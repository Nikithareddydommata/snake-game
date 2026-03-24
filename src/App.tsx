import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 100; // Faster base speed

const TRACKS = [
  {
    id: 1,
    title: "Neon Nights (AI Generated)",
    artist: "SynthBot",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Cybernetic Pulse (AI Generated)",
    artist: "NeuralNet",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Digital Horizon (AI Generated)",
    artist: "Algorithm",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

// --- Helper Functions ---
const generateFood = (snake: {x: number, y: number}[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    // eslint-disable-next-line no-loop-func
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [trail, setTrail] = useState<{x: number, y: number, id: number}[]>([]);
  const trailIdRef = useRef(0);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    setTrail([]);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !isGameRunning) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { x: head.x + direction.x, y: head.y + direction.y };

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        setIsGameRunning(false);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setIsGameRunning(false);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Add to trail (the position the tail just left)
      const tail = prevSnake[prevSnake.length - 1];
      setTrail(prevTrail => [
        { ...tail, id: trailIdRef.current++ },
        ...prevTrail.slice(0, 5) // Keep last 6 trail positions
      ]);

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isGameRunning, score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' && direction.y !== 1) setDirection({ x: 0, y: -1 });
      if (e.key === 'ArrowDown' && direction.y !== -1) setDirection({ x: 0, y: 1 });
      if (e.key === 'ArrowLeft' && direction.x !== 1) setDirection({ x: -1, y: 0 });
      if (e.key === 'ArrowRight' && direction.x !== -1) setDirection({ x: 1, y: 0 });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    // Speed increases slightly with score
    const currentSpeed = Math.max(50, BASE_SPEED - Math.floor(score / 50) * 5);
    const gameLoop = setInterval(moveSnake, currentSpeed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, score]);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-400 font-mono flex flex-col items-center justify-center p-4 selection:bg-fuchsia-500 selection:text-white relative overflow-hidden">
      
      {/* Background Neon Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="mb-12 text-center z-10">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] uppercase italic font-digital glitch">
          <span aria-hidden="true">Neon Snake & Beats</span>
          Neon Snake & Beats
          <span aria-hidden="true">Neon Snake & Beats</span>
        </h1>
        <p className="text-fuchsia-400 mt-4 text-lg tracking-[0.3em] uppercase font-digital opacity-80">Cybernetic Arcade Experience</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl z-10 items-center lg:items-start justify-center">
        
        {/* Game Container */}
        <div className="flex flex-col items-center bg-gray-900/80 p-6 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.15)] backdrop-blur-sm">
          <div className="flex justify-between w-full mb-4 px-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
              <span className="text-2xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">{score}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 uppercase tracking-wider">High Score</span>
              <span className="text-2xl font-bold text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]">{highScore}</span>
            </div>
          </div>

          <div 
            className="relative bg-gray-950 border-2 border-cyan-500/50 rounded-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden"
            style={{ 
              width: `${GRID_SIZE * 20}px`, 
              height: `${GRID_SIZE * 20}px` 
            }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{
                   backgroundImage: 'linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }}>
            </div>

            {/* Trail Effect */}
            <AnimatePresence>
              {trail.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute bg-cyan-500/30 rounded-full blur-[2px]"
                  style={{
                    width: '20px',
                    height: '20px',
                    left: `${t.x * 20}px`,
                    top: `${t.y * 20}px`,
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Food */}
            <motion.div 
              animate={{ 
                scale: [0.8, 1.1, 0.8],
                boxShadow: [
                  '0 0 10px rgba(217,70,239,0.5)',
                  '0 0 20px rgba(217,70,239,1)',
                  '0 0 10px rgba(217,70,239,0.5)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute bg-fuchsia-500 rounded-full"
              style={{
                width: '20px',
                height: '20px',
                left: `${food.x * 20}px`,
                top: `${food.y * 20}px`,
              }}
            />

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              const isTail = index === snake.length - 1;
              return (
                <motion.div 
                  key={`${segment.x}-${segment.y}-${index}`}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`absolute rounded-sm ${isHead ? 'bg-cyan-300 shadow-[0_0_15px_rgba(103,232,249,1)] z-10' : 'bg-cyan-500/80 shadow-[0_0_8px_rgba(34,211,238,0.6)]'}`}
                  style={{
                    width: '20px',
                    height: '20px',
                    left: `${segment.x * 20}px`,
                    top: `${segment.y * 20}px`,
                    opacity: 1 - (index / snake.length) * 0.5, // Tail fades out
                    scale: isHead ? 0.95 : 0.85 - (index / snake.length) * 0.2 // Tail shrinks
                  }}
                >
                  {isHead && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-1 bg-gray-900 rounded-full translate-x-1 -translate-y-1"></div>
                      <div className="w-1 h-1 bg-gray-900 rounded-full -translate-x-1 -translate-y-1"></div>
                    </div>
                  )}
                </motion.div>
              )
            })}

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-20">
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-transparent border-2 border-cyan-400 text-cyan-400 font-bold uppercase tracking-widest hover:bg-cyan-400 hover:text-gray-950 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.8)] rounded-md"
                >
                  Start Game
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
                <h2 className="text-4xl font-black text-fuchsia-500 mb-2 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] uppercase">Game Over</h2>
                <p className="text-cyan-400 mb-6">Final Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-transparent border-2 border-fuchsia-500 text-fuchsia-500 font-bold uppercase tracking-widest hover:bg-fuchsia-500 hover:text-gray-950 transition-all duration-300 shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:shadow-[0_0_25px_rgba(217,70,239,0.8)] rounded-md"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-xs text-gray-500 uppercase tracking-widest flex gap-4">
            <span>Use Arrow Keys to Move</span>
          </div>
        </div>

        {/* Music Player Container */}
        <div className="flex flex-col w-full max-w-md bg-gray-900/80 p-6 rounded-2xl border border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.15)] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_5px_rgba(217,70,239,1)]"></span>
              Now Playing
            </h3>
            <button 
              onClick={toggleMute}
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          {/* Track Info */}
          <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 mb-6 relative overflow-hidden group">
            {/* Visualizer effect */}
            {isPlaying && (
              <div className="absolute inset-0 opacity-20 pointer-events-none flex items-end justify-between px-2 pb-2">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-fuchsia-500 rounded-t-sm animate-pulse"
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDuration: `${0.5 + Math.random()}s`
                    }}
                  ></div>
                ))}
              </div>
            )}
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 mb-3 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                <div className={`w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                  <div className="w-4 h-4 rounded-full bg-gray-950 border border-gray-700"></div>
                </div>
              </div>
              <h4 className="text-cyan-300 font-bold truncate w-full">{currentTrack.title}</h4>
              <p className="text-gray-500 text-sm truncate w-full">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={prevTrack}
              className="p-3 rounded-full bg-gray-800 text-cyan-400 hover:bg-gray-700 hover:text-cyan-300 transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="p-5 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-gray-950 hover:scale-105 transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)]"
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            
            <button 
              onClick={nextTrack}
              className="p-3 rounded-full bg-gray-800 text-fuchsia-400 hover:bg-gray-700 hover:text-fuchsia-300 transition-all hover:shadow-[0_0_10px_rgba(217,70,239,0.3)]"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          {/* Playlist */}
          <div className="mt-8">
            <h5 className="text-xs text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">Playlist</h5>
            <div className="flex flex-col gap-2">
              {TRACKS.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(index);
                    setIsPlaying(true);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    currentTrackIndex === index 
                      ? 'bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300' 
                      : 'hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xs opacity-50 w-4">{index + 1}</span>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <p className="text-xs opacity-60 truncate">{track.artist}</p>
                    </div>
                  </div>
                  {currentTrackIndex === index && isPlaying && (
                    <div className="flex gap-1">
                      <div className="w-1 h-3 bg-fuchsia-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-3 bg-fuchsia-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-3 bg-fuchsia-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onEnded={nextTrack}
        preload="auto"
      />
    </div>
  );
}
