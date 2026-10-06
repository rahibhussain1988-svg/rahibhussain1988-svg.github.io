// Web Audio API Hospital/Clinic Chime & Vocal Announcement Utility

class ClinicAudioService {
  constructor() {
    this.audioCtx = null;
    this.speechEnabled = true;
    this.chimeEnabled = true;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Soft hospital two-tone announcement chime
  playHospitalChime() {
    this.playChime();
  }

  playChime() {
    if (!this.chimeEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Bell 1: F5 (698.46 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.9);

      // Bell 2: A5 (880.00 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.22);
      gain2.gain.setValueAtTime(0.3, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 1.2);

      // Bell 3: C6 (1046.50 Hz) - soft harmonic shimmer
      const osc3 = this.audioCtx.createOscillator();
      const gain3 = this.audioCtx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1046.50, now + 0.44);
      gain3.gain.setValueAtTime(0.2, now + 0.44);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc3.connect(gain3);
      gain3.connect(this.audioCtx.destination);
      osc3.start(now + 0.44);
      osc3.stop(now + 1.6);
    } catch (err) {
      console.warn('Audio chime playback failed:', err);
    }
  }

  // Vocal Announcement via Web Speech API
  announcePatient(tokenNumber, cabinNumber, doctorName) {
    this.playChime();

    if (!this.speechEnabled || !('speechSynthesis' in window)) return;

    setTimeout(() => {
      try {
        window.speechSynthesis.cancel();

        const spelledToken = tokenNumber.split('').join(' ');
        const text = `Attention please. Patient Token ${spelledToken}. Please proceed to Cabin ${cabinNumber}, with ${doctorName}.`;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.90; // Gentle, clear clinical pacing
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Voice announcement failed:', err);
      }
    }, 950);
  }

  // High-Priority Emergency Chime (Dual Rapid Tone)
  playEmergencyChime() {
    if (!this.chimeEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Pulse 1: 880 Hz (A5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Pulse 2: 1174.66 Hz (D6)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);

      // Pulse 3: 880 Hz confirmation
      const osc3 = this.audioCtx.createOscillator();
      const gain3 = this.audioCtx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(880, now + 0.35);
      gain3.gain.setValueAtTime(0.35, now + 0.35);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc3.connect(gain3);
      gain3.connect(this.audioCtx.destination);
      osc3.start(now + 0.35);
      osc3.stop(now + 0.8);
    } catch (err) {
      console.warn('Emergency chime playback failed:', err);
    }
  }

  // Vocal Emergency Announcement
  announceEmergency(tokenNumber, cabinNumber = 1, procedureName = 'Minor Emergency Procedure') {
    this.playEmergencyChime();

    if (!this.speechEnabled || !('speechSynthesis' in window)) return;

    setTimeout(() => {
      try {
        window.speechSynthesis.cancel();
        const spelledToken = tokenNumber.split('').join(' ');
        const text = `Emergency Priority Alert. Patient Token ${spelledToken}. Please proceed immediately to Cabin ${cabinNumber} for ${procedureName}.`;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Voice emergency announcement failed:', err);
      }
    }, 700);
  }

  triggerHaptic(ms = 18) {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  }
}

export const clinicAudio = new ClinicAudioService();
