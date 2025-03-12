'use client';

import { useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useGame } from '@/contexts/GameContext';
import MissAnimation from './MissAnimation';

export default function ScoreInput() {
  const { state, dispatch } = useGame();
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [showMissAnimation, setShowMissAnimation] = useState(false);

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
    if (multiplier === 2) playSound('double');
    else if (multiplier === 3) playSound('triple');
    
    // Dispatch score and reset multiplier
    dispatch({ type: 'ADD_SCORE', score, baseScore });
    setMultiplier(1);
  };

  const handleMiss = (isWallMiss = false) => {
    dispatch({ type: 'ADD_SCORE', score: 0, baseScore: 0 });
    setMultiplier(1);
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
                variant="secondary"
                onClick={() => dispatch({ type: 'UNDO_SCORE' })}
                disabled={state.currentTurn.scores.length === 0}
              >
                Undo
              </Button>
              <Button
                onClick={() => handleMiss(false)}
                disabled={state.gameOver}
              >
                Miss
              </Button>
              <Button
                onClick={() => dispatch({ type: 'NEXT_PLAYER' })}
                disabled={state.currentTurn.dartsThrown === 0}
                className="col-span-2"
              >
                Next Player
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
              variant="secondary"
              onClick={() => dispatch({ type: 'UNDO_SCORE' })}
              disabled={state.currentTurn.scores.length === 0}
            >
              Undo
            </Button>
            <Button
              onClick={() => handleMiss(false)}
              disabled={state.gameOver}
            >
              Miss
            </Button>
            <Button
              onClick={() => dispatch({ type: 'NEXT_PLAYER' })}
              disabled={state.currentTurn.dartsThrown === 0}
              className="col-span-2"
            >
              Next Player
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
    </>
  );
} 