import { useState, useCallback } from 'react';

const STORAGE_KEY = 'nptel-scores';

export function getScoreHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (data['iot-2']) {
      delete data['iot-2'];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    }
    return data;
  } catch {
    return {};
  }
}

export function saveScore(course, week, score, total) {
  const history = getScoreHistory();
  const key = `${course}-${week}`;
  const existing = history[key];
  if (!existing || score > existing.score) {
    history[key] = { score, total, date: Date.now() };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function clearScore(course, week) {
  const history = getScoreHistory();
  const key = `${course}-${week}`;
  if (history[key]) {
    delete history[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
  return history;
}

export function useScoreHistory() {
  const [history, setHistory] = useState(getScoreHistory);

  const save = useCallback((course, week, score, total) => {
    const updated = saveScore(course, week, score, total);
    setHistory(updated);
  }, []);

  const clear = useCallback((course, week) => {
    const updated = clearScore(course, week);
    setHistory(updated);
  }, []);

  const getBest = useCallback((course, week) => {
    return history[`${course}-${week}`] || null;
  }, [history]);

  return { history, save, clear, getBest };
}
