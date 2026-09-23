/**
 * PAC-MAN Maze Grid & Renderer
 */

import { TILE_SIZE, MAZE_COLS, MAZE_ROWS, RAW_MAZE, COLORS } from './constants.js';

export class Maze {
    constructor() {
        this.cols = MAZE_COLS;
        this.rows = MAZE_ROWS;
        this.tileSize = TILE_SIZE;
        this.grid = [];
        this.totalPellets = 0;
        this.pelletsRemaining = 0;
        this.energizersRemaining = 0;
        this.flashWalls = false;
        this.wallCanvas = null;
        this.wallFlashCanvas = null;

        this.init();
    }

    init() {
        this.grid = [];
        this.totalPellets = 0;
        this.pelletsRemaining = 0;
        this.energizersRemaining = 0;

        for (let r = 0; r < this.rows; r++) {
            const rowChars = RAW_MAZE[r].split('');
            const rowArr = [];
            for (let c = 0; c < this.cols; c++) {
                const char = rowChars[c] || ' ';
                rowArr.push(char);
                if (char === '.') {
                    this.totalPellets++;
                    this.pelletsRemaining++;
                } else if (char === 'o') {
                    this.totalPellets++;
                    this.energizersRemaining++;
                    this.pelletsRemaining++;
                }
            }
            this.grid.push(rowArr);
        }

        this.buildWallCanvases();
    }

    resetPellets() {
        this.init();
    }

    getTile(c, r) {
        if (r < 0 || r >= this.rows) return 'W';
        // Tunnel wrapping horizontally
        if (c < 0 || c >= this.cols) {
            if (r === 14) return 'T';
            return 'W';
        }
        return this.grid[r][c];
    }

    isWall(c, r) {
        const tile = this.getTile(c, r);
        return tile === 'W';
    }

    isDoor(c, r) {
        const tile = this.getTile(c, r);
        return tile === '-';
    }

    isTunnel(c, r) {
        const tile = this.getTile(c, r);
        return tile === 'T' || (r === 14 && (c < 0 || c >= this.cols));
    }

    isGhostHouse(c, r) {
        const tile = this.getTile(c, r);
        return tile === 'G' || tile === '-';
    }

    canPacmanMove(c, r) {
        if (r < 0 || r >= this.rows) return false;
        // In tunnel
        if (r === 14 && (c < 0 || c >= this.cols)) return true;
        const tile = this.getTile(c, r);
        // Pacman cannot enter walls or the ghost house door
        return tile !== 'W' && tile !== '-' && tile !== 'G';
    }

    canGhostMove(c, r, isEaten = false, isExiting = false) {
        if (r < 0 || r >= this.rows) return false;
        if (r === 14 && (c < 0 || c >= this.cols)) return true;
        const tile = this.getTile(c, r);

        if (tile === 'W') return false;
        if (tile === '-') {
            // Eaten ghosts and ghosts exiting house can pass through the door
            return isEaten || isExiting;
        }
        if (tile === 'G') {
            return isEaten || isExiting;
        }
        return true;
    }

    eatPellet(c, r) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
        const tile = this.grid[r][c];
        if (tile === '.') {
            this.grid[r][c] = ' ';
            this.pelletsRemaining--;
            return { type: 'dot', points: 10 };
        } else if (tile === 'o') {
            this.grid[r][c] = ' ';
            this.pelletsRemaining--;
            this.energizersRemaining--;
            return { type: 'energizer', points: 50 };
        }
        return null;
    }

    /**
     * Pre-render classic neon maze walls for silky smooth performance
     */
    buildWallCanvases() {
        const w = this.cols * this.tileSize;
        const h = this.rows * this.tileSize;

        this.wallCanvas = document.createElement('canvas');
        this.wallCanvas.width = w;
        this.wallCanvas.height = h;
        const ctx = this.wallCanvas.getContext('2d');

        this.wallFlashCanvas = document.createElement('canvas');
        this.wallFlashCanvas.width = w;
        this.wallFlashCanvas.height = h;
        const flashCtx = this.wallFlashCanvas.getContext('2d');

        this.renderWalls(ctx, COLORS.MAZE_WALL, '#000033');
        this.renderWalls(flashCtx, '#ffffff', '#aaaaaa');
    }

    renderWalls(ctx, wallColor, innerGlowColor) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

        const S = this.tileSize;
        const half = S / 2;

        // Draw solid wall blocks and borders
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                const x = c * S;
                const y = r * S;

                if (tile === 'W') {
                    // Check neighboring tiles to draw clean smooth arcade outlines
                    const top = this.isWall(c, r - 1);
                    const bottom = this.isWall(c, r + 1);
                    const left = this.isWall(c - 1, r);
                    const right = this.isWall(c + 1, r);

                    ctx.fillStyle = innerGlowColor;
                    ctx.fillRect(x + 2, y + 2, S - 4, S - 4);

                    ctx.strokeStyle = wallColor;
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';

                    // Draw outer border lines where there is an open space
                    if (!top) {
                        ctx.beginPath();
                        ctx.moveTo(x + 1, y + 1.5);
                        ctx.lineTo(x + S - 1, y + 1.5);
                        ctx.stroke();
                    }
                    if (!bottom) {
                        ctx.beginPath();
                        ctx.moveTo(x + 1, y + S - 1.5);
                        ctx.lineTo(x + S - 1, y + S - 1.5);
                        ctx.stroke();
                    }
                    if (!left) {
                        ctx.beginPath();
                        ctx.moveTo(x + 1.5, y + 1);
                        ctx.lineTo(x + 1.5, y + S - 1);
                        ctx.stroke();
                    }
                    if (!right) {
                        ctx.beginPath();
                        ctx.moveTo(x + S - 1.5, y + 1);
                        ctx.lineTo(x + S - 1.5, y + S - 1);
                        ctx.stroke();
                    }

                    // Inner corner highlights for authentic arcade look
                    if (top && left && !this.isWall(c - 1, r - 1)) {
                        ctx.fillStyle = wallColor;
                        ctx.fillRect(x, y, 3, 3);
                    }
                    if (top && right && !this.isWall(c + 1, r - 1)) {
                        ctx.fillStyle = wallColor;
                        ctx.fillRect(x + S - 3, y, 3, 3);
                    }
                    if (bottom && left && !this.isWall(c - 1, r + 1)) {
                        ctx.fillStyle = wallColor;
                        ctx.fillRect(x, y + S - 3, 3, 3);
                    }
                    if (bottom && right && !this.isWall(c + 1, r + 1)) {
                        ctx.fillStyle = wallColor;
                        ctx.fillRect(x + S - 3, y + S - 3, 3, 3);
                    }
                } else if (tile === '-') {
                    // Ghost house door
                    ctx.fillStyle = COLORS.MAZE_DOOR;
                    ctx.fillRect(x, y + half - 2, S, 4);
                }
            }
        }
    }

    draw(ctx, energizerBlink) {
        // Draw pre-rendered walls (normal or flashing during level complete)
        if (this.flashWalls && this.wallFlashCanvas) {
            ctx.drawImage(this.wallFlashCanvas, 0, 0);
        } else if (this.wallCanvas) {
            ctx.drawImage(this.wallCanvas, 0, 0);
        }

        const S = this.tileSize;
        const half = S / 2;

        // Draw pellets and energizers
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                const cx = c * S + half;
                const cy = r * S + half;

                if (tile === '.') {
                    ctx.fillStyle = COLORS.PELLET;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile === 'o') {
                    if (energizerBlink) {
                        ctx.fillStyle = COLORS.ENERGIZER;
                        ctx.beginPath();
                        ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
    }
}
