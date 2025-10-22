# CSE 110 Project
```
project-root/
├── client/
│   ├── index.html                   // Main entry point (Vite requirement)
│   ├── public/
│   │   └── assets/                  // Static assets (images, fonts, etc.)
│   │       ├── images/
│   │       └── fonts/
│   ├── src/
│   │   ├── app.ts                   // Main app - manages Konva stage and page routing
│   │   ├── pages/
│   │   │   ├── EntrancePage.ts      // Returns Konva Layer for entrance page
│   │   │   ├── GameRoom.ts          // Returns Konva Layer for game room
│   │   │   └── HundredMeterDash.ts  // Returns Konva Layer for 100m dash game
│   │   ├── components/
│   │   │   ├── Leaderboard.ts       // Konva component for leaderboard
│   │   │   └── CountdownTimer.ts    // Konva component for countdown
│   │   ├── services/
│   │   │   ├── api.ts               // HTTP API calls
│   │   │   └── socket.ts            // Socket.io client setup
│   │   ├── types/
│   │   │   └── index.ts             // Client-specific TypeScript types
│   │   ├── styles/                  // CSS files
│   │   │   ├── global.css
│   │   │   ├── entrance.css
│   │   │   ├── gameRoom.css
│   │   │   └── hundredMeterDash.css
│   ├── dist/                         // Compiled output (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── api.ts               // /api/join-game endpoint
│   │   ├── sockets/
│   │   │   └── gameSocket.ts        // Socket event handlers
│   │   ├── services/
│   │   │   ├── gameState.ts         // Game state management
│   │   │   └── leaderboard.ts       // Leaderboard logic
│   │   ├── types/
│   │   │   └── index.ts             // Server-specific TypeScript types
│   │   └── server.ts                // Main server file
│   ├── dist/                         // Compiled output (gitignored)
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   ├── types/
│   │   └── index.ts                  // Shared TypeScript types (Player, GameState, etc.)
│   └── package.json
│
├── .gitignore
├── package.json                      // Root package.json for workspace
└── README.md
```
