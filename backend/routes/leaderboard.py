import os
import uuid
import random
import string
from datetime import date, datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from database import get_db
from models import User, UserProfile, UserProgress, FriendGroup, FriendGroupMember, Roadmap

router = APIRouter()

# ─────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    user_id: str
    college_name: str = ""
    college_year: str = ""
    course: str = ""


class CreateGroupRequest(BaseModel):
    user_id: str
    group_name: str


class JoinGroupRequest(BaseModel):
    user_id: str
    invite_code: str


class StreakUpdateRequest(BaseModel):
    user_id: str


class RescheduleRequest(BaseModel):
    user_id: str


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _get_or_create_profile(db: Session, user_id: str) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(
            id=str(uuid.uuid4()),
            user_id=user_id,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def _profile_to_dict(profile: UserProfile, user: User) -> dict:
    return {
        "user_id": profile.user_id,
        "username": user.username if user else "unknown",
        "college_name": profile.college_name,
        "college_year": profile.college_year,
        "course": profile.course,
        "current_streak": profile.current_streak,
        "longest_streak": profile.longest_streak,
        "total_problems_solved": profile.total_problems_solved,
        "xp_points": profile.xp_points,
        "last_active_date": profile.last_active_date.isoformat() if profile.last_active_date else None,
    }


def _generate_invite_code(db: Session) -> str:
    """Generate unique 6-char alphanumeric code."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "".join(random.choices(chars, k=6))
        existing = db.query(FriendGroup).filter(FriendGroup.invite_code == code).first()
        if not existing:
            return code


# ─────────────────────────────────────────────
# Profile endpoints
# ─────────────────────────────────────────────

@router.post("/leaderboard/profile/update")
def update_profile(data: ProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = _get_or_create_profile(db, data.user_id)
    if data.college_name:
        profile.college_name = data.college_name
    if data.college_year:
        profile.college_year = data.college_year
    if data.course:
        profile.course = data.course

    db.commit()
    db.refresh(profile)
    return _profile_to_dict(profile, user)


@router.get("/leaderboard/profile/{user_id}")
def get_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = _get_or_create_profile(db, user_id)
    return _profile_to_dict(profile, user)


# ─────────────────────────────────────────────
# Leaderboard endpoints
# ─────────────────────────────────────────────

@router.get("/leaderboard/global")
def global_leaderboard(limit: int = 50, db: Session = Depends(get_db)):
    profiles = (
        db.query(UserProfile)
        .order_by(UserProfile.xp_points.desc())
        .limit(limit)
        .all()
    )
    result = []
    for rank, profile in enumerate(profiles, start=1):
        user = db.query(User).filter(User.id == profile.user_id).first()
        entry = _profile_to_dict(profile, user)
        entry["rank"] = rank
        result.append(entry)
    return result


@router.get("/leaderboard/college/{college_name}")
def college_leaderboard(college_name: str, limit: int = 50, db: Session = Depends(get_db)):
    profiles = (
        db.query(UserProfile)
        .filter(UserProfile.college_name == college_name)
        .order_by(UserProfile.xp_points.desc())
        .limit(limit)
        .all()
    )
    result = []
    for rank, profile in enumerate(profiles, start=1):
        user = db.query(User).filter(User.id == profile.user_id).first()
        entry = _profile_to_dict(profile, user)
        entry["rank"] = rank
        result.append(entry)
    return result


# ─────────────────────────────────────────────
# Friend group endpoints
# ─────────────────────────────────────────────

@router.post("/leaderboard/group/create")
def create_group(data: CreateGroupRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    invite_code = _generate_invite_code(db)
    group = FriendGroup(
        id=str(uuid.uuid4()),
        name=data.group_name,
        invite_code=invite_code,
        created_by=data.user_id,
    )
    db.add(group)
    db.flush()

    # Add creator as first member
    member = FriendGroupMember(
        id=str(uuid.uuid4()),
        group_id=group.id,
        user_id=data.user_id,
    )
    db.add(member)
    db.commit()
    db.refresh(group)

    return {
        "group_id": group.id,
        "group_name": group.name,
        "invite_code": group.invite_code,
        "created_by": data.user_id,
    }


@router.post("/leaderboard/group/join")
def join_group(data: JoinGroupRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    group = db.query(FriendGroup).filter(
        FriendGroup.invite_code == data.invite_code.upper()
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Don't add duplicates
    existing = db.query(FriendGroupMember).filter(
        FriendGroupMember.group_id == group.id,
        FriendGroupMember.user_id == data.user_id,
    ).first()
    if not existing:
        member = FriendGroupMember(
            id=str(uuid.uuid4()),
            group_id=group.id,
            user_id=data.user_id,
        )
        db.add(member)
        db.commit()

    return _build_group_response(group, db)


@router.get("/leaderboard/group/{group_id}")
def get_group(group_id: str, db: Session = Depends(get_db)):
    group = db.query(FriendGroup).filter(FriendGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return _build_group_response(group, db)


@router.get("/leaderboard/group/by-user/{user_id}")
def get_user_group(user_id: str, db: Session = Depends(get_db)):
    """Return the first group the user belongs to (if any)."""
    membership = db.query(FriendGroupMember).filter(
        FriendGroupMember.user_id == user_id
    ).first()
    if not membership:
        return None
    group = db.query(FriendGroup).filter(FriendGroup.id == membership.group_id).first()
    if not group:
        return None
    return _build_group_response(group, db)


@router.post("/leaderboard/group/{group_id}/leave")
def leave_group(group_id: str, user_id: str, db: Session = Depends(get_db)):
    member = db.query(FriendGroupMember).filter(
        FriendGroupMember.group_id == group_id,
        FriendGroupMember.user_id == user_id,
    ).first()
    if member:
        db.delete(member)
        db.commit()
    return {"status": "left"}


def _build_group_response(group: FriendGroup, db: Session) -> dict:
    members_rows = db.query(FriendGroupMember).filter(
        FriendGroupMember.group_id == group.id
    ).all()

    members_data = []
    for m in members_rows:
        user = db.query(User).filter(User.id == m.user_id).first()
        profile = db.query(UserProfile).filter(UserProfile.user_id == m.user_id).first()
        if not profile:
            profile = UserProfile(user_id=m.user_id, xp_points=0, current_streak=0, total_problems_solved=0)
        entry = {
            "user_id": m.user_id,
            "username": user.username if user else "unknown",
            "xp_points": profile.xp_points,
            "current_streak": profile.current_streak,
            "total_problems_solved": profile.total_problems_solved,
            "college_name": profile.college_name,
        }
        members_data.append(entry)

    members_data.sort(key=lambda x: x["xp_points"], reverse=True)
    for i, m in enumerate(members_data):
        m["rank"] = i + 1

    return {
        "group_id": group.id,
        "group_name": group.name,
        "invite_code": group.invite_code,
        "created_by": group.created_by,
        "members": members_data,
    }


# ─────────────────────────────────────────────
# Streak & XP update
# ─────────────────────────────────────────────

@router.post("/leaderboard/streak/update")
def update_streak(data: StreakUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = _get_or_create_profile(db, data.user_id)
    today = date.today()

    # Count total solved problems
    solved_count = db.query(UserProgress).filter(
        UserProgress.user_id == data.user_id,
        UserProgress.status == "completed",
    ).count()
    profile.total_problems_solved = solved_count

    # Streak logic
    if profile.last_active_date is None:
        profile.current_streak = 1
    else:
        delta = (today - profile.last_active_date).days
        if delta == 0:
            pass  # Same day, no change
        elif delta == 1:
            profile.current_streak += 1
        else:
            profile.current_streak = 1  # Streak broken

    profile.last_active_date = today
    if profile.current_streak > profile.longest_streak:
        profile.longest_streak = profile.current_streak

    # XP = 10 per problem solved + 5 per current streak day
    profile.xp_points = (solved_count * 10) + (profile.current_streak * 5)

    db.commit()
    db.refresh(profile)

    return {
        "current_streak": profile.current_streak,
        "longest_streak": profile.longest_streak,
        "xp_points": profile.xp_points,
        "total_problems_solved": profile.total_problems_solved,
    }


# ─────────────────────────────────────────────
# Roadmap Rescheduling endpoint
# ─────────────────────────────────────────────

@router.post("/roadmap/reschedule")
def reschedule_roadmap(data: RescheduleRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = _get_or_create_profile(db, data.user_id)
    today = date.today()

    if profile.last_active_date is None:
        profile.last_active_date = today
        db.commit()
        return {"rescheduled": False, "message": "On track"}

    gap = (today - profile.last_active_date).days

    if gap <= 1:
        if gap == 1:
            profile.last_active_date = today
            db.commit()
        return {"rescheduled": False, "message": "On track"}

    missed_days = gap - 1

    latest_roadmap = (
        db.query(Roadmap)
        .filter(Roadmap.user_id == data.user_id)
        .order_by(Roadmap.generated_at.desc())
        .first()
    )

    updated_topics_count = 0

    if latest_roadmap and latest_roadmap.topics:
        import copy
        topics_data = copy.deepcopy(latest_roadmap.topics)

        topics_list = []
        if isinstance(topics_data, dict) and "roadmap" in topics_data and isinstance(topics_data["roadmap"], list):
            topics_list = topics_data["roadmap"]
        elif isinstance(topics_data, list):
            topics_list = topics_data

        for topic in topics_list:
            if isinstance(topic, dict) and topic.get("status") != "completed":
                updated_topics_count += 1
                if "scheduled_day" in topic and isinstance(topic["scheduled_day"], (int, float)):
                    topic["scheduled_day"] += missed_days
                if "estimated_start" in topic and topic["estimated_start"]:
                    try:
                        dt = datetime.strptime(str(topic["estimated_start"]), "%Y-%m-%d")
                        topic["estimated_start"] = (dt + timedelta(days=missed_days)).strftime("%Y-%m-%d")
                    except Exception:
                        pass

        latest_roadmap.topics = topics_data
        flag_modified(latest_roadmap, "topics")

    profile.current_streak = 1
    profile.last_active_date = today
    if profile.current_streak > profile.longest_streak:
        profile.longest_streak = profile.current_streak

    db.commit()

    return {
        "rescheduled": True,
        "missed_days": missed_days,
        "updated_topics_count": updated_topics_count
    }
