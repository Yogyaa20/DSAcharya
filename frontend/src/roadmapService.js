// roadmapService.js
// Handles calls to the DSAcharya v2 roadmap agent (Groq + topic graph based).
// Uses the same BACKEND_URL env var as the rest of the app, but hits /v2
// instead of /api since this is the new agent, mounted separately in server.py.

import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export async function generateRoadmapV2({ skill_level, known_topics, goal, time_available, weak_areas = [] }) {
    const response = await axios.post(`${BACKEND_URL}/v2/generate-roadmap`, {
        skill_level,
        known_topics,
        goal,
        time_available,
        weak_areas,
    });

    return response.data; // { roadmap: [...], total_estimated_days, notes }
}