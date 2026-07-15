# Chess-Client

**Live Demo:** [https://chess-client-phi.vercel.app](https://chess-client-phi.vercel.app)

React frontend for the multiplayer chess platform, built with Vite, TypeScript, and Tailwind CSS. Provides the full player experience — matchmaking, live gameplay, spectating, and post-game analysis — on top of the [Chess-Server](https://github.com/vipul016/Chess-Server) backend.

## Features

- Live drag-and-drop chessboard (`react-chessboard`) synced to server-authoritative state
- Real-time matchmaking, private room creation/joining via shareable codes, and bot games (Stockfish, adjustable difficulty)
- Live game clocks, resign/draw controls, in-game chat, and spectator view
- Automatic reconnection handling on disconnect/refresh, restoring the player to their in-progress game
- Post-game move-by-move analysis view, alongside rating and match history
- State management via Zustand; API/auth handled through a typed API client

## Tech Stack

React 19, TypeScript, Vite, Tailwind CSS, Zustand, `react-chessboard`, `chess.js` (client-side rendering only — the server remains authoritative), Vitest + Testing Library + Puppeteer for testing

## Getting Started

```bash
git clone https://github.com/vipul016/Chess-Client.git
cd Chess-Client
npm install

# Configure environment
cp .env.example .env
# Set the backend API/WebSocket URL in .env

npm run dev
```

Requires [Chess-Server](https://github.com/vipul016/Chess-Server) running and reachable.

## Testing

```bash
npm test
```

Includes component/unit tests (Vitest + Testing Library) and a dedicated browser-level test for chessboard drag-and-drop interaction (Puppeteer).

## Related
Pairs with [Chess-Server](https://github.com/vipul016/Chess-Server) — see that repo for backend architecture, API/WebSocket protocol details, and full setup instructions.
## Deployment

The application is configured for seamless deployment to Vercel.

1. **Push to GitHub:** Ensure your `chess-client` repository is pushed to GitHub.
2. **Import to Vercel:** Create a new project on Vercel and import the repository.
3. **Environment Variables:** Set the following variables in Vercel:
   - `VITE_API_URL`: Your backend REST API URL (e.g. `https://chess-server.onrender.com`)
   - `VITE_WS_URL`: Your backend WebSocket URL (e.g. `wss://chess-server.onrender.com`)
4. **Deploy:** Vercel will automatically build the React application using `vite build`. Routing is handled out-of-the-box by the included `vercel.json` configuration to prevent 404 errors on direct navigation.
