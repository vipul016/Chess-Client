import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

interface UserProfile {
    id: string;
    username: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    bio: string | null;
    createdAt: string;
}

interface RecentGame {
    id: string;
    status: string;
    result: string | null;
    whitePlayer: { username: string, rating: number };
    blackPlayer: { username: string, rating: number };
    createdAt: string;
}

const Profile = () => {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/users/${username}`);
                setProfile(res.data.user);
                setRecentGames(res.data.recentGames);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    if (loading) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-white">Loading...</div>;
    if (error || !profile) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-red-500">{error}</div>;

    const totalGames = profile.wins + profile.losses + profile.draws;
    const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/lobby" className="text-gray-400 hover:text-white mb-8 inline-block">&larr; Back to Lobby</Link>
                
                <div className="bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-800 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center text-5xl font-bold uppercase shadow-lg">
                        {profile.username[0]}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-black mb-2">{profile.username}</h1>
                        <p className="text-gray-400 mb-4">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
                        {profile.bio && (
                            <p className="text-gray-300 italic mb-6">"{profile.bio}"</p>
                        )}
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-700">
                                <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Elo Rating</div>
                                <div className="text-2xl font-bold text-yellow-400">{profile.rating}</div>
                            </div>
                            <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-700">
                                <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Win Rate</div>
                                <div className="text-2xl font-bold text-green-400">{winRate}%</div>
                            </div>
                            <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-700">
                                <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Record</div>
                                <div className="text-xl font-bold">{profile.wins}W - {profile.losses}L - {profile.draws}D</div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">Recent Games</h2>
                {recentGames.length === 0 ? (
                    <p className="text-gray-500 italic">No recent games found.</p>
                ) : (
                    <div className="grid gap-4">
                        {recentGames.map(game => {
                            const isWhite = game.whitePlayer.username === profile.username;
                            const opponent = isWhite ? game.blackPlayer : game.whitePlayer;
                            let outcomeText = 'Draw';
                            let outcomeColor = 'text-gray-400';
                            
                            if (game.result === '1-0') {
                                outcomeText = isWhite ? 'Victory' : 'Defeat';
                                outcomeColor = isWhite ? 'text-green-500' : 'text-red-500';
                            } else if (game.result === '0-1') {
                                outcomeText = !isWhite ? 'Victory' : 'Defeat';
                                outcomeColor = !isWhite ? 'text-green-500' : 'text-red-500';
                            }

                            return (
                                <Link to={`/games/${game.id}`} key={game.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-indigo-500 transition-colors flex justify-between items-center group">
                                    <div>
                                        <div className="text-gray-400 text-sm mb-1">{new Date(game.createdAt).toLocaleDateString()}</div>
                                        <div className="flex items-center gap-2">
                                            <span className={isWhite ? 'text-white font-bold' : 'text-gray-400'}>{game.whitePlayer.username} ({game.whitePlayer.rating})</span>
                                            <span className="text-gray-600">vs</span>
                                            <span className={!isWhite ? 'text-white font-bold' : 'text-gray-400'}>{game.blackPlayer.username} ({game.blackPlayer.rating})</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold uppercase tracking-wider ${outcomeColor}`}>{outcomeText}</div>
                                        <div className="text-indigo-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">Analyze &rarr;</div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
