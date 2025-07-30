import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Tic Tac Toe game modes
 */
const MODE_SINGLE_PLAYER = 'Single Player (vs AI)';
const MODE_TWO_PLAYER = 'Two Player (Local)';

const GAME_MODES = [MODE_SINGLE_PLAYER, MODE_TWO_PLAYER];

/**
 * Main player symbols
 */
const PLAYER_X = 'X';
const PLAYER_O = 'O';

/**
 * Get initial empty board
 */
function getEmptyBoard() {
  return Array(9).fill(null);
}

/**
 * Find winner and winning line for board
 */
function calculateWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6], // diags
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return { winner: board[a], line };
    }
  }
  if (board.every(sq => sq != null)) {
    return { winner: 'Draw', line: null };
  }
  return null;
}

/**
 * PUBLIC_INTERFACE
 * Minimax AI for Tic Tac Toe (assume 'O' is always AI)
 * Returns best move index for AI
 */
function getBestAIMove(board, aiPlayer = PLAYER_O, humanPlayer = PLAYER_X) {
  // Check for game over
  const result = calculateWinner(board);
  if (result) {
    if (result.winner === aiPlayer) return { score: 1 };
    if (result.winner === humanPlayer) return { score: -1 };
    if (result.winner === 'Draw') return { score: 0 };
  }
  // Minimax logic
  let moves = [];
  board.forEach((cell, idx) => {
    if (cell == null) {
      let newBoard = [...board];
      newBoard[idx] = aiPlayer;
      let { score } = getBestAIMove(newBoard, humanPlayer, aiPlayer);
      moves.push({ idx, score: -score });
    }
  });
  // Pick best move
  let best = moves.reduce(
    (acc, move) => (acc == null || move.score > acc.score ? move : acc),
    null
  );
  if (best) return best;
  return { idx: null, score: 0 };
}

/**
 * Square UI component
 */
function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`ttt-square${highlight ? ' highlight' : ''}`}
      onClick={onClick}
      aria-label={value ? `Square ${value}` : 'Empty square'}
      disabled={!!value}
      tabIndex={0}
    >
      {value}
    </button>
  );
}

/**
 * Board UI
 */
function Board({ squares, onSquareClick, winningLine }) {
  const renderSquare = (i) => (
    <Square
      key={i}
      value={squares[i]}
      onClick={() => onSquareClick(i)}
      highlight={winningLine && winningLine.includes(i)}
    />
  );
  return (
    <div className="ttt-board">
      {[0, 1, 2].map(row => (
        <div key={row} className="ttt-board-row">
          { [0, 1, 2].map(col => renderSquare(row * 3 + col)) }
        </div>
      ))}
    </div>
  );
}

/**
 * Game History Panel
 */
function HistoryPanel({ history, jumpTo, currentStep }) {
  return (
    <div className="ttt-history-panel">
      <h3>Game History</h3>
      <ul>
        {history.map((step, idx) => (
          <li key={idx}>
            <button
              className={`ttt-history-btn${idx === currentStep ? " selected" : ""}`}
              onClick={() => jumpTo(idx)}
              aria-label={`Go to move ${idx === 0 ? "start" : idx}`}
            >
              {idx === 0 ? "Start" : `Move #${idx}`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Game Control Panel
 */
function GamePanel({
  mode,
  setMode,
  onRestart,
  xIsNext,
  winner,
  aiThinking
}) {
  return (
    <div className="ttt-control-panel">
      <div className="ttt-modes">
        {GAME_MODES.map((m, i) => (
          <button
            key={i}
            className={`ttt-mode-btn${mode === m ? " selected" : ""}`}
            onClick={() => setMode(m)}
            disabled={aiThinking}
            aria-label={`Switch to ${m}`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="ttt-status">
        {winner
          ? 
            winner === 'Draw'
              ? <span>It&apos;s a draw!</span>
              : <span>Winner: <span className={winner === PLAYER_X ? "x-color" : "o-color"}>{winner}</span></span>
          :
            <span>
              Next: <span className={xIsNext ? "x-color" : "o-color"}>{xIsNext ? PLAYER_X : PLAYER_O}</span>
              {aiThinking && ' ...AI is thinking'}
            </span>
        }
      </div>
      <button
        className="ttt-restart-btn"
        onClick={onRestart}
        aria-label="Restart Game"
      >
        Restart
      </button>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Main App component for Tic Tac Toe
 */
function App() {
  // Theme support (light by default)
  const [theme, setTheme] = useState('light');

  // Game mode state
  const [mode, setMode] = useState(MODE_SINGLE_PLAYER);

  // Game history: each entry is {board, xIsNext}
  const [history, setHistory] = useState([{ board: getEmptyBoard(), xIsNext: true }]);
  const [stepNumber, setStepNumber] = useState(0);

  // AI thinking state
  const [aiThinking, setAIThinking] = useState(false);

  // Get latest board/next player from history
  const current = history[stepNumber];
  const winnerObj = calculateWinner(current.board);
  const winner = winnerObj ? winnerObj.winner : null;
  const winningLine = winnerObj ? winnerObj.line : null;

  // Apply selected theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle AI move if in single player mode
  useEffect(() => {
    if (
      mode === MODE_SINGLE_PLAYER &&
      !winner &&
      !current.xIsNext // AI plays as O
    ) {
      setAIThinking(true);
      const timer = setTimeout(() => {
        const best = getBestAIMove(current.board, PLAYER_O, PLAYER_X);
        if (best.idx != null && !current.board[best.idx]) {
          handleSquareClick(best.idx, true);
        }
        setAIThinking(false);
      }, 500); // A small delay
      return () => clearTimeout(timer);
    }
  // We also react to 'mode' changes here to allow quick switching.
  // eslint-disable-next-line
  }, [current, winner, mode]);

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }

  // PUBLIC_INTERFACE
  function handleSquareClick(idx, isAI = false) {
    // Disallow clicking after win, draw or on filled square or when AI is thinking
    if (winner || current.board[idx] || (mode === MODE_SINGLE_PLAYER && aiThinking && !isAI)) return;
    // Prevent humans from playing O in AI mode
    if (!isAI && mode === MODE_SINGLE_PLAYER && !current.xIsNext) return;

    const board = [...current.board];
    board[idx] = current.xIsNext ? PLAYER_X : PLAYER_O;
    const nextHistory = history.slice(0, stepNumber + 1).concat([
      { board, xIsNext: !current.xIsNext }
    ]);
    setHistory(nextHistory);
    setStepNumber(nextHistory.length - 1);
  }

  // PUBLIC_INTERFACE
  function jumpTo(step) {
    setStepNumber(step);
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setHistory([{ board: getEmptyBoard(), xIsNext: true }]);
    setStepNumber(0);
    setAIThinking(false);
  }

  // PUBLIC_INTERFACE
  function switchMode(newMode) {
    setMode(newMode);
    handleRestart();
  }

  return (
    <div className="App" data-theme={theme}>
      <header className="ttt-header">
        <h1 className="ttt-title">
          <span className="primary-color">Tic Tac Toe</span>
        </h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="ttt-main">
        <div className="ttt-game-layout">
          <section className="ttt-board-section">
            <Board
              squares={current.board}
              onSquareClick={handleSquareClick}
              winningLine={winningLine}
            />
            <GamePanel
              mode={mode}
              setMode={switchMode}
              onRestart={handleRestart}
              xIsNext={current.xIsNext}
              winner={winner}
              aiThinking={aiThinking}
            />
          </section>
          <aside className="ttt-history-section">
            <HistoryPanel
              history={history}
              jumpTo={jumpTo}
              currentStep={stepNumber}
            />
          </aside>
        </div>
      </main>
      <footer className="ttt-footer">
        <span>
          Made with <span className="accent-color">♥</span> | <a className="footer-link" href="https://reactjs.org" rel="noopener noreferrer" target="_blank">React</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
