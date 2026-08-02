from pathlib import Path
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import User, Roadmap, Problem, UserProgress, RoadmapProblem
from routes.roadmap import router as roadmap_router
from routes.quiz import router as quiz_router
from routes.leaderboard import router as leaderboard_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create tables
Base.metadata.create_all(bind=engine)

# Create the main app
app = FastAPI(title="DSA Forge API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Pydantic Models for API
class UserCreate(BaseModel):
    username: str
    email: str
    skill_level: str = 'beginner'


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    skill_level: str
    created_at: datetime

    class Config:
        from_attributes = True


class RoadmapResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    skill_level: str
    duration_weeks: int
    topics: dict
    generated_at: datetime

    class Config:
        from_attributes = True


class ProblemCreate(BaseModel):
    title: str
    difficulty: str
    topic: str
    description: Optional[str] = None
    solution_link: Optional[str] = None
    tags: Optional[List[str]] = None


class ProblemResponse(BaseModel):
    id: str
    title: str
    difficulty: str
    topic: str
    description: Optional[str]
    solution_link: Optional[str]
    tags: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class ProgressUpdate(BaseModel):
    user_id: str
    problem_id: str
    status: str  # pending, in_progress, completed
    notes: Optional[str] = None


class ProgressResponse(BaseModel):
    id: str
    user_id: str
    problem_id: str
    status: str
    completed_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_problems: int
    completed_problems: int
    in_progress_problems: int
    pending_problems: int
    completion_rate: float
    problems_by_difficulty: dict
    problems_by_topic: dict


# API Routes
@api_router.get("/")
async def root():
    return {"message": "DSA Forge API is running!", "version": "1.0.0"}


# User endpoints
@api_router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    new_user = User(
        id=str(uuid.uuid4()),
        username=user.username,
        email=user.email,
        skill_level=user.skill_level
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@api_router.get("/users", response_model=List[UserResponse])
async def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users


# Roadmap endpoints (DB-backed, original)
@api_router.get("/roadmaps/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(roadmap_id: str, db: Session = Depends(get_db)):
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap


@api_router.get("/users/{user_id}/roadmaps", response_model=List[RoadmapResponse])
async def get_user_roadmaps(user_id: str, db: Session = Depends(get_db)):
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == user_id).all()
    return roadmaps


# Problem endpoints
@api_router.post("/problems", response_model=ProblemResponse)
async def create_problem(problem: ProblemCreate, db: Session = Depends(get_db)):
    new_problem = Problem(
        id=str(uuid.uuid4()),
        title=problem.title,
        difficulty=problem.difficulty,
        topic=problem.topic,
        description=problem.description,
        solution_link=problem.solution_link,
        tags=problem.tags
    )
    db.add(new_problem)
    db.commit()
    db.refresh(new_problem)
    return new_problem


def _normalize_topic_name(t: str) -> str:
    return t.lower().replace("_", "").replace("-", "").replace(" ", "")


@api_router.get("/problems", response_model=List[ProblemResponse])
async def get_problems(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Problem)
    roadmap_topics_order = []

    # 1. Per-user personalization if user_id is provided
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

        # Skill level filter (unless explicit difficulty parameter is provided)
        if user and user.skill_level and not (difficulty and difficulty.lower() != "all"):
            skill = user.skill_level.lower()
            if skill == "beginner":
                query = query.filter(Problem.difficulty == "easy")
            elif skill == "advanced":
                query = query.filter(Problem.difficulty.in_(["medium", "hard"]))
            elif skill == "intermediate":
                query = query.filter(Problem.difficulty.in_(["easy", "medium"]))

        # Exclude completed problems
        completed = db.query(UserProgress.problem_id).filter(
            UserProgress.user_id == user_id,
            UserProgress.status == "completed"
        ).all()
        completed_ids = {c[0] for c in completed if c[0]}
        if completed_ids:
            query = query.filter(~Problem.id.in_(completed_ids))

        # Look up user's most recent roadmap for topic priority ordering
        recent_roadmap = db.query(Roadmap).filter(
            Roadmap.user_id == user_id
        ).order_by(Roadmap.generated_at.desc()).first()

        if recent_roadmap and recent_roadmap.topics:
            topics_data = recent_roadmap.topics
            if isinstance(topics_data, dict):
                if "roadmap" in topics_data and isinstance(topics_data["roadmap"], list):
                    for item in topics_data["roadmap"]:
                        if isinstance(item, dict) and "topic" in item:
                            roadmap_topics_order.append(_normalize_topic_name(str(item["topic"])))
                elif "weekly_plan" in topics_data and isinstance(topics_data["weekly_plan"], list):
                    for week in topics_data["weekly_plan"]:
                        if isinstance(week, dict) and "topics" in week:
                            for top in week["topics"]:
                                roadmap_topics_order.append(_normalize_topic_name(str(top)))

    # 2. Apply manual topic / difficulty filters if specified
    if topic and topic.lower() != "all":
        query = query.filter(Problem.topic == topic)

    if difficulty and difficulty.lower() != "all":
        query = query.filter(Problem.difficulty == difficulty)

    problems = query.all()

    # 3. Sort problems according to the user's roadmap topic order
    if roadmap_topics_order:
        def get_topic_rank(p: Problem) -> int:
            p_norm = _normalize_topic_name(p.topic)
            for idx, r_topic in enumerate(roadmap_topics_order):
                if p_norm in r_topic or r_topic in p_norm:
                    return idx
                if "dp" in p_norm and "dynamic" in r_topic:
                    return idx
                if "graph" in p_norm and "graph" in r_topic:
                    return idx
                if "tree" in p_norm and "tree" in r_topic:
                    return idx
            return 9999  # not in roadmap (placed after roadmap topics)

        problems = sorted(problems, key=get_topic_rank)

    return problems


@api_router.get("/problems/{problem_id}", response_model=ProblemResponse)
async def get_problem(problem_id: str, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem


# Progress endpoints
@api_router.post("/progress", response_model=ProgressResponse)
async def update_progress(progress: ProgressUpdate, db: Session = Depends(get_db)):
    # Check if progress entry exists
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == progress.user_id,
        UserProgress.problem_id == progress.problem_id
    ).first()

    if existing:
        # Update existing progress
        existing.status = progress.status
        existing.notes = progress.notes
        if progress.status == 'completed':
            existing.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new progress entry
        new_progress = UserProgress(
            id=str(uuid.uuid4()),
            user_id=progress.user_id,
            problem_id=progress.problem_id,
            status=progress.status,
            notes=progress.notes,
            completed_at=datetime.utcnow() if progress.status == 'completed' else None
        )
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress


@api_router.get("/users/{user_id}/progress", response_model=List[ProgressResponse])
async def get_user_progress(user_id: str, db: Session = Depends(get_db)):
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    return progress


@api_router.get("/users/{user_id}/dashboard-stats", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str, db: Session = Depends(get_db)):
    # Get all progress for user
    all_progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()

    total = len(all_progress)
    completed = len([p for p in all_progress if p.status == 'completed'])
    in_progress = len([p for p in all_progress if p.status == 'in_progress'])
    pending = len([p for p in all_progress if p.status == 'pending'])

    completion_rate = (completed / total * 100) if total > 0 else 0

    # Get problems by difficulty
    problems_by_difficulty = {}
    problems_by_topic = {}

    for prog in all_progress:
        problem = db.query(Problem).filter(Problem.id == prog.problem_id).first()
        if problem:
            # Count by difficulty
            if problem.difficulty not in problems_by_difficulty:
                problems_by_difficulty[problem.difficulty] = 0
            problems_by_difficulty[problem.difficulty] += 1

            # Count by topic
            if problem.topic not in problems_by_topic:
                problems_by_topic[problem.topic] = 0
            problems_by_topic[problem.topic] += 1

    return DashboardStats(
        total_problems=total,
        completed_problems=completed,
        in_progress_problems=in_progress,
        pending_problems=pending,
        completion_rate=completion_rate,
        problems_by_difficulty=problems_by_difficulty,
        problems_by_topic=problems_by_topic
    )


@api_router.post("/chat")
async def chat_with_ai(request: Request):
    body = await request.json()
    user_message = body.get("message", "")
    history = body.get("conversation_history", [])
    
    import requests as req
    system_msg = {
        "role": "system",
        "content": "You are DSA AI Teacher — an expert DSA tutor. Answer DSA questions clearly and concisely. Give code examples when needed. Be encouraging and friendly."
    }
    messages = [system_msg] + history + [{"role": "user", "content": user_message}]
    
    response = req.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.environ.get('GROQ_API_KEY')}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500
        }
    )
    result = response.json()
    reply = result["choices"][0]["message"]["content"]
    return {"reply": reply}


# Include the routers in the main app
app.include_router(api_router)
# New Groq + topic-graph based roadmap agent, mounted under /v2 to avoid
# clashing with the existing DB-backed /api/generate-roadmap endpoint above.
app.include_router(roadmap_router, prefix="/v2")
# Quiz / retention-score agent, also mounted under /v2 alongside the roadmap agent.
app.include_router(quiz_router, prefix="/v2")
# Leaderboard, streaks, friend-groups agent
app.include_router(leaderboard_router, prefix="/v2")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)