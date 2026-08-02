import json
import os
import uuid
from typing import Optional, List, Dict
import requests
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Problem, UserProgress, Roadmap
from prompts.roadmap_prompt import SYSTEM_PROMPT, build_user_prompt
from routes.quiz import get_user_weak_areas

router = APIRouter()

# Load topic graph once at startup
TOPIC_GRAPH_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "topic_graph.json")
with open(TOPIC_GRAPH_PATH) as f:
    TOPIC_GRAPH = json.load(f)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


class RoadmapRequest(BaseModel):
    user_id: Optional[str] = None
    skill_level: str
    known_topics: List[str]
    goal: str
    time_available: str
    weak_areas: List[str] = []


def _normalize(text: str) -> str:
    return text.lower().replace("_", "").replace("-", "").replace(" ", "")


def get_allowed_difficulties(skill_level: str) -> List[str]:
    skill = (skill_level or "beginner").lower()
    if skill == "beginner":
        return ["easy"]
    elif skill == "advanced":
        return ["medium", "hard"]
    else:
        return ["easy", "medium"]


def get_available_db_problems(db: Session, skill_level: str, user_id: Optional[str] = None) -> Dict[str, List[Dict]]:
    allowed_diffs = get_allowed_difficulties(skill_level)

    # Find completed problems if user_id is provided
    completed_ids = set()
    if user_id:
        completed_rows = db.query(UserProgress.problem_id).filter(
            UserProgress.user_id == user_id,
            UserProgress.status == "completed"
        ).all()
        completed_ids = {r[0] for r in completed_rows if r[0]}

    # Query candidate problems
    query = db.query(Problem).filter(Problem.difficulty.in_(allowed_diffs))
    if completed_ids:
        query = query.filter(~Problem.id.in_(completed_ids))

    candidate_problems = query.all()

    # Group by normalized topic name
    grouped = {}
    for p in candidate_problems:
        norm_t = _normalize(p.topic)
        if norm_t not in grouped:
            grouped[norm_t] = []
        grouped[norm_t].append({
            "id": p.id,
            "title": p.title,
            "difficulty": p.difficulty,
            "topic": p.topic
        })

    return grouped


def find_matching_db_problems(topic_name: str, grouped_problems: Dict[str, List[Dict]]) -> List[Dict]:
    norm_topic = _normalize(topic_name)
    matched = []

    for db_topic_norm, probs in grouped_problems.items():
        if db_topic_norm in norm_topic or norm_topic in db_topic_norm:
            matched.extend(probs)
        elif "dp" in norm_topic and "dynamic" in db_topic_norm:
            matched.extend(probs)
        elif "graph" in norm_topic and "graph" in db_topic_norm:
            matched.extend(probs)
        elif "tree" in norm_topic and "tree" in db_topic_norm:
            matched.extend(probs)
        elif "search" in norm_topic and ("search" in db_topic_norm or "array" in db_topic_norm):
            matched.extend(probs)

    # Deduplicate by title
    seen = set()
    unique = []
    for p in matched:
        if p["title"] not in seen:
            seen.add(p["title"])
            unique.append(p)
    return unique


@router.post("/generate-roadmap")
def generate_roadmap(data: RoadmapRequest, db: Session = Depends(get_db)):
    # 0. Pull weak_areas from the retention_scores table (latest attempt per
    # topic) and merge with anything explicitly passed in the request, so
    # the roadmap always reflects the user's real quiz history rather than
    # relying on the frontend to remember and resend weak_areas.
    weak_areas = list(data.weak_areas or [])
    if data.user_id:
        db_weak_areas = get_user_weak_areas(db, data.user_id)
        for w in db_weak_areas:
            if w not in weak_areas:
                weak_areas.append(w)
    data.weak_areas = weak_areas

    # 1. Fetch filtered practice problems from DB based on skill_level & uncompleted status
    db_problems_by_topic = get_available_db_problems(db, data.skill_level, data.user_id)

    # Flatten for prompt context per topic
    available_context = {}
    for topic_item in TOPIC_GRAPH.get("topics", []):
        t_id = topic_item.get("id", "")
        t_name = topic_item.get("name", "")
        matched = find_matching_db_problems(t_id, db_problems_by_topic) or find_matching_db_problems(t_name, db_problems_by_topic)
        if matched:
            available_context[t_id] = [p["title"] for p in matched]

    system_prompt = SYSTEM_PROMPT.replace("{topic_graph_json}", json.dumps(TOPIC_GRAPH))
    user_prompt = build_user_prompt(
        data.skill_level,
        data.known_topics,
        data.goal,
        data.time_available,
        data.weak_areas,
        available_context
    )

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
    )

    result = response.json()
    roadmap_json = json.loads(result["choices"][0]["message"]["content"])

    # 2. Ensure each roadmap item's resources are populated with real, personalized DB problem titles
    weak_set = {_normalize(w) for w in data.weak_areas}

    if "roadmap" in roadmap_json and isinstance(roadmap_json["roadmap"], list):
        for item in roadmap_json["roadmap"]:
            topic_id = item.get("topic", "")
            matched_probs = find_matching_db_problems(topic_id, db_problems_by_topic)
            db_titles = [p["title"] for p in matched_probs]

            is_weak = any(w in _normalize(topic_id) for w in weak_set)
            target_count = 3 if is_weak else 2

            if db_titles:
                # Filter LLM resources to keep valid db_titles or replace with real db_titles
                llm_resources = item.get("resources", [])
                valid_resources = [r for r in llm_resources if r in db_titles]

                # Fill with real DB titles if fewer than target count
                for title in db_titles:
                    if len(valid_resources) >= target_count:
                        break
                    if title not in valid_resources:
                        valid_resources.append(title)

                item["resources"] = valid_resources

    # 3. Persist the roadmap so progress-tracking and future roadmap
    # requests can reference it (mirrors what /api/generate-roadmap did,
    # but wasn't happening here before).
    roadmap_id = None
    if data.user_id:
        new_roadmap = Roadmap(
            id=str(uuid.uuid4()),
            user_id=data.user_id,
            title=roadmap_json.get("title", f"{data.skill_level.title()} DSA Roadmap"),
            description=roadmap_json.get("description", "Personalized roadmap"),
            skill_level=data.skill_level,
            duration_weeks=roadmap_json.get("duration_weeks", 0),
            topics=roadmap_json,
        )
        db.add(new_roadmap)
        db.commit()
        db.refresh(new_roadmap)
        roadmap_id = new_roadmap.id

    roadmap_json["roadmap_id"] = roadmap_id
    roadmap_json["weak_areas_used"] = weak_areas
    return roadmap_json