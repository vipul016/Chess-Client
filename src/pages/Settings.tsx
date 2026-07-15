import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useGameStore } from '../store';

const Settings = () => {
    const { user: currentUser } = useGameStore();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        
        // Fetch current profile data to pre-fill the form
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/users/${currentUser.username}`);
                setUsername(res.data.user.username);
                setBio(res.data.user.bio || '');
            } catch (err) {
                setError('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const updates: any = {};
            if (username && username !== currentUser?.username) updates.username = username;
            if (bio !== undefined) updates.bio = bio; // allow empty bio
            if (password) updates.password = password;

            if (Object.keys(updates).length === 0) {
                setSaving(false);
                return;
            }

            await api.put('/users/me', updates);
            setSuccess('Profile updated successfully!');
            setPassword(''); // clear password field
            
            // If username changed, we should probably force login again or update state, 
            // but for simplicity we'll just show success. 
            // In a production app, we'd update the JWT token with the new username.
        } catch (err: any) {
            setError(err.response?.data?.error?.username?._errors?.[0] || err.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-950 flex justify-center items-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white">
            <div className="w-full max-w-md">
                <Link to="/lobby" className="text-gray-400 hover:text-white mb-6 inline-block">&larr; Back to Lobby</Link>
                <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
                    <h1 className="text-3xl font-black mb-2 text-center">Settings</h1>
                    <p className="text-gray-400 text-center mb-8">Update your profile details</p>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 text-sm text-center">{error}</div>}
                    {success && <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded mb-6 text-sm text-center">{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell everyone about yourself..."
                                maxLength={160}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors h-24 resize-none"
                            />
                            <div className="text-right text-xs text-gray-500 mt-1">{bio.length}/160</div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">New Password (optional)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
