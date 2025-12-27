import React, { forwardRef } from 'react';
import styles from './Hole.module.css';

export const Hole = forwardRef(function Hole({ number, x, y, onClick, animating }, ref) {
  return (
    <div
      ref={ref}
      className={styles.hole}
      style={{ left: `${x - 14}px`, top: `${y - 14}px` }}
      title={`Hole ${number}`}
      data-num={number}
      onClick={() => {
        if (!animating) {
          onClick(number);
        }
      }}
    >
      {number}
    </div>
  );
});

