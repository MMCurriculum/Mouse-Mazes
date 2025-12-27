import { useState, useCallback, useRef } from 'react';
import { makeMaze, emptyGrid, computeMappingForGrid, simulateHoleWithGrid, randInt } from '../utils/mazeUtils';

const TOTAL_QUESTIONS = 8;

export function useMazeGame(mazeType, level, mode) {
  const [realGrid, setRealGrid] = useState(() => emptyGrid());
  const [modelGrid, setModelGrid] = useState(() => emptyGrid());
  const [mapping, setMapping] = useState({});
  const [gameActive, setGameActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [inferenceProbeCount, setInferenceProbeCount] = useState(0);
  
  // Refs for tracking used questions
  const usedForwardStarts = useRef(new Set());
  const usedReverseWallsEnds = useRef(new Set());
  const usedReverseArrowsEnds = useRef(new Set());
  const introColorToggle = useRef(false);

  const chooseForwardStart = useCallback(() => {
    const candidates = [];
    for (let h = 1; h <= 16; h++) {
      if (!usedForwardStarts.current.has(h)) candidates.push(h);
    }
    if (candidates.length === 0) return 1;
    const startHole = candidates[randInt(0, candidates.length - 1)];
    usedForwardStarts.current.add(startHole);
    return startHole;
  }, []);

  const chooseReverseWalls = useCallback((mapping) => {
    const pairs = [];
    for (let h = 1; h <= 16; h++) {
      const info = mapping[h];
      if (!info.trapped && info.exitHole !== null &&
          !usedReverseWallsEnds.current.has(info.exitHole)) {
        pairs.push({startHole: h, endHole: info.exitHole});
      }
    }
    if (pairs.length === 0) return null;
    const choice = pairs[randInt(0, pairs.length - 1)];
    usedReverseWallsEnds.current.add(choice.endHole);
    return choice;
  }, []);

  const chooseReverseArrows = useCallback((mapping) => {
    const endMap = {};
    for (let h = 1; h <= 16; h++) {
      const info = mapping[h];
      if (!info.trapped && info.exitHole !== null &&
          !usedReverseArrowsEnds.current.has(info.exitHole)) {
        if (!endMap[info.exitHole]) endMap[info.exitHole] = [];
        endMap[info.exitHole].push(h);
      }
    }
    const ends = Object.keys(endMap);
    if (ends.length === 0) return null;
    const endHole = parseInt(ends[randInt(0, ends.length - 1)]);
    usedReverseArrowsEnds.current.add(endHole);
    const starts = endMap[endHole];
    return {endHole, starts};
  }, []);

  const startIntroGame = useCallback(() => {
    setGameActive(true);
    setQuestionIndex(0);
    setScore(0);
    usedForwardStarts.current = new Set();
    usedReverseWallsEnds.current = new Set();
    usedReverseArrowsEnds.current = new Set();
    
    const { realGrid: newRealGrid, mapping: newMapping } = makeMaze(mazeType, level);
    setRealGrid(newRealGrid);
    setMapping(newMapping);
    setModelGrid(emptyGrid());
    setQuestionIndex(1);
    setAwaitingAnswer(true);
    
    // Return question data for first question
    let useReverse = false;
    if (level === "intermediate") useReverse = Math.random() < 0.4;
    else if (level === "expert") useReverse = Math.random() < 0.6;

    if (!useReverse) {
      const startHole = chooseForwardStart();
      const info = newMapping[startHole];
      const question = {
        mode: "forward",
        startHole,
        exitHole: info.exitHole,
        trapped: info.trapped
      };
      setCurrentQuestion(question);
      return { question, questionIndex: 1 };
    } else {
      if (mazeType === "walls") {
        const choice = chooseReverseWalls(newMapping);
        if (!choice) {
          // Retry with forward
          const startHole = chooseForwardStart();
          const info = newMapping[startHole];
          const question = {
            mode: "forward",
            startHole,
            exitHole: info.exitHole,
            trapped: info.trapped
          };
          setCurrentQuestion(question);
          return { question, questionIndex: 1 };
        }
        const {endHole, startHole} = choice;
        const question = {
          mode:"reverseWalls",
          endHole,
          startHole
        };
        setCurrentQuestion(question);
        return { question, questionIndex: 1 };
      } else {
        const choice = chooseReverseArrows(newMapping);
        if (!choice) {
          // Retry with forward
          const startHole = chooseForwardStart();
          const info = newMapping[startHole];
          const question = {
            mode: "forward",
            startHole,
            exitHole: info.exitHole,
            trapped: info.trapped
          };
          setCurrentQuestion(question);
          return { question, questionIndex: 1 };
        }
        const {endHole, starts} = choice;
        const question = {
          mode:"reverseArrows",
          endHole,
          starts
        };
        setCurrentQuestion(question);
        return { question, questionIndex: 1 };
      }
    }
  }, [mazeType, level, chooseForwardStart, chooseReverseWalls, chooseReverseArrows]);

  const nextQuestion = useCallback((currentMapping) => {
    setQuestionIndex(prev => {
      const newIndex = prev + 1;
      if (newIndex > TOTAL_QUESTIONS) {
        setGameActive(false);
        setAwaitingAnswer(false);
        return newIndex;
      }

      let useReverse = false;
      if (level === "intermediate") useReverse = Math.random() < 0.4;
      else if (level === "expert") useReverse = Math.random() < 0.6;

      if (!useReverse) {
        const startHole = chooseForwardStart();
        const info = currentMapping[startHole];
        const question = {
          mode: "forward",
          startHole,
          exitHole: info.exitHole,
          trapped: info.trapped
        };
        setCurrentQuestion(question);
        setAwaitingAnswer(true);
        return newIndex;
      } else {
        if (mazeType === "walls") {
          const choice = chooseReverseWalls(currentMapping);
          if (!choice) {
            // Retry with forward
            const startHole = chooseForwardStart();
            const info = currentMapping[startHole];
            const question = {
              mode: "forward",
              startHole,
              exitHole: info.exitHole,
              trapped: info.trapped
            };
            setCurrentQuestion(question);
            setAwaitingAnswer(true);
            return newIndex;
          }
          const {endHole, startHole} = choice;
          const question = {
            mode:"reverseWalls",
            endHole,
            startHole
          };
          setCurrentQuestion(question);
          setAwaitingAnswer(true);
          return newIndex;
        } else {
          const choice = chooseReverseArrows(currentMapping);
          if (!choice) {
            // Retry with forward
            const startHole = chooseForwardStart();
            const info = currentMapping[startHole];
            const question = {
              mode: "forward",
              startHole,
              exitHole: info.exitHole,
              trapped: info.trapped
            };
            setCurrentQuestion(question);
            setAwaitingAnswer(true);
            return newIndex;
          }
          const {endHole, starts} = choice;
          const question = {
            mode:"reverseArrows",
            endHole,
            starts
          };
          setCurrentQuestion(question);
          setAwaitingAnswer(true);
          return newIndex;
        }
      }
    });
  }, [level, mazeType, chooseForwardStart, chooseReverseWalls, chooseReverseArrows]);

  const handleIntroAnswer = useCallback((holeNum, isNoExit) => {
    if (!gameActive || !awaitingAnswer) {
      return null;
    }

    setAwaitingAnswer(false);
    const q = currentQuestion;
    if (!q) return null;
    
    let isCorrect = false;
    let animStartHole;

    if (q.mode === "forward") {
      animStartHole = q.startHole;
      if (q.trapped && mazeType === "arrows") {
        isCorrect = isNoExit;
      } else {
        isCorrect = (!isNoExit && holeNum === q.exitHole);
      }
    } else if (q.mode === "reverseWalls") {
      animStartHole = q.startHole;
      isCorrect = (!isNoExit && holeNum === q.startHole);
    } else {
      if (isNoExit) {
        animStartHole = q.starts[0];
        isCorrect = false;
      } else {
        animStartHole = holeNum;
        isCorrect = q.starts.includes(holeNum);
      }
    }

    const info = mapping[animStartHole] || simulateHoleWithGrid(animStartHole, realGrid);

    const after = () => {
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      
      // Return feedback data
      let feedback = "";
      let feedbackClass = "";
      
      if (isCorrect) {
        if (info.trapped && q.mode === "forward" && mazeType === "arrows") {
          feedback = "Nice work — in this maze that mouse never comes out.";
        } else if (q.mode === "reverseArrows") {
          const list = q.starts.join(", ");
          feedback = `Nice work — that matches the maze. (Possible starting hole(s): ${list})`;
        } else {
          feedback = "Nice work — that matches the maze.";
        }
        feedbackClass = "correct";
      } else {
        if (info.trapped) {
          if (q.mode === "forward" && mazeType === "arrows" && !isNoExit) {
            feedback = "That mouse is stuck in the house forever — the correct choice was that it doesn't come out.";
          } else {
            feedback = "That mouse is stuck in the house forever!";
          }
          feedbackClass = "";
        } else {
          if (q.mode === "forward") {
            feedback = `Oops — it actually came out at hole ${q.exitHole}.`;
          } else if (q.mode === "reverseWalls") {
            feedback = `Oops — it actually started at hole ${q.startHole}.`;
          } else {
            const list = q.starts.join(", ");
            feedback = `Oops — Possible starting hole(s): ${list}.`;
          }
          feedbackClass = "incorrect";
        }
      }

      return { feedback, feedbackClass, isCorrect };
    };

    return { info, animStartHole, after };
  }, [gameActive, awaitingAnswer, currentQuestion, mapping, realGrid, mazeType]);

  const handleInferenceProbe = useCallback((holeNum) => {
    setInferenceProbeCount(prev => prev + 1);
    const info = mapping[holeNum] || simulateHoleWithGrid(holeNum, realGrid);
    return { info, probeCount: inferenceProbeCount + 1 };
  }, [mapping, realGrid, inferenceProbeCount]);

  const testModel = useCallback(() => {
    console.log('=== TESTING MODEL ===');
    console.log('Real Grid State:', realGrid);
    console.log('Real Grid (formatted):');
    console.log(realGrid.map((row, r) => 
      row.map((cell, c) => `${r},${c}:${cell || 'empty'}`).join(' | ')
    ).join('\n'));
    
    console.log('Model Grid State:', modelGrid);
    console.log('Model Grid (formatted):');
    console.log(modelGrid.map((row, r) => 
      row.map((cell, c) => `${r},${c}:${cell || 'empty'}`).join(' | ')
    ).join('\n'));
    
    const modelMap = computeMappingForGrid(modelGrid);
    console.log('Model Mapping (computed from grid):', modelMap);
    
    const realMap = mapping;
    console.log('Real Mapping (actual maze):', realMap);

    let matches = 0;
    for (let h = 1; h <= 16; h++) {
      const a = realMap[h];
      const b = modelMap[h];
      let same = false;
      if (a.trapped && b.trapped) same = true;
      else if (!a.trapped && !b.trapped && a.exitHole === b.exitHole) same = true;
      if (same) matches++;
    }

    let sameLayout = true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (realGrid[r][c] !== modelGrid[r][c]) {
          sameLayout = false;
          break;
        }
      }
      if (!sameLayout) break;
    }

    const probeMsg = ` You have sent ${inferenceProbeCount} mice into the maze.`;

    // Check if model has been meaningfully built (count non-empty cells)
    let modelCellCount = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (modelGrid[r][c]) {
          modelCellCount++;
        }
      }
    }
    // Only show button if model has at least 4 cells filled (meaningful attempt)
    const modelIsSubstantial = modelCellCount >= 4;

    let feedback = "";
    let didNotMatch = false;
    if (matches === 16) {
      if (sameLayout) {
        feedback = "Your model is right! All 16 mice behave correctly and your layout matches the hidden one." + probeMsg;
        didNotMatch = false;
      } else {
        feedback = "Your model works. All 16 mice behave correctly, though your layout is different from mine. More than one right answer is possible." + probeMsg;
        // Only show button if model is successful (all 16 work) but layout is different, and model is substantially built
        didNotMatch = modelIsSubstantial;
      }
    } else {
      feedback = `${matches} of your mice arrive in the right place for that model.` + probeMsg;
      // Don't show button if model doesn't work (matches < 16)
      didNotMatch = false;
    }

    console.log('Test Model Result:', { matches, sameLayout, didNotMatch, feedback, modelIsSubstantial, modelCellCount });
    return { feedback, didNotMatch };
  }, [modelGrid, mapping, realGrid, inferenceProbeCount]);

  const resetModelGrid = useCallback(() => {
    setModelGrid(emptyGrid());
  }, []);

  const startInferenceGame = useCallback(() => {
    setGameActive(false);
    setAwaitingAnswer(false);
    const { realGrid: newRealGrid, mapping: newMapping } = makeMaze(mazeType, level);
    setRealGrid(newRealGrid);
    setMapping(newMapping);
    setModelGrid(emptyGrid());
    setInferenceProbeCount(0);
    
    console.log('=== NEW INFERENCE GAME STARTED ===');
    console.log('Real Grid State:', newRealGrid);
    console.log('Real Grid (formatted):');
    console.log(newRealGrid.map((row, r) => 
      row.map((cell, c) => `${r},${c}:${cell || 'empty'}`).join(' | ')
    ).join('\n'));
    console.log('Real Mapping (actual maze):', newMapping);
    
    return { realGrid: newRealGrid, mapping: newMapping };
  }, [mazeType, level]);

  const updateModelGrid = useCallback((r, c, value) => {
    setModelGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = value;
      console.log(`Model Grid Updated: [${r}][${c}] = "${value}"`);
      console.log('Current Model Grid:', newGrid);
      return newGrid;
    });
  }, []);

  const toggleIntroColor = useCallback(() => {
    introColorToggle.current = !introColorToggle.current;
    return introColorToggle.current;
  }, []);

  return {
    realGrid,
    modelGrid,
    mapping,
    gameActive,
    questionIndex,
    score,
    awaitingAnswer,
    currentQuestion,
    inferenceProbeCount,
    TOTAL_QUESTIONS,
    startIntroGame,
    handleIntroAnswer,
    nextQuestion,
    handleInferenceProbe,
    testModel,
    resetModelGrid,
    startInferenceGame,
    updateModelGrid,
    toggleIntroColor
  };
}

