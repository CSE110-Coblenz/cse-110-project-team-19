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
│   │   ├── services/
│   │   │   ├── api.ts               // HTTP API calls
│   │   │   └── socket.ts            // Socket.io client setup
│   │   └── styles/
│   │       └── global.css           // Global CSS styles
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
│   │   │   ├── Game.ts              // Game class (manages single game room)
│   │   │   └── GameManager.ts       // GameManager singleton (manages all games)
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
