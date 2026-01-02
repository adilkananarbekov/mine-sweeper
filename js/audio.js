export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.enabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    play(type) {
        if (!this.ctx || !this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        switch (type) {
            case 'click':
                this._playTone(800, 'sine', 0.05, 0.05);
                break;
            case 'flag':
                this._playTone(600, 'square', 0.05, 0.1);
                break;
            case 'reveal':
                // Softer click
                this._playTone(400, 'triangle', 0.05, 0.05);
                break;
            case 'win':
                this._playWinMelody();
                break;
            case 'lose':
                this._playLoseSound();
                break;
        }
    }

    _playTone(freq, type, attack, decay) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + attack + decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + attack + decay);
    }

    _playWinMelody() {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             osc.type = 'sine';
             osc.frequency.value = freq;

             gain.gain.setValueAtTime(0, now + i*0.1);
             gain.gain.linearRampToValueAtTime(0.1, now + i*0.1 + 0.05);
             gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.3);

             osc.connect(gain);
             gain.connect(this.ctx.destination);
             osc.start(now + i*0.1);
             osc.stop(now + i*0.1 + 0.3);
        });
    }

    _playLoseSound() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }
}
