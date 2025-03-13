'use client';

import { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useGame } from '@/contexts/GameContext';
import MissAnimation from './MissAnimation';

interface ScoreAdjustModalProps {
  playerId: string;
  onClose: () => void;
}

function ScoreAdjustModal({ playerId, onClose }: ScoreAdjustModalProps) {
  const { state, dispatch } = useGame();
  const player = state.players.find(p => p.id === playerId)!;
  const [newScore, setNewScore] = useState(player.score.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ 
      type: 'ADJUST_SCORE', 
      playerId, 
      newScore: parseInt(newScore) 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
        <input
          type="number"
          value={newScore}
          onChange={(e) => setNewScore(e.target.value)}
          className="border p-2 rounded w-full text-xl dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        <div className="flex gap-2 mt-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ScoreInput() {
  const { state, dispatch } = useGame();
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [showMissAnimation, setShowMissAnimation] = useState(false);
  const [showScoreAdjust, setShowScoreAdjust] = useState(false);
  const currentPlayer = state.players.find(p => p.current)!;

  const playSound = useCallback((type: 'single' | 'double' | 'triple') => {
    const sound = new Audio(`/sounds/${type}.mp3`);
    sound.volume = 0.5;
    
    const playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'AbortError') {
          console.log('Sound play aborted - this is normal when navigating');
        } else {
          console.error('Error playing sound:', error);
        }
      });
    }
  }, []);

  const handleScore = (baseScore: number) => {
    if (state.gameOver) return;

    // Calculate score with multiplier
    const score = baseScore * multiplier;

    // Play sound if it's a double or triple
    if (multiplier === 2) {
      const sound = new Audio('/sounds/double.mp3');
      sound.volume = 0.75; // 1.5x the default volume of 0.5
      sound.play().catch(console.error);
    }
    else if (multiplier === 3) playSound('triple');
    
    // Dispatch score and reset multiplier
    dispatch({ type: 'ADD_SCORE', score, baseScore });
    setMultiplier(1);
  };

  const handleMiss = (isWallMiss = false) => {
    // Add score of 0 but increment darts thrown
    dispatch({ 
      type: 'ADD_SCORE', 
      score: 0, 
      baseScore: 0 
    });

    if (isWallMiss) {
      setShowMissAnimation(true);
      setTimeout(() => setShowMissAnimation(false), 2000);
    }
  };

  if (state.gameType === 'cricket') {
    const cricketNumbers = [15, 16, 17, 18, 19, 20];
    const bullseye = [25, 50];

    return (
      <>
        {showMissAnimation && <MissAnimation />}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Button
                variant={multiplier === 1 ? 'primary' : 'secondary'}
                onClick={() => setMultiplier(1)}
              >
                Single
              </Button>
              <Button
                variant={multiplier === 2 ? 'primary' : 'secondary'}
                onClick={() => setMultiplier(2)}
              >
                Double
              </Button>
              <Button
                variant={multiplier === 3 ? 'primary' : 'secondary'}
                onClick={() => setMultiplier(3)}
              >
                Triple
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {cricketNumbers.map((n) => (
                <Button
                  key={n}
                  onClick={() => handleScore(n)}
                  disabled={state.gameOver}
                >
                  {n}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {bullseye.map((n) => (
                <Button
                  key={n}
                  onClick={() => handleScore(n)}
                  disabled={state.gameOver || (n === 50 && multiplier > 1)}
                >
                  {n}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                onClick={() => handleMiss(false)}
                disabled={state.gameOver}
                className="col-span-2"
              >
                Miss
              </Button>
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: 'UNDO_SCORE' })}
                disabled={state.currentTurn.scores.length === 0}
              >
                Undo
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowScoreAdjust(true)}
              >
                Adjust Score
              </Button>
            </div>
          </div>

          <button
            onClick={() => handleMiss(true)}
            disabled={state.gameOver}
            className="w-48 h-48 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl p-2 text-center flex items-center justify-center self-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Missed whole FUCKING wall
          </button>
        </div>

        {showScoreAdjust && (
          <ScoreAdjustModal
            playerId={currentPlayer.id}
            onClose={() => setShowScoreAdjust(false)}
          />
        )}
      </>
    );
  }

  // X01 Game UI
  const numbers = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    [25, 50]
  ];

  const getButtonColor = (n: number) => {
    if (n >= 15) return 'bg-green-500 hover:bg-green-600 text-white';
    return '';
  };

  return (
    <>
      {showMissAnimation && <MissAnimation />}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button
              variant={multiplier === 1 ? 'primary' : 'secondary'}
              onClick={() => setMultiplier(1)}
            >
              Single
            </Button>
            <Button
              variant={multiplier === 2 ? 'primary' : 'secondary'}
              onClick={() => setMultiplier(2)}
            >
              Double
            </Button>
            <Button
              variant={multiplier === 3 ? 'primary' : 'secondary'}
              onClick={() => setMultiplier(3)}
            >
              Triple
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {numbers[0].map((n) => (
              <Button
                key={n}
                size="sm"
                onClick={() => handleScore(n)}
                disabled={state.gameOver}
                className={getButtonColor(n)}
              >
                {n}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {numbers[1].map((n) => (
              <Button
                key={n}
                onClick={() => handleScore(n)}
                disabled={state.gameOver || (n === 50 && multiplier > 1)}
                className={getButtonColor(n)}
              >
                {n}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              onClick={() => handleMiss(false)}
              disabled={state.gameOver}
              className="col-span-2"
            >
              Miss
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'UNDO_SCORE' })}
              disabled={state.currentTurn.scores.length === 0}
            >
              Undo
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowScoreAdjust(true)}
            >
              Adjust Score
            </Button>
          </div>
        </div>

        <button
          onClick={() => handleMiss(true)}
          disabled={state.gameOver}
          className="w-48 h-48 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl p-2 text-center flex items-center justify-center self-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Missed whole FUCKING wall
        </button>
      </div>

      {showScoreAdjust && (
        <ScoreAdjustModal
          playerId={currentPlayer.id}
          onClose={() => setShowScoreAdjust(false)}
        />
      )}
    </>
  );
} 