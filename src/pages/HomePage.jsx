import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useScoreHistory } from '../hooks/useScoreHistory';
import cloudData from '../data/cloud.json';
import blockchainData from '../data/blockchain.json';
import iotData from '../data/iot.json';
import entrepreneurshipData from '../data/entrepreneurship.json';
import FeedbackSection from '../components/FeedbackSection';

const COURSES = [
  {
    id: 'cloud',
    name: 'Cloud Computing',
    desc: 'Distributed Systems, Virtualization & Azure/GCP',
    icon: 'cloud',
    color: '#38bdf8',
    data: cloudData,
  },
  {
    id: 'blockchain',
    name: 'Blockchain & Applications',
    desc: 'Cryptography, Consensus & Cryptocurrency',
    icon: 'hub',
    color: '#00d4ff',
    data: blockchainData,
  },
  {
    id: 'iot',
    name: 'Introduction to IoT',
    desc: 'Sensors, Actuators, Wireless Networks & IoT Protocols',
    icon: 'satellite_alt',
    color: '#10b981',
    data: iotData,
  },
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    desc: 'Ideation, Prototyping, Disruption & Business Strategies',
    icon: 'rocket_launch',
    color: '#f59e0b',
    data: entrepreneurshipData,
  },
];

export default function HomePage() {
  const { setCourseTheme } = useTheme();
  const { getBest, clear } = useScoreHistory();
  const [selectedCourse, setSelectedCourse] = useState(() => {
    return localStorage.getItem('selectedCourse') || null;
  });
  const [viewState, setViewState] = useState(selectedCourse ? 'dashboard' : 'courses');
  const [transitioning, setTransitioning] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const dashboardRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowHowTo(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setCourseTheme(selectedCourse);
    if (selectedCourse) {
      localStorage.setItem('selectedCourse', selectedCourse);
    } else {
      localStorage.removeItem('selectedCourse');
    }
  }, [selectedCourse, setCourseTheme]);

  const activeCourseObj = COURSES.find(c => c.id === selectedCourse);

  const handleSelectCourse = (courseId) => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedCourse(courseId);
      setViewState('dashboard');
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 220);
  };

  const handleBackToCourses = () => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedCourse(null);
      setViewState('courses');
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 220);
  };

  return (
    <main className="main-content">
      {viewState === 'courses' && (
        <div
          id="view-courses"
          className={`home-view ${transitioning ? 'home-view-exit' : 'home-view-enter'}`}
        >
          <div className="hero-section">
            <img src="/logo.jpg" alt="NPTEL Ace Mascot" className="hero-mascot" />
            <h1 className="hero-title">
              NPTEL <span className="highlight">Ace</span>
            </h1>
            <p className="hero-subtitle">Pick a course to start practicing</p>
          </div>

          <div className="course-grid">
            {COURSES.map((course, index) => {
              const weekKeys = Object.keys(course.data);
              const weeksCount = weekKeys.length;
              const questionsCount = weekKeys.reduce(
                (acc, w) => acc + (course.data[w]?.length || 0),
                0
              );

              return (
                <div
                  key={course.id}
                  className="course-card"
                  id={`card-${course.id}`}
                  style={{ animationDelay: `${index * 0.08}s` }}
                  onClick={() => handleSelectCourse(course.id)}
                >
                  <div className="course-icon ms">{course.icon}</div>
                  <div className="course-info">
                    <h3>{course.name}</h3>
                    <p>{course.desc}</p>
                    <div className="course-stats">
                      <span className="course-stat"><span className="ms">calendar_month</span> {weeksCount} weeks</span>
                      <span className="course-stat"><span className="ms">contact_support</span> {questionsCount} questions</span>
                    </div>
                  </div>
                  <div className="course-card-arrow ms">chevron_right</div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="howto-trigger"
            onClick={() => setShowHowTo(true)}
            aria-haspopup="dialog"
          >
            <span className="ms">lightbulb</span> How to use NPTEL Ace — keybinds & tips
          </button>

          <FeedbackSection />
        </div>
      )}

      {viewState === 'dashboard' && (
        <div
          id="view-dashboard"
          ref={dashboardRef}
          className={`home-view ${transitioning ? 'home-view-exit' : 'home-view-enter'}`}
        >
          <div className="dashboard-header">
            <div className="dashboard-title-group">
              <span className="dashboard-course-icon ms" style={{ color: COURSES.find(c => c.id === selectedCourse)?.color }}>{COURSES.find(c => c.id === selectedCourse)?.icon}</span>
              <h2 className="dashboard-title">{activeCourseObj?.name}</h2>
            </div>
            <button className="back-to-courses" onClick={handleBackToCourses}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Courses
            </button>
          </div>

          <div className="dashboard-grid">
            {activeCourseObj &&
              Object.keys(activeCourseObj.data)
                .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                .map((week, idx) => {
                  const best = getBest(selectedCourse, week);
                  const hasScore = !!best;
                  return (
                    <Link
                      key={week}
                      to={`/quiz/${selectedCourse}/${week}`}
                      className={`week-card ${hasScore ? 'week-card-done' : ''}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <span className="week-number">{week}</span>
                      <span className="week-label">Week</span>
                      {best && (
                        <div className="week-score-wrapper">
                          <span className="week-score-badge">
                            Best: {best.score}/{best.total}
                          </span>
                          <button
                            type="button"
                            className="week-score-reset-btn"
                            title="Reset score"
                            aria-label={`Reset score for week ${week}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clear(selectedCourse, week);
                            }}
                          >
                            <span className="ms">close</span>
                          </button>
                        </div>
                      )}
                      {hasScore && <span className="week-done-tick ms">check_circle</span>}
                    </Link>
                  );
                })}

            {/* Grand Test Card */}
            {activeCourseObj && (
              <Link
                to={`/quiz/${selectedCourse}/grand`}
                className="week-card grand-test-card"
                style={{ animationDelay: `${Object.keys(activeCourseObj.data).length * 0.05 + 0.05}s` }}
              >
                <span className="week-number ms">emoji_events</span>
                <span className="week-label">Grand Test — All Weeks</span>
                {(() => {
                  const grandBest = getBest(selectedCourse, 'grand');
                  return grandBest ? (
                    <span className="week-score-badge">
                      Best: {grandBest.score}/{grandBest.total}
                    </span>
                  ) : null;
                })()}
              </Link>
            )}
          </div>
        </div>
      )}
      {showHowTo && (
        <div
          className="howto-modal-backdrop"
          onClick={() => setShowHowTo(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="howto-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="howto-modal-header">
              <h3><span className="ms">lightbulb</span> How to use NPTEL Ace</h3>
              <button
                type="button"
                className="howto-close-btn"
                onClick={() => setShowHowTo(false)}
                aria-label="Close"
              >
                <span className="ms">close</span>
              </button>
            </div>
            <ul className="howto-list">
              <li><span className="howto-key ms">touch_app</span> Pick a course, then a week — or jump straight to the Grand Test mixing every week.</li>
              <li><span className="howto-key ms">ads_click</span> <b>Right-click</b> to check your answer, continue, or dismiss the streak pop-up — no in-browser menu while quizzing.</li>
              <li><span className="howto-key ms">keyboard</span> <b>Esc</b> closes any open pop-up.</li>
              <li><span className="howto-key ms">local_fire_department</span> Stack 2+ correct answers in a row for milestone celebrations.</li>
              <li><span className="howto-key ms">forum</span> Spotted a wrong answer? Use the feedback card below — it helps fix data.</li>
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
