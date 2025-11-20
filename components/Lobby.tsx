import React, { useState } from 'react';
import { Copy, Users, Play } from 'lucide-react';

interface LobbyProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  existingRoomId?: string;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateRoom, onJoinRoom, existingRoomId }) => {
  const [name, setName] = useState("Player " + Math.floor(Math.random() * 100));
  const [roomIdInput, setRoomIdInput] = useState(existingRoomId || "");

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 text-center border-b border-slate-700">
          <h1 className="text-3xl font-bold text-yellow-400 poker-font mb-2">Zha Jin Hua</h1>
          <p className="text-blue-200 text-sm">Multiplayer & AI Poker</p>
        </div>

        <div className="p-6 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Enter your name"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {!existingRoomId ? (
              <button
                onClick={() => onCreateRoom(name)}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={20} /> Create New Room
              </button>
            ) : (
               <div className="text-center">
                 <p className="text-gray-400 mb-2">Joining Room:</p>
                 <div className="text-2xl font-mono text-yellow-400 mb-4">{existingRoomId}</div>
                 <button
                  onClick={() => onJoinRoom(existingRoomId, name)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Users size={20} /> Join Game
                </button>
               </div>
            )}
          </div>
          
          {!existingRoomId && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-slate-400">OR</span>
                </div>
              </div>
          )}

           {!existingRoomId && (
              <div className="flex gap-2">
                <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-sm"
                    placeholder="Enter Room ID"
                />
                <button
                    onClick={() => onJoinRoom(roomIdInput, name)}
                    disabled={!roomIdInput}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 rounded-lg disabled:opacity-50"
                >
                    Join
                </button>
              </div>
           )}

        </div>
        <div className="bg-slate-900 p-4 text-center text-xs text-gray-500">
           Invite friends by sharing the link after creating a room.
        </div>
      </div>
    </div>
  );
};

export default Lobby;
