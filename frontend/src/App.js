import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
// 1. VoiceTeacher ko import kiya
import VoiceTeacher from './voiceteacher';
// Import pages
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import RoadmapGenerator from './pages/RoadmapGenerator';
import ProblemsList from './pages/ProblemsList';
import RoadmapView from './pages/RoadmapView';
import DiagnosticQuiz from './pages/DiagnosticQuiz';
import Leaderboard from './pages/Leaderboard';
// New: DSAcharya v2 roadmap agent (Groq + topic graph based) test page
import RoadmapPage from './RoadmapPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Check if user exists in localStorage
    const storedUser = localStorage.getItem('dsa_forge_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);
  const loginUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('dsa_forge_user', JSON.stringify(user));
  };
  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('dsa_forge_user');
    toast.success('Logged out successfully!');
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="App min-h-screen bg-[#080808] text-[rgb(220,220,220)]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage currentUser={currentUser} loginUser={loginUser} logoutUser={logoutUser} />} />
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} logoutUser={logoutUser} />} />
          <Route path="/generate-roadmap" element={<RoadmapGenerator currentUser={currentUser} logoutUser={logoutUser} />} />
          <Route path="/problems" element={<ProblemsList currentUser={currentUser} logoutUser={logoutUser} />} />
          <Route path="/roadmap/:roadmapId" element={<RoadmapView currentUser={currentUser} logoutUser={logoutUser} />} />
          <Route path="/diagnostic" element={<DiagnosticQuiz currentUser={currentUser} logoutUser={logoutUser} />} />
          <Route path="/quiz/:topic" element={<DiagnosticQuiz currentUser={currentUser} logoutUser={logoutUser} />} />
          <Route path="/leaderboard" element={<Leaderboard currentUser={currentUser} logoutUser={logoutUser} />} />
          {/* New: test route for the v2 roadmap agent (Groq + topic graph) */}
          <Route path="/roadmap-v2" element={<RoadmapPage />} />
        </Routes>

        {/* 🎙️ Voice Teacher AI Agent - Added outside Routes so it stays on all pages */}
        <VoiceTeacher />
      </BrowserRouter>

      <Toaster position="top-right" richColors />
    </div>
  );
}
export default App;