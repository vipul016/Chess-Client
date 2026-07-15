import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useGameStore } from '../store';
import { LogOut, Play, Swords, History as HistoryIcon, Search, Users, Cpu, Settings, User } from 'lucide-react';

export default function Lobby() {
  const { user, setUser, logout, matchmaking, findMatch, cancelFindMatch, sendMessage, roomId, isConnected, createdRoomCode } = useGameStore();
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [myActiveGame, setMyActiveGame] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');
  const [botLevel, setBotLevel] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data)).catch(() => logout());
    api.get('/games/active').then(res => setActiveGames(res.data)).catch(console.error);
    api.get('/games/my-active').then(res => setMyActiveGame(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (roomId) navigate(`/game/${roomId}`);
  }, [roomId, navigate]);

  const handleCreatePrivate = () => {
    sendMessage({ type: 'create_private_room' });
  };

  const handleJoinPrivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode) sendMessage({ type: 'join_private_room', roomCode: joinCode });
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Chess</h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <span className="font-medium text-white">{user.username}</span> • 
            <span className="text-yellow-400 font-bold">{user.rating} Elo</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate(`/profile/${user.username}`)} className="btn-secondary flex items-center gap-2"><User size={18}/> Profile</button>
          <button onClick={() => navigate('/games')} className="btn-secondary flex items-center gap-2"><HistoryIcon size={18}/> History</button>
          <button onClick={() => navigate('/settings')} className="btn-secondary flex items-center gap-2"><Settings size={18}/> Settings</button>
          <button onClick={logout} className="btn-secondary border-red-900/50 hover:bg-red-900/20 text-red-400 flex items-center gap-2"><LogOut size={18}/> Logout</button>
        </div>
      </header>

      {myActiveGame && (
        <div className="mb-8 p-4 bg-primary/20 border border-primary rounded-xl flex justify-between items-center shadow-lg shadow-primary/10">
           <div>
             <h3 className="font-bold text-white text-lg flex items-center gap-2"><Play size={18} className="text-primary"/> Active Match Found</h3>
             <p className="text-sm text-gray-300">You are currently in an active game against <strong>{myActiveGame.opponentName}</strong></p>
           </div>
           <button 
             onClick={() => {
               sessionStorage.setItem('roomId', myActiveGame.roomId);
               sessionStorage.setItem('sessionId', myActiveGame.sessionId);
               useGameStore.setState({ roomId: myActiveGame.roomId, sessionId: myActiveGame.sessionId, color: myActiveGame.color });
               navigate(`/game`);
             }} 
             className="btn-primary py-2 px-6"
           >
             Rejoin Game
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        
        {/* Play Now Card */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center h-[400px]">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <Swords size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ranked Match</h2>
          <p className="text-gray-400 mb-8 text-sm">Play against an opponent of similar skill rating.</p>
          
          {matchmaking ? (
            <div className="w-full mt-auto">
              <button onClick={cancelFindMatch} className="btn-secondary w-full flex items-center justify-center gap-2 border-red-900/50 text-red-400 hover:bg-red-900/20">
                <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
                Cancel Search
              </button>
            </div>
          ) : (
            <button onClick={findMatch} disabled={!isConnected} className="btn-primary w-full py-3 text-lg font-bold shadow-primary/30 mt-auto">
              Find Match
            </button>
          )}
        </div>

        {/* Private Room Card */}
        <div className="glass-panel p-6 flex flex-col h-[400px]">
           <div className="flex items-center gap-3 mb-6">
              <Users className="text-purple-400" size={28} />
              <h2 className="text-2xl font-bold">Private Game</h2>
           </div>
           
           <div className="space-y-8 mt-auto">
             <div>
               <button onClick={handleCreatePrivate} disabled={!isConnected} className="btn-secondary w-full py-3 border-purple-500/30 text-purple-300 hover:bg-purple-900/20">Create Room</button>
             </div>
             
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#141920] text-gray-500">OR</span>
                </div>
             </div>

             <form onSubmit={handleJoinPrivate} className="flex gap-2">
               <input type="text" placeholder="Room Code" className="input-field uppercase" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} required />
               <button type="submit" disabled={!isConnected} className="btn-primary px-6">Join</button>
             </form>
           </div>
        </div>

        {/* Play Computer Card */}
        <div className="glass-panel p-6 flex flex-col h-[400px]">
           <div className="flex items-center gap-3 mb-6">
              <Cpu className="text-blue-400" size={28} />
              <h2 className="text-2xl font-bold">Play Computer</h2>
           </div>
           
           <div className="space-y-6 mt-auto">
             <div className="text-center">
               <label className="text-sm text-gray-400 font-bold tracking-wide uppercase">Difficulty Level</label>
               <div className="text-4xl font-bold text-blue-400 mt-2 mb-4">{botLevel}</div>
               <input 
                 type="range" 
                 min="1" max="20" 
                 value={botLevel} 
                 onChange={(e) => setBotLevel(parseInt(e.target.value))} 
                 className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
               />
               <div className="flex justify-between text-xs text-gray-500 mt-2">
                 <span>Beginner</span>
                 <span>Grandmaster</span>
               </div>
             </div>
             
             <button 
               onClick={() => sendMessage({ type: 'play_bot', level: botLevel })} 
               disabled={!isConnected} 
               className="btn-primary w-full py-3 bg-blue-600 hover:bg-blue-500 shadow-blue-500/30"
             >
               Play Stockfish
             </button>
           </div>
        </div>

        {/* Active Games / Spectate */}
        <div className="glass-panel p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <Search className="text-green-400" size={24} />
            <h2 className="text-xl font-bold">Spectate Live</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {activeGames.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-10">No active games.</p>
            ) : (
              activeGames.map((game, i) => (
                <div key={i} className="bg-dark-bg/50 rounded-lg p-3 border border-dark-border/50 flex justify-between items-center hover:border-dark-border cursor-pointer transition-colors" onClick={() => navigate(`/spectate/${game.roomId}`)}>
                   <div className="text-sm">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white"/> {game.whitePlayer} <span className="text-xs text-gray-500">{game.whiteRating}</span></div>
                     <div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full bg-black border border-gray-600"/> {game.blackPlayer} <span className="text-xs text-gray-500">{game.blackRating}</span></div>
                   </div>
                   <button className="text-xs bg-dark-surface px-3 py-1.5 rounded text-gray-300 hover:text-white border border-dark-border">Watch</button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Copy Room Code Modal */}
      {createdRoomCode && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="glass-panel p-8 max-w-md w-full text-center border-t-4 border-t-purple-500">
              <h2 className="text-3xl font-bold mb-2">Room Created!</h2>
              <p className="text-gray-400 mb-6">Share this code with your opponent.</p>
              
              <div className="bg-gray-900 border border-dark-border p-4 rounded-xl mb-6 flex justify-between items-center">
                <span className="text-3xl font-mono tracking-widest font-bold text-white">{createdRoomCode}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(createdRoomCode);
                    alert('Copied to clipboard!');
                  }} 
                  className="p-2 bg-dark-surface rounded hover:bg-gray-800 transition-colors text-gray-300"
                  title="Copy"
                >
                  <Search size={20} className="hidden" /> {/* Using existing lucide icons if no copy icon, maybe just text */}
                  Copy
                </button>
              </div>

              <button onClick={() => useGameStore.setState({ createdRoomCode: null })} className="btn-secondary w-full py-3">Close</button>
           </div>
         </div>
      )}
    </div>
  );
}
