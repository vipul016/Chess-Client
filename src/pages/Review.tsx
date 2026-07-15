import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { api } from '../api';
import { ArrowLeft, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

export default function Review() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [moveIndex, setMoveIndex] = useState(-1);

  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    api.get(`/games/${id}`).then(res => setGame(res.data)).catch(console.error);

    let timeoutId: NodeJS.Timeout;
    const fetchAnalysis = () => {
      api.get(`/games/${id}/analyze`)
        .then(res => {
          if (res.data.status === 'pending') {
            timeoutId = setTimeout(fetchAnalysis, 3000);
          } else {
            setAnalysis(res.data);
            setIsAnalyzing(false);
          }
        })
        .catch(err => {
          console.error(err);
          setIsAnalyzing(false);
        });
    };
    
    fetchAnalysis();

    return () => clearTimeout(timeoutId);
  }, [id]);

  if (!game) return <div className="min-h-screen flex items-center justify-center">Loading game...</div>;

  const fens = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', ...game.moves.map((m:any) => m.fenAfter)];
  const currentFen = fens[moveIndex + 1];
  const currentMoveAnalysis = analysis && moveIndex >= 0 ? analysis.moves[moveIndex] : null;

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Blunder': return 'text-red-500';
      case 'Mistake': return 'text-orange-500';
      case 'Inaccuracy': return 'text-yellow-500';
      case 'Good': return 'text-green-300';
      case 'Excellent': return 'text-green-400';
      case 'Best': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const boardOptions = React.useMemo(() => ({
    position: currentFen,
    boardOrientation: 'white' as 'white' | 'black',
    darkSquareStyle: { backgroundColor: '#334155' },
    lightSquareStyle: { backgroundColor: '#94a3b8' },
    animationDurationInMs: 200
  }), [currentFen]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/games')} className="p-2 bg-dark-surface rounded hover:bg-gray-800 transition-colors"><ArrowLeft size={20}/></button>
        <div>
          <h1 className="text-2xl font-bold">Game Review</h1>
          <p className="text-sm text-gray-400">{game.whitePlayer?.username || 'Stockfish'} vs {game.blackPlayer?.username || 'Stockfish'}</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl justify-center items-start">
        
        <div className="w-full max-w-[480px] flex flex-col gap-4">
          <div className="w-full max-w-2xl bg-gray-800 rounded-xl overflow-hidden border-4 border-dark-border shadow-2xl">
            <Chessboard options={boardOptions} />
          </div>
          
          <div className="glass-panel p-4 flex justify-between items-center">
             <button onClick={() => setMoveIndex(Math.max(-1, moveIndex - 1))} className="btn-secondary px-6"><ChevronLeft/></button>
             <span className="font-mono text-gray-300">Move {Math.floor((moveIndex + 2) / 2)}</span>
             <button onClick={() => setMoveIndex(Math.min(fens.length - 2, moveIndex + 1))} className="btn-secondary px-6"><ChevronRight/></button>
          </div>
        </div>

        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-dark-border pb-4">
              <Activity className="text-primary"/>
              <h2 className="text-xl font-bold">Stockfish Analysis</h2>
            </div>
            
            {!analysis ? (
               <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"/>
                  {isAnalyzing ? (
                    <>
                      <p className="font-bold text-white mb-2">Analyzing engine lines...</p>
                      <p className="text-xs">This runs in the background and may take a minute for long games.</p>
                    </>
                  ) : (
                    <p className="text-red-400">Analysis failed or unavailable.</p>
                  )}
               </div>
            ) : (
               <div className="space-y-6">
                 <div className="flex justify-between items-center p-4 bg-dark-bg/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{analysis.whiteAccuracy}%</div>
                      <div className="text-sm text-gray-400">White Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{analysis.blackAccuracy}%</div>
                      <div className="text-sm text-gray-400">Black Accuracy</div>
                    </div>
                 </div>

                 <div className="space-y-4">
                   <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">Evaluation</h3>
                   
                   {currentMoveAnalysis ? (
                     <div className="bg-dark-bg p-4 rounded-lg text-center">
                        <div className="text-4xl font-bold font-mono mb-1">{currentMoveAnalysis.evaluation}</div>
                        <div className={`text-lg font-bold uppercase tracking-wide ${getClassificationColor(currentMoveAnalysis.classification)}`}>
                          {currentMoveAnalysis.classification}
                        </div>
                        <div className="text-sm text-gray-400 mt-2">Best Engine Move: <span className="font-mono text-white">{currentMoveAnalysis.bestMove}</span></div>
                     </div>
                   ) : (
                     <div className="bg-dark-bg p-4 rounded-lg text-center">
                        <div className="text-4xl font-bold font-mono mb-1 text-gray-500">-</div>
                        <div className="text-lg font-bold uppercase tracking-wide text-gray-600">Starting Position</div>
                     </div>
                   )}
                   
                   <p className="text-xs text-center text-gray-500 mt-2">Game accurately analyzed by Stockfish 16.</p>
                 </div>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
