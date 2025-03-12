'use client';

import { useState } from 'react';
import { addPlayer } from '@/utils/db';
import Button from '../ui/Button';
import CameraModal from '../ui/CameraModal';

export default function AddPlayerForm({ onPlayerAdded }: { onPlayerAdded: () => void }) {
  const [name, setName] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [pendingName, setPendingName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with name:', name);
    
    if (!name.trim()) return;

    setPendingName(name.trim());
    setShowCamera(true);
    console.log('Camera should show now');
  };

  const handlePhotoCapture = async (blob: Blob) => {
    try {
      await addPlayer(pendingName, blob);
      setName('');
      setPendingName('');
      onPlayerAdded();
    } catch (error) {
      console.error('Error adding player with photo:', error);
    }
    setShowCamera(false);
  };

  const handleSkipPhoto = async () => {
    try {
      await addPlayer(pendingName);
      setName('');
      setPendingName('');
      onPlayerAdded();
    } catch (error) {
      console.error('Error adding player:', error);
    }
    setShowCamera(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
          className="flex-1 border rounded p-2 dark:bg-gray-700"
          required
        />
        <Button type="submit">Add Player</Button>
      </form>

      {showCamera && (
        <CameraModal
          onCapture={handlePhotoCapture}
          onSkip={handleSkipPhoto}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
} 