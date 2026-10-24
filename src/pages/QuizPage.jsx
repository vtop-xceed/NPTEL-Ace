import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useScoreHistory } from '../hooks/useScoreHistory';
import { shuffle } from '../utils/shuffle';
import Confetti from '../components/Confetti';
import MilestoneOverlay from '../components/MilestoneOverlay';
import CelebrationVideo from '../components/CelebrationVideo';
import XpPopup from '../components/XpPopup';
import cloudData from '../data/cloud.json';
import blockchainData from '../data/blockchain.json';
import iotData from '../data/iot.json';
import entrepreneurshipData from '../data/entrepreneurship.json';

const DATA_MAP = {
  cloud: cloudData,
  blockchain: blockchainData,
  iot: iotData,
  entrepreneurship: entrepreneurshipData,
};

export default function QuizPage() {
  const { course, week } = useParams();
  const navigate = useNavigate();
  const { setCourseTheme } = useTheme();
  const { save } = useScoreHistory();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [quizState, setQuizState] = useState('selecting'); // 'selecting' | 'feedback' | 'milestone' | 'video' | 'results'
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [xpTrigger, setXpTrigger] = useState(0);
  const [slideDir, setSlideDir] = useState('right'); // 'right' | 'left'

  // Milestone tracking
  const [milestoneInfo, setMilestoneInfo] = useState(null);
  const lastMilestoneAt = useRef(0);
  const scoreAtLastMilestone = useRef(0);

  // Set course theme
  useEffect(() => {
    if (course) {
      setCourseTheme(course);
    }
  }, [course, setCourseTheme]);

  // Load & shuffle questions on mount
  useEffect(() => {
    const courseData = DATA_MAP[course];
    if (!courseData) {
      navigate('/');
      return;
    }

    let rawQuestions = [];
    if (week === 'grand') {
      Object.keys(courseData).forEach(w => {
        rawQuestions = rawQuestions.concat(courseData[w]);
      });
    } else if (courseData[week]) {
      rawQuestions = [...courseData[week]];
    }

    if (rawQuestions.length === 0) {
      navigate('/');
      return;
    }

    const shuffled = shuffle(rawQuestions);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedOptions(new Set());
    setQuizState('selecting');
    lastMilestoneAt.current = 0;
    scoreAtLastMilestone.current = 0;
  }, [course, week, navigate]);

  const currentQ = questions[currentIndex];

  // Helper for correct indices
  const correctIndices = useMemo(() => {
    if (!currentQ) return [];
    if (Array.isArray(currentQ.correctIndex)) {
      return currentQ.correctIndex;
    }
    if (typeof currentQ.correctIndex === 'number') {
      return [currentQ.correctIndex];
    }
    return [];
  }, [currentQ]);

  const isMSQ = correctIndices.length > 1;

  // Toggle option selection
  const handleSelectOption = (idx) => {
    if (quizState !== 'selecting') return;

    setSelectedOptions(prev => {
      const next = new Set(prev);
      if (isMSQ) {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
      } else {
        next.clear();
        next.add(idx);
      }
      return next;
    });
  };

  // Submit Answer
  const handleCheck = () => {
    if (selectedOptions.size === 0 || quizState !== 'selecting') return;

    const selectedArr = Array.from(selectedOptions).sort();
    const correctArr = [...correctIndices].sort();

    const correct =
      selectedArr.length === correctArr.length &&
      selectedArr.every((val, i) => val === correctArr[i]);

    setIsAnswerCorrect(correct);
    setQuizState('feedback');

    if (correct) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setConfettiTrigger(Date.now());
      setXpTrigger(Date.now());
    } else {
      setStreak(0);
    }
  };

  // Advance to next question or milestone or results
  const handleContinue = () => {
    const answeredCount = currentIndex + 1;
    const isFinished = answeredCount >= questions.length;

    if (isFinished) {
      save(course, week, score, questions.length);
      const pct = Math.round((score / questions.length) * 100);
      if (pct > 50) {
        setQuizState('video');
      } else {
        setQuizState('results');
      }
      return;
    }

    // Check for milestone celebration every 3 questions
    const milestoneInterval = 3;
    if (
      answeredCount > 0 &&
      answeredCount % milestoneInterval === 0 &&
      answeredCount !== lastMilestoneAt.current
    ) {
      const correctSinceLast = score - scoreAtLastMilestone.current;
      lastMilestoneAt.current = answeredCount;
      scoreAtLastMilestone.current = score;

      if (correctSinceLast >= 2) {
        setMilestoneInfo({
          correctCount: correctSinceLast,
          totalInBlock: milestoneInterval,
        });
        setQuizState('milestone');
        setConfettiTrigger(Date.now());
        return;
      }
    }

    // Next question
    advanceQuestion();
  };

  const advanceQuestion = () => {
    setSlideDir('right');
    setCurrentIndex(prev => prev + 1);
    setSelectedOptions(new Set());
    setQuizState('selecting');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMilestoneDismiss = () => {
    setMilestoneInfo(null);
    advanceQuestion();
  };

  const handleVideoComplete = () => {
    setQuizState('results');
    const pct = Math.round((score / questions.length) * 100);
    if (pct >= 50) {
      setConfettiTrigger(Date.now());
    }
  };

  const handleRestart = () => {
    const shuffled = shuffle(questions);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedOptions(new Set());
    setQuizState('selecting');
    lastMilestoneAt.current = 0;
    scoreAtLastMilestone.current = 0;
  };

  if (questions.length === 0) {
    return (
      <div className="quiz-body" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading quiz questions...</p>
      </div>
    );
  }

  // Calculate stats for Results
  const pct = Math.round((score / questions.length) * 100);
  let resultEmoji = '🎉';
  let resultTitle = 'Excellent Work!';
  let resultSubtitle = "You're almost there, keep it up!";

  if (pct === 100) {
    resultEmoji = '🏆';
    resultTitle = 'Perfect Score!';
    resultSubtitle = 'You nailed every single question!';
  } else if (pct >= 80) {
    resultEmoji = '🎉';
    resultTitle = 'Excellent Work!';
    resultSubtitle = "You're doing great, keep it up!";
  } else if (pct >= 60) {
    resultEmoji = '💪';
    resultTitle = 'Good Effort!';
    resultSubtitle = "A little more practice and you'll master this.";
  } else {
    resultEmoji = '📖';
    resultTitle = 'Keep Studying!';
    resultSubtitle = 'Review the material and try again.';
  }

  const progressPct = Math.min(100, Math.round(((currentIndex + (quizState === 'results' ? 1 : 0)) / questions.length) * 100));

  return (
    <>
      <Confetti trigger={confettiTrigger} />

      {/* Progress Bar */}
      {quizState !== 'results' && quizState !== 'video' && (
        <>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="quiz-header" id="quiz-header">
            <Link to="/" className="quiz-close-btn" aria-label="Exit quiz">
              ✕
            </Link>
            <span className="quiz-counter">
              <span className="current">{currentIndex + 1}</span> / {questions.length}
            </span>
            <div className={`quiz-streak-badge ${streak >= 2 ? 'visible' : ''} ${streak >= 5 ? 'hot' : ''}`}>
              <span className="streak-flame">🔥</span>
              <span className="streak-num" key={streak}>{streak}</span>
            </div>
          </div>
          <XpPopup trigger={xpTrigger} amount={10} />
        </>
      )}

      {/* Video Screen */}
      {quizState === 'video' && (
        <div className="results-screen">
          <CelebrationVideo onComplete={handleVideoComplete} />
        </div>
      )}

      {/* Milestone Overlay */}
      {quizState === 'milestone' && milestoneInfo && (
        <MilestoneOverlay
          correctCount={milestoneInfo.correctCount}
          totalInBlock={milestoneInfo.totalInBlock}
          onDismiss={handleMilestoneDismiss}
        />
      )}

      {/* Results Screen */}
      {quizState === 'results' && (
        <div className="results-screen view-transition">
          <div className="results-content">
            <div className="results-emoji">{resultEmoji}</div>
            <h2 className="results-title">{resultTitle}</h2>
            <p className="results-subtitle">{resultSubtitle}</p>
            <div className="results-stats">
              <div className="result-stat-card">
                <div
                  className={`result-stat-value ${
                    pct >= 80 ? '' : pct >= 50 ? 'warning' : 'danger'
                  }`}
                >
                  {score}/{questions.length}
                </div>
                <div className="result-stat-label">Score</div>
              </div>
              <div className="result-stat-card">
                <div
                  className={`result-stat-value ${
                    pct >= 80 ? '' : pct >= 50 ? 'warning' : 'danger'
                  }`}
                >
                  {pct}%
                </div>
                <div className="result-stat-label">Accuracy</div>
              </div>
              <div className="result-stat-card">
                <div className="result-stat-value warning">{bestStreak}</div>
                <div className="result-stat-label">Best Streak</div>
              </div>
            </div>
            <div className="results-actions">
              <button className="result-btn primary" onClick={handleRestart}>
                Try Again
              </button>
              <Link to="/" className="result-btn secondary">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Active Question View */}
      {(quizState === 'selecting' || quizState === 'feedback') && currentQ && (
        <>
          <main className="quiz-body">
            <div className={`question-container slide-${slideDir}`} key={currentIndex}>
              <div className="question-label">
                Question {currentIndex + 1} of {questions.length}
                {isMSQ && <span className="msq-badge">MSQ — Multiple Options</span>}
              </div>
              <h2 className="question-text">{currentQ.q}</h2>

              <div className="options-grid">
                {currentQ.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOptions.has(idx);
                  const isCorrectAnswer = correctIndices.includes(idx);

                  let cardClass = 'option-card';
                  let iconText = null;

                  if (quizState === 'feedback') {
                    if (isCorrectAnswer) {
                      cardClass += ' correct';
                      iconText = '✓';
                    } else if (isSelected) {
                      cardClass += ' wrong';
                      iconText = '✗';
                    } else {
                      cardClass += ' dimmed';
                    }
                  } else if (isSelected) {
                    cardClass += ' selected';
                  }

                  return (
                    <div
                      key={idx}
                      className={cardClass}
                      onClick={() => handleSelectOption(idx)}
                    >
                      <span className="option-badge">{letter}</span>
                      <span className="option-text">{opt}</span>
                      {iconText && (
                        <span className="option-result-icon">{iconText}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>

          {/* Bottom Bar */}
          <div
            className={`quiz-bottom-bar ${
              quizState === 'feedback'
                ? isAnswerCorrect
                  ? 'feedback-correct'
                  : 'feedback-wrong'
                : ''
            }`}
          >
            <div className="bottom-bar-inner">
              {quizState === 'feedback' && (
                <div className="feedback-section visible">
                  <div className="feedback-header">
                    <span className="feedback-icon">
                      {isAnswerCorrect ? '✅' : '❌'}
                    </span>
                    <span
                      className={`feedback-title ${
                        isAnswerCorrect ? 'correct' : 'wrong'
                      }`}
                    >
                      {isAnswerCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  {currentQ.solution && (
                    <p className="feedback-solution">{currentQ.solution}</p>
                  )}
                </div>
              )}

              {quizState === 'selecting' ? (
                <button
                  className="quiz-action-btn check-btn"
                  disabled={selectedOptions.size === 0}
                  onClick={handleCheck}
                >
                  CHECK
                </button>
              ) : (
                <button
                  className={`quiz-action-btn ${
                    isAnswerCorrect ? 'continue-btn' : 'wrong-continue-btn'
                  }`}
                  onClick={handleContinue}
                >
                  {isAnswerCorrect ? 'CONTINUE' : 'GOT IT'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
