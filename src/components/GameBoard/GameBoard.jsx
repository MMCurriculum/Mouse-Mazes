import React, { useRef, useCallback } from 'react';
import { Hole } from '../Hole/Hole';
import styles from './GameBoard.module.css';

const CANVAS_SIZE = 600;
const SIZE = 4;
const CELL = CANVAS_SIZE / SIZE;
const OFFSET = 30;

export function GameBoard({
  mode,
  gridToDraw,
  animating,
  onHoleClick,
  onCanvasClick,
  mouseMarkerRef,
  holeRefs,
  canvasRef
}) {
  const boardWrapperRef = useRef(null);

  // Create holes array
  const holes = [];
  let n = 1;
  // Top row
  for (let c = 0; c < SIZE; c++) {
    holes.push({ num: n++, x: c * CELL + CELL / 2, y: -OFFSET });
  }
  // Right column
  for (let r = 0; r < SIZE; r++) {
    holes.push({ num: n++, x: CANVAS_SIZE + OFFSET, y: r * CELL + CELL / 2 });
  }
  // Bottom row
  for (let c = SIZE - 1; c >= 0; c--) {
    holes.push({ num: n++, x: c * CELL + CELL / 2, y: CANVAS_SIZE + OFFSET });
  }
  // Left column
  for (let r = SIZE - 1; r >= 0; r--) {
    holes.push({ num: n++, x: -OFFSET, y: r * CELL + CELL / 2 });
  }

  const handleCanvasClick = useCallback((e) => {
    if (mode !== 'inference' || animating || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    onCanvasClick(r, c);
  }, [mode, animating, onCanvasClick, canvasRef]);

  return (
    <div className={styles.leftColumn}>
      <div ref={boardWrapperRef} className={styles.boardWrapper}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onClick={handleCanvasClick}
        />
        {holes.map((hole, index) => (
          <div key={hole.num}>
            <Hole
              number={hole.num}
              x={hole.x}
              y={hole.y}
              onClick={onHoleClick}
              animating={animating}
              ref={el => { if (holeRefs && el) holeRefs.current[index] = el; }}
            />
          </div>
        ))}
        <img
          ref={mouseMarkerRef}
          className={styles.mouseMarker}
          src={(process.env.PUBLIC_URL || '.') + '/movingmouse.png'}
          alt="Mouse"
        />
      </div>
    </div>
  );
}

