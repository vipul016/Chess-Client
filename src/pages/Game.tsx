import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGameStore } from '../store';
import { MessageSquare, Flag, Handshake } from 'lucide-react';

export default function Game({ spectate = false }: { spectate?: boolean }) {
  const { 
    isConnected, roomId, color, fen, turn, clock, gameOverResult,
    players, chatMessages, rematchOffered, drawOfferReceived, sendMessage
  } = useGameStore();
  const navigate = useNavigate();
  const [chess] = useState(new Chess());
  const [chatInput, setChatInput] = useState('');
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  
  // Interpolated clocks for smooth countdown
  const [localClock, setLocalClock] = useState({ w: clock.w, b: clock.b });

  useEffect(() => {
    if (spectate && isConnected) {
       sendMessage({ type: 'join', roomId: roomId! });
    }
  }, [spectate, isConnected, roomId]);

  useEffect(() => {
    // Sync local clock with server truth
    setLocalClock({ w: clock.w, b: clock.b });
  }, [clock.w, clock.b]);

  useEffect(() => {
    if (gameOverResult) return;
    const interval = setInterval(() => {
      setLocalClock(prev => ({
        ...prev,
        [turn]: Math.max(0, prev[turn] - 100) // Tick down 100ms
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [turn, gameOverResult]);

  useEffect(() => {
    try { chess.load(fen); } catch(e){}
  }, [fen, chess]);

  const onDrop = (sourceSquare: any, targetSquare?: string, piece?: string) => {
    // Handle both new object signature and old 3-argument signature for react-chessboard
    let src = typeof sourceSquare === 'string' ? sourceSquare : sourceSquare.sourceSquare;
    let tgt = typeof targetSquare === 'string' ? targetSquare : sourceSquare.targetSquare;
    let pObj = typeof piece === 'string' ? piece : sourceSquare.piece;
    let p = typeof pObj === 'string' ? pObj : (pObj?.pieceType || '');

    if (spectate || gameOverResult || (turn !== color)) {
      alert(`Move rejected! spectate=${spectate}, gameOver=${!!gameOverResult}, turn=${turn}, your_color=${color}`);
      return false;
    }
    
    // Check local validation
    try {
      console.log(`Attempting move: from ${src} to ${tgt} with piece ${p}`);
      const isPromotion = (p && p[1]?.toLowerCase() === 'p') && (tgt[1] === '8' || tgt[1] === '1');
      const movePayload = {
        from: src,
        to: tgt,
        ...(isPromotion && { promotion: 'q' }) // Default to queen for now
      };
      
      const move = chess.move(movePayload);

      if (move) {
        useGameStore.setState({ fen: chess.fen(), turn: chess.turn() });
        sendMessage({ type: 'move', from: src, to: tgt, promotion: isPromotion ? 'q' : undefined });
        return true;
      } else {
        alert(`chess.move rejected ${src} to ${tgt}`);
        return false;
      }
    } catch (e: any) {
      console.error("Move error:", e);
      alert("Move error: " + e.message);
    }
    return false;
  };

  const onSquareClick = ({ square }: { piece?: any; square: string }) => {
    if (spectate || gameOverResult || (turn !== color)) return;

    if (!moveFrom) {
      // First click: select piece
      const piece = chess.get(square as any);
      if (piece && piece.color === color) {
        setMoveFrom(square);
      }
      return;
    }

    // Second click: attempt move
    const pieceObj = chess.get(moveFrom as any);
    const pieceString = pieceObj ? pieceObj.color + pieceObj.type.toUpperCase() : '';
    const success = onDrop(moveFrom, square, pieceString);
    if (!success) {
      // If move failed, maybe they clicked another of their own pieces
      const piece = chess.get(square as any);
      if (piece && piece.color === color) {
        setMoveFrom(square);
      } else {
        setMoveFrom(null);
      }
    } else {
      setMoveFrom(null);
    }
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage({ type: 'chat', message: chatInput });
    useGameStore.setState(s => ({ chatMessages: [...s.chatMessages, { sender: 'You', text: chatInput }] }));
    setChatInput('');
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    if (totalSeconds < 20) return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const myColor = spectate ? 'w' : (color || 'w');
  const oppColor = myColor === 'w' ? 'b' : 'w';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 cursor-pointer" onClick={() => { sendMessage({type: 'leave_room'}); useGameStore.getState().resetGameState(); navigate('/lobby'); }}>Chess</h1>
        <button onClick={() => { sendMessage({type: 'leave_room'}); useGameStore.getState().resetGameState(); navigate('/lobby'); }} className="btn-secondary text-sm">Leave Room</button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl justify-center items-start">
        
        {/* Main Board Area */}
        <div className="w-full max-w-[480px] flex flex-col gap-3">
          {/* Opponent Info */}
          <div className="glass-panel p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded border-2 ${oppColor === 'w' ? 'bg-gray-200' : 'bg-gray-800'} ${turn === oppColor ? 'border-yellow-400' : 'border-transparent'}`} />
               <div>
                 <p className="font-bold text-gray-200">
                   {spectate 
                     ? (oppColor === 'w' ? players?.white?.username : players?.black?.username) 
                     : (oppColor === 'w' ? players?.white?.username : players?.black?.username) || 'Opponent'}
                   {spectate && ` (${oppColor === 'w' ? 'White' : 'Black'})`}
                 </p>
                 <p className="text-xs text-yellow-400">
                   {players ? (oppColor === 'w' ? players.white?.rating : players.black?.rating) + ' Elo' : 'Connecting...'}
                 </p>
               </div>
            </div>
            <div className={`text-3xl font-mono ${turn === oppColor ? 'text-white' : 'text-gray-500'}`}>
              {formatTime(localClock[oppColor])}
            </div>
          </div>

          <div className="w-full rounded-xl overflow-hidden shadow-2xl border-4 border-dark-border bg-gray-800">
            <Chessboard 
              options={{
                position: fen,
                onPieceDrop: onDrop,
                onSquareClick: onSquareClick,
                squareStyles: {
                  ...(moveFrom ? { [moveFrom]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } } : {})
                },
                canDragPiece: ({ piece }) => (piece.pieceType ? piece.pieceType[0] === color : false) && turn === color,
                boardOrientation: myColor === 'w' ? 'white' : 'black',
                darkSquareStyle: { backgroundColor: '#334155' },
                lightSquareStyle: { backgroundColor: '#94a3b8' },
                animationDurationInMs: 200
              }}
            />
          </div>

          {/* Player Info */}
          <div className="glass-panel p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded border-2 ${myColor === 'w' ? 'bg-gray-200' : 'bg-gray-800'} ${turn === myColor ? 'border-yellow-400' : 'border-transparent'}`} />
               <div>
                 <p className="font-bold text-gray-200">
                   {spectate 
                     ? (myColor === 'w' ? players?.white?.username : players?.black?.username) 
                     : (myColor === 'w' ? players?.white?.username : players?.black?.username) || 'You'}
                   {spectate && ` (${myColor === 'w' ? 'White' : 'Black'})`}
                 </p>
                 <p className="text-xs text-yellow-400">
                   {players ? (myColor === 'w' ? players.white?.rating : players.black?.rating) + ' Elo' : 'Connecting...'}
                 </p>
               </div>
            </div>
            <div className={`text-3xl font-mono ${turn === myColor ? 'text-white' : 'text-gray-500'}`}>
              {formatTime(localClock[myColor])}
            </div>
          </div>
          
          {/* Controls */}
          {!spectate && !gameOverResult && (
            <div className="flex gap-4 mt-2">
              <button onClick={() => sendMessage({type: 'resign'})} className="btn-secondary flex-1 flex justify-center items-center gap-2 text-red-400 hover:text-red-300"><Flag size={18}/> Resign</button>
              <button onClick={() => sendMessage({type: 'draw_offer'})} className="btn-secondary flex-1 flex justify-center items-center gap-2 text-blue-400 hover:text-blue-300"><Handshake size={18}/> Offer Draw</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[350px] flex flex-col gap-6">
          <div className="glass-panel p-4 flex flex-col h-[500px]">
            <div className="flex items-center gap-2 mb-4 border-b border-dark-border pb-2">
              <MessageSquare size={18} className="text-gray-400"/>
              <h3 className="font-bold text-gray-300">Match Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-500 mb-1">{msg.sender}</span>
                  <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${msg.sender === 'You' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            {!spectate && (
              <form onSubmit={handleChat} className="mt-4 flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send a message..." className="input-field text-sm py-2" />
                <button type="submit" className="btn-primary py-2 px-4 text-sm">Send</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {gameOverResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 max-w-md w-full text-center border-t-4 border-t-primary">
             <h2 className="text-3xl font-bold mb-2">Game Over</h2>
             <p className="text-gray-300 mb-8 text-lg">{gameOverResult}</p>
             <div className="flex flex-col gap-3">
               {!spectate && <button onClick={() => sendMessage({type: 'rematch_offer'})} className="btn-primary py-3 text-lg">Offer Rematch</button>}
               <button onClick={() => { sendMessage({type: 'leave_room'}); useGameStore.getState().resetGameState(); navigate('/lobby'); }} className="btn-secondary py-3">Back to Lobby</button>
             </div>
          </div>
        </div>
      )}

      {rematchOffered && (
         <div className="fixed top-4 right-4 bg-gray-800 border border-primary p-4 rounded-xl shadow-2xl z-50 flex flex-col gap-3">
           <p className="font-bold">Opponent offered a rematch!</p>
           <div className="flex gap-2">
             <button onClick={() => sendMessage({type: 'rematch_accept'})} className="btn-primary flex-1 text-sm py-1.5">Accept</button>
             <button onClick={() => useGameStore.setState({rematchOffered: false})} className="btn-secondary flex-1 text-sm py-1.5">Decline</button>
           </div>
         </div>
      )}

      {drawOfferReceived && (
         <div className="fixed top-4 right-4 bg-gray-800 border border-primary p-4 rounded-xl shadow-2xl z-50 flex flex-col gap-3">
           <p className="font-bold">Opponent offered a draw.</p>
           <div className="flex gap-2">
             <button onClick={() => { sendMessage({type: 'draw_response', accept: true}); useGameStore.setState({drawOfferReceived: false}); }} className="btn-primary flex-1 text-sm py-1.5">Accept</button>
             <button onClick={() => { sendMessage({type: 'draw_response', accept: false}); useGameStore.setState({drawOfferReceived: false}); }} className="btn-secondary flex-1 text-sm py-1.5">Decline</button>
           </div>
         </div>
      )}

    </div>
  );
}
