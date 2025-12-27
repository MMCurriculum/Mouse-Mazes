import { useState, useRef, useCallback } from 'react';
import { holeWallCoords } from '../utils/mazeUtils';
import { drawMaze as drawMazeUtil } from '../utils/drawingUtils';

const CANVAS_SIZE = 600;
const SIZE = 4;
const CELL = CANVAS_SIZE / SIZE;

// Cache for the mouse image - preload it
let mouseImageCache = null;

// Preload the mouse image
const mouseImage = new Image();
mouseImage.onload = () => {
  mouseImageCache = mouseImage;
};
mouseImage.onerror = () => {
  console.warn('Failed to load mouse image:', (process.env.PUBLIC_URL || '.') + '/movingmouse.png');
};
mouseImage.src = (process.env.PUBLIC_URL || '.') + '/movingmouse.png';

function drawMouseOnCanvas(ctx, x, y, direction) {
  if (!mouseImageCache) {
    // Image not loaded yet, skip drawing
    return;
  }
  
  ctx.save();
  
  // Move to center point
  ctx.translate(x, y);
  
  // Apply transformations based on direction
  // Image faces right by default
  if (direction === 'right') {
    // No transformation needed (already faces right)
  } else if (direction === 'down') {
    // Rotate 90 degrees clockwise
    ctx.rotate(Math.PI / 2);
  } else if (direction === 'left') {
    // Flip horizontally to face left
    ctx.scale(-1, 1);
  } else if (direction === 'up') {
    // Rotate 90 degrees counterclockwise
    ctx.rotate(-Math.PI / 2);
  }
  
  // Add shadow effect
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  
  // Draw image centered, scaled to 36px (50% of 72px)
  const imgSize = 36;
  ctx.drawImage(mouseImageCache, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
  
  ctx.restore();
}

function getDirection(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  
  // Determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

export function useAnimation(ctxRef, canvasRef, drawMaze, mouseMarkerRef) {
  const [animating, setAnimating] = useState(false);
  const animationFrameRef = useRef(null);

  const animatePath = useCallback((path, exitHole, trapped, startHole, after, gridToDraw) => {
    if (!canvasRef.current) return;
    
    // Ensure context is set
    if (!ctxRef.current && canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
    }
    
    if (!ctxRef.current) return;
    
    setAnimating(true);
    const points = [];
    points.push(holeWallCoords(startHole, CELL, CANVAS_SIZE, CANVAS_SIZE));
    for (const p of path) {
      points.push({ x: p.c * CELL + CELL / 2, y: p.r * CELL + CELL / 2 });
    }
    if (!trapped && exitHole !== null && exitHole !== undefined) {
      points.push(holeWallCoords(exitHole, CELL, CANVAS_SIZE, CANVAS_SIZE));
    }

    if (points.length < 2) {
      setAnimating(false);
      if (after) after();
      return;
    }

    let segIndex = 0;
    let frame = 0;
    const framesPerSeg = 31; // 95% slower than original: 15 * 1.95 = 29.25, rounded to 31

    const step = () => {
      if (!ctxRef.current || !canvasRef.current) return;
      
      drawMazeUtil(ctxRef.current, canvasRef.current, gridToDraw, CELL);

      ctxRef.current.strokeStyle = "rgba(255,200,80,0.6)";
      ctxRef.current.lineWidth = 6;
      ctxRef.current.lineCap = "round";
      ctxRef.current.beginPath();
      let started = false;
      for (let i = 0; i < segIndex; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        if (!started) {
          ctxRef.current.moveTo(p1.x, p1.y);
          started = true;
        }
        ctxRef.current.lineTo(p2.x, p2.y);
      }
      const p1 = points[segIndex];
      const p2 = points[segIndex+1];
      const t = frame / framesPerSeg;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      if (!started) {
        ctxRef.current.moveTo(p1.x, p1.y);
        started = true;
      }
      ctxRef.current.lineTo(x, y);
      ctxRef.current.stroke();
      ctxRef.current.lineWidth = 1;

      // Determine direction and draw mouse facing that direction
      const direction = getDirection(p1, p2);
      drawMouseOnCanvas(ctxRef.current, x, y, direction);

      frame++;
      if (frame > framesPerSeg) {
        frame = 0;
        segIndex++;
        if (segIndex >= points.length - 1) {
          setAnimating(false);
          if (after) after();
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(step);
    };
    
    animationFrameRef.current = requestAnimationFrame(step);
  }, [ctxRef, canvasRef]);

  const animateDomSegment = useCallback((p1, p2, callback) => {
    if (!mouseMarkerRef.current) return;
    
    setAnimating(true);
    const frames = 91; // 95% slower than original: 45 * 1.95 = 87.75, rounded to 91
    let frame = 0;
    mouseMarkerRef.current.style.display = "block";
    
    // Determine direction for this segment
    const direction = getDirection(p1, p2);
    let transform = '';
    
    // Apply transformations based on direction (image faces right by default)
    if (direction === 'right') {
      transform = ''; // No transformation needed
    } else if (direction === 'down') {
      transform = 'rotate(90deg)'; // Rotate 90 degrees clockwise
    } else if (direction === 'left') {
      transform = 'scaleX(-1)'; // Flip horizontally
    } else if (direction === 'up') {
      transform = 'rotate(-90deg)'; // Rotate 90 degrees counterclockwise
    }
    
    mouseMarkerRef.current.style.transform = transform;

    const step = () => {
      if (!mouseMarkerRef.current) return;
      
      const t = frame / frames;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      mouseMarkerRef.current.style.left = (x - 18) + "px"; // 50% of 36px = 18px
      mouseMarkerRef.current.style.top = (y - 18) + "px"; // 50% of 36px = 18px

      frame++;
      if (frame > frames) {
        if (callback) callback();
        return;
      }
      animationFrameRef.current = requestAnimationFrame(step);
    };
    
    animationFrameRef.current = requestAnimationFrame(step);
  }, [mouseMarkerRef]);

  const animateInferenceProbe = useCallback((startHole, info, after, holeRefs) => {
    if (!mouseMarkerRef.current) return;
    
    const holeStartDiv = holeRefs.find(h => h && parseInt(h.dataset?.num) === startHole);
    if (!holeStartDiv) {
      if (after) after();
      return;
    }
    
    const startBtn = {
      x: holeStartDiv.offsetLeft + holeStartDiv.offsetWidth / 2,
      y: holeStartDiv.offsetTop + holeStartDiv.offsetHeight / 2
    };
    const startEdgeCanvas = holeWallCoords(startHole, CELL, CANVAS_SIZE, CANVAS_SIZE);
    const startEdge = { x: startEdgeCanvas.x, y: startEdgeCanvas.y };

    const doExit = () => {
      if (info.trapped || info.exitHole === null || info.exitHole === undefined) {
        if (mouseMarkerRef.current) {
          mouseMarkerRef.current.style.display = "none";
        }
        setAnimating(false);
        if (after) after();
        return;
      }
      const holeExitDiv = holeRefs.find(h => h && parseInt(h.dataset?.num) === info.exitHole);
      if (!holeExitDiv) {
        if (mouseMarkerRef.current) {
          mouseMarkerRef.current.style.display = "none";
        }
        setAnimating(false);
        if (after) after();
        return;
      }
      const exitEdgeCanvas = holeWallCoords(info.exitHole, CELL, CANVAS_SIZE, CANVAS_SIZE);
      const exitEdge = { x: exitEdgeCanvas.x, y: exitEdgeCanvas.y };
      const exitBtn = {
        x: holeExitDiv.offsetLeft + holeExitDiv.offsetWidth / 2,
        y: holeExitDiv.offsetTop + holeExitDiv.offsetHeight / 2
      };
      animateDomSegment(exitEdge, exitBtn, () => {
        if (mouseMarkerRef.current) {
          mouseMarkerRef.current.style.display = "none";
        }
        setAnimating(false);
        if (after) after();
      });
    };

    animateDomSegment(startBtn, startEdge, doExit);
  }, [mouseMarkerRef, animateDomSegment]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return { animating, animatePath, animateInferenceProbe, cleanup };
}

