import React from 'react';
import styles from './SidePanel.module.css';
import { PromptBox } from './PromptBox';
import { FeedbackBox } from './FeedbackBox';
import { ScoreBox } from './ScoreBox';
import { InferencePanel } from './InferencePanel';
import { QuestionLog } from './QuestionLog';

export function SidePanel({
  mode,
  mazeType,
  prompt,
  promptIsHTML,
  feedback,
  feedbackClass,
  score,
  questionIndex,
  totalQuestions,
  onTestModel,
  onNoExitClick,
  logEntries,
  questionHistory,
  onShowHiddenModel,
  showHiddenModelButton
}) {
  return (
    <div className={styles.sidePanel}>
      <PromptBox content={prompt} isHTML={promptIsHTML} />
      <FeedbackBox feedback={feedback} className={feedbackClass} />
      {mode === 'intro' && (
        <ScoreBox score={score} questionIndex={questionIndex} totalQuestions={totalQuestions} />
      )}
      {mode === 'intro' && mazeType === 'arrows' && (
        <button className={styles.noExitButton} onClick={onNoExitClick}>
          The Mouse Doesn't Come Out!
        </button>
      )}
      {mode === 'intro' && (
        <QuestionLog questionHistory={questionHistory} />
      )}
      {mode === 'inference' && (
        <InferencePanel 
          onTestModel={onTestModel} 
          logEntries={logEntries}
          onShowHiddenModel={onShowHiddenModel}
          showHiddenModelButton={showHiddenModelButton}
        />
      )}
    </div>
  );
}

