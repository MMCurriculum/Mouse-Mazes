// Maze generation and simulation utilities

const SIZE = 4;

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function emptyGrid() {
  const g = [];
  for (let r = 0; r < SIZE; r++) g[r] = new Array(SIZE).fill("");
  return g;
}

export function hasOpposingArrows(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (!v) continue;
      if (c + 1 < SIZE) {
        const vr = grid[r][c+1];
        if ((v === "R" && vr === "L") || (v === "L" && vr === "R")) return true;
      }
      if (r + 1 < SIZE) {
        const vd = grid[r+1][c];
        if ((v === "D" && vd === "U") || (v === "U" && vd === "D")) return true;
      }
    }
  }
  return false;
}

export function makeMazeOnce(mazeType, level) {
  const grid = emptyGrid();

  let minObj, maxObj;
  if (level === "beginner") { minObj = 1; maxObj = 3; }
  else if (level === "intermediate") { minObj = 4; maxObj = 6; }
  else { minObj = 7; maxObj = 12; }

  const count = randInt(minObj, maxObj);

  let cells = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      cells.push({r,c});
  shuffle(cells);

  const dirs = ["U","D","L","R"];
  for (let i = 0; i < count; i++) {
    const {r,c} = cells[i];
    if (mazeType === "walls") {
      grid[r][c] = Math.random() < 0.5 ? "/" : "\\";
    } else {
      grid[r][c] = dirs[Math.floor(Math.random() * 4)];
    }
  }
  
  return grid;
}

export function startFromHole(h) {
  if (h >= 1 && h <= 4) return { r: 0, c: h - 1, dir: "D" };
  if (h >= 5 && h <= 8) return { r: h - 5, c: 3, dir: "L" };
  if (h >= 9 && h <= 12) return { r: 3, c: 12 - h, dir: "U" };
  if (h >= 13 && h <= 16) return { r: 16 - h, c: 0, dir: "R" };
}

export function findExit(r, c) {
  if (r < 0) return c + 1;
  if (c >= SIZE) return 5 + r;
  if (r >= SIZE) return 9 + (SIZE - 1 - c);
  if (c < 0) return 13 + (SIZE - 1 - r);
}

export function simulateHoleWithGrid(startHole, gridForSim) {
  const start = startFromHole(startHole);
  let r = start.r, c = start.c, dir = start.dir;
  const path = [];
  const visited = new Set();

  while (true) {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
      const exit = findExit(r, c);
      return { path, exitHole: exit, trapped: false };
    }
    const key = `${r},${c},${dir}`;
    if (visited.has(key)) {
      return { path, exitHole: null, trapped: true };
    }
    visited.add(key);
    path.push({ r, c });
    const v = gridForSim[r][c];
    if (v === "/") {
      if (dir === "R") dir = "U";
      else if (dir === "U") dir = "R";
      else if (dir === "L") dir = "D";
      else if (dir === "D") dir = "L";
    } else if (v === "\\") {
      if (dir === "R") dir = "D";
      else if (dir === "D") dir = "R";
      else if (dir === "L") dir = "U";
      else if (dir === "U") dir = "L";
    } else if (["U","D","L","R"].includes(v)) {
      dir = v;
    }
    if (dir === "U") r--;
    else if (dir === "D") r++;
    else if (dir === "L") c--;
    else if (dir === "R") c++;
  }
}

export function computeMappingForGrid(gridForSim) {
  const map = {};
  for (let h = 1; h <= 16; h++) {
    map[h] = simulateHoleWithGrid(h, gridForSim);
  }
  return map;
}

export function makeMaze(mazeType, level) {
  let tries = 0;
  let realGrid;
  let mapping;
  
  while (true) {
    realGrid = makeMazeOnce(mazeType, level);
    const testMap = computeMappingForGrid(realGrid);
    let escaping = 0;
    for (let h = 1; h <= 16; h++) {
      if (!testMap[h].trapped && testMap[h].exitHole !== null) escaping++;
    }
    if (
      escaping > 0 &&
      !(mazeType === "arrows" && level === "beginner" && hasOpposingArrows(realGrid))
    ) {
      mapping = testMap;
      break;
    }
    tries++;
    if (tries > 50) {
      mapping = testMap;
      break;
    }
  }
  
  return { realGrid, mapping };
}

export function holeWallCoords(h, cell, canvasWidth, canvasHeight) {
  if (h >= 1 && h <= 4) {
    return { x: (h - 1) * cell + cell / 2, y: 0 };
  }
  if (h >= 5 && h <= 8) {
    return { x: canvasWidth, y: (h - 5) * cell + cell / 2 };
  }
  if (h >= 9 && h <= 12) {
    return { x: (12 - h) * cell + cell / 2, y: canvasHeight };
  }
  if (h >= 13 && h <= 16) {
    return { x: 0, y: (16 - h) * cell + cell / 2 };
  }
}

export { SIZE };

