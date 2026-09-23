/**
 * PAC-MAN Game Engine & Main Loop
 * Version: v1.0.0
 */

import {
    VERSION,
    TILE_SIZE,
    MAZE_COLS,
    MAZE_ROWS,
    HUD_BOTTOM_ROWS,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    DIR,
    STATE,
    GHOST_MODE,
    COLORS,
    FRUITS
} from './constants.js';

import { soundEngine } from './audio.js';
import { Maze } from './maze.js';
import { Pacman } from './pacman.js';
import { Ghost } from './ghost.js';
import { Fruit } from './fruit.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // High DPI canvas support
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // DOM elements
        this.scoreEl = document.getElementById('scoreValue');
        this.highScoreEl = document.getElementById('highScoreValue');
        this.levelEl = document.getElementById('levelValue');
        this.muteBtn = document.getElementById('muteBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.versionEl = document.getElementById('appVersion');

        // Display current version
        if (this.versionEl) {
            this.versionEl.textContent = VERSION;
        }

        // State & Entities
        this.maze = new Maze();
        this.pacman = new Pacman();
        this.fruit = new Fruit();

        // 4 Iconic Ghosts
        this.blinky = new Ghost({
            name: 'Blinky',
            color: COLORS.BLINKY,
            homeX: 13.5,
            homeY: 11.5,
            scatterX: 25,
            scatterY: -2,
            dotTrigger: 0,
            startsOutside: true
        });

        this.pinky = new Ghost({
            name: 'Pinky',
            color: COLORS.PINKY,
            homeX: 13.5,
            homeY: 14.5,
            scatterX: 2,
            scatterY: -2,
            dotTrigger: 0,
            startsOutside: false
        });

        this.inky = new Ghost({
            name: 'Inky',
            color: COLORS.INKY,
            homeX: 11.5,
            homeY: 14.5,
            scatterX: 27,
            scatterY: 31,
            dotTrigger: 30,
            startsOutside: false
        });

        this.clyde = new Ghost({
            name: 'Clyde',
            color: COLORS.CLYDE,
            homeX: 15.5,
            homeY: 14.5,
            scatterX: 0,
            scatterY: 31,
            dotTrigger: 60,
            startsOutside: false
        });

        this.ghosts = [this.blinky, this.pinky, this.inky, this.clyde];

        // Scores & Progress
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pacman_highscore') || '0', 10);
        this.level = 1;
        this.dotsEatenThisRound = 0;

        // Wave Timers (Scatter vs Chase)
        this.waveTimer = 0;
        this.waveIndex = 0;
        this.waveMode = GHOST_MODE.SCATTER;

        // Ghost eating combo (200, 400, 800, 1600)
        this.ghostEatCombo = 0;
        this.ghostScorePopups = []; // { text, x, y, timer }

        // Energizer flashing
        this.energizerBlinkTimer = 0;
        this.energizerVisible = true;

        // Game Flow State
        this.state = STATE.READY;
        this.stateTimer = 0;
        this.flashWallsTimer = 0;
        this.flashCount = 0;

        // Loop timing
        this.lastTime = 0;

        // Input setup
        this.initInput();
        this.initUI();

        // Start initial round
        this.startNewGame();
        requestAnimationFrame((t) => this.loop(t));
    }

    startNewGame() {
        this.score = 0;
        this.level = 1;
        this.pacman.lives = 3;
        this.pacman.extraLifeAwarded = false;
        this.updateHUD();
        this.startLevel();
    }

    startLevel() {
        this.maze.resetPellets();
        this.dotsEatenThisRound = 0;
        this.fruit.resetForLevel(this.level);
        this.resetPositions();

        // Start in READY state with classic intro music
        this.state = STATE.READY;
        this.stateTimer = 4.0; // Wait for intro to play
        soundEngine.playIntro();
        this.updateHUD();
    }

    resetPositions() {
        this.pacman.reset();
        this.blinky.reset();
        this.pinky.reset();
        this.inky.reset();
        this.clyde.reset();

        this.waveIndex = 0;
        this.waveTimer = 0;
        this.waveMode = GHOST_MODE.SCATTER;
        this.ghostEatCombo = 0;
        this.ghostScorePopups = [];

        soundEngine.stopSiren();
    }

    updateWaveMode(dt) {
        // Authentic arcade wave timing:
        // Wave 1: Scatter 7s, Chase 20s
        // Wave 2: Scatter 7s, Chase 20s
        // Wave 3: Scatter 5s, Chase 20s
        // Wave 4: Scatter 5s, Chase permanent
        const waves = [
            { mode: GHOST_MODE.SCATTER, duration: 7 },
            { mode: GHOST_MODE.CHASE,   duration: 20 },
            { mode: GHOST_MODE.SCATTER, duration: 7 },
            { mode: GHOST_MODE.CHASE,   duration: 20 },
            { mode: GHOST_MODE.SCATTER, duration: 5 },
            { mode: GHOST_MODE.CHASE,   duration: 20 },
            { mode: GHOST_MODE.SCATTER, duration: 5 },
            { mode: GHOST_MODE.CHASE,   duration: Infinity }
        ];

        this.waveTimer += dt;
        const currentWave = waves[this.waveIndex];

        if (this.waveTimer >= currentWave.duration && this.waveIndex < waves.length - 1) {
            this.waveIndex++;
            this.waveTimer = 0;
            this.waveMode = waves[this.waveIndex].mode;

            // When switching modes, ghosts reverse direction
            this.ghosts.forEach(g => {
                if (g.mode === GHOST_MODE.SCATTER || g.mode === GHOST_MODE.CHASE) {
                    g.mode = this.waveMode;
                    g.reverseDirection();
                }
            });
        }
    }

    loop(currentTime) {
        if (!this.lastTime) this.lastTime = currentTime;
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // clamp delta
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Blink Energizers
        this.energizerBlinkTimer += dt;
        if (this.energizerBlinkTimer >= 0.25) {
            this.energizerBlinkTimer = 0;
            this.energizerVisible = !this.energizerVisible;
        }

        // Update floating ghost eat popups
        for (let i = this.ghostScorePopups.length - 1; i >= 0; i--) {
            const popup = this.ghostScorePopups[i];
            popup.timer -= dt;
            if (popup.timer <= 0) {
                this.ghostScorePopups.splice(i, 1);
            }
        }

        switch (this.state) {
            case STATE.READY:
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.state = STATE.PLAYING;
                }
                break;

            case STATE.PLAYING:
                this.updatePlaying(dt);
                break;

            case STATE.GHOST_EATEN_PAUSE:
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.state = STATE.PLAYING;
                }
                break;

            case STATE.PACMAN_DYING:
                this.pacman.updateDeath(dt);
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    if (this.pacman.lives > 0) {
                        this.resetPositions();
                        this.state = STATE.READY;
                        this.stateTimer = 1.8;
                    } else {
                        this.state = STATE.GAME_OVER;
                        soundEngine.stopSiren();
                    }
                }
                break;

            case STATE.LEVEL_CLEAR:
                this.flashWallsTimer += dt;
                if (this.flashWallsTimer >= 0.22) {
                    this.flashWallsTimer = 0;
                    this.flashCount++;
                    this.maze.flashWalls = !this.maze.flashWalls;
                }
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.maze.flashWalls = false;
                    this.level++;
                    this.startLevel();
                }
                break;

            case STATE.PAUSED:
            case STATE.GAME_OVER:
                break;
        }
    }

    updatePlaying(dt) {
        this.updateWaveMode(dt);

        // Update Pac-Man
        this.pacman.update(dt, this.maze);

        // Check Pellet Consumption
        const currentTileC = Math.floor(this.pacman.x / TILE_SIZE);
        const currentTileR = Math.floor(this.pacman.y / TILE_SIZE);
        const pellet = this.maze.eatPellet(currentTileC, currentTileR);

        if (pellet) {
            this.addScore(pellet.points);
            this.dotsEatenThisRound++;
            this.fruit.checkSpawn(this.dotsEatenThisRound);

            if (pellet.type === 'dot') {
                soundEngine.playChomp();
            } else if (pellet.type === 'energizer') {
                soundEngine.playChomp();
                this.ghostEatCombo = 0; // reset combo multiplier
                // Frighten ghosts (7 seconds on level 1, decreasing slightly on higher levels)
                const frightenedDuration = Math.max(2.0, 7.5 - (this.level - 1) * 0.5);
                this.ghosts.forEach(g => g.triggerFrightened(frightenedDuration));
            }

            // Check Level Completion
            if (this.maze.pelletsRemaining <= 0) {
                this.triggerLevelClear();
                return;
            }
        }

        // Update Fruit
        this.fruit.update(dt);
        const fruitPts = this.fruit.checkCollision(this.pacman);
        if (fruitPts) {
            this.addScore(fruitPts);
            soundEngine.playFruit();
        }

        // Update Ghosts
        let anyFrightened = false;
        let anyEaten = false;

        this.ghosts.forEach(ghost => {
            ghost.update(dt, this.waveMode, this.pacman, this.blinky, this.dotsEatenThisRound, this.maze);

            if (ghost.mode === GHOST_MODE.FRIGHTENED) anyFrightened = true;
            if (ghost.mode === GHOST_MODE.EATEN) anyEaten = true;

            // Collision check with Pacman
            const dist = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);
            if (dist < TILE_SIZE * 0.8) {
                if (ghost.mode === GHOST_MODE.FRIGHTENED) {
                    // Eat ghost!
                    this.eatGhost(ghost);
                } else if (ghost.mode === GHOST_MODE.SCATTER || ghost.mode === GHOST_MODE.CHASE) {
                    // Pac-Man caught by ghost
                    this.triggerPacmanDeath();
                }
            }
        });

        // Update Ambient Audio Siren
        if (anyEaten) {
            soundEngine.setSiren('eyes');
        } else if (anyFrightened) {
            soundEngine.setSiren('frightened');
        } else {
            // Speed up siren as dots decrease
            const speedFactor = 1.0 + (1.0 - this.maze.pelletsRemaining / 244.0) * 0.6;
            soundEngine.setSiren('normal', speedFactor);
        }
    }

    eatGhost(ghost) {
        ghost.mode = GHOST_MODE.EATEN;
        this.ghostEatCombo++;
        const pts = Math.min(1600, 200 * Math.pow(2, this.ghostEatCombo - 1));
        this.addScore(pts);
        soundEngine.playEatGhost();

        this.ghostScorePopups.push({
            text: `${pts}`,
            x: ghost.x,
            y: ghost.y,
            timer: 0.65
        });

        // Brief freeze frame
        this.state = STATE.GHOST_EATEN_PAUSE;
        this.stateTimer = 0.45;
    }

    triggerPacmanDeath() {
        soundEngine.stopSiren();
        soundEngine.playDeath();
        this.pacman.lives--;
        this.updateHUD();
        this.state = STATE.PACMAN_DYING;
        this.stateTimer = 2.2;
    }

    triggerLevelClear() {
        soundEngine.stopSiren();
        soundEngine.playLevelClear();
        this.state = STATE.LEVEL_CLEAR;
        this.stateTimer = 2.5;
        this.flashWallsTimer = 0;
        this.flashCount = 0;
    }

    addScore(pts) {
        this.score += pts;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacman_highscore', this.highScore.toString());
        }

        // Award Extra Life at 10,000 points
        if (!this.pacman.extraLifeAwarded && this.score >= 10000) {
            this.pacman.extraLifeAwarded = true;
            this.pacman.lives++;
            soundEngine.playExtraLife();
        }

        this.updateHUD();
    }

    updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = this.score.toString().padStart(2, '0');
        if (this.highScoreEl) this.highScoreEl.textContent = this.highScore.toString().padStart(2, '0');
        if (this.levelEl) this.levelEl.textContent = this.level.toString();
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Maze & Pellets
        this.maze.draw(ctx, this.energizerVisible);

        // Draw Fruit
        this.fruit.draw(ctx);

        // In certain states, ghosts or Pacman might be hidden
        const hideGhosts = (this.state === STATE.PACMAN_DYING || this.state === STATE.LEVEL_CLEAR);
        const hidePacman = (this.state === STATE.LEVEL_CLEAR && this.flashCount % 2 === 1);

        // Draw Pac-Man
        if (!hidePacman) {
            this.pacman.draw(ctx);
        }

        // Draw Ghosts
        if (!hideGhosts) {
            this.ghosts.forEach(ghost => ghost.draw(ctx));
        }

        // Draw Ghost Eat Floating Scores
        this.ghostScorePopups.forEach(popup => {
            ctx.save();
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 11px "Press Start 2P", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(popup.text, popup.x, popup.y);
            ctx.restore();
        });

        // Draw Bottom Status Area (Lives & Fruit)
        this.renderBottomHUD(ctx);

        // Draw State Overlays (READY, PAUSED, GAME OVER)
        this.renderOverlays(ctx);
    }

    renderBottomHUD(ctx) {
        const bottomY = (MAZE_ROWS + 1.2) * TILE_SIZE;

        // Render Pacman Lives Icons
        for (let i = 0; i < this.pacman.lives - 1; i++) {
            const x = (2.5 + i * 1.8) * TILE_SIZE;
            ctx.save();
            ctx.translate(x, bottomY);
            ctx.fillStyle = COLORS.PACMAN;
            ctx.beginPath();
            ctx.arc(0, 0, TILE_SIZE * 0.55, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.restore();
        }

        // Render Fruit Level Icons (up to 7 recent fruits on bottom-right)
        const fruitsToDraw = Math.min(this.level, 7);
        for (let i = 0; i < fruitsToDraw; i++) {
            const x = (MAZE_COLS - 2.5 - i * 1.8) * TILE_SIZE;
            const fruitIndex = Math.min(i, FRUITS.length - 1);
            this.fruit.drawFruitIcon(ctx, x, bottomY, FRUITS[fruitIndex], 0.85);
        }
    }

    renderOverlays(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 18px "Press Start 2P", monospace, sans-serif';

        if (this.state === STATE.READY) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText('READY!', 13.5 * TILE_SIZE, 17.5 * TILE_SIZE);
        } else if (this.state === STATE.PAUSED) {
            ctx.fillStyle = '#00ffff';
            ctx.fillText('PAUSED', 13.5 * TILE_SIZE, 17.5 * TILE_SIZE);
        } else if (this.state === STATE.GAME_OVER) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText('GAME  OVER', 13.5 * TILE_SIZE, 17.5 * TILE_SIZE);

            ctx.font = 'bold 10px "Press Start 2P", monospace, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', 13.5 * TILE_SIZE, 20.5 * TILE_SIZE);
        }

        ctx.restore();
    }

    initInput() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            soundEngine.init();

            if (this.state === STATE.GAME_OVER) {
                this.startNewGame();
                return;
            }

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    e.preventDefault();
                    this.pacman.setNextDirection(DIR.UP);
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    e.preventDefault();
                    this.pacman.setNextDirection(DIR.DOWN);
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    e.preventDefault();
                    this.pacman.setNextDirection(DIR.LEFT);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    e.preventDefault();
                    this.pacman.setNextDirection(DIR.RIGHT);
                    break;
                case 'Space':
                case 'KeyP':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                case 'KeyR':
                    e.preventDefault();
                    this.startNewGame();
                    break;
            }
        });

        // Touch & Swipe Controls
        let touchStartX = 0;
        let touchStartY = 0;

        window.addEventListener('touchstart', (e) => {
            soundEngine.init();
            if (this.state === STATE.GAME_OVER) {
                this.startNewGame();
                return;
            }
            if (e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 0) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 25) { // minimum swipe distance
                if (absDx > absDy) {
                    this.pacman.setNextDirection(dx > 0 ? DIR.RIGHT : DIR.LEFT);
                } else {
                    this.pacman.setNextDirection(dy > 0 ? DIR.DOWN : DIR.UP);
                }
            }
        }, { passive: true });

        // Virtual D-Pad buttons
        const dpadUp = document.getElementById('dpadUp');
        const dpadDown = document.getElementById('dpadDown');
        const dpadLeft = document.getElementById('dpadLeft');
        const dpadRight = document.getElementById('dpadRight');

        if (dpadUp) dpadUp.addEventListener('click', () => { soundEngine.init(); this.pacman.setNextDirection(DIR.UP); });
        if (dpadDown) dpadDown.addEventListener('click', () => { soundEngine.init(); this.pacman.setNextDirection(DIR.DOWN); });
        if (dpadLeft) dpadLeft.addEventListener('click', () => { soundEngine.init(); this.pacman.setNextDirection(DIR.LEFT); });
        if (dpadRight) dpadRight.addEventListener('click', () => { soundEngine.init(); this.pacman.setNextDirection(DIR.RIGHT); });
    }

    initUI() {
        if (this.muteBtn) {
            this.muteBtn.addEventListener('click', () => this.toggleMute());
            this.updateMuteButton();
        }

        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.startNewGame());
        }

        // Instructions Modal
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeHelpBtn = document.getElementById('closeHelpBtn');

        if (helpBtn && helpModal) {
            helpBtn.addEventListener('click', () => {
                helpModal.classList.toggle('active');
            });
        }
        if (closeHelpBtn && helpModal) {
            closeHelpBtn.addEventListener('click', () => {
                helpModal.classList.remove('active');
            });
        }

        // CRT Scanline toggle
        const crtBtn = document.getElementById('crtBtn');
        const cabinet = document.querySelector('.arcade-cabinet');
        if (crtBtn && cabinet) {
            crtBtn.addEventListener('click', () => {
                cabinet.classList.toggle('crt-active');
            });
        }
    }

    togglePause() {
        if (this.state === STATE.PLAYING) {
            this.state = STATE.PAUSED;
            soundEngine.stopSiren();
            if (this.pauseBtn) this.pauseBtn.textContent = '▶ Resume';
        } else if (this.state === STATE.PAUSED) {
            this.state = STATE.PLAYING;
            if (this.pauseBtn) this.pauseBtn.textContent = '⏸ Pause';
        }
    }

    toggleMute() {
        const isMuted = soundEngine.toggleMute();
        this.updateMuteButton(isMuted);
    }

    updateMuteButton(isMuted = soundEngine.isMuted) {
        if (this.muteBtn) {
            this.muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
        }
    }
}

// Bootstrap on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
