import { AudioAnalysisData } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private sourceNode: AudioNode | null = null;
  private isRunning: boolean = false;
  private beatCutoff: number = 0;
  private beatDecayRate: number = 0.96;
  private synthInterval: number | null = null;
  private micStream: MediaStream | null = null;

  private currentSource: 'synth' | 'mic' | 'file' = 'synth';

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  public async startSynth(style: 'synthwave' | 'chillhop' | 'cosmic' = 'synthwave') {
    this.init();
    if (!this.ctx || !this.analyser) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.stopCurrent();
    this.currentSource = 'synth';
    this.isRunning = true;

    // Master gain for synthesizer connected to destination and analyser
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    masterGain.connect(this.analyser);
    masterGain.connect(this.ctx.destination);

    let step = 0;
    const bpm = style === 'synthwave' ? 120 : style === 'chillhop' ? 84 : 65;
    const stepTimeMs = (60 / bpm / 4) * 1000;

    // Chord progressions in semi-tones
    const synthwaveChords = [
      [57, 60, 64], // Am
      [53, 57, 60], // F
      [55, 59, 62], // C
      [55, 58, 62], // G
    ];

    const chillhopChords = [
      [60, 63, 67, 70], // Cm7
      [58, 62, 65, 68], // Bb7
      [56, 60, 63, 66], // Ab7
      [55, 58, 62, 65], // G7
    ];

    const cosmicChords = [
      [48, 55, 62, 67], // C sus2 open
      [44, 51, 58, 63], // Ab maj7
      [46, 53, 60, 65], // Bb add9
      [41, 48, 55, 60], // F sus2
    ];

    const chords = style === 'synthwave' ? synthwaveChords : style === 'chillhop' ? chillhopChords : cosmicChords;

    const playKick = (time: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);
      gain.gain.setValueAtTime(0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.24);
    };

    const playSnareOrHihat = (time: number, isSnare: boolean) => {
      if (!this.ctx) return;
      // Synthesize noise burst for percussion
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = isSnare ? 'bandpass' : 'highpass';
      filter.frequency.value = isSnare ? 1200 : 7000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isSnare ? 0.35 : 0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + (isSnare ? 0.12 : 0.05));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
      noise.stop(time + (isSnare ? 0.13 : 0.06));
    };

    const playNote = (midi: number, time: number, duration: number, type: OscillatorType = 'sawtooth') => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(style === 'synthwave' ? 2400 : 1200, time);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    };

    this.synthInterval = window.setInterval(() => {
      if (!this.ctx || !this.isRunning) return;
      const now = this.ctx.currentTime + 0.05;

      const chordIndex = Math.floor(step / 16) % chords.length;
      const currentChord = chords[chordIndex];

      // Kick drum on 1 and 3 (every 8 steps) or syncopated
      if (step % 8 === 0 || (style === 'synthwave' && step % 16 === 10)) {
        playKick(now);
      }

      // Snare on 2 and 4 (steps 4 and 12)
      if (step % 8 === 4) {
        playSnareOrHihat(now, true);
      }

      // Hi-hats
      if (step % 2 === 0) {
        playSnareOrHihat(now, false);
      }

      // Bass note
      if (step % 4 === 0) {
        const rootMidi = currentChord[0] - 24;
        playNote(rootMidi, now, (stepTimeMs / 1000) * 3, 'triangle');
      }

      // Arpeggios / Pad
      if (step % 2 === 0) {
        const noteIndex = (step / 2) % currentChord.length;
        const note = currentChord[noteIndex] + (style === 'synthwave' ? 12 : 0);
        playNote(note, now, (stepTimeMs / 1000) * 2, style === 'cosmic' ? 'sine' : 'sawtooth');
      }

      step = (step + 1) % 64;
    }, stepTimeMs);
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx || !this.analyser) return false;

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.stopCurrent();
      this.currentSource = 'mic';

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      const micSource = this.ctx.createMediaStreamSource(stream);
      micSource.connect(this.analyser);
      this.sourceNode = micSource;
      this.isRunning = true;
      return true;
    } catch {
      return false;
    }
  }

  public async loadAudioFile(file: File): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx || !this.analyser) return false;

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.stopCurrent();
      this.currentSource = 'file';

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      const bufferSource = this.ctx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.loop = true;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.5;

      bufferSource.connect(gain);
      gain.connect(this.analyser);
      gain.connect(this.ctx.destination);

      bufferSource.start(0);
      this.sourceNode = bufferSource;
      this.isRunning = true;
      return true;
    } catch {
      return false;
    }
  }

  public stopCurrent() {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.sourceNode) {
      try {
        if ('stop' in this.sourceNode && typeof (this.sourceNode as AudioScheduledSourceNode).stop === 'function') {
          (this.sourceNode as AudioScheduledSourceNode).stop();
        }
        this.sourceNode.disconnect();
      } catch {
        // Ignored
      }
      this.sourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.isRunning = false;
  }

  public getAnalysis(sensitivity: number = 1.0): AudioAnalysisData {
    if (!this.analyser || !this.dataArray || !this.isRunning) {
      return {
        bass: 0,
        mid: 0,
        treble: 0,
        overallVolume: 0,
        frequencyData: new Uint8Array(256),
        isBeat: false,
      };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const binCount = this.analyser.frequencyBinCount;
    // Bins correspond to ~0 to ~22050 Hz (at 44.1kHz rate, bin resolution ~86Hz)
    const bassEnd = Math.floor(binCount * 0.08); // 0 to ~350Hz
    const midEnd = Math.floor(binCount * 0.4); // 350Hz to ~3500Hz
    const trebleEnd = binCount;

    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) {
      bassSum += this.dataArray[i];
    }
    const bassAvg = bassEnd > 0 ? (bassSum / bassEnd / 255) * sensitivity : 0;

    let midSum = 0;
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += this.dataArray[i];
    }
    const midAvg = midEnd > bassEnd ? (midSum / (midEnd - bassEnd) / 255) * sensitivity : 0;

    let trebleSum = 0;
    for (let i = midEnd; i < trebleEnd; i++) {
      trebleSum += this.dataArray[i];
    }
    const trebleAvg = trebleEnd > midEnd ? (trebleSum / (trebleEnd - midEnd) / 255) * sensitivity : 0;

    const overallVolume = Math.min((bassAvg * 0.5 + midAvg * 0.3 + trebleAvg * 0.2), 1.0);

    // Simple adaptive threshold beat detection
    let isBeat = false;
    if (bassAvg > this.beatCutoff && bassAvg > 0.35) {
      isBeat = true;
      this.beatCutoff = bassAvg * 1.15;
    } else {
      this.beatCutoff *= this.beatDecayRate;
      this.beatCutoff = Math.max(this.beatCutoff, 0.2);
    }

    return {
      bass: Math.min(bassAvg, 1.0),
      mid: Math.min(midAvg, 1.0),
      treble: Math.min(trebleAvg, 1.0),
      overallVolume,
      frequencyData: this.dataArray,
      isBeat,
    };
  }

  public getActiveSource() {
    return this.currentSource;
  }

  public isAudioActive() {
    return this.isRunning;
  }
}

export const globalAudioEngine = new AudioEngine();
