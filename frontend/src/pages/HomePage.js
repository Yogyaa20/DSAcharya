import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { toast } from "sonner";

import { api } from "../App";
import BackgroundPaths from "@/components/BackgroundPaths";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const useCyclingTypewriter = (lines, speedMs = 40, delayMs = 2000) => {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(2); // start after "> "
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = lines[lineIdx];
    let timeout;

    if (!isDeleting && charIdx < currentText.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), speedMs);
    } else if (!isDeleting && charIdx === currentText.length) {
      timeout = setTimeout(() => setIsDeleting(true), delayMs);
    } else if (isDeleting && charIdx > 2) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), speedMs / 2);
    } else if (isDeleting && charIdx <= 2) {
      setIsDeleting(false);
      setLineIdx((i) => (i + 1) % lines.length);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, lineIdx, lines, speedMs, delayMs]);

  return lines[lineIdx].slice(0, charIdx);
};

const useAnimatedCounter = (target, duration = 1600, inView = false) => {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [duration, inView, target]);
  return count;
};

const Marquee = ({ text }) => {
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-black/20 py-4">
      <div className="marquee group flex w-[200%] select-none items-center gap-10 whitespace-nowrap text-white/20">
        <div className="marquee__track flex w-1/2 items-center gap-10">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={`a-${i}`} style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs tracking-[0.35em]">
              {text}
            </span>
          ))}
        </div>
        <div className="marquee__track flex w-1/2 items-center gap-10">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={`b-${i}`} style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs tracking-[0.35em]">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ currentUser, loginUser }) => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", skill_level: "beginner" });

  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const orbY = useTransform(scrollYProgress, [0, 0.4], [0, -90]);
  const navScaleY = useTransform(scrollYProgress, [0, 0.08], [1, 0.93]);

  const typewriterLines = useMemo(
    () => [
      "> Finding your weak patterns...",
      "> Building your acharya roadmap...",
      "> Mastering sliding window...",
      "> Preparing for FAANG...",
    ],
    []
  );
  const typing = useCyclingTypewriter(typewriterLines, 35, 1800);

  const featurePills = [
    { label: "Sliding Window", color: "#e8c27a", bg: "rgba(232,194,122,0.12)", border: "rgba(232,194,122,0.3)" },
    { label: "Two Pointers", color: "#a8d8a8", bg: "rgba(168,216,168,0.12)", border: "rgba(168,216,168,0.3)" },
    { label: "Dynamic Programming", color: "#c4a8d8", bg: "rgba(196,168,216,0.12)", border: "rgba(196,168,216,0.3)" },
    { label: "Graph Traversal", color: "#e8c27a", bg: "rgba(232,194,122,0.12)", border: "rgba(232,194,122,0.3)" },
    { label: "Binary Search", color: "#a8d8a8", bg: "rgba(168,216,168,0.12)", border: "rgba(168,216,168,0.3)" },
    { label: "Backtracking", color: "#c4a8d8", bg: "rgba(196,168,216,0.12)", border: "rgba(196,168,216,0.3)" },
    { label: "Tries", color: "#e8c27a", bg: "rgba(232,194,122,0.12)", border: "rgba(232,194,122,0.3)" },
  ];

  const bento = useMemo(
    () => [
      { title: "⚡ Acharya AI Roadmap", desc: "Personalized pattern-based learning path designed for top tech interviews." },
      { title: "🧩 Visual Pattern Tracker", desc: "Master algorithmic patterns across Sliding Window, DP, Graphs & Trees." },
      { title: "🔥 Consistency Engine", desc: "Track weak spots, solve daily target problems, and build compound mastery." },
      { title: "📊 Deep Analytics", desc: "Gain precision insights into speed, logic accuracy, and pattern gaps." },
      { title: "🤖 AI Mentor Teacher", desc: "Ask questions step-by-step and understand deep algorithmic intuition." },
      { title: "🏆 Global Acharya Ranks", desc: "Measure your readiness against serious candidates nationwide." },
    ],
    []
  );

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-120px" });
  const s1 = useAnimatedCounter(150, 1600, statsInView);
  const s2 = useAnimatedCounter(15, 1600, statsInView);
  const s4 = useAnimatedCounter(98, 1600, statsInView);

  // Redirect logged-in users
  useEffect(() => {
    if (currentUser) navigate("/dashboard");
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.get("/users");
        const user = res.data.find((u) => u.username === formData.username);
        if (user) {
          loginUser(user);
          toast.success("Welcome back to DSAcharya!");
          navigate("/dashboard");
        } else {
          toast.error("User not found. Sign up first.");
        }
      } else {
        const res = await api.post("/users", formData);
        loginUser(res.data);
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) return null;

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-[rgb(220,220,220)] overflow-x-hidden">
      {/* WebGL shader background — fixed, full-screen, subtle 0.32 opacity */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.32 }}>
        <ShaderAnimation />
      </div>

      {/* Radial gradient overlay — fixed: rgba(10,10,15,0.85) edges, 0.4 center */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0.7) 50%, rgba(10,10,15,0.85) 100%)",
        }}
      />

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee__track { animation: marquee 22s linear infinite; }
        .marquee:hover .marquee__track { animation-play-state: paused; }
      `}</style>

      {/* Sticky frosted navbar */}
      <motion.nav
        style={{ scaleY: navScaleY, transformOrigin: "top" }}
        className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigate("/")}
              className="logo-dsacharya flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: "16px", letterSpacing: "0.06em" }}
            >
              <span style={{ color: "#e8c27a", fontWeight: 700 }}>&gt;_</span>
              <span style={{ color: "#ffffff", fontWeight: 700 }}>DSAcharya</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAuth(true)}
              className="btn-hover-lift rounded-[10px] font-bold tracking-[0.06em]"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                padding: "10px 24px",
                border: "1.5px solid rgba(232,194,122,0.5)",
                background: "rgba(232,194,122,0.1)",
                color: "#e8c27a",
                cursor: "pointer",
              }}
            >
              GET_STARTED →
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Floating Button (bottom-left) */}
      <button
        onClick={() => setShowAuth(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 font-bold cursor-pointer btn-hover-lift"
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "13px",
          background: "#e8c27a",
          color: "#0a0a0f",
          borderRadius: "999px",
          padding: "12px 20px",
          boxShadow: "0 4px 24px rgba(232,194,122,0.4)",
          border: "none",
        }}
      >
        <span>🪬</span> Ask Acharya
      </button>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex flex-col justify-center overflow-hidden py-16">
        <BackgroundPaths className="absolute inset-0 h-full w-full opacity-[0.03]" />

        <motion.div
          style={{ y: orbY }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        >
          <div className="h-full w-full rounded-full bg-[radial-gradient(ellipse,rgba(232,194,122,0.08),transparent_65%)]" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
          {/* Badge Pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(232,194,122,0.3)] bg-white/[0.04] px-4 py-2 backdrop-blur-md"
          >
            <span className="h-2 w-2 rounded-full bg-[#e8c27a] pulsing-gold-dot" />
            <span className="text-xs tracking-[0.1em] text-white/80" style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px" }}>
              ● AI-POWERED • ADAPTIVE • FREE
            </span>
          </motion.div>

          {/* H1 Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="relative z-20 w-full flex flex-col items-center justify-center"
          >
            <h1
              className="font-bold tracking-tight text-white relative z-20"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "clamp(48px, 7vw, 92px)",
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#ffffff",
                position: "relative",
                zIndex: 20,
              }}
            >
              Master DSA,
            </h1>
            <h1
              className="font-bold tracking-tight relative z-20 mt-1"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "clamp(48px, 7vw, 92px)",
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#e8c27a",
                position: "relative",
                zIndex: 20,
              }}
            >
              Dominate LeetCode.
            </h1>
          </motion.div>

          {/* Typewriter Line */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="mt-6 flex items-center justify-center h-8"
          >
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "15px", letterSpacing: "0.05em", color: "#e8c27a" }}>
              {typing}
              <span className="ml-1 inline-block h-4 w-[2px] align-[-2px] animate-pulse" style={{ background: "#e8c27a" }} />
            </div>
          </motion.div>

          {/* Sub-tagline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="mt-2"
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontStyle: "italic", fontSize: "13px", color: "rgba(232,194,122,0.55)" }}>
              "Think in patterns, not solutions."
            </span>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}
            className="mt-5 max-w-2xl text-center"
          >
            DSAcharya is your AI guru for algorithmic mastery. Identify gaps, visualize patterns, and crush every interview with confidence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-5"
          >
            <button
              onClick={() => setShowAuth(true)}
              className="btn-hover-lift font-bold tracking-[0.06em] cursor-pointer"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                padding: "14px 32px",
                borderRadius: "10px",
                background: "#e8c27a",
                color: "#0a0a0f",
                border: "none",
                fontWeight: 700,
                boxShadow: "0 0 28px rgba(232,194,122,0.3)",
              }}
            >
              START LEARNING →
            </button>
            <button
              onClick={() => navigate("/problems")}
              className="btn-hover-lift font-bold tracking-[0.06em] cursor-pointer"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                padding: "13px 28px",
                borderRadius: "10px",
                background: "rgba(196,168,216,0.1)",
                border: "1.5px solid rgba(196,168,216,0.55)",
                color: "#c4a8d8",
              }}
            >
              VIEW PROBLEMS
            </button>
          </motion.div>

          {/* Feature Pills Row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-2 max-w-3xl"
          >
            {featurePills.map((p) => (
              <span
                key={p.label}
                className="px-3 py-1.5 transition-all"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "11px",
                  borderRadius: "999px",
                  color: p.color,
                  background: p.bg,
                  border: `1px solid ${p.border}`,
                  letterSpacing: "0.04em",
                }}
              >
                {p.label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Banner */}
      <Marquee text="SLIDING WINDOW • TWO POINTERS • DYNAMIC PROGRAMMING • GRAPH TRAVERSAL • BINARY SEARCH • BACKTRACKING • TRIES •" />

      {/* Features Bento */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.35em", color: "#e8c27a" }}>
            // PATTERN_ENGINE
          </div>
          <h2 style={{ fontFamily: "'Space Mono', monospace" }} className="mt-3 text-3xl font-bold tracking-tight text-white">
            Built for deep pattern mastery.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }} className="mt-2">
            Stop memorizing line-by-line code. Learn the underlying patterns that solve 95% of interview questions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {bento.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
            >
              <Card className="h-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all hover:border-[rgba(232,194,122,0.3)] hover:bg-white/[0.04]">
                <div className="p-6">
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", letterSpacing: "0.08em", color: "#e8c27a" }}>
                    {f.title}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }} className="mt-3">
                    {f.desc}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Code Terminal Section */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.35em", color: "#e8c27a" }}>
              // ACHARYA_INSIGHTS
            </div>
            <h3 style={{ fontFamily: "'Space Mono', monospace" }} className="mt-3 text-3xl font-bold tracking-tight text-white">
              Deconstruct complex algorithms in seconds.
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }} className="mt-3">
              Interactive pattern breakdowns, space-time complexity proofs, and step-by-step AI guidance tailored to your current level.
            </p>
          </motion.div>

          <motion.div
            style={{ y: y1 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="rounded-2xl border border-[rgba(232,194,122,0.2)] bg-[#0d0d12] p-0 shadow-[0_0_50px_rgba(232,194,122,0.05)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.2em", color: "#e8c27a" }}>
                acharya-terminal
              </div>
            </div>
            <pre className="overflow-x-auto px-5 py-5 text-[12px] leading-6" style={{ fontFamily: "'Space Mono', monospace", color: "#a8d8a8" }}>
{`// Sliding Window Pattern
function lengthOfLongestSubstring(s) {
  let map = new Map(), maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) {
      left = Math.max(map.get(s[right]) + 1, left);
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen; // Time: O(N), Space: O(min(N, M))
}`}
            </pre>
          </motion.div>
        </div>
      </section>

      {/* Stats Row */}
      <section ref={statsRef} className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Stat 1 */}
            <div className="text-center">
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "28px", color: "#e8c27a", fontWeight: 700 }}>
                {s1}+
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.45)" }} className="mt-1">
                Problems
              </div>
            </div>

            {/* Stat 2 */}
            <div className="text-center md:border-l md:border-white/10">
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "28px", color: "#e8c27a", fontWeight: 700 }}>
                {s2}+
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.45)" }} className="mt-1">
                Patterns
              </div>
            </div>

            {/* Stat 3 */}
            <div className="text-center md:border-l md:border-white/10">
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "28px", color: "#e8c27a", fontWeight: 700 }}>
                AI
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.45)" }} className="mt-1">
                Acharya
              </div>
            </div>

            {/* Stat 4 */}
            <div className="text-center md:border-l md:border-white/10">
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "28px", color: "#e8c27a", fontWeight: 700 }}>
                {s4}%
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.45)" }} className="mt-1">
                Interview Ready
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10 text-center">
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", letterSpacing: "0.2em", color: "#e8c27a" }}>
          DSAcharya © 2026
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.4)" }} className="mt-1">
          Master DSA, Dominate LeetCode • Think in patterns, not solutions.
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent data-testid="auth-dialog" className="bg-[#0a0a0f]/95 border border-[rgba(232,194,122,0.3)] backdrop-blur-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Space Mono', monospace", fontSize: "16px", letterSpacing: "0.15em", color: "#e8c27a" }}>
              {isLogin ? ">_ WELCOME_BACK" : ">_ CREATE_ACCOUNT"}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)" }}>
              {isLogin ? "Enter your username to access DSAcharya" : "Start your path to algorithmic mastery today"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
            <div>
              <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.1em", color: "rgba(232,194,122,0.8)" }} className="block">
                $ username
              </label>
              <input
                required
                data-testid="auth-username-input"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-[#e8c27a]"
                style={{ fontFamily: "'Space Mono', monospace" }}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="your_username"
              />
            </div>

            {!isLogin && (
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.1em", color: "rgba(232,194,122,0.8)" }} className="block">
                  $ email
                </label>
                <input
                  required
                  data-testid="auth-email-input"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white outline-none focus:border-[#e8c27a]"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.1em", color: "rgba(232,194,122,0.8)" }} className="block">
                  $ skill_level
                </label>
                <Select value={formData.skill_level} onValueChange={(v) => setFormData({ ...formData, skill_level: v })}>
                  <SelectTrigger data-testid="auth-skill-select" className="mt-2 border-white/10 bg-black/50 text-xs text-white" style={{ fontFamily: "'Space Mono', monospace" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/95">
                    {["beginner", "intermediate", "advanced"].map((v) => (
                      <SelectItem key={v} value={v} style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs text-white">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-btn"
              className="btn-hover-lift rounded-[10px] font-bold tracking-[0.06em] disabled:opacity-50 mt-2 cursor-pointer"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "13px",
                padding: "12px 28px",
                background: "#e8c27a",
                color: "#0a0a0f",
                border: "none",
                boxShadow: "0 0 20px rgba(232,194,122,0.3)",
              }}
            >
              {loading ? "PROCESSING..." : isLogin ? "LOGIN →" : "CREATE ACCOUNT →"}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            data-testid="auth-toggle-btn"
            className="mt-2 bg-transparent text-left hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", letterSpacing: "0.1em", color: "rgba(232,194,122,0.6)" }}
          >
            {isLogin ? "→ No account? Sign up" : "→ Already have account? Login"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomePage;