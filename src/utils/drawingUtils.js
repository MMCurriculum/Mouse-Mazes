// Canvas drawing utilities

const SIZE = 4;

export function drawMaze(ctx, canvas, gridToDraw, cell, hiddenGrid = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const x = c * cell;
      const y = r * cell;

      const grad = ctx.createLinearGradient(x, y, x + cell, y + cell);
      grad.addColorStop(0, "#fefdfb");
      grad.addColorStop(1, "#e1dfd8");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, cell, cell);

      ctx.strokeStyle = "#777";
      ctx.strokeRect(x, y, cell, cell);

      const v = gridToDraw[r][c];
      if (v === "/" || v === "\\") {
        ctx.strokeStyle = "#3b6ea8";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 2;
        ctx.beginPath();
        if (v === "/") {
          ctx.moveTo(x, y + cell);
          ctx.lineTo(x + cell, y);
        } else {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cell, y + cell);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
      } else if (v) {
        drawArrow(ctx, x + cell / 2, y + cell / 2, v);
      }

      // Draw hidden model overlay in upper right corner if provided
      if (hiddenGrid && hiddenGrid[r][c]) {
        const hiddenVal = hiddenGrid[r][c];
        const overlayX = x + cell - 35; // Upper right corner
        const overlayY = y + 10;
        const overlaySize = 30;
        
        if (hiddenVal === "/" || hiddenVal === "\\") {
          // Draw small wall - centered at the middle of the cell (halfway mark) at exact 45-degree angle
          // Cell is 150px tall, so middle is at y + 75. overlayY is y + 10, so we need y + 75 - (y + 10) = 65px from overlayY
          const wallCenterY = overlayY + 65; // Center at halfway mark of cell (y + 75)
          const wallHalfSize = overlaySize / 2; // Use full half size for 45-degree angle
          ctx.strokeStyle = "#e67e22";
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 1;
          ctx.beginPath();
          if (hiddenVal === "/") {
            // 45-degree angle: x changes by overlaySize, y changes by -overlaySize (same magnitude, opposite direction)
            ctx.moveTo(overlayX, wallCenterY + wallHalfSize);
            ctx.lineTo(overlayX + overlaySize, wallCenterY - wallHalfSize);
          } else {
            // 45-degree angle: x changes by overlaySize, y changes by overlaySize (same magnitude, same direction)
            ctx.moveTo(overlayX, wallCenterY - wallHalfSize);
            ctx.lineTo(overlayX + overlaySize, wallCenterY + wallHalfSize);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1;
        } else {
          // Draw small arrow
          drawSmallArrow(ctx, overlayX + overlaySize / 2 - 3, overlayY + overlaySize / 2, hiddenVal);
        }
      }
    }
  }

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#333";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 1;
}

export function drawArrow(ctx, cx, cy, dir) {
  ctx.save();
  ctx.strokeStyle = "#3b6ea8";
  ctx.fillStyle = "#3b6ea8";
  ctx.lineWidth = 7;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 2;
  const len = 70;
  const head = 18;

  if (dir === "U" || dir === "D") {
    const y1 = cy - len / 2;
    const y2 = cy + len / 2;
    ctx.beginPath();
    ctx.moveTo(cx, dir === "U" ? y2 : y1);
    ctx.lineTo(cx, dir === "U" ? y1 : y2);
    ctx.stroke();

    ctx.beginPath();
    if (dir === "U") {
      ctx.moveTo(cx, y1 - head);
      ctx.lineTo(cx - head, y1 + 4);
      ctx.lineTo(cx + head, y1 + 4);
    } else {
      ctx.moveTo(cx, y2 + head);
      ctx.lineTo(cx - head, y2 - 4);
      ctx.lineTo(cx + head, y2 - 4);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    const x1 = cx - len / 2;
    const x2 = cx + len / 2;
    ctx.beginPath();
    ctx.moveTo(dir === "L" ? x2 : x1, cy);
    ctx.lineTo(dir === "L" ? x1 : x2, cy);
    ctx.stroke();

    ctx.beginPath();
    if (dir === "L") {
      ctx.moveTo(x1 - head, cy);
      ctx.lineTo(x1 + 4, cy - head);
      ctx.lineTo(x1 + 4, cy + head);
    } else {
      ctx.moveTo(x2 + head, cy);
      ctx.lineTo(x2 - 4, cy - head);
      ctx.lineTo(x2 - 4, cy + head);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawSmallArrow(ctx, cx, cy, dir) {
  ctx.save();
  ctx.strokeStyle = "#e67e22"; // Orange color
  ctx.fillStyle = "#e67e22";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 1;
  const len = 25; // Smaller arrow
  const head = 6;

  if (dir === "U" || dir === "D") {
    const y1 = cy - len / 2;
    const y2 = cy + len / 2;
    ctx.beginPath();
    ctx.moveTo(cx, dir === "U" ? y2 : y1);
    ctx.lineTo(cx, dir === "U" ? y1 : y2);
    ctx.stroke();

    ctx.beginPath();
    if (dir === "U") {
      ctx.moveTo(cx, y1 - head);
      ctx.lineTo(cx - head, y1 + 2);
      ctx.lineTo(cx + head, y1 + 2);
    } else {
      ctx.moveTo(cx, y2 + head);
      ctx.lineTo(cx - head, y2 - 2);
      ctx.lineTo(cx + head, y2 - 2);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    const x1 = cx - len / 2;
    const x2 = cx + len / 2;
    ctx.beginPath();
    ctx.moveTo(dir === "L" ? x2 : x1, cy);
    ctx.lineTo(dir === "L" ? x1 : x2, cy);
    ctx.stroke();

    ctx.beginPath();
    if (dir === "L") {
      ctx.moveTo(x1 - head, cy);
      ctx.lineTo(x1 + 2, cy - head);
      ctx.lineTo(x1 + 2, cy + head);
    } else {
      ctx.moveTo(x2 + head, cy);
      ctx.lineTo(x2 - 2, cy - head);
      ctx.lineTo(x2 - 2, cy + head);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

