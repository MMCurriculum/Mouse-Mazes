import React from 'react';
import styles from './SidePanel.module.css';

export function InferencePanel({ onTestModel, logEntries, onShowHiddenModel, showHiddenModelButton }) {
  console.log('InferencePanel render - showHiddenModelButton:', showHiddenModelButton);
  return (
    <div className={styles.inferencePanel}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button className={styles.testModelBtn} onClick={onTestModel}>
          Test My Model
        </button>
        {showHiddenModelButton && (
          <button className={styles.testModelBtn} onClick={onShowHiddenModel}>
            Show Hidden Model
          </button>
        )}
      </div>
      <div className={styles.logTitle}>Probe Log</div>
      <div className={styles.logBox}>
        {logEntries.map((entry, index) => (
          <div key={index}>{entry}</div>
        ))}
      </div>
    </div>
  );
}

