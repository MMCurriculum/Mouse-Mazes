import React from 'react';
import styles from './SidePanel.module.css';

export function QuestionLog({ questionHistory }) {
  return (
    <div className={styles.inferencePanel}>
      <div className={styles.logTitle}>Question Log</div>
      <div className={styles.logBox}>
        {questionHistory && questionHistory.length > 0 ? (
          questionHistory.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <strong>Question {item.questionNumber - 1}:</strong> {item.questionText}
            </div>
          ))
        ) : (
          <div style={{ color: '#999', fontStyle: 'italic' }}>No questions answered yet.</div>
        )}
      </div>
    </div>
  );
}

