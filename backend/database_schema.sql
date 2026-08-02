-- DSA Forge Database Schema
-- PostgreSQL Database Schema

-- Create database (run this separately if needed)
-- CREATE DATABASE dsa_forge;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    skill_level VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skill_level VARCHAR(50),
    duration_weeks INTEGER,
    topics JSONB, -- Store topics as JSON array
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL, -- easy, medium, hard
    topic VARCHAR(100) NOT NULL, -- arrays, strings, trees, graphs, dp, etc.
    description TEXT,
    solution_link VARCHAR(500),
    tags JSONB, -- Additional tags as JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    problem_id VARCHAR(36) REFERENCES problems(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, problem_id)
);

-- Roadmap Problems (Junction table)
CREATE TABLE IF NOT EXISTS roadmap_problems (
    id VARCHAR(36) PRIMARY KEY,
    roadmap_id VARCHAR(36) REFERENCES roadmaps(id) ON DELETE CASCADE,
    problem_id VARCHAR(36) REFERENCES problems(id) ON DELETE CASCADE,
    week_number INTEGER,
    day_number INTEGER,
    order_index INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(roadmap_id, problem_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_topic ON problems(topic);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_problem_id ON user_progress(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_problems_roadmap_id ON roadmap_problems(roadmap_id);
