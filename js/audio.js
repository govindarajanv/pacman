/**
 * PAC-MAN Retro Web Audio Synthesizer
 * 100% synthesized 8-bit sound effects - zero external audio assets required!
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = localStorage.getItem('pacman_muted') === 'true';
        this.chompState = 0;
        this.sirenOsc = null;
        this.sirenGain = null;
        this.sirenMod = null;
        this.sirenModGain = null;
        this.currentSirenType = null;
        this.sirenTimer = null;
    }

    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('pacman_muted', this.isMuted ? 'true' : 'false');
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    setMuted(muted) {
        this.isMuted = !!muted;
        localStorage.setItem('pacman_muted', this.isMuted ? 'true' : 'false');
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
        }
    }

    /**
     * Play a single synth tone
     */
    playTone(freq, type = 'square', duration = 0.1, startTime = null, volume = 0.5) {
        if (!this.ctx || this.isMuted) return;
        const now = startTime || this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Classic Start Game Jingle
     */
    playIntro() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        // Note frequencies (Hz) & durations
        const B4 = 493.88, B5 = 987.77, FS5 = 739.99, DS5 = 622.25;
        const C5 = 523.25, C6 = 1046.50, G5 = 783.99, E5 = 659.25;
        const F5 = 698.46;

        const melody = [
            { f: B4, d: 0.14 }, { f: B5, d: 0.14 }, { f: FS5, d: 0.14 }, { f: DS5, d: 0.14 },
            { f: B5, d: 0.08 }, { f: FS5, d: 0.18 }, { f: DS5, d: 0.22 },
            { f: C5, d: 0.14 }, { f: C6, d: 0.14 }, { f: G5, d: 0.14 }, { f: E5, d: 0.14 },
            { f: C6, d: 0.08 }, { f: G5, d: 0.18 }, { f: E5, d: 0.22 },
            { f: B4, d: 0.14 }, { f: B5, d: 0.14 }, { f: FS5, d: 0.14 }, { f: DS5, d: 0.14 },
            { f: B5, d: 0.08 }, { f: FS5, d: 0.18 }, { f: DS5, d: 0.22 },
            { f: DS5, d: 0.07 }, { f: E5, d: 0.07 }, { f: F5, d: 0.07 },
            { f: F5, d: 0.07 }, { f: FS5, d: 0.07 }, { f: G5, d: 0.07 },
            { f: G5, d: 0.07 }, { f: G5, d: 0.07 }, { f: B5, d: 0.35 }
        ];

        let time = this.ctx.currentTime + 0.05;
        for (const note of melody) {
            this.playTone(note.f, 'triangle', note.d * 0.9, time, 0.4);
            // Double with quiet square for 8-bit richness
            this.playTone(note.f, 'square', note.d * 0.85, time, 0.15);
            time += note.d;
        }
    }

    /**
     * Waka-waka dot munch sound
     */
    playChomp() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const startFreq = this.chompState === 0 ? 520 : 380;
        const endFreq   = this.chompState === 0 ? 260 : 190;
        this.chompState = 1 - this.chompState;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Eating fruit bonus sound
     */
    playFruit() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [440, 554, 659, 880];
        notes.forEach((f, i) => {
            this.playTone(f, 'sine', 0.09, now + i * 0.07, 0.4);
            this.playTone(f * 2, 'triangle', 0.05, now + i * 0.07, 0.2);
        });
    }

    /**
     * Eating a ghost sound (arpeggiated rapid chromatic ascent)
     */
    playEatGhost() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const steps = 14;
        for (let i = 0; i < steps; i++) {
            const freq = 300 + Math.pow(i, 2.3) * 12;
            this.playTone(freq, 'square', 0.035, now + i * 0.022, 0.35);
        }
    }

    /**
     * Pac-Man death sound (descending chromatic pitch fall with concluding pop)
     */
    playDeath() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        this.stopSiren();
        const now = this.ctx.currentTime;
        const steps = 12;
        for (let i = 0; i < steps; i++) {
            const freq = 900 - i * 55;
            this.playTone(freq, 'sawtooth', 0.08, now + i * 0.07, 0.35);
            this.playTone(freq * 0.5, 'triangle', 0.08, now + i * 0.07, 0.2);
        }

        // Two concluding chirps
        const popTime = now + steps * 0.07;
        this.playTone(180, 'square', 0.06, popTime, 0.4);
        this.playTone(120, 'square', 0.12, popTime + 0.1, 0.5);
    }

    /**
     * Level cleared celebration fanfare
     */
    playLevelClear() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        this.stopSiren();
        const now = this.ctx.currentTime;
        const notes = [
            { f: 523.25, d: 0.1 }, { f: 659.25, d: 0.1 }, { f: 783.99, d: 0.1 },
            { f: 1046.50, d: 0.2 }, { f: 783.99, d: 0.1 }, { f: 1046.50, d: 0.35 }
        ];
        let t = now;
        notes.forEach(n => {
            this.playTone(n.f, 'triangle', n.d * 0.9, t, 0.4);
            this.playTone(n.f, 'square', n.d * 0.8, t, 0.15);
            t += n.d;
        });
    }

    /**
     * Extra Life Award Fanfare
     */
    playExtraLife() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [330, 392, 659, 523, 587, 784];
        notes.forEach((f, i) => {
            this.playTone(f, 'sine', 0.08, now + i * 0.07, 0.35);
        });
    }

    /**
     * Background Ambient Siren
     * type: 'normal' | 'frightened' | 'eyes'
     */
    setSiren(type, speedFactor = 1.0) {
        if (!this.ctx || this.isMuted) {
            this.stopSiren();
            return;
        }

        if (this.currentSirenType === type && this.sirenOsc) {
            return; // Already playing this siren mode
        }

        this.stopSiren();
        this.currentSirenType = type;

        try {
            const now = this.ctx.currentTime;
            this.sirenOsc = this.ctx.createOscillator();
            this.sirenGain = this.ctx.createGain();

            if (type === 'frightened') {
                // Warbling fast low-frequency sound
                this.sirenOsc.type = 'sawtooth';
                this.sirenOsc.frequency.setValueAtTime(120, now);

                this.sirenMod = this.ctx.createOscillator();
                this.sirenMod.frequency.setValueAtTime(7, now);
                this.sirenModGain = this.ctx.createGain();
                this.sirenModGain.gain.setValueAtTime(45, now);

                this.sirenMod.connect(this.sirenModGain);
                this.sirenModGain.connect(this.sirenOsc.frequency);
                this.sirenMod.start(now);

                this.sirenGain.gain.setValueAtTime(0.08, now);
            } else if (type === 'eyes') {
                // High-pitched urgent pulse
                this.sirenOsc.type = 'square';
                this.sirenOsc.frequency.setValueAtTime(750, now);

                this.sirenMod = this.ctx.createOscillator();
                this.sirenMod.frequency.setValueAtTime(12, now);
                this.sirenModGain = this.ctx.createGain();
                this.sirenModGain.gain.setValueAtTime(250, now);

                this.sirenMod.connect(this.sirenModGain);
                this.sirenModGain.connect(this.sirenOsc.frequency);
                this.sirenMod.start(now);

                this.sirenGain.gain.setValueAtTime(0.08, now);
            } else {
                // Classic siren sweep (wailing triangle)
                const baseFreq = 160 + (speedFactor - 1.0) * 80;
                this.sirenOsc.type = 'triangle';
                this.sirenOsc.frequency.setValueAtTime(baseFreq, now);

                this.sirenMod = this.ctx.createOscillator();
                this.sirenMod.frequency.setValueAtTime(2.2 * speedFactor, now);
                this.sirenModGain = this.ctx.createGain();
                this.sirenModGain.gain.setValueAtTime(40, now);

                this.sirenMod.connect(this.sirenModGain);
                this.sirenModGain.connect(this.sirenOsc.frequency);
                this.sirenMod.start(now);

                this.sirenGain.gain.setValueAtTime(0.05, now);
            }

            this.sirenOsc.connect(this.sirenGain);
            this.sirenGain.connect(this.masterGain);
            this.sirenOsc.start(now);
        } catch (e) {
            console.warn('Error starting siren', e);
        }
    }

    stopSiren() {
        if (this.sirenOsc) {
            try {
                this.sirenOsc.stop();
                this.sirenOsc.disconnect();
            } catch (e) {}
            this.sirenOsc = null;
        }
        if (this.sirenMod) {
            try {
                this.sirenMod.stop();
                this.sirenMod.disconnect();
            } catch (e) {}
            this.sirenMod = null;
        }
        this.currentSirenType = null;
    }
}

export const soundEngine = new SoundEngine();
