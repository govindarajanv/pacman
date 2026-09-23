/**
 * PAC-MAN Ghost AI & Entities (Blinky, Pinky, Inky, Clyde)
 */

import { TILE_SIZE, MAZE_COLS, DIR, COLORS, GHOST_MODE } from './constants.js';

export class Ghost {
    constructor(config) {
        this.name = config.name;
        this.color = config.color;
        this.homeX = config.homeX; // tile units
        this.homeY = config.homeY;
        this.scatterX = config.scatterX; // scatter target tile
        this.scatterY = config.scatterY;
        this.dotTrigger = config.dotTrigger; // dots eaten before leaving house
        this.startsOutside = config.startsOutside || false;

        this.x = 0;
        this.y = 0;
        this.tileX = 0;
        this.tileY = 0;
        this.dir = DIR.NONE;
        this.mode = GHOST_MODE.IN_HOUSE;
        this.baseSpeed = 9.8; // tiles per second
        this.speed = this.baseSpeed;

        this.targetX = 0;
        this.targetY = 0;

        // Frightened mode variables
        this.frightenedTimer = 0;
        this.frightenedDuration = 7.0; // seconds
        this.flashWhite = false;

        // House bouncing
        this.bounceDir = 1;
        this.bounceLimitTop = 13.8 * TILE_SIZE;
        this.bounceLimitBottom = 14.8 * TILE_SIZE;

        // Animation frame
        this.animTimer = 0;
        this.animFrame = 0;

        this.reset();
    }

    reset() {
        this.tileX = this.homeX;
        this.tileY = this.homeY;
        this.x = (this.tileX + 0.5) * TILE_SIZE;
        this.y = (this.tileY + 0.5) * TILE_SIZE;

        if (this.startsOutside) {
            this.mode = GHOST_MODE.SCATTER;
            this.dir = DIR.LEFT;
            this.y = 11.5 * TILE_SIZE;
        } else {
            this.mode = GHOST_MODE.IN_HOUSE;
            this.dir = DIR.UP;
        }

        this.speed = this.baseSpeed;
        this.frightenedTimer = 0;
        this.flashWhite = false;
        this.animTimer = 0;
        this.animFrame = 0;
    }

    triggerFrightened(duration) {
        // Can only be frightened if active outside
        if (this.mode === GHOST_MODE.IN_HOUSE || this.mode === GHOST_MODE.EXITING || this.mode === GHOST_MODE.EATEN) {
            return;
        }
        this.mode = GHOST_MODE.FRIGHTENED;
        this.frightenedDuration = duration;
        this.frightenedTimer = duration;
        // Reverse direction immediately on energizer eat
        this.reverseDirection();
    }

    reverseDirection() {
        if (this.dir === DIR.UP) this.dir = DIR.DOWN;
        else if (this.dir === DIR.DOWN) this.dir = DIR.UP;
        else if (this.dir === DIR.LEFT) this.dir = DIR.RIGHT;
        else if (this.dir === DIR.RIGHT) this.dir = DIR.LEFT;
    }

    update(dt, globalWaveMode, pacman, blinky, dotsEaten, maze) {
        const S = TILE_SIZE;

        // Animation counter for skirt wiggle
        this.animTimer += dt;
        if (this.animTimer >= 0.15) {
            this.animTimer = 0;
            this.animFrame = 1 - this.animFrame;
        }

        // Frightened timer countdown
        if (this.mode === GHOST_MODE.FRIGHTENED) {
            this.frightenedTimer -= dt;
            // Flash white when timer < 2.5 seconds
            this.flashWhite = (this.frightenedTimer < 2.5) && (Math.floor(this.frightenedTimer * 4) % 2 === 0);
            if (this.frightenedTimer <= 0) {
                this.mode = globalWaveMode;
                this.flashWhite = false;
            }
        }

        // Check if ghost should exit house
        if (this.mode === GHOST_MODE.IN_HOUSE) {
            if (dotsEaten >= this.dotTrigger) {
                this.mode = GHOST_MODE.EXITING;
            } else {
                // Bob up and down inside house
                this.y += this.bounceDir * 30 * dt;
                if (this.y < this.bounceLimitTop) {
                    this.y = this.bounceLimitTop;
                    this.bounceDir = 1;
                } else if (this.y > this.bounceLimitBottom) {
                    this.y = this.bounceLimitBottom;
                    this.bounceDir = -1;
                }
                return;
            }
        }

        // Exiting house sequence: move to center x (13.5), then move up through door to y (11.5)
        if (this.mode === GHOST_MODE.EXITING) {
            const centerX = 13.5 * S;
            const exitY = 11.5 * S;
            const exitSpeed = 60 * dt;

            if (Math.abs(this.x - centerX) > 1.0) {
                this.x += Math.sign(centerX - this.x) * exitSpeed;
            } else {
                this.x = centerX;
                if (this.y > exitY) {
                    this.y -= exitSpeed;
                    this.dir = DIR.UP;
                } else {
                    this.y = exitY;
                    this.mode = globalWaveMode;
                    this.dir = DIR.LEFT;
                }
            }
            this.tileX = this.x / S;
            this.tileY = this.y / S;
            return;
        }

        // Adjust speed depending on mode and location
        const inTunnel = maze.isTunnel(Math.floor(this.x / S), Math.floor(this.y / S));
        if (this.mode === GHOST_MODE.EATEN) {
            this.speed = this.baseSpeed * 1.8;
        } else if (inTunnel) {
            this.speed = this.baseSpeed * 0.45;
        } else if (this.mode === GHOST_MODE.FRIGHTENED) {
            this.speed = this.baseSpeed * 0.55;
        } else {
            this.speed = this.baseSpeed;
        }

        // Target calculation based on current state & AI personality
        this.computeTarget(globalWaveMode, pacman, blinky);

        // Check if eaten ghost arrived back at house door
        if (this.mode === GHOST_MODE.EATEN) {
            const doorCenterX = 13.5 * S;
            const doorCenterY = 11.5 * S;
            const houseCenterY = 14.5 * S;

            if (Math.abs(this.x - doorCenterX) < S * 0.4 && Math.abs(this.y - doorCenterY) < S * 0.4) {
                // Enter ghost house to revive
                this.x = doorCenterX;
                this.y += 60 * dt;
                if (this.y >= houseCenterY) {
                    this.y = houseCenterY;
                    this.mode = GHOST_MODE.EXITING;
                }
                return;
            }
        }

        // Tile alignment & navigation logic
        const currentTileC = Math.floor(this.x / S);
        const currentTileR = Math.floor(this.y / S);
        const centerTileX = (currentTileC + 0.5) * S;
        const centerTileY = (currentTileR + 0.5) * S;

        // Move ghost
        const step = this.speed * S * dt;
        let nextX = this.x + this.dir.x * step;
        let nextY = this.y + this.dir.y * step;

        // Check if ghost crossed the tile center this frame
        let passedCenter = false;
        if (this.dir === DIR.LEFT && this.x >= centerTileX && nextX <= centerTileX) passedCenter = true;
        else if (this.dir === DIR.RIGHT && this.x <= centerTileX && nextX >= centerTileX) passedCenter = true;
        else if (this.dir === DIR.UP && this.y >= centerTileY && nextY <= centerTileY) passedCenter = true;
        else if (this.dir === DIR.DOWN && this.y <= centerTileY && nextY >= centerTileY) passedCenter = true;

        if (passedCenter) {
            // Snap to center and make decision for next direction
            this.x = centerTileX;
            this.y = centerTileY;

            this.chooseNextDirection(currentTileC, currentTileR, maze);

            // Re-apply remaining movement in new direction
            nextX = this.x + this.dir.x * step;
            nextY = this.y + this.dir.y * step;
        }

        this.x = nextX;
        this.y = nextY;

        // Tunnel wrapping
        const leftBound = -0.5 * S;
        const rightBound = (MAZE_COLS - 0.5) * S;
        if (this.x < leftBound) {
            this.x = rightBound;
        } else if (this.x > rightBound) {
            this.x = leftBound;
        }

        this.tileX = this.x / S;
        this.tileY = this.y / S;
    }

    computeTarget(globalWaveMode, pacman, blinky) {
        if (this.mode === GHOST_MODE.EATEN) {
            // Target ghost house door
            this.targetX = 13.5;
            this.targetY = 11.5;
            return;
        }

        if (this.mode === GHOST_MODE.FRIGHTENED) {
            // In frightened mode, ghost chooses random turns (no specific target needed)
            return;
        }

        const effectiveMode = (this.mode === GHOST_MODE.SCATTER || this.mode === GHOST_MODE.CHASE) 
            ? globalWaveMode 
            : this.mode;

        if (effectiveMode === GHOST_MODE.SCATTER) {
            this.targetX = this.scatterX;
            this.targetY = this.scatterY;
            return;
        }

        // CHASE Mode - Individual AI personalities!
        switch (this.name) {
            case 'Blinky': // Red: Direct chaser
                this.targetX = pacman.tileX;
                this.targetY = pacman.tileY;
                break;

            case 'Pinky': // Pink: Ambusher (4 tiles ahead)
                this.targetX = pacman.tileX + 4 * pacman.dir.x;
                this.targetY = pacman.tileY + 4 * pacman.dir.y;
                break;

            case 'Inky': { // Cyan: Flanker (vector doubled from Blinky to 2 tiles ahead of Pacman)
                const pivotX = pacman.tileX + 2 * pacman.dir.x;
                const pivotY = pacman.tileY + 2 * pacman.dir.y;
                const bX = blinky ? blinky.tileX : pacman.tileX;
                const bY = blinky ? blinky.tileY : pacman.tileY;
                this.targetX = pivotX + (pivotX - bX);
                this.targetY = pivotY + (pivotY - bY);
                break;
            }

            case 'Clyde': { // Orange: Coward (chases if >= 8 tiles away, retreats to scatter if < 8)
                const distToPacman = Math.hypot(this.tileX - pacman.tileX, this.tileY - pacman.tileY);
                if (distToPacman >= 8) {
                    this.targetX = pacman.tileX;
                    this.targetY = pacman.tileY;
                } else {
                    this.targetX = this.scatterX;
                    this.targetY = this.scatterY;
                }
                break;
            }
        }
    }

    chooseNextDirection(col, row, maze) {
        // Possible candidate directions (arcade priority: UP, LEFT, DOWN, RIGHT)
        const candidates = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT];
        const validMoves = [];

        for (const candidate of candidates) {
            // Cannot immediately reverse 180 degrees at an intersection
            if (candidate.x === -this.dir.x && candidate.y === -this.dir.y) {
                continue;
            }

            const nextC = col + candidate.x;
            const nextR = row + candidate.y;

            const isEaten = this.mode === GHOST_MODE.EATEN;
            const isExiting = this.mode === GHOST_MODE.EXITING;

            if (maze.canGhostMove(nextC, nextR, isEaten, isExiting)) {
                validMoves.push(candidate);
            }
        }

        if (validMoves.length === 0) {
            // Dead-end: must reverse
            this.reverseDirection();
            return;
        }

        if (this.mode === GHOST_MODE.FRIGHTENED) {
            // Choose a random valid direction
            const idx = Math.floor(Math.random() * validMoves.length);
            this.dir = validMoves[idx];
            return;
        }

        // Find candidate move with minimum Euclidean distance to target
        let bestMove = validMoves[0];
        let bestDistSq = Infinity;

        for (const move of validMoves) {
            const nextC = col + move.x;
            const nextR = row + move.y;
            const dx = nextC - this.targetX;
            const dy = nextR - this.targetY;
            const distSq = dx * dx + dy * dy;

            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                bestMove = move;
            }
        }

        this.dir = bestMove;
    }

    draw(ctx) {
        const S = TILE_SIZE;
        const radius = S * 0.65;
        const x = this.x;
        const y = this.y;

        ctx.save();

        if (this.mode === GHOST_MODE.EATEN) {
            // Draw floating eyes only
            this.drawEyes(ctx, x, y, S);
            ctx.restore();
            return;
        }

        // Determine ghost body color
        let bodyColor = this.color;
        if (this.mode === GHOST_MODE.FRIGHTENED) {
            bodyColor = this.flashWhite ? COLORS.FRIGHTENED_WHITE : COLORS.FRIGHTENED_BLUE;
        }

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        // Top dome
        ctx.arc(x, y - 2, radius, Math.PI, 0, false);
        // Right side
        ctx.lineTo(x + radius, y + radius - 2);

        // Wavy skirt / tentacles
        const waveCount = 3;
        const waveWidth = (radius * 2) / waveCount;
        const skirtBottom = y + radius;
        const waveIndent = this.animFrame === 0 ? 3 : -3;

        for (let i = waveCount - 1; i >= 0; i--) {
            const startX = x - radius + (i + 1) * waveWidth;
            const endX = x - radius + i * waveWidth;
            const midX = (startX + endX) / 2;
            const peakY = skirtBottom - (i % 2 === 0 ? waveIndent : -waveIndent);
            ctx.quadraticCurveTo(midX, peakY, endX, skirtBottom);
        }

        // Left side
        ctx.lineTo(x - radius, y - 2);
        ctx.closePath();
        ctx.fill();

        // Draw face
        if (this.mode === GHOST_MODE.FRIGHTENED) {
            // Frightened face (small eyes + squiggly mouth)
            const eyeColor = this.flashWhite ? '#ff0000' : '#ffffff';
            ctx.fillStyle = eyeColor;

            // Small eyes
            ctx.fillRect(x - radius * 0.45, y - 4, 3, 3);
            ctx.fillRect(x + radius * 0.25, y - 4, 3, 3);

            // Squiggly mouth
            ctx.strokeStyle = eyeColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 6, y + 4);
            ctx.lineTo(x - 3, y + 2);
            ctx.lineTo(x, y + 4);
            ctx.lineTo(x + 3, y + 2);
            ctx.lineTo(x + 6, y + 4);
            ctx.stroke();
        } else {
            // Normal expressive eyes looking in direction of motion
            this.drawEyes(ctx, x, y, S);
        }

        ctx.restore();
    }

    drawEyes(ctx, x, y, S) {
        const eyeRadiusX = S * 0.22;
        const eyeRadiusY = S * 0.28;
        const eyeOffsetX = S * 0.26;
        const eyeOffsetY = -2;

        const pupilShiftX = (this.dir ? this.dir.x : 0) * 2.5;
        const pupilShiftY = (this.dir ? this.dir.y : 0) * 2.5;

        // White of left and right eyes
        ctx.fillStyle = COLORS.EYE_WHITE;
        ctx.beginPath();
        ctx.ellipse(x - eyeOffsetX, y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
        ctx.ellipse(x + eyeOffsetX, y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Blue pupils
        ctx.fillStyle = COLORS.EYE_PUPIL;
        ctx.beginPath();
        ctx.arc(x - eyeOffsetX + pupilShiftX, y + eyeOffsetY + pupilShiftY, 2.2, 0, Math.PI * 2);
        ctx.arc(x + eyeOffsetX + pupilShiftX, y + eyeOffsetY + pupilShiftY, 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
}
