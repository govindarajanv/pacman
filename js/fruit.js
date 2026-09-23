/**
 * PAC-MAN Fruit Bonus System
 */

import { TILE_SIZE, FRUITS } from './constants.js';

export class Fruit {
    constructor() {
        this.x = 13.5 * TILE_SIZE;
        this.y = 17.5 * TILE_SIZE;
        this.active = false;
        this.timer = 0;
        this.duration = 10.0; // 10 seconds on screen
        this.currentFruit = FRUITS[0];
        this.firstSpawned = false;
        this.secondSpawned = false;
        this.scorePopup = null; // { text, x, y, timer }
    }

    resetForLevel(level) {
        this.active = false;
        this.firstSpawned = false;
        this.secondSpawned = false;
        this.scorePopup = null;

        // Determine fruit for current level
        let idx = Math.min(level - 1, FRUITS.length - 1);
        if (level >= 13) idx = 7; // Key
        else if (level >= 11) idx = 6; // Bell
        else if (level >= 9) idx = 5; // Galaxian
        else if (level >= 7) idx = 4; // Melon
        else if (level >= 5) idx = 3; // Apple
        else if (level >= 3) idx = 2; // Orange
        else if (level === 2) idx = 1; // Strawberry
        else idx = 0; // Cherry

        this.currentFruit = FRUITS[idx];
    }

    checkSpawn(dotsEaten) {
        if (!this.firstSpawned && dotsEaten >= 70) {
            this.spawn();
            this.firstSpawned = true;
        } else if (!this.secondSpawned && dotsEaten >= 170) {
            this.spawn();
            this.secondSpawned = true;
        }
    }

    spawn() {
        this.active = true;
        this.timer = this.duration;
    }

    update(dt) {
        if (this.active) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.active = false;
            }
        }

        if (this.scorePopup) {
            this.scorePopup.timer -= dt;
            this.scorePopup.y -= 15 * dt; // float upwards
            if (this.scorePopup.timer <= 0) {
                this.scorePopup = null;
            }
        }
    }

    checkCollision(pacman) {
        if (!this.active) return null;

        const dist = Math.hypot(pacman.x - this.x, pacman.y - this.y);
        if (dist < TILE_SIZE * 0.75) {
            this.active = false;
            const pts = this.currentFruit.points;
            this.scorePopup = {
                text: `${pts}`,
                x: this.x,
                y: this.y,
                timer: 1.5
            };
            return pts;
        }
        return null;
    }

    draw(ctx) {
        if (this.active) {
            this.drawFruitIcon(ctx, this.x, this.y, this.currentFruit);
        }

        // Floating score popup when fruit is eaten
        if (this.scorePopup) {
            ctx.save();
            ctx.fillStyle = '#ffb8ff';
            ctx.font = 'bold 12px "Press Start 2P", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.scorePopup.text, this.scorePopup.x, this.scorePopup.y);
            ctx.restore();
        }
    }

    drawFruitIcon(ctx, x, y, fruit, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const name = fruit.name;

        if (name === 'Cherry') {
            // Twin Cherries
            ctx.fillStyle = fruit.color;
            ctx.beginPath();
            ctx.arc(-4, 4, 4, 0, Math.PI * 2);
            ctx.arc(4, 4, 4, 0, Math.PI * 2);
            ctx.fill();

            // Stems
            ctx.strokeStyle = fruit.stemColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-4, 2);
            ctx.quadraticCurveTo(-2, -6, 2, -6);
            ctx.moveTo(4, 2);
            ctx.quadraticCurveTo(2, -6, 2, -6);
            ctx.stroke();
        } else if (name === 'Strawberry') {
            ctx.fillStyle = fruit.color;
            ctx.beginPath();
            ctx.moveTo(0, 7);
            ctx.lineTo(-6, -2);
            ctx.lineTo(-4, -6);
            ctx.lineTo(4, -6);
            ctx.lineTo(6, -2);
            ctx.closePath();
            ctx.fill();

            // Stem / Leaves
            ctx.fillStyle = fruit.stemColor;
            ctx.beginPath();
            ctx.arc(0, -6, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (name === 'Orange' || name === 'Apple') {
            ctx.fillStyle = fruit.color;
            ctx.beginPath();
            ctx.arc(0, 2, 6, 0, Math.PI * 2);
            ctx.fill();

            // Stem
            ctx.strokeStyle = fruit.stemColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(2, -7);
            ctx.stroke();
        } else if (name === 'Melon') {
            ctx.fillStyle = fruit.color;
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();

            // Stem
            ctx.strokeStyle = fruit.stemColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(0, -9);
            ctx.stroke();
        } else if (name === 'Galaxian') {
            // Retro Galaxian Flagship shape
            ctx.fillStyle = '#ffea00';
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(6, 6);
            ctx.lineTo(0, 2);
            ctx.lineTo(-6, 6);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#3388ff';
            ctx.fillRect(-2, -2, 4, 4);
        } else if (name === 'Bell') {
            ctx.fillStyle = fruit.color;
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(6, 4);
            ctx.lineTo(-6, 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-2, 5, 4, 2);
        } else {
            // Key
            ctx.fillStyle = fruit.color;
            ctx.beginPath();
            ctx.arc(0, -4, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillRect(-1.5, 0, 3, 9);
            ctx.fillRect(1.5, 4, 3, 2);
            ctx.fillRect(1.5, 7, 3, 2);
        }

        ctx.restore();
    }
}
