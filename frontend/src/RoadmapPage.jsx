// RoadmapPage.jsx
import { useState } from "react";
import { generateRoadmapV2 } from "./roadmapService";

export default function RoadmapPage() {
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleGenerate() {
        setLoading(true);
        setError(null);
        try {
            const data = await generateRoadmapV2({
                skill_level: "beginner",
                known_topics: ["arrays", "basics_syntax"],
                goal: "placement",
                time_available: "2 hours per day",
            });
            setRoadmap(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: 24 }}>
            <button onClick={handleGenerate} disabled={loading}>
                {loading ? "Generating..." : "Generate My Roadmap"}
            </button>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {roadmap && (
                <div style={{ marginTop: 24 }}>
                    <p>{roadmap.notes}</p>
                    <p>Total estimated days: {roadmap.total_estimated_days}</p>
                    <ul>
                        {roadmap.roadmap.map((item, i) => (
                            <li key={i} style={{ marginBottom: 12 }}>
                                <strong>{item.topic}</strong> — {item.priority} priority, ~{item.estimated_days} days
                                <br />
                                <span style={{ fontSize: 13, color: "#666" }}>{item.status}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}