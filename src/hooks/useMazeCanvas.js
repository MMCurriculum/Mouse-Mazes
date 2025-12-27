import { useRef, useEffect, useCallback } from 'react';
import { drawMaze as drawMazeUtil } from '../utils/drawingUtils';

const CANVAS_SIZE = 600;
const SIZE = 4;
const CELL = CANVAS_SIZE / SIZE;

export function useMazeCanvas(gridToDraw, hiddenGrid = null) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && !ctxRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
    }
  }, []);

  const drawMaze = useCallback(() => {
    if (!canvasRef.current || !ctxRef.current) return;
    drawMazeUtil(ctxRef.current, canvasRef.current, gridToDraw, CELL, hiddenGrid);
  }, [gridToDraw, hiddenGrid]);

  useEffect(() => {
    drawMaze();
  }, [gridToDraw, hiddenGrid, drawMaze]);

  return { canvasRef, ctxRef, drawMaze, CELL, CANVAS_SIZE };
}

