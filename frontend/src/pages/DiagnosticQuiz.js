import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Sparkles, CheckCircle, AlertTriangle, ArrowRight, Loader2, Award } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const ALL_TOPICS = [
  'arrays',
  'strings',
  'linked-lists',
  'trees',
  'graphs',
  'dynamic-programming',
  'binary-search',
  'backtracking',
  'greedy',
  'sorting',
  'hashing',
];

const DiagnosticQuiz = ({ currentUser, logoutUser }) => {
  const navigate = useNavigate();
  const { topic: urlTopic } = useParams();

  // Step 1: selection, Step 2: quiz, Step 3: results
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState(
    urlTopic ? [urlTopic.toLowerCase()] : []
  );

  const [quizId, setQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: selected_index }

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (!currentUser) navigate('/');
  }, [currentUser, navigate]);

  // If navigated directly via /quiz/:topic, auto-start if topic is present
  useEffect(() => {
    if (urlTopic && step === 1 && selectedTopics.length > 0 && !quizId && !loading) {
      handleStartQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTopic]);

  if (!currentUser) return null;

  const toggleTopic = (t) => {
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleStartQuiz = async () => {
    if (selectedTopics.length === 0) {
      toast.error('Please select at least one topic');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/v2/diagnostic/start`, {
        user_id: currentUser.id,
        selected_topics: selectedTopics,
      });

      if (res.data && res.data.questions && res.data.questions.length > 0) {
        setQuizId(res.data.quiz_id);
        setQuestions(res.data.questions);
        setStep(2);
        setCurrentIdx(0);
        setAnswers({});
      } else {
        toast.error('No questions received for selected topics');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start diagnostic quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleNextQuestion = () => {
    const currentQ = questions[currentIdx];
    if (answers[currentQ.id] === undefined) {
      toast.error('Please select an answer before proceeding');
      return;
    }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    try {
      const answerPayload = questions.map((q) => ({
        question_id: q.id,
        selected_index: answers[q.id] !== undefined ? answers[q.id] : -1,
      }));

      const res = await axios.post(`${BACKEND_URL}/v2/diagnostic/submit`, {
        quiz_id: quizId,
        user_id: currentUser.id,
        answers: answerPayload,
        goal: 'general DSA mastery',
        time_available: '1-2 hours/day',
      });

      setResults(res.data);
      setStep(3);
      toast.success('Diagnostic quiz submitted!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[currentIdx];
  const progressPct = questions.length
    ? Math.round(((currentIdx + 1) / questions.length) * 100)
    : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030508',
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.018) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar currentUser={currentUser} logoutUser={logoutUser} />

        <div
          style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}
          data-testid="diagnostic-quiz-container"
        >
          {/* STEP 1: Topic Selection */}
          {step === 1 && (
            <div
              style={{ opacity: 0, animation: 'fadeIn 0.5s ease forwards' }}
              data-testid="diagnostic-step-1"
            >
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  color: '#00ff88',
                  letterSpacing: '0.15em',
                  marginBottom: '8px',
                }}
              >
                // DIAGNOSTIC_ASSESSMENT
              </p>
              <h1
                style={{
                  fontSize: 'clamp(28px,4vw,40px)',
                  fontWeight: 800,
                  color: '#e6edf3',
                  marginBottom: '12px',
                }}
              >
                Test Your{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg,#00ff88,#00d4ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  DSA Knowledge
                </span>
              </h1>
              <p
                style={{
                  color: '#8b949e',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  marginBottom: '32px',
                }}
              >
                Select the topics you have studied to get an instant skill evaluation and custom roadmap.
              </p>

              <div
                style={{
                  background: '#0d1117',
                  border: '1px solid rgba(48,54,61,0.8)',
                  borderRadius: '20px',
                  padding: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background:
                      'linear-gradient(90deg,transparent,#00ff88,#00d4ff,transparent)',
                    opacity: 0.5,
                  }}
                />

                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#00ff88',
                    letterSpacing: '0.1em',
                    marginBottom: '16px',
                  }}
                >
                  $ select_studied_topics ({selectedTopics.length} selected)
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '32px',
                  }}
                >
                  {ALL_TOPICS.map((t) => {
                    const isSelected = selectedTopics.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTopic(t)}
                        data-testid={`diagnostic-topic-${t}`}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '10px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: isSelected
                            ? 'rgba(0,255,136,0.12)'
                            : 'rgba(255,255,255,0.03)',
                          border: isSelected
                            ? '1px solid rgba(0,255,136,0.4)'
                            : '1px solid rgba(48,54,61,0.8)',
                          color: isSelected ? '#00ff88' : '#8b949e',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {t.replace(/-/g, '_')}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleStartQuiz}
                  disabled={loading || selectedTopics.length === 0}
                  data-testid="start-diagnostic-btn"
                  style={{
                    width: '100%',
                    background:
                      loading || selectedTopics.length === 0
                        ? 'rgba(0,255,136,0.2)'
                        : 'linear-gradient(135deg,#00ff88,#00d4ff)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#030508',
                    cursor:
                      loading || selectedTopics.length === 0
                        ? 'not-allowed'
                        : 'pointer',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow:
                      selectedTopics.length > 0
                        ? '0 0 25px rgba(0,255,136,0.25)'
                        : 'none',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />{' '}
                      GENERATING_QUIZ...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> START_DIAGNOSTIC_QUIZ →
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Quiz View */}
          {step === 2 && currentQ && (
            <div
              style={{ opacity: 0, animation: 'fadeIn 0.5s ease forwards' }}
              data-testid="diagnostic-step-2"
            >
              {/* Header & Progress */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: '#00ff88',
                      letterSpacing: '0.1em',
                    }}
                  >
                    QUESTION {currentIdx + 1} OF {questions.length}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: '#00d4ff',
                      background: 'rgba(0,212,255,0.08)',
                      border: '1px solid rgba(0,212,255,0.2)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    TOPIC: {currentQ.topic || 'DSA'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg,#00ff88,#00d4ff)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div
                style={{
                  background: '#0d1117',
                  border: '1px solid rgba(48,54,61,0.8)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                data-testid="question-card"
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background:
                      'linear-gradient(90deg,transparent,#00ff88,#00d4ff,transparent)',
                    opacity: 0.5,
                  }}
                />

                {currentQ.subtopic && (
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#8b949e',
                      marginBottom: '8px',
                    }}
                  >
                    // subtopic: {currentQ.subtopic}
                  </p>
                )}

                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#e6edf3',
                    marginBottom: '24px',
                    lineHeight: 1.4,
                  }}
                >
                  {currentQ.question}
                </h2>

                {/* Options */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '28px',
                  }}
                >
                  {currentQ.options?.map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        data-testid={`option-${optIdx}`}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 18px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '13px',
                          transition: 'all 0.2s',
                          background: isSelected
                            ? 'rgba(0,255,136,0.12)'
                            : 'rgba(255,255,255,0.03)',
                          border: isSelected
                            ? '1px solid #00ff88'
                            : '1px solid rgba(48,54,61,0.8)',
                          color: isSelected ? '#00ff88' : '#e6edf3',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isSelected
                              ? '#00ff88'
                              : 'rgba(255,255,255,0.05)',
                            color: isSelected ? '#030508' : '#8b949e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '11px',
                            flexShrink: 0,
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Practice this problem section */}
                {(currentQ.problem_title || currentQ.problem_link) && (
                  <div style={{
                    marginTop: '16px',
                    marginBottom: '20px',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(48,54,61,0.8)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.06em',
                        color: ({ leetcode: '#FFA116', gfg: '#2F8D46', codeforces: '#1F8ACB', hackerrank: '#00EA64', interviewbit: '#1F6FEB' }[(currentQ.platform || '').toLowerCase()] || '#8b949e'),
                        background: `${({ leetcode: '#FFA116', gfg: '#2F8D46', codeforces: '#1F8ACB', hackerrank: '#00EA64', interviewbit: '#1F6FEB' }[(currentQ.platform || '').toLowerCase()] || '#8b949e')}18`,
                        border: `1px solid ${({ leetcode: '#FFA116', gfg: '#2F8D46', codeforces: '#1F8ACB', hackerrank: '#00EA64', interviewbit: '#1F6FEB' }[(currentQ.platform || '').toLowerCase()] || '#8b949e')}40`,
                        textTransform: 'uppercase'
                      }}>
                        {currentQ.platform || 'LeetCode'}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#e6edf3'
                      }}>
                        {currentQ.problem_title || 'Practice Problem'}
                      </span>
                    </div>

                    {currentQ.problem_link && (
                      <button
                        onClick={() => window.open(currentQ.problem_link, '_blank')}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px',
                          fontWeight: 700,
                          color: ({ leetcode: '#FFA116', gfg: '#2F8D46', codeforces: '#1F8ACB', hackerrank: '#00EA64', interviewbit: '#1F6FEB' }[(currentQ.platform || '').toLowerCase()] || '#8b949e'),
                          background: 'transparent',
                          border: `1px solid ${({ leetcode: '#FFA116', gfg: '#2F8D46', codeforces: '#1F8ACB', hackerrank: '#00EA64', interviewbit: '#1F6FEB' }[(currentQ.platform || '').toLowerCase()] || '#8b949e')}`,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          letterSpacing: '0.06em',
                          transition: 'all 0.2s'
                        }}
                      >
                        SOLVE ON {(currentQ.platform || 'PLATFORM').toUpperCase()} →
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={handleNextQuestion}
                  disabled={loading}
                  data-testid="next-question-btn"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg,#00ff88,#00d4ff)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#030508',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 20px rgba(0,255,136,0.2)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />{' '}
                      EVALUATING...
                    </>
                  ) : currentIdx === questions.length - 1 ? (
                    <>
                      <CheckCircle size={16} /> SUBMIT_DIAGNOSTIC →
                    </>
                  ) : (
                    <>
                      NEXT_QUESTION <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Results View */}
          {step === 3 && results && (
            <div
              style={{ opacity: 0, animation: 'fadeIn 0.5s ease forwards' }}
              data-testid="diagnostic-results"
            >
              <div
                style={{
                  background: 'rgba(0,255,136,0.06)',
                  border: '1px solid rgba(0,255,136,0.25)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <Award size={32} color="#00ff88" />
                <div>
                  <h2
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: '22px',
                      color: '#00ff88',
                    }}
                  >
                    Diagnostic Complete!
                  </h2>
                  <p style={{ color: '#8b949e', fontSize: '14px', marginTop: '2px' }}>
                    Here is your breakdown per topic based on your answers:
                  </p>
                </div>
              </div>

              {/* Topic Score Cards */}
              <div
                style={{
                  background: '#0d1117',
                  border: '1px solid rgba(48,54,61,0.8)',
                  borderRadius: '20px',
                  padding: '32px',
                  marginBottom: '28px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#00ff88',
                    letterSpacing: '0.12em',
                    marginBottom: '20px',
                  }}
                >
                  // SCORE_BY_TOPIC
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  {Object.entries(results.score_summary || {}).map(
                    ([topic, score]) => {
                      const isWeak = score < 60;
                      return (
                        <div key={topic} data-testid={`result-topic-${topic}`}>
                          <div
                            style={{
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              marginBottom: '8px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#e6edf3',
                                textTransform: 'capitalize',
                              }}
                            >
                              {topic}
                            </span>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '13px',
                                fontWeight: 700,
                                color: isWeak ? '#ff4d4d' : '#00ff88',
                              }}
                            >
                              {score}% {isWeak ? '(Needs Revision)' : '(Proficient)'}
                            </span>
                          </div>

                          <div
                            style={{
                              height: '8px',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${score}%`,
                                background: isWeak
                                  ? 'linear-gradient(90deg,#ff4d4d,#ff7b7b)'
                                  : 'linear-gradient(90deg,#00ff88,#00d4ff)',
                                borderRadius: '4px',
                                transition: 'width 0.8s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Weak Areas Banner */}
                {results.weak_areas && results.weak_areas.length > 0 && (
                  <div
                    style={{
                      marginTop: '28px',
                      background: 'rgba(255,77,77,0.08)',
                      border: '1px solid rgba(255,77,77,0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <AlertTriangle size={20} color="#ff4d4d" />
                    <div>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '12px',
                          color: '#ff4d4d',
                          fontWeight: 700,
                        }}
                      >
                        WEAK AREAS DETECTED: {results.weak_areas.join(', ')}
                      </p>
                      <p style={{ color: '#8b949e', fontSize: '12px', marginTop: '2px' }}>
                        Your personalized roadmap will prioritize extra practice for these topics.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  if (results.roadmap_id) {
                    navigate(`/roadmap/${results.roadmap_id}`);
                  } else {
                    navigate('/generate-roadmap');
                  }
                }}
                data-testid="generate-roadmap-from-results-btn"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg,#00ff88,#00d4ff)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '16px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#030508',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  boxShadow: '0 0 25px rgba(0,255,136,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Sparkles size={16} /> GENERATE MY ROADMAP →
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

export default DiagnosticQuiz;
