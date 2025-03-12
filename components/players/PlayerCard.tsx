'use client';

import { useState } from 'react';
import { Player } from '@/types/game';
import { uploadPlayerPhoto } from '@/utils/db';
import CameraModal from '../ui/CameraModal';

interface PlayerCardProps {
  player: Player;
  onDelete: (id: string) => void;
}

export default function PlayerCard({ player, onDelete }: PlayerCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handlePhotoCapture = async (blob: Blob) => {
    try {
      const photoUrl = await uploadPlayerPhoto(player.id, blob);
      if (photoUrl) {
        // Refresh the page to show new photo
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
    setShowCamera(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center justify-between">
      <div className="flex items-center gap-4">
        {player.photoUrl ? (
          <img 
            src={player.photoUrl} 
            alt={player.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-xl">{player.name[0]}</span>
          </div>
        )}
        <span className="font-medium">{player.name}</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showOptions && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
            <button
              onClick={() => {
                setShowCamera(true);
                setShowOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Take Photo
            </button>
            <button
              onClick={() => {
                onDelete(player.id);
                setShowOptions(false);
              }}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {showCamera && (
        <CameraModal
          onCapture={handlePhotoCapture}
          onSkip={() => setShowCamera(false)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
} 