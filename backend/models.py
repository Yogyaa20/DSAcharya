from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, ForeignKey, JSON, Date
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    skill_level = Column(String(50), default='beginner')
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    skill_level = Column(String(50))
    duration_weeks = Column(Integer)
    topics = Column(JSON)
    generated_at = Column(TIMESTAMP, server_default=func.now())

class Problem(Base):
    __tablename__ = "problems"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    difficulty = Column(String(20), nullable=False)
    topic = Column(String(100), nullable=False)
    description = Column(Text)
    solution_link = Column(String(500))
    tags = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'))
    problem_id = Column(String(36), ForeignKey('problems.id', ondelete='CASCADE'))
    status = Column(String(20), default='pending')
    completed_at = Column(TIMESTAMP, nullable=True)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

class RoadmapProblem(Base):
    __tablename__ = "roadmap_problems"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    roadmap_id = Column(String(36), ForeignKey('roadmaps.id', ondelete='CASCADE'))
    problem_id = Column(String(36), ForeignKey('problems.id', ondelete='CASCADE'))
    week_number = Column(Integer)
    day_number = Column(Integer)
    order_index = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())

class RetentionScore(Base):
    """
    Stores the result of every retention/diagnostic quiz a user takes.
    One row per (user, topic, attempt) -- we keep history rather than
    overwriting, so the roadmap generator can always pull the *latest*
    attempt per topic to compute current weak_areas.
    """
    __tablename__ = "retention_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    topic = Column(String(100), nullable=False)
    quiz_type = Column(String(20), default='retention')  # 'retention' or 'diagnostic'
    score_pct = Column(Integer, nullable=False)
    correct = Column(Integer)
    total = Column(Integer)
    weak_subtopics = Column(JSON)  # list[str]
    created_at = Column(TIMESTAMP, server_default=func.now())


# ─────────────────────────────────────────────
# Leaderboard models
# ─────────────────────────────────────────────

class UserProfile(Base):
    """Extended profile for leaderboard / social features."""
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    college_name = Column(String(255), nullable=True)
    college_year = Column(String(10), nullable=True)   # '1st', '2nd', '3rd', '4th'
    course = Column(String(100), nullable=True)        # 'B.Tech CSE', etc.
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    total_problems_solved = Column(Integer, default=0)
    xp_points = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class FriendGroup(Base):
    """A named group/gang users can create and share via invite code."""
    __tablename__ = "friend_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    invite_code = Column(String(6), unique=True, nullable=False)
    created_by = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class FriendGroupMember(Base):
    """Membership join-table between FriendGroup and User."""
    __tablename__ = "friend_group_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String(36), ForeignKey('friend_groups.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    joined_at = Column(TIMESTAMP, server_default=func.now())
