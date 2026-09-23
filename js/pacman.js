/**
 * PAC-MAN Character Entity
 */

import { TILE_SIZE, MAZE_COLS, DIR, COLORS } from './constants.js';

export class Pacman {
    constructor() {
        this.reset();
        this.lives = 3;
        this.extraLifeAwarded = false;
    }

    reset() {
        // Classic Pacman start position: Row 23, centered between Col 13 and 14
        this.tileX = 13.5;
        this.tileY = 23;
        this.x = this.tileX * TILE_SIZE;
        this.y = (this.tileY + 0.5) * TILE_SIZE;
        this.dir = DIR.LEFT;
        this.nextDir = DIR.LEFT;
        this.speed = 10.5; // tiles per second base speed
        this.mouthAngle = 0.2;
        this.mouthDir = 1;
        this.mouthSpeed = 6;
        this.isMoving = false;
        this.deathProgress = 0; // 0 to 1 during death animation
    }

    setNextDirection(direction) {
        if (!direction || direction === DIR.NONE) return;

        // If reversing direction, change immediately
        if (this.dir && direction.x === -this.dir.x && direction.y === -this.dir.y) {
            this.dir = direction;
            this.nextDir = direction;
            return;
        }

        this.nextDir = direction;
    }

    update(dt, maze) {
        const S = TILE_SIZE;
        const currentTileC = Math.floor(this.x / S);
        const currentTileR = Math.floor(this.y / S);

        // Center of current tile
        const centerTileX = (currentTileC + 0.5) * S;
        const centerTileY = (currentTileR + 0.5) * S;

        // Try to take buffered next direction
        if (this.nextDir !== this.dir && this.nextDir !== DIR.NONE) {
            const nextTileC = currentTileC + this.nextDir.x;
            const nextTileR = currentTileR + this.nextDir.y;

            if (maze.canPacmanMove(nextTileC, nextTileR)) {
                // Check if aligned enough with tile center to turn corner
                const distToCenter = this.nextDir.x !== 0 
                    ? Math.abs(this.y - centerTileY) 
                    : Math.abs(this.x - centerTileX);

                if (distToCenter <= S * 0.45) {
                    // Snap perpendicular axis to center for clean turning
                    if (this.nextDir.x !== 0) {
                        this.y = centerTileY;
                    } else {
                        this.x = centerTileX;
                    }
                    this.dir = this.nextDir;
                }
            }
        }

        // Move in current direction if path is clear
        let moved = false;
        if (this.dir !== DIR.NONE) {
            const targetTileC = currentTileC + this.dir.x;
            const targetTileR = currentTileR + this.dir.y;
            const canMoveForward = maze.canPacmanMove(targetTileC, targetTileR);

            const step = this.speed * S * dt;

            if (canMoveForward) {
                this.x += this.dir.x * step;
                this.y += this.dir.y * step;
                moved = true;
            } else {
                // Heading into wall: allow moving up to the center of current tile
                if (this.dir.x > 0) {
                    if (this.x < centerTileX) {
                        this.x = Math.min(centerTileX, this.x + step);
                        moved = true;
                    }
                } else if (this.dir.x < 0) {
                    if (this.x > centerTileX) {
                        this.x = Math.max(centerTileX, this.x - step);
                        moved = true;
                    }
                } else if (this.dir.y > 0) {
                    if (this.y < centerTileY) {
                        this.y = Math.min(centerTileY, this.y + step);
                        moved = true;
                    }
                } else if (this.dir.y < 0) {
                    if (this.y > centerTileY) {
                        this.y = Math.max(centerTileY, this.y - step);
                        moved = true;
                    }
                }
            }
        }

        this.isMoving = moved;

        // Tunnel wrapping
        const leftBound = -0.5 * S;
        const rightBound = (MAZE_COLS - 0.5) * S;
        if (this.x < leftBound) {
            this.x = rightBound;
        } else if (this.x > rightBound) {
            this.x = leftBound;
        }

        // Update tile position
        this.tileX = this.x / S;
        this.tileY = this.y / S;

        // Animate mouth
        if (this.isMoving) {
            this.mouthAngle += this.mouthDir * this.mouthSpeed * dt;
            if (this.mouthAngle >= 0.32) {
                this.mouthAngle = 0.32;
                this.mouthDir = -1;
            } else if (this.mouthAngle <= 0.02) {
                this.mouthAngle = 0.02;
                this.mouthDir = 1;
            }
        }
    }

    updateDeath(dt) {
        this.deathProgress = Math.min(1.0, this.deathProgress + dt * 0.7);
    }

    draw(ctx) {
        const radius = TILE_SIZE * 0.65;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.deathProgress > 0) {
            // Death animation: Pac-man opens mouth until it folds into itself
            const startAngle = Math.PI * 1.5 - (1 - this.deathProgress) * Math.PI;
            const endAngle = Math.PI * 1.5 + (1 - this.deathProgress) * Math.PI;

            if (this.deathProgress < 0.95) {
                ctx.fillStyle = COLORS.PACMAN;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, radius * (1 - this.deathProgress * 0.25), startAngle, endAngle);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            // Normal living Pac-Man
            const angle = this.dir.angle || 0;
            ctx.rotate(angle);

            ctx.fillStyle = COLORS.PACMAN;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, this.mouthAngle * Math.PI, (2 - this.mouthAngle) * Math.PI);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
