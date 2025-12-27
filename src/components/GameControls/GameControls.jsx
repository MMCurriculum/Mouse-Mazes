import React from 'react';
import styles from './GameControls.module.css';

export function GameControls({ mode, mazeType, level, onModeChange, onMazeTypeChange, onLevelChange, onNewGame }) {
  return (
    <div className={styles.topControls}>
      <label>Mode:</label>
      <select value={mode} onChange={(e) => onModeChange(e.target.value)}>
        <option value="intro">Introduction</option>
        <option value="inference">Inference</option>
      </select>
      <label>Maze Type:</label>
      <select value={mazeType} onChange={(e) => onMazeTypeChange(e.target.value)}>
        <option value="walls">Bouncy Walls</option>
        <option value="arrows">Arrows</option>
      </select>
      <label>Number of Detours:</label>
      <select value={level} onChange={(e) => onLevelChange(e.target.value)}>
        <option value="beginner">Beginner (1-3)</option>
        <option value="intermediate">Intermediate (4-6)</option>
        <option value="expert">Expert (7-12)</option>
      </select>
      <button onClick={onNewGame}>Start New Game</button>
    </div>
  );
}

