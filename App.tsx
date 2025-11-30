
import React, { useState, useEffect } from 'react';
import ZhaJinHuaGame from './components/ZhaJinHuaGame';
import Lobby from './components/Lobby';

interface GameConfig {
  playerName: string;
  roomId: string;
  isHost: boolean;
}

const App: React.FC = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [urlRoomId, setUrlRoomId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setUrlRoomId(room);
    }
  }, []);

  const handleCreateRoom = (name: string) => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Update URL to reflect the new room, so refresh works or sharing works immediately
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoomId);
    window.history.pushState({}, '', url);
    
    setGameConfig({
      playerName: name,
      roomId: newRoomId,
      isHost: true
    });
  };

  const handleJoinRoom = (roomId: string, name: string) => {
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    window.history.pushState({}, '', url);

    setGameConfig({
      playerName: name,
      roomId: roomId,
      isHost: false
    });
  };

  const handleExit = () => {
    setGameConfig(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url);
    setUrlRoomId("");
  };

  if (gameConfig) {
    return (
      <ZhaJinHuaGame 
        playerName={gameConfig.playerName}
        roomId={gameConfig.roomId}
        isHost={gameConfig.isHost}
        onExit={handleExit}
      />
    );
  }

  return (
    <Lobby 
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      existingRoomId={urlRoomId}
    />
  );
};

export default App;
