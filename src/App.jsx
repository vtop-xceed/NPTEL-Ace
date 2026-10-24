import React, { useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AnalyticsTracker } from './utils/analytics';

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
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AnalyticsTracker />
          <HeaderIfNotQuiz />
          <Routes>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/quiz/:course/:week" element={<PageTransition><QuizPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
