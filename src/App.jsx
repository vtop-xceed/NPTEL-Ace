import React, { useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import { AnalyticsTracker } from './utils/analytics';
import { startTracking } from './utils/tracker';

function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth; // reflow
    el.classList.add('page-enter');
    const timer = setTimeout(() => {
      if (el) el.classList.remove('page-enter');
    }, 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div ref={ref} className="page-enter">
      {children}
    </div>
  );
}

function HeaderIfNotQuiz() {
  const { pathname } = useLocation();
  return pathname.startsWith('/quiz') ? null : <Header />;
}

export default function App() {
  useEffect(() => {
    startTracking();
  }, []);
  return (
    <ThemeProvider>
      <Router>
        <AnalyticsTracker />
        <HeaderIfNotQuiz />
        <Routes>
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/quiz/:course/:week" element={<PageTransition><QuizPage /></PageTransition>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
