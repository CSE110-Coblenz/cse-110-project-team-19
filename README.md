# CSE 110 Project
```
project-root/
├── client/
│   ├── public/
│   │   ├── index.html               // Main entry point
│   │   ├── entrance.html
│   │   ├── gameRoom.html
│   │   ├── hundredMeterDash.html
│   │   ├── favicon.ico
│   │   └── assets/                  // Static assets (images, fonts, etc.)
│   │       ├── images/
│   │       └── fonts/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── EntrancePage.tsx
│   │   │   ├── GameRoom.tsx
│   │   │   └── HundredMeterDash.tsx
│   │   ├── components/
│   │   │   ├── Leaderboard.tsx
│   │   │   └── CountdownTimer.tsx
│   │   ├── services/
│   │   │   ├── api.ts               // HTTP API calls
│   │   │   └── socket.ts            // Socket.io client setup
│   │   ├── types/
│   │   │   └── index.ts             // TypeScript interfaces/types
│   │   ├── utils/
│   │   │   └── constants.ts         // Game states, event names
│   │   ├── styles/                  // CSS files
│   │   │   ├── global.css
│   │   │   ├── entrance.css
│   │   │   ├── gameRoom.css
│   │   │   └── hundredMeterDash.css
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── dist/                         // Compiled output (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
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
│   │   │   └── index.ts             // TypeScript interfaces/types
│   │   ├── utils/
│   │   │   └── constants.ts         // Game states, timing constants
│   │   └── server.ts                // Main server file
│   ├── dist/                         // Compiled output (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── shared/
│   ├── types/
│   │   └── index.ts                  // Shared TypeScript types
│   └── constants.ts                  // Shared constants
│
├── .gitignore
├── package.json                      // Root package.json for workspace
```
