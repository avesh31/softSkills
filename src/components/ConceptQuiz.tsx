"use client";

import { useState } from 'react';

interface QuizOption {
  A: string;
  B: string;
  C: string;
  D: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

type QuizState = 'idle' | 'loading' | 'active' | 'result' | 'error';

const OPTION_KEYS: Array<keyof QuizOption> = ['A', 'B', 'C', 'D'];

function getFeedback(score: number, total: number) {
  const pct = score / total;
  if (pct >= 0.8) {
    return {
      emoji: '🎉',
      label: 'Excellent Understanding!',
      message: 'Great job! You have understood the concept very well. Keep up the amazing work!',
      color: 'var(--accent-success)',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.3)',
    };
  }
  if (pct >= 0.4) {
    return {
      emoji: '👍',
      label: 'Partial Understanding',
      message: 'Good attempt! You have a basic understanding, but reviewing the concept again will help strengthen your knowledge.',
      color: 'var(--accent-warning)',
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.3)',
    };
  }
  return {
    emoji: '📚',
    label: 'Needs More Practice',
    message: 'It seems this topic needs a little more practice. Try reviewing the explanation again or ask the community for further help.',
    color: 'var(--accent-danger)',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.3)',
  };
}

export default function ConceptQuiz({ doubtId }: { doubtId: string }) {
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, keyof QuizOption>>({});
  const [score, setScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const startQuiz = async () => {
    setQuizState('loading');
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
    try {
      const res = await fetch(`/api/doubts/${doubtId}/ai/quiz`);
      let errorData;
      try {
        errorData = await res.json();
      } catch (parseErr) {
        errorData = null;
      }
      
      if (!res.ok) {
        throw new Error((errorData && errorData.error) ? errorData.error : 'Failed to generate quiz');
      }
      
      setQuestions(errorData.questions);
      setQuizState('active');
    } catch (e: any) {
      setErrorMsg(e.message || 'Something went wrong. Please try again.');
      setQuizState('error');
    }
  };

  const handleSelect = (qIdx: number, opt: keyof QuizOption) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < questions.length) return;
    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    setQuizState('result');
  };

  const handleReset = () => {
    setQuizState('idle');
    setQuestions([]);
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  // ── IDLE ──
  if (quizState === 'idle') {
    return (
      <div
        style={{
          margin: '1.5rem 0',
          padding: '1.5rem 2rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(236,72,153,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🧠</span>
            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Test My Understanding</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Take a short AI-generated quiz to verify how well you understood this concept.
          </p>
        </div>
        <button
          onClick={startQuiz}
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap', padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}
        >
          🧠 Start Quiz
        </button>
      </div>
    );
  }

  // ── LOADING ──
  if (quizState === 'loading') {
    return (
      <div
        className="glass-panel animate-fade-in"
        style={{ margin: '1.5rem 0', padding: '2.5rem', textAlign: 'center' }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          AI is generating your quiz questions…
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
          This may take a few seconds
        </p>
      </div>
    );
  }

  // ── ERROR ──
  if (quizState === 'error') {
    return (
      <div
        className="glass-panel animate-fade-in"
        style={{
          margin: '1.5rem 0',
          padding: '2rem',
          border: '1px solid rgba(239,68,68,0.3)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '1rem' }}>
          <span style={{ color: 'var(--accent-danger)', marginRight: '8px' }}>⚠️</span> 
          {errorMsg}
        </p>
        <button onClick={startQuiz} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          Try Again
        </button>
      </div>
    );
  }

  // ── ACTIVE / RESULT ──
  const feedback = quizState === 'result' ? getFeedback(score, questions.length) : null;
  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        margin: '1.5rem 0',
        padding: '2rem',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🧠</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Concept Check Quiz
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {questions.length} questions · AI-generated
            </p>
          </div>
        </div>
        {quizState === 'result' && (
          <button onClick={handleReset} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
            ↩ Try Again
          </button>
        )}
      </div>

      {/* Result feedback banner */}
      {quizState === 'result' && feedback && (
        <div
          className="animate-fade-in"
          style={{
            background: feedback.bg,
            border: `1px solid ${feedback.border}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '2rem', flexShrink: 0 }}>{feedback.emoji}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <strong style={{ fontSize: '1.05rem', color: feedback.color }}>{feedback.label}</strong>
              <span
                style={{
                  background: feedback.color,
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.15rem 0.7rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {score}/{questions.length}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {feedback.message}
            </p>
          </div>
        </div>
      )}

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {questions.map((q, qi) => {
          const selected = selectedAnswers[qi];
          const isCorrect = submitted && selected === q.correctAnswer;
          const isWrong = submitted && selected && selected !== q.correctAnswer;

          return (
            <div key={qi}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  marginBottom: '0.85rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    background: 'rgba(99,102,241,0.15)',
                    color: 'var(--accent-primary)',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginRight: '0.5rem',
                    flexShrink: 0,
                  }}
                >
                  {qi + 1}
                </span>
                {q.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {OPTION_KEYS.map(opt => {
                  const isSelected = selected === opt;
                  const isCorrectOpt = q.correctAnswer === opt;
                  const showCorrect = submitted && isCorrectOpt;
                  const showWrong = submitted && isSelected && !isCorrectOpt;

                  let bg = 'rgba(255,255,255,0.03)';
                  let border = 'rgba(255,255,255,0.08)';
                  let color = 'var(--text-secondary)';
                  let optLabelBg = 'rgba(255,255,255,0.05)';
                  let optLabelColor = 'var(--text-muted)';

                  if (isSelected && !submitted) {
                    bg = 'rgba(99,102,241,0.12)';
                    border = 'rgba(99,102,241,0.5)';
                    color = 'var(--text-primary)';
                    optLabelBg = 'var(--accent-primary)';
                    optLabelColor = '#fff';
                  }
                  if (showCorrect) {
                    bg = 'rgba(16,185,129,0.1)';
                    border = 'rgba(16,185,129,0.4)';
                    color = 'var(--text-primary)';
                    optLabelBg = 'var(--accent-success)';
                    optLabelColor = '#fff';
                  }
                  if (showWrong) {
                    bg = 'rgba(239,68,68,0.08)';
                    border = 'rgba(239,68,68,0.4)';
                    color = 'var(--text-secondary)';
                    optLabelBg = 'var(--accent-danger)';
                    optLabelColor = '#fff';
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(qi, opt)}
                      disabled={submitted}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.75rem 1rem',
                        background: bg,
                        border: `1px solid ${border}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: submitted ? 'default' : 'pointer',
                        transition: 'all 0.18s ease',
                        textAlign: 'left',
                        color,
                        width: '100%',
                      }}
                      onMouseEnter={e => {
                        if (!submitted && !isSelected)
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={e => {
                        if (!submitted && !isSelected)
                          (e.currentTarget as HTMLButtonElement).style.background = bg;
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 26,
                          height: 26,
                          borderRadius: 'var(--radius-sm)',
                          background: optLabelBg,
                          color: optLabelColor,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {opt}
                      </span>
                      <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{q.options[opt]}</span>
                      {showCorrect && (
                        <span style={{ marginLeft: 'auto', color: 'var(--accent-success)', fontSize: '1rem' }}>✓</span>
                      )}
                      {showWrong && (
                        <span style={{ marginLeft: 'auto', color: 'var(--accent-danger)', fontSize: '1rem' }}>✗</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      {quizState === 'active' && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={!allAnswered}
            style={{
              padding: '0.75rem 2rem',
              opacity: allAnswered ? 1 : 0.45,
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              fontSize: '0.95rem',
            }}
          >
            Submit Answers →
          </button>
        </div>
      )}
      {!allAnswered && quizState === 'active' && (
        <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Answer all {questions.length} questions to submit
        </p>
      )}
    </div>
  );
}
