# AGENT.md - Codebase Guide for AI Agents

## Architecture
- **Full-stack HRMS application** with Node.js/Express backend and React frontend
- **Backend**: Express.js API (port 5002) using MongoDB, JWT auth, Socket.IO, ES modules
- **Frontend**: React app (port 3000/80) with Redux, Material-UI, Ant Design, Chart.js
- **Docker**: Containerized deployment via docker-compose.yml

## Commands
```bash
# Backend (run from /backend)
npm run dev          # Development with nodemon
npm start           # Production server
npm run data:import # Seed database
npm run data:destroy # Clear database

# Frontend (run from /frontend)  
npm run start:dev   # Development server (localhost:3000)
npm start          # Public server (0.0.0.0:3000)
npm run build      # Production build
npm test           # Run Jest tests

# Docker
docker-compose up  # Full stack deployment
```

## Code Style & Conventions
- **ES6 modules** (`import/export`) in backend, type: "module" in package.json
- **React functional components** with hooks, Redux Toolkit for state management
- **Folder structure**: backend has routes/, controllers/, models/, middleware/, services/
- **Frontend structure**: components/, screens/, redux/, services/, context/
- **Authentication**: JWT-based with company filtering middleware
- **File uploads**: Multer for backend file handling
- **Real-time**: Socket.IO for live updates and notifications
