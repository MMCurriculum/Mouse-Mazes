import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameControls } from './components/GameControls/GameControls';
import { GameBoard } from './components/GameBoard/GameBoard';
import { SidePanel } from './components/SidePanel/SidePanel';
import { useMazeGame } from './hooks/useMazeGame';
import { useMazeCanvas } from './hooks/useMazeCanvas';
import { useAnimation } from './hooks/useAnimation';
import { emptyGrid, simulateHoleWithGrid, computeMappingForGrid } from './utils/mazeUtils';
import styles from './App.module.css';

function App() {
  const [mode, setMode] = useState('intro');
  const [mazeType, setMazeType] = useState('walls');
  const [level, setLevel] = useState('beginner');
  const [prompt, setPrompt] = useState('Click "Start New Game" to begin.\nIn Introduction mode, you\'ll get 8 questions on the same maze.\nIn Inference mode, you\'ll probe the maze and build your own model.');
  const [promptIsHTML, setPromptIsHTML] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackClass, setFeedbackClass] = useState('');
  const [logEntries, setLogEntries] = useState([]);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [showHiddenModel, setShowHiddenModel] = useState(false);
  const [modelDidNotMatch, setModelDidNotMatch] = useState(false);
  
  const mouseMarkerRef = useRef(null);
  const holeRefs = useRef([]);
  
  const game = useMazeGame(mazeType, level, mode);
  const gridToDraw = mode === 'intro' ? game.realGrid : game.modelGrid;
  const hiddenGrid = mode === 'inference' && showHiddenModel ? game.realGrid : null;
  const { canvasRef, ctxRef, drawMaze } = useMazeCanvas(gridToDraw, hiddenGrid);
  const { animating, animatePath, animateInferenceProbe } = useAnimation(
    ctxRef,
    canvasRef,
    drawMaze,
    mouseMarkerRef
  );

  const formatQuestionPrompt = useCallback((question, questionIndex, totalQuestions, mazeType, toggleIntroColor) => {
    const color = toggleIntroColor() ? "#e67e22" : "#1f6ad3";
    let scenarioLine = "";
    let rest = "";

    if (question.mode === "forward") {
      scenarioLine = `A mouse leaves hole ${question.startHole}.`;
      const extra = (mazeType === "arrows")
        ? ' (You can also choose "The Mouse Doesn\'t Come Out!")'
        : "";
      rest = `Where will it come out? Click a hole.${extra}`;
    } else if (question.mode === "reverseWalls") {
      scenarioLine = `A mouse ends up in hole ${question.endHole}.`;
      rest = "From which hole did it start? Click a starting hole.";
    } else {
      scenarioLine = `A mouse ends up in hole ${question.endHole}.`;
      rest = "Click on one hole that could have been its starting hole.";
    }

    return `Question ${questionIndex} of ${totalQuestions}:<br>` +
      `<span style="font-weight:bold;color:${color};">${scenarioLine}</span><br>` +
      `${rest}`;
  }, []);

  const formatQuestionForLog = useCallback((question, questionIndex, mazeType) => {
    let scenarioLine = "";
    let rest = "";

    if (question.mode === "forward") {
      scenarioLine = `A mouse leaves hole ${question.startHole}.`;
      rest = "Where will it come out?";
    } else if (question.mode === "reverseWalls") {
      scenarioLine = `A mouse ends up in hole ${question.endHole}.`;
      rest = "From which hole did it start?";
    } else {
      scenarioLine = `A mouse ends up in hole ${question.endHole}.`;
      rest = "Click on one hole that could have been its starting hole.";
    }

    return `${scenarioLine} ${rest}`;
  }, []);

  // Track previous question to add to log when new question appears
  const prevQuestionRef = useRef(null);
  const prevQuestionIndexRef = useRef(0);

  // Update prompt when mode changes
  useEffect(() => {
    if (mode === 'intro') {
      setPrompt('Introduction mode:\nClick "Start New Game" to get 8 questions on the same maze.\nAnswer by clicking a hole (or "The Mouse Doesn\'t Come Out!" when appropriate).');
      setPromptIsHTML(false);
    } else {
      setPrompt('Inference mode:\nClick mouse holes to probe the hidden maze (log appears below).\nClick inside rooms to set your model (blank / wall / arrow).\nWhen you\'re ready, press "Test My Model".');
      setPromptIsHTML(false);
    }
    setFeedback('');
    setFeedbackClass('');
    setQuestionHistory([]);
    prevQuestionRef.current = null;
    prevQuestionIndexRef.current = 0;
    setShowHiddenModel(false);
    setModelDidNotMatch(false);
  }, [mode]);

  // Update prompt when question changes
  useEffect(() => {
    if (mode === 'intro' && game.currentQuestion && game.questionIndex > 0 && game.questionIndex <= game.TOTAL_QUESTIONS && game.toggleIntroColor) {
      // If we have a previous question and the index increased, add it to the log
      if (prevQuestionRef.current && game.questionIndex > prevQuestionIndexRef.current) {
        const questionText = formatQuestionForLog(prevQuestionRef.current, prevQuestionIndexRef.current, mazeType);
        setQuestionHistory(prev => [...prev, {
          questionNumber: prevQuestionIndexRef.current,
          questionText: questionText
        }]);
      }
      
      setPrompt(formatQuestionPrompt(game.currentQuestion, game.questionIndex, game.TOTAL_QUESTIONS, mazeType, game.toggleIntroColor));
      setPromptIsHTML(true);
      
      // Update refs for next time
      prevQuestionRef.current = game.currentQuestion;
      prevQuestionIndexRef.current = game.questionIndex;
    }
  }, [game.currentQuestion, game.questionIndex, mode, mazeType, formatQuestionPrompt, formatQuestionForLog, game.TOTAL_QUESTIONS]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
  }, []);

  const handleMazeTypeChange = useCallback((newMazeType) => {
    setMazeType(newMazeType);
  }, []);

  // Automatically start new game when maze type changes
  const prevMazeTypeRef = useRef(mazeType);
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevMazeTypeRef.current = mazeType;
      return;
    }
    
    // Only trigger if maze type actually changed
    if (prevMazeTypeRef.current !== mazeType) {
      // Start new game automatically
      if (mode === 'intro') {
        const result = game.startIntroGame();
        if (result && result.question && game.toggleIntroColor) {
          setPrompt(formatQuestionPrompt(result.question, result.questionIndex, game.TOTAL_QUESTIONS, mazeType, game.toggleIntroColor));
          setPromptIsHTML(true);
          prevQuestionRef.current = result.question;
          prevQuestionIndexRef.current = result.questionIndex;
        }
        setFeedback('');
        setFeedbackClass('');
        setQuestionHistory([]);
      } else {
        game.startInferenceGame();
        setPrompt('Inference mode:\nClick mouse holes to probe the hidden maze (log appears below).\nClick inside rooms to set your model (blank / wall / arrow).\nWhen you\'re ready, press "Test My Model".');
        setPromptIsHTML(false);
        setFeedback('');
        setFeedbackClass('');
        setLogEntries([]);
        prevQuestionRef.current = null;
        prevQuestionIndexRef.current = 0;
      }
      // Reset hidden model display when maze type changes
      setShowHiddenModel(false);
      setModelDidNotMatch(false);
    }
    prevMazeTypeRef.current = mazeType;
  }, [mazeType, mode, game, formatQuestionPrompt]);

  const handleLevelChange = useCallback((newLevel) => {
    setLevel(newLevel);
  }, []);

  const handleNewGame = useCallback(() => {
    if (mode === 'intro') {
      const result = game.startIntroGame();
      if (result && result.question && game.toggleIntroColor) {
        setPrompt(formatQuestionPrompt(result.question, result.questionIndex, game.TOTAL_QUESTIONS, mazeType, game.toggleIntroColor));
        setPromptIsHTML(true);
        prevQuestionRef.current = result.question;
        prevQuestionIndexRef.current = result.questionIndex;
      }
      setFeedback('');
      setFeedbackClass('');
      setQuestionHistory([]);
      setModelDidNotMatch(false);
      setShowHiddenModel(false);
    } else {
      game.startInferenceGame();
      setPrompt('Inference mode:\nClick mouse holes to probe the hidden maze (log appears below).\nClick inside rooms to set your model (blank / wall / arrow).\nWhen you\'re ready, press "Test My Model".');
      setPromptIsHTML(false);
      setFeedback('');
      setFeedbackClass('');
      setLogEntries([]);
      prevQuestionRef.current = null;
      prevQuestionIndexRef.current = 0;
      setShowHiddenModel(false);
      setModelDidNotMatch(false);
    }
  }, [mode, game, mazeType, formatQuestionPrompt]);

  const handleHoleClick = useCallback((holeNum) => {
    if (animating) return;

    if (mode === 'intro') {
      const result = game.handleIntroAnswer(holeNum, false);
      if (!result) return;
      
      animatePath(
        result.info.path,
        result.info.exitHole,
        result.info.trapped,
        result.animStartHole,
        () => {
          const feedbackResult = result.after();
          if (feedbackResult) {
            setFeedback(feedbackResult.feedback);
            setFeedbackClass(feedbackResult.feedbackClass);
            
            if (feedbackResult.isCorrect !== undefined) {
              // Update score display will happen automatically via game state
              setTimeout(() => {
                if (game.questionIndex < game.TOTAL_QUESTIONS) {
                  // Get next question
                  game.nextQuestion(game.mapping);
                  // Question will be set in state, we'll update prompt in useEffect
                } else {
                  setPrompt('Game over. You\'ve answered all 8 questions.');
                  setPromptIsHTML(false);
                  // Score is already updated in the hook, but we need to account for the current answer
                  const finalScore = feedbackResult.isCorrect ? game.score + 1 : game.score;
                  setFeedback(`You made ${finalScore} out of ${game.TOTAL_QUESTIONS} correct predictions.`);
                  setFeedbackClass('');
                }
                
                setTimeout(() => {
                  if (game.questionIndex < game.TOTAL_QUESTIONS) {
                    setFeedback('');
                    setFeedbackClass('');
                  }
                }, 3000);
              }, 1800);
            }
          }
        },
        gridToDraw
      );
    } else {
      const { info, probeCount } = game.handleInferenceProbe(holeNum);
      animateInferenceProbe(
        holeNum,
        info,
        () => {
          if (info.trapped) {
            setFeedback(`The mouse from hole ${holeNum} is stuck in the house forever.`);
          } else {
            setFeedback(`The mouse from hole ${holeNum} came out of hole ${info.exitHole}.`);
          }
          setFeedbackClass('');
          const entry = info.trapped
            ? `From ${holeNum} → (stuck inside)`
            : `From ${holeNum} → ${info.exitHole}`;
          setLogEntries(prev => [...prev, entry]);
        },
        holeRefs.current
      );
    }
  }, [mode, animating, game, animatePath, animateInferenceProbe, gridToDraw, mazeType, formatQuestionPrompt]);

  const handleNoExitClick = useCallback(() => {
    if (animating || mode !== 'intro') return;
    const result = game.handleIntroAnswer(null, true);
    if (!result) return;
    
    animatePath(
      result.info.path,
      result.info.exitHole,
      result.info.trapped,
      result.animStartHole,
      () => {
        const feedbackResult = result.after();
        if (feedbackResult) {
          setFeedback(feedbackResult.feedback);
          setFeedbackClass(feedbackResult.feedbackClass);
          
          setTimeout(() => {
            if (game.questionIndex < game.TOTAL_QUESTIONS) {
              game.nextQuestion(game.mapping);
              // Question will be set in state, we'll update prompt in useEffect
            } else {
              setPrompt('Game over. You\'ve answered all 8 questions.');
              setPromptIsHTML(false);
              // Score is already updated in the hook, but we need to account for the current answer
              const finalScore = feedbackResult.isCorrect ? game.score + 1 : game.score;
              setFeedback(`You made ${finalScore} out of ${game.TOTAL_QUESTIONS} correct predictions.`);
              setFeedbackClass('');
            }
            
            setTimeout(() => {
              if (game.questionIndex < game.TOTAL_QUESTIONS) {
                setFeedback('');
                setFeedbackClass('');
              }
            }, 3000);
          }, 1800);
        }
      },
      gridToDraw
    );
  }, [animating, mode, game, animatePath, gridToDraw, mazeType, formatQuestionPrompt]);

  const handleCanvasClick = useCallback((r, c) => {
    if (mode !== 'inference' || animating) return;
    
    // If showing hidden model, switch back to user's model when they edit
    if (showHiddenModel) {
      setShowHiddenModel(false);
    }
    
    let val = game.modelGrid[r][c];
    if (mazeType === 'walls') {
      const seq = ['', '/', '\\'];
      let idx = seq.indexOf(val);
      if (idx === -1) idx = 0;
      val = seq[(idx + 1) % seq.length];
    } else {
      const seq = ['', 'U', 'R', 'D', 'L'];
      let idx = seq.indexOf(val);
      if (idx === -1) idx = 0;
      val = seq[(idx + 1) % seq.length];
    }
    game.updateModelGrid(r, c, val);
  }, [mode, animating, game, mazeType, showHiddenModel]);

  const handleTestModel = useCallback(() => {
    if (mode !== 'inference') return;
    const result = game.testModel();
    console.log('handleTestModel result:', result);
    setFeedback(result.feedback);
    setFeedbackClass('');
    // Show "Show Hidden Model" button if model didn't match perfectly
    const shouldShowButton = result.didNotMatch === true;
    console.log('shouldShowButton:', shouldShowButton, 'result.didNotMatch:', result.didNotMatch);
    setModelDidNotMatch(shouldShowButton);
    // Reset show hidden model when testing again
    setShowHiddenModel(false);
  }, [mode, game]);

  const handleShowHiddenModel = useCallback(() => {
    setShowHiddenModel(true);
  }, []);

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <img 
          src={(process.env.PUBLIC_URL || '.') + '/MouseInAHole.png'} 
          alt="Mouse Mazes Logo" 
          className={styles.logo}
        />
        <h1 className={styles.title}>Mouse Mazes</h1>
      </div>
      <GameControls
        mode={mode}
        mazeType={mazeType}
        level={level}
        onModeChange={handleModeChange}
        onMazeTypeChange={handleMazeTypeChange}
        onLevelChange={handleLevelChange}
        onNewGame={handleNewGame}
      />
      <div className={styles.gameArea}>
        <GameBoard
          mode={mode}
          gridToDraw={gridToDraw}
          animating={animating}
          onHoleClick={handleHoleClick}
          onCanvasClick={handleCanvasClick}
          mouseMarkerRef={mouseMarkerRef}
          holeRefs={holeRefs}
          canvasRef={canvasRef}
        />
        <SidePanel
          mode={mode}
          mazeType={mazeType}
          prompt={prompt}
          promptIsHTML={promptIsHTML}
          feedback={feedback}
          feedbackClass={feedbackClass}
          score={game.score}
          questionIndex={game.questionIndex}
          totalQuestions={game.TOTAL_QUESTIONS}
          onTestModel={handleTestModel}
          onNoExitClick={handleNoExitClick}
          logEntries={logEntries}
          questionHistory={questionHistory}
          onShowHiddenModel={handleShowHiddenModel}
          showHiddenModelButton={(() => {
            const shouldShow = modelDidNotMatch && !showHiddenModel;
            console.log('SidePanel prop calculation - modelDidNotMatch:', modelDidNotMatch, 'showHiddenModel:', showHiddenModel, 'shouldShow:', shouldShow);
            return shouldShow;
          })()}
        />
      </div>
    </div>
  );
}

export default App;

