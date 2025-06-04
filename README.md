# Planning Poker App

This is a real-time Planning Poker application built with:
- React + TypeScript
- Vite
- Redux Toolkit (RTK)
- RTK Query
- json-server

## Features

- Create and join poker planning rooms
- Roles: Croupier (Scrum Master) and Players
- Real-time voting with card values (1-21 and ?)
- Vote hiding until reveal
- Real-time updates using RTK Query
- Local JSON server for data persistence
- Modern UI with CSS

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development servers:
   - For local development only:
   ```bash
   npm run dev:all
   ```
   - To allow external access (for other players to join):
   ```bash
   npm run dev:host
   ```

When using `dev:host`, the servers will be accessible at:
- Web app: `http://<your-ip>:5173` (or next available port)
- API server: `http://<your-ip>:3000`

Replace `<your-ip>` with your local IP address (can be found using `ipconfig` on Windows or `ifconfig` on Mac/Linux).

This will start:
- Vite dev server (the port will be displayed in the terminal, typically http://localhost:5173 or next available port)
- json-server on http://localhost:3000

## Available Scripts

- `npm run dev` - Start the Vite development server (local only)
- `npm run server` - Start json-server (local only)
- `npm run dev:all` - Start both servers (local only)
- `npm run dev:host` - Start both servers with external access (allows other players to join)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### External Access

When using `npm run dev:host`:
1. The servers will bind to all network interfaces (0.0.0.0)
2. Other players on the same network can join using your machine's IP address
3. Both the web app and API will be accessible externally
4. The terminal will show the URLs, including your network IP

## API Endpoints

The following endpoints are available through json-server:

### Rooms
- GET `/rooms` - Get all rooms
- GET `/rooms/:id` - Get a specific room
- POST `/rooms` - Create a new room
- PUT `/rooms/:id` - Update a room

### Users
- GET `/users` - Get all users
- GET `/users?roomId=:roomId` - Get users in a specific room
- POST `/users` - Join a room
- DELETE `/users/:id` - Leave a room

### Votes
- GET `/votes` - Get all votes
- GET `/votes?roomId=:roomId` - Get votes for a specific room
- POST `/votes` - Cast a vote
- DELETE `/votes?roomId=:roomId` - Clear votes for a room

## ESLint Configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
