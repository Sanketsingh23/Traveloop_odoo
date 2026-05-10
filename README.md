# TravelLoop

TravelLoop is a full-stack monorepo with a modern frontend and scalable backend, structured for clean collaboration and fast iteration.

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Workspace: npm workspaces with a root-level developer workflow

## Project Structure

```text
travelloop/
  backend/
    src/
      config/
      middleware/
      routes/
      app.ts
      server.ts
    .env.example
    eslint.config.js
    package.json
    tsconfig.json
  frontend/
    src/
      App.tsx
      App.css
      index.css
    package.json
    vite.config.ts
  .gitignore
  package.json
  README.md
```

## Quick Start

1. Install dependencies from the repository root:

```bash
npm install
```

2. Start frontend and backend together:

```bash
npm run dev
```

3. Open the apps:

- Frontend: http://localhost:5173
- Backend health API: http://localhost:5000/api/health

## Scripts

From repository root:

- `npm run dev` runs backend and frontend together
- `npm run build` builds backend and frontend
- `npm run lint` lints backend and frontend

From backend:

- `npm run dev` runs API in watch mode
- `npm run build` compiles TypeScript into `dist`
- `npm run start` starts compiled server

From frontend:

- `npm run dev` starts Vite dev server
- `npm run build` builds production frontend

## Environment Variables

Copy backend example variables from `backend/.env.example` to `backend/.env` and update values as needed.

## Next Step

Share your page-by-page requirements (home, destinations, booking flow, dashboard, etc.) and I will implement the complete UI/UX and APIs on top of this foundation.
