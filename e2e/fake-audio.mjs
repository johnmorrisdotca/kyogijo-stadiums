// A stand-in for the page's AudioContext, put in before the page's own scripts run (`page.addInitScript(fakeAudio)`): no sound is ever made in a test. It counts the contexts made, the
// resumes and suspends, the recordings decoded and the sources started and stopped, and keeps the frequencies of the oscillators, in `window.__audio`.
export function fakeAudio() {
  const audio = { contexts: 0, resumes: 0, suspends: 0, decodes: 0, state: "none", sources: 0, running: 0, tones: [], cues: [] };
  window.__audio = audio;
  const param = (value) => ({ value, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = (extra = {}) => ({ connect() {}, disconnect() {}, ...extra });
  class FakeAudioContext {
    constructor() {
      audio.contexts++;
      audio.state = "suspended";
      this.sampleRate = 8000;
      this.destination = node();
      this.started = window.performance.now();
    }
    get state() {
      return audio.state;
    }
    get currentTime() {
      return audio.state === "running" ? (window.performance.now() - this.started) / 1000 : 0;
    }
    resume() {
      audio.resumes++;
      audio.state = "running";
      return Promise.resolve();
    }
    suspend() {
      audio.suspends++;
      audio.state = "suspended";
      return Promise.resolve();
    }
    createGain() {
      return node({ gain: param(1) });
    }
    createBiquadFilter() {
      return node({ type: "lowpass", frequency: param(350), Q: param(1) });
    }
    createConvolver() {
      return node({ buffer: null });
    }
    createOscillator() {
      const osc = node({ type: "sine", frequency: param(440), start() { audio.tones.push(osc.frequency.value); }, stop() {} });
      return osc;
    }
    createBufferSource() {
      let on = false;
      return node({
        buffer: null,
        loop: false,
        start() {
          audio.sources++;
          if (!on) audio.running++;
          on = true;
        },
        stop() {
          if (on) audio.running--;
          on = false;
        },
      });
    }
    createBuffer(channels, length, rate) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate: rate, duration: length / rate, getChannelData: (i) => data[i] };
    }
    decodeAudioData(bytes) {
      audio.decodes++;
      const data = new Float32Array(Math.max(1, bytes.byteLength >> 4));
      return Promise.resolve({ numberOfChannels: 1, length: data.length, sampleRate: 8000, duration: data.length / 8000, getChannelData: () => data });
    }
  }
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
}
