import React from 'react';
import styles from './SidePanel.module.css';

export function FeedbackBox({ feedback, className = '' }) {
  return (
    <div className={`${styles.feedbackBox} ${className ? styles[className] : ''}`}>
      {feedback}
    </div>
  );
}

