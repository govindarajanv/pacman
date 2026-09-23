# PAC-MAN Arcade Game

[![Version](https://img.shields.io/badge/version-v1.0.0-yellow.svg)](./)
[![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-brightgreen.svg)](https://govindarajanv.github.io/pacman/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An authentic, fully-featured recreation of the classic **PAC-MAN** arcade game, designed and optimized to run as a **static site on GitHub Pages**.

Playable directly in any modern desktop or mobile browser with zero build steps or external dependencies.

---

## 🎮 Live Demo

Play live at: **[https://govindarajanv.github.io/pacman/](https://govindarajanv.github.io/pacman/)**

> **Version Notice**: The live version (`v1.0.0`) is always displayed directly beneath the game title on the arcade cabinet.

---

## ✨ Features

- **Classic Arcade Maze**: Authentic 28 × 31 tile layout with exactly 240 pellets, 4 power energizers, ghost house, and horizontal side tunnels with wrap-around.
- **Autonomous Ghost AI with Distinct Personalities**:
  - 🔴 **Blinky (Red / "Shadow")**: Relentless chaser targeting Pac-Man's exact tile coordinates.
  - 🌸 **Pinky (Pink / "Speedy")**: Strategic ambusher calculating 4 tiles ahead of Pac-Man.
  - 🔷 **Inky (Cyan / "Bashful")**: Coordinated flanker using vector doubling based on Blinky and Pac-Man.
  - 🟠 **Clyde (Orange / "Pokey")**: Cowardly wanderer who chases Pac-Man from afar but retreats to his corner when within 8 tiles.
- **Classic Ghost Wave Cycle**: Authentic timed alternation between *Scatter* and *Chase* modes.
- **Frightened Mode & Combos**: Ghosts turn dark blue on Energizer consumption, flash blue/white as time expires, and yield progressive combo points: `200` → `400` → `800` → `1600`.
- **Eaten Eyes State**: Defeated ghosts return to the ghost house at 180% speed, revive, and re-emerge into the maze.
- **Fruit Bonus System**: Cherries, Strawberries, Oranges, Apples, Melons, Galaxian flagships, Bells, and Keys spawn at dot thresholds (70 & 170 dots) with custom vector graphics.
- **Synthesized 8-Bit Audio (Web Audio API)**:
  - 100% self-contained sound effects generated procedurally:
    - Opening intro theme arpeggio
    - Alternating two-tone *waka-waka* dot chomp
    - Dynamic pitch-shifting siren background drone
    - Power pellet siren & ghost eye sirens
    - Ascending chromatic ghost eaten sound
    - Classic descending chromatic death sound
    - Bonus fruit chime & 1-Up fanfare
- **Fluid Arcade Controls**:
  - Smooth subpixel movement with cornering input buffering / pre-turning.
  - Keyboard: Arrow keys & WASD.
  - Mobile & Tablet: Full swipe gesture recognition and on-screen virtual D-Pad.
  - Quick keys: `Space` / `P` to Pause, `M` to Mute/Unmute, `R` to Restart.
- **Arcade Visual Polish**:
  - Neon glow border aesthetics.
  - Toggleable CRT scanline retro monitor filter (`📺 CRT`).
  - Scoreboard displaying Current Score, High Score (persisted via `localStorage`), and Level.
  - Animated HUD icons for remaining lives and level fruit indicators.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Up** | <kbd>↑</kbd> or <kbd>W</kbd> | Swipe Up / D-Pad ▲ |
| **Move Down** | <kbd>↓</kbd> or <kbd>S</kbd> | Swipe Down / D-Pad ▼ |
| **Move Left** | <kbd>←</kbd> or <kbd>A</kbd> | Swipe Left / D-Pad ◀ |
| **Move Right** | <kbd>→</kbd> or <kbd>D</kbd> | Swipe Right / D-Pad ▶ |
| **Pause / Resume** | <kbd>Space</kbd> or <kbd>P</kbd> | Cabinet "⏸ Pause" button |
| **Mute / Unmute** | <kbd>M</kbd> | Cabinet "🔊 Mute" button |
| **Restart Game** | <kbd>R</kbd> | Cabinet "🔄 Restart" button |
| **Toggle Scanlines**| — | Cabinet "📺 CRT" button |
| **Help Guide** | — | Cabinet "❓ Guide" button |

---

## 🏆 Scoring Guide

| Target | Score |
| :--- | :--- |
| Regular Dot / Pellet | **10 pts** |
| Power Pellet (Energizer) | **50 pts** |
| 1st Ghost (Blue) | **200 pts** |
| 2nd Ghost (Blue) | **400 pts** |
| 3rd Ghost (Blue) | **800 pts** |
| 4th Ghost (Blue) | **1,600 pts** |
| Cherry (Level 1) | **100 pts** |
| Strawberry (Level 2) | **300 pts** |
| Orange (Levels 3–4) | **500 pts** |
| Apple (Levels 5–6) | **700 pts** |
| Melon (Levels 7–8) | **1,000 pts** |
| Galaxian Flagship (Levels 9–10) | **2,000 pts** |
| Bell (Levels 11–12) | **3,000 pts** |
| Key (Level 13+) | **5,000 pts** |
| **Extra Life Bonus** | Awarded at **10,000 pts** |

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages CI/CD workflow
├── css/
│   └── style.css           # Arcade cabinet, CRT scanlines, and responsive styling
├── js/
│   ├── audio.js            # Web Audio API 8-bit procedural sound synthesizer
│   ├── constants.js        # Game constants, authentic 28x31 maze matrix, colors, config
│   ├── fruit.js            # Bonus fruit spawning, scoring, and vector rendering
│   ├── game.js             # Core game loop, state management, inputs, and HUD
│   ├── ghost.js            # Ghost entities, AI state machine (Chase/Scatter/Frightened/Eyes)
│   ├── maze.js             # Grid parser, collision detection, and pre-rendered neon canvas
│   └── pacman.js           # Pac-Man physics, cornering buffer, and animations
├── index.html              # HTML5 entrypoint with semantic arcade cabinet UI
├── package.json            # Project metadata & npm scripts
└── README.md               # Project documentation
```

---

## 🚀 Running Locally

Because the application uses native browser ES Modules (`import`/`export`), it should be served over HTTP rather than `file://`:

### Using Python:
```bash
python3 -m http.server 8080
```
Open your browser to: [http://localhost:8080](http://localhost:8080)

### Using Node / npm:
```bash
npm start
```
Open your browser to: [http://localhost:8080](http://localhost:8080)

---

## 🌐 Deploying to GitHub Pages

This repository includes a pre-configured GitHub Actions workflow in [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).

To enable deployment on your GitHub repository:
1. Go to **Settings** > **Pages** in your GitHub repository.
2. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
3. Push to `main` branch. The action will build and deploy the game to `https://<username>.github.io/<repository>/` automatically.

---

## 📜 License

MIT License. Free to use, modify, and distribute.
