import React, { useState, useEffect } from 'react';

import { FEEDBACK_ENDPOINT } from '../utils/feedbackClient';

export default function FeedbackSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [course, setCourse] = useState('general');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !FEEDBACK_ENDPOINT) return;

    setStatus('submitting');
    try {
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course,
          rating,
          name: name.trim() || 'Anonymous Student',
          message: message.trim(),
          page: window.location.href,
        }),
      });
      if (!res.ok) throw new Error(`feedback endpoint ${res.status}`);
    } catch {
      setStatus('error');
      return;
    }

    setStatus('success');
    setMessage('');
    setName('');
  };

  // Automatically close modal after 2.5 seconds on success
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => {
      setIsOpen(false);
      setStatus('idle');
    }, 2500);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <>
      {/* Inline Feedback Bar on Homepage below courses */}
      <div className="feedback-inline-bar">
        <span>Have feedback or noticed a typo?</span>
        <button
          type="button"
          className="feedback-inline-trigger"
          onClick={() => {
            setIsOpen(true);
            setStatus('idle');
          }}
        >
          <span className="ms">forum</span> Give Feedback
        </button>
      </div>

      {/* Modal Backdrop and Popup Form */}
      {isOpen && (
        <div
          className="feedback-modal-backdrop"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="feedback-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="feedback-modal-header">
              <div className="feedback-header-left">
                <span className="feedback-modal-badge"><span className="ms">forum</span> Feedback</span>
                <h3 className="feedback-modal-title">Share Your Feedback</h3>
              </div>
              <button
                type="button"
                className="feedback-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close Feedback Form"
              >
                <span className="ms">close</span>
              </button>
            </div>

            {status === 'success' ? (
              <div className="feedback-success-state">
                <div className="feedback-success-icon ms">celebration</div>
                <h4>Thank you for your feedback!</h4>
                <p className="feedback-card-sub" style={{ marginTop: '8px' }}>
                  Your feedback has been submitted successfully.
                </p>
                <div className="feedback-success-actions" style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    className="feedback-btn-secondary"
                    onClick={() => {
                      setIsOpen(false);
                      setStatus('idle');
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="feedback-form">
                {status === 'error' && (
                  <p className="feedback-error-note" role="alert">
                    Couldn't send your feedback right now. Please try again in a bit.
                  </p>
                )}
                <p className="feedback-card-sub">
                  Spotted a wrong answer or a typo? Tell us which question and what's wrong.
                </p>

                <div className="feedback-row">
                  <div className="feedback-field">
                    <label htmlFor="fb-course">Course</label>
                    <select
                      id="fb-course"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="feedback-select"
                    >
                      <option value="general">🌐 General / Website</option>
                      <option value="cloud">☁️ Cloud Computing</option>
                      <option value="iot">📡 Introduction to IoT</option>
                      <option value="blockchain">⛓️ Blockchain & Applications</option>
                      <option value="entrepreneurship">🚀 Entrepreneurship</option>
                    </select>
                  </div>

                  <div className="feedback-field">
                    <label>Rating</label>
                    <div className="feedback-stars" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`${star} star`}
                        >
                          <span className="ms">star</span>
                        </button>
                      ))}
                      <span className="star-text">
                        {rating === 5 && 'Loved it!'}
                        {rating === 4 && 'Great'}
                        {rating === 3 && 'Good'}
                        {rating === 2 && 'Needs work'}
                        {rating === 1 && 'Needs fix'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="feedback-field">
                  <label htmlFor="fb-name">Your Name (Optional)</label>
                  <input
                    id="fb-name"
                    type="text"
                    placeholder="e.g. Rahul / Student"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="feedback-input"
                    maxLength={60}
                  />
                </div>

                <div className="feedback-field">
                  <label htmlFor="fb-message">
                    Feedback / Suggestion <span className="required">*</span>
                  </label>
                  <textarea
                    id="fb-message"
                    rows={3}
                    placeholder="Write your feedback or suggestion here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="feedback-textarea"
                    required
                    maxLength={800}
                  />
                </div>

                <div className="feedback-actions">
                  <button
                    type="submit"
                    className="feedback-submit-btn"
                    disabled={status === 'submitting' || !message.trim()}
                  >
                    {status === 'submitting' ? (
                      <>
                        <span className="fb-spinner"></span> Submitting...
                      </>
                    ) : (
                      <>Submit Feedback</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
