/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI AUDIO SYNTHESIZER
   Pure Web Audio API procedural sound system (zero external assets needed)
   ═══════════════════════════════════════════════════════════════════════════════ */

const SoundFX = (() => {
    let audioCtx = null;
    let isMuted = false;

    // Load persisted mute preference
    try {
        isMuted = localStorage.getItem('guti_muted') === 'true';
    } catch (e) {
        isMuted = false;
    }

    function getContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function isSoundMuted() {
        return isMuted;
    }

    function toggleMute() {
        isMuted = !isMuted;
        try {
            localStorage.setItem('guti_muted', isMuted);
        } catch (e) {}
        return isMuted;
    }

    // Play piece selection pop
    function playSelect() {
        if (isMuted) return;
        const ctx = getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.09);
    }

    // Play normal piece sliding move (satisfying wooden click)
    function playMove() {
        if (isMuted) return;
        const ctx = getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }

    // Play capture jump (resonant strike + high snap)
    function playCapture() {
        if (isMuted) return;
        const ctx = getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Sub thud
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(160, now);
        osc1.frequency.exponentialRampToValueAtTime(45, now + 0.22);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.26);

        // Snap crack
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(650, now);
        osc2.frequency.exponentialRampToValueAtTime(140, now + 0.14);
        gain2.gain.setValueAtTime(0.25, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.16);
    }

    // Play chain jump combo chime
    function playChain(comboStep = 1) {
        if (isMuted) return;
        const ctx = getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const baseFreq = 330 * Math.pow(1.22, comboStep);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    // Play invalid move / blocked thud
    function playError() {
        if (isMuted) return;
        const ctx = getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.setValueAtTime(95, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Play celebratory victory fanfare
    function playVictory() {
        if (isMuted) return;
        const ctx = getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C-E-G-C-E-G arpeggio

        notes.forEach((freq, idx) => {
            const start = now + idx * 0.11;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.18, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.6);
        });
    }

    return {
        isSoundMuted,
        toggleMute,
        playSelect,
        playMove,
        playCapture,
        playChain,
        playError,
        playVictory
    };
})();
