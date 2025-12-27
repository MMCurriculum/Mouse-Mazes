import React from 'react';
import styles from './SidePanel.module.css';

export function PromptBox({ content, isHTML = false }) {
  if (isHTML) {
    return (
      <div className={styles.promptBox} dangerouslySetInnerHTML={{ __html: content }} />
    );
  }
  return (
    <div className={styles.promptBox} style={{ whiteSpace: 'pre-line' }}>
      {content}
    </div>
  );
}

