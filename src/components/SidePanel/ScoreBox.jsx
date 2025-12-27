import React from 'react';
import styles from './SidePanel.module.css';

export function ScoreBox({ score, questionIndex, totalQuestions }) {
  const shownQ = Math.min(questionIndex, totalQuestions);
  return (
    <div className={styles.scoreBox}>
      Score: {score} / {shownQ}
    </div>
  );
}

