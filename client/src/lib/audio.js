let audioCtx = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playTone = (frequency, duration, type = 'sine') => {
  initAudio();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};

export const sfx = {
  bgm: () => {
    // Dummy BGM function to prevent crashes
    console.log("BGM started (placeholder)");
  },
  amazing: () => {
    playTone(880, 0.1, 'square');
    setTimeout(() => playTone(1108.73, 0.1, 'square'), 100);
    setTimeout(() => playTone(1318.51, 0.2, 'square'), 200);
  },
  great: () => {
    playTone(523.25, 0.1, 'sine');
    setTimeout(() => playTone(659.25, 0.2, 'sine'), 100);
  },
  solid: () => {
    playTone(440, 0.2, 'triangle');
  },
  good: () => {
    playTone(349.23, 0.2, 'triangle');
  },
  keep_going: () => {
    playTone(261.63, 0.3, 'sine');
  },
  dont_give_up: () => {
    playTone(196, 0.4, 'sine');
  },
  skip: () => {
    playTone(440, 0.1, 'sawtooth');
    setTimeout(() => playTone(349.23, 0.1, 'sawtooth'), 100);
    setTimeout(() => playTone(261.63, 0.2, 'sawtooth'), 200);
  }
};
