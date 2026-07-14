import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store';

export default function History() {
  const [games, setGames] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useGameStore();

  useEffect(() => {
    api.get('/games').then(res => setGames(res.data)).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/lobby')} className="p-2 bg-dark-surface rounded hover:bg-gray-800 transition-colors"><ArrowLeft size={20}/></button>
        <h1 className="text-3xl font-bold">Match History</h1>
      </header>

      <div className="space-y-4">
        {games.length === 0 ? (
           <div className="glass-panel p-8 text-center text-gray-500">No games played yet.</div>
        ) : games.map(g => (
           <div key={g.id} onClick={() => navigate(`/games/${g.id}`)} className="glass-panel p-6 flex justify-between items-center hover:border-primary cursor-pointer transition-all">
             <div>
               <div className="font-bold text-lg mb-1">{g.whitePlayer?.username || 'Stockfish'} vs {g.blackPlayer?.username || 'Stockfish'}</div>
               <div className="text-sm text-gray-400">{new Date(g.createdAt).toLocaleString()}</div>
             </div>
             <div className="text-right flex flex-col items-end gap-1">
               <div className="font-bold text-primary">{g.result || 'In Progress'}</div>
               {user && g.status !== 'active' && (
                 <div className={`text-sm font-bold ${
                   (g.whitePlayerId === user.id ? g.whiteRatingChange : g.blackRatingChange) > 0 ? 'text-green-500' : 
                   (g.whitePlayerId === user.id ? g.whiteRatingChange : g.blackRatingChange) < 0 ? 'text-red-500' : 'text-gray-500'
                 }`}>
                   {(g.whitePlayerId === user.id ? g.whiteRatingChange : g.blackRatingChange) > 0 ? '+' : ''}
                   {g.whitePlayerId === user.id ? g.whiteRatingChange : g.blackRatingChange} Elo
                 </div>
               )}
             </div>
           </div>
        ))}
      </div>
    </div>
  );
}
