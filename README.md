# Mouse Mazes React

A React refactoring of the Mouse Mazes game - an educational puzzle game where players predict mouse paths through mazes with bouncy walls or directional arrows.

## Features

- **Introduction Mode**: Answer 8 questions on the same maze
- **Inference Mode**: Probe the maze and build your own model
- **Two Maze Types**: Bouncy Walls (/) and Arrows (U/D/L/R)
- **Three Difficulty Levels**: Beginner (1-3 detours), Intermediate (4-6), Expert (7-12)
- **Animated Path Visualization**: See the mouse's path through the maze

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd mouse-mazes-react
```

2. Install dependencies:
```bash
npm install
```

### Running the App

Start the development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`.

### Building for Production

Create an optimized production build:
```bash
npm run build
```

The build folder will contain the production-ready files.

## Project Structure

```
mouse-mazes-react/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx                 # Main app component
│   ├── App.module.css
│   ├── components/
│   │   ├── GameControls/       # Top control bar
│   │   ├── GameBoard/          # Canvas and holes
│   │   ├── SidePanel/          # Right side panel
│   │   └── Hole/               # Individual hole component
│   ├── hooks/
│   │   ├── useMazeGame.js      # Main game logic
│   │   ├── useMazeCanvas.js    # Canvas drawing
│   │   └── useAnimation.js      # Animation management
│   ├── utils/
│   │   ├── mazeUtils.js        # Maze generation & simulation
│   │   └── drawingUtils.js     # Canvas drawing functions
│   └── index.js
└── package.json
```

## How to Play

### Introduction Mode
1. Select your preferred maze type and difficulty level
2. Click "Start New Game"
3. Answer 8 questions about where mice will exit the maze
4. Click on a hole to predict the exit, or click "The Mouse Doesn't Come Out!" when appropriate

### Inference Mode
1. Select your preferred maze type and difficulty level
2. Click "Start New Game"
3. Click on holes to probe the hidden maze (results appear in the log)
4. Click inside rooms on the canvas to set your model (blank / wall / arrow)
5. Click "Test My Model" when ready to see how accurate your model is

## Technologies Used

- React 18
- Create React App
- CSS Modules
- Canvas API for maze rendering

## License

This project is for educational purposes.

