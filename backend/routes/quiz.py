import json
import os
import uuid
from datetime import datetime
from collections import Counter, defaultdict
import logging

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import RetentionScore, User
from prompts.quiz_prompt import QUIZ_SYSTEM_PROMPT, build_quiz_user_prompt

logger = logging.getLogger(__name__)

router = APIRouter()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# In-memory cache of generated quizzes, keyed by quiz_id
_QUIZ_CACHE = {}

# Fallback question bank for topics if LLM calls fail
FALLBACK_QUESTIONS = {
    "arrays": [
        {
            "id": "arr_1",
            "question": "What is the time complexity to access an element by index in an array?",
            "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
            "correct_index": 0,
            "subtopic": "indexing"
        },
        {
            "id": "arr_2",
            "question": "Which algorithm technique is optimal for searching in a sorted array?",
            "options": ["Linear Search", "Binary Search", "Depth-First Search", "Sliding Window"],
            "correct_index": 1,
            "subtopic": "binary search"
        },
        {
            "id": "arr_3",
            "question": "What technique is commonly used to find contiguous subarrays with a target sum?",
            "options": ["Sliding Window", "Binary Search Tree", "Disjoint Set", "Floyd-Warshall"],
            "correct_index": 0,
            "subtopic": "sliding window"
        }
    ],
    "trees": [
        {
            "id": "tree_1",
            "question": "In a Binary Search Tree (BST), elements in the left subtree of a node are:",
            "options": ["Greater than the node", "Smaller than the node", "Equal to the node only", "Unordered"],
            "correct_index": 1,
            "subtopic": "BST properties"
        },
        {
            "id": "tree_2",
            "question": "Which tree traversal yields elements of a BST in sorted ascending order?",
            "options": ["Pre-order", "In-order", "Post-order", "Level-order"],
            "correct_index": 1,
            "subtopic": "traversal"
        },
        {
            "id": "tree_3",
            "question": "What is the worst-case height of an unbalanced Binary Search Tree with n nodes?",
            "options": ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
            "correct_index": 1,
            "subtopic": "tree height"
        }
    ],
    "strings": [
        {
            "id": "str_1",
            "question": "Which algorithm efficiently checks for pattern matching in strings in O(n+m) time?",
            "options": ["KMP (Knuth-Morris-Pratt)", "Bubble Sort", "Dijkstra", "Kruskal"],
            "correct_index": 0,
            "subtopic": "pattern matching"
        },
        {
            "id": "str_2",
            "question": "Two strings are anagrams if:",
            "options": ["They have same length only", "They contain identical character frequencies", "They start with the same character", "They are reverse of each other"],
            "correct_index": 1,
            "subtopic": "character frequency"
        }
    ]
}


class QuizRequest(BaseModel):
    topic: str
    skill_level: str = "beginner"
    user_id: str


class QuizAnswer(BaseModel):
    question_id: str
    selected_index: int


class QuizSubmission(BaseModel):
    quiz_id: str
    user_id: str
    topic: str
    answers: list[QuizAnswer]
    quiz_type: str = "retention"  # 'retention' or 'diagnostic'


class DiagnosticStartRequest(BaseModel):
    user_id: str
    selected_topics: list[str]


class DiagnosticSubmission(BaseModel):
    quiz_id: str
    user_id: str
    answers: list[QuizAnswer]
    goal: str = "general DSA mastery"
    time_available: str = "1-2 hours/day"


@router.post("/generate-quiz")
def generate_quiz(data: QuizRequest):
    user_prompt = build_quiz_user_prompt(data.topic, data.skill_level)

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.5,
                "response_format": {"type": "json_object"}
            },
            timeout=15
        )

        result = response.json()
        quiz = json.loads(result["choices"][0]["message"]["content"])
    except Exception as e:
        logger.error(f"Failed to generate quiz via Groq API: {e}")
        # Fallback quiz
        fb = FALLBACK_QUESTIONS.get(data.topic.lower(), FALLBACK_QUESTIONS["arrays"])
        quiz = {
            "topic": data.topic,
            "questions": [
                {
                    "id": f"{data.topic}_{i+1}",
                    "question": q["question"],
                    "options": q["options"],
                    "correct_index": q["correct_index"],
                    "subtopic": q["subtopic"]
                }
                for i, q in enumerate(fb)
            ]
        }

    quiz_id = str(uuid.uuid4())
    _QUIZ_CACHE[quiz_id] = quiz

    # Strip correct_index before sending to frontend so it can't be cheated.
    safe_questions = [
        {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "subtopic": q.get("subtopic", data.topic),
            "platform": q.get("platform", "leetcode"),
            "problem_title": q.get("problem_title", ""),
            "problem_link": q.get("problem_link", "")
        }
        for q in quiz["questions"]
    ]

    return {"quiz_id": quiz_id, "topic": quiz.get("topic", data.topic), "questions": safe_questions}


@router.post("/submit-quiz")
def submit_quiz(data: QuizSubmission, db: Session = Depends(get_db)):
    quiz = _QUIZ_CACHE.get(data.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or expired")

    correct_by_id = {q["id"]: q["correct_index"] for q in quiz["questions"]}
    subtopic_by_id = {q["id"]: q.get("subtopic", "general") for q in quiz["questions"]}

    total = len(data.answers)
    correct = 0
    wrong_subtopics = []

    for ans in data.answers:
        expected = correct_by_id.get(ans.question_id)
        if expected is None:
            continue
        if ans.selected_index == expected:
            correct += 1
        else:
            wrong_subtopics.append(subtopic_by_id.get(ans.question_id, "unknown"))

    score_pct = round((correct / total) * 100, 1) if total else 0

    weak_subtopics = [s for s, _ in Counter(wrong_subtopics).most_common()]

    record = RetentionScore(
        id=str(uuid.uuid4()),
        user_id=data.user_id,
        topic=data.topic,
        quiz_type=data.quiz_type,
        score_pct=int(score_pct),
        correct=correct,
        total=total,
        weak_subtopics=weak_subtopics,
    )
    db.add(record)
    db.commit()

    return {
        "topic": data.topic,
        "score_pct": score_pct,
        "correct": correct,
        "total": total,
        "weak_subtopics": weak_subtopics,
        "needs_revision": score_pct < 60,
    }


@router.post("/diagnostic/start")
def start_diagnostic_quiz(data: DiagnosticStartRequest, db: Session = Depends(get_db)):
    if not data.selected_topics:
        raise HTTPException(status_code=400, detail="At least one topic must be selected")

    user = db.query(User).filter(User.id == data.user_id).first() if data.user_id else None
    skill_level = user.skill_level if user else "intermediate"

    combined_full_questions = []
    combined_safe_questions = []

    for topic in data.selected_topics:
        try:
            # Generate quiz for this topic
            q_res = generate_quiz(QuizRequest(topic=topic, skill_level=skill_level, user_id=data.user_id))
            q_id_cached = q_res["quiz_id"]
            cached_quiz = _QUIZ_CACHE.get(q_id_cached, {})
            raw_qs = cached_quiz.get("questions", [])

            # Take 2-3 questions per topic
            selected_raw = raw_qs[:3] if len(raw_qs) >= 3 else raw_qs

            for q in selected_raw:
                q_guid = str(uuid.uuid4())
                q_full = {
                    "id": q_guid,
                    "topic": topic,
                    "question": q["question"],
                    "options": q["options"],
                    "correct_index": q["correct_index"],
                    "subtopic": q.get("subtopic", topic)
                }
                combined_full_questions.append(q_full)
                combined_safe_questions.append({
                    "id": q_guid,
                    "topic": topic,
                    "question": q["question"],
                    "options": q["options"],
                    "subtopic": q.get("subtopic", topic)
                })
        except Exception as e:
            logger.error(f"Error generating questions for topic {topic}: {e}")
            fb = FALLBACK_QUESTIONS.get(topic.lower(), FALLBACK_QUESTIONS["arrays"])
            for q in fb[:3]:
                q_guid = str(uuid.uuid4())
                combined_full_questions.append({
                    "id": q_guid,
                    "topic": topic,
                    "question": q["question"],
                    "options": q["options"],
                    "correct_index": q["correct_index"],
                    "subtopic": q["subtopic"]
                })
                combined_safe_questions.append({
                    "id": q_guid,
                    "topic": topic,
                    "question": q["question"],
                    "options": q["options"],
                    "subtopic": q["subtopic"]
                })

    diagnostic_quiz_id = str(uuid.uuid4())
    _QUIZ_CACHE[diagnostic_quiz_id] = {
        "topic": "diagnostic",
        "questions": combined_full_questions
    }

    return {
        "quiz_id": diagnostic_quiz_id,
        "questions": combined_safe_questions
    }


@router.post("/diagnostic/submit")
def submit_diagnostic_quiz(data: DiagnosticSubmission, db: Session = Depends(get_db)):
    quiz = _QUIZ_CACHE.get(data.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Diagnostic quiz not found or expired")

    questions = quiz.get("questions", [])
    correct_by_id = {q["id"]: q["correct_index"] for q in questions}
    topic_by_id = {q["id"]: q.get("topic", "arrays") for q in questions}
    subtopic_by_id = {q["id"]: q.get("subtopic", "general") for q in questions}

    topic_totals = defaultdict(int)
    topic_corrects = defaultdict(int)
    topic_wrong_subtopics = defaultdict(list)

    for ans in data.answers:
        q_topic = topic_by_id.get(ans.question_id, "general")
        topic_totals[q_topic] += 1
        expected = correct_by_id.get(ans.question_id)

        if expected is not None and ans.selected_index == expected:
            topic_corrects[q_topic] += 1
        else:
            sub = subtopic_by_id.get(ans.question_id, "general")
            topic_wrong_subtopics[q_topic].append(sub)

    score_summary = {}
    weak_areas = []
    known_topics = []

    for t_name, total in topic_totals.items():
        corr = topic_corrects[t_name]
        pct = round((corr / total) * 100, 1) if total > 0 else 0
        score_summary[t_name] = pct

        if pct < 60:
            weak_areas.append(t_name)
        else:
            known_topics.append(t_name)

        # Save RetentionScore record per topic
        record = RetentionScore(
            id=str(uuid.uuid4()),
            user_id=data.user_id,
            topic=t_name,
            quiz_type="diagnostic",
            score_pct=int(pct),
            correct=corr,
            total=total,
            weak_subtopics=[s for s, _ in Counter(topic_wrong_subtopics[t_name]).most_common()],
        )
        db.add(record)

    db.commit()

    # Generate personalized roadmap based on diagnostic quiz results
    from routes.roadmap import generate_roadmap as generate_roadmap_v2, RoadmapRequest

    user = db.query(User).filter(User.id == data.user_id).first() if data.user_id else None
    skill_level = user.skill_level if (user and user.skill_level) else "intermediate"

    roadmap_req = RoadmapRequest(
        user_id=data.user_id,
        skill_level=skill_level,
        known_topics=known_topics,
        goal=data.goal or "general DSA mastery",
        time_available=data.time_available or "1-2 hours/day",
        weak_areas=weak_areas
    )

    try:
        roadmap_res = generate_roadmap_v2(roadmap_req, db)
        roadmap_id = roadmap_res.get("roadmap_id") or roadmap_res.get("id")
    except Exception as e:
        logger.error(f"Failed to generate roadmap from diagnostic: {e}")
        roadmap_id = None

    return {
        "score_summary": score_summary,
        "weak_areas": weak_areas,
        "roadmap_id": roadmap_id
    }


def get_user_weak_areas(db: Session, user_id: str, threshold: int = 60) -> list[str]:
    """
    Returns the list of topics the user is currently weak in, based on the
    latest retention/diagnostic attempt per topic.
    """
    all_scores = (
        db.query(RetentionScore)
        .filter(RetentionScore.user_id == user_id)
        .order_by(RetentionScore.created_at.desc())
        .all()
    )

    latest_per_topic = {}
    for s in all_scores:
        if s.topic not in latest_per_topic:
            latest_per_topic[s.topic] = s

    return [topic for topic, s in latest_per_topic.items() if s.score_pct < threshold]