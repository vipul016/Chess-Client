import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import History from './pages/History';
import Review from './pages/Review';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useGameStore(state => state.token);
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  const { token, connectWS, disconnectWS } = useGameStore();

  useEffect(() => {
    if (token) {
      connectWS();
    } else {
      disconnectWS();
    }
  }, [token, connectWS, disconnectWS]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/game/:roomId" element={<ProtectedRoute><Game /></ProtectedRoute>} />
        <Route path="/spectate/:roomId" element={<ProtectedRoute><Game spectate /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/games/:id" element={<ProtectedRoute><Review /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={token ? "/lobby" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
