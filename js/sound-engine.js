(function (global) {
    'use strict';

    const DEFAULT_UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'];

    class EonwispSoundModule {
        constructor(options = {}) {
            const AudioCtx = global.AudioContext || global.webkitAudioContext;
            if (!AudioCtx) {
                throw new Error('Web Audio API not supported in this browser.');
            }

            this.context = options.context || new AudioCtx({ latencyHint: 'interactive' });
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = options.masterVolume ?? 0.8;
            this.masterGain.connect(this.context.destination);

            this.musicBus = this.context.createGain();
            this.fxBus = this.context.createGain();
            this.musicBus.connect(this.masterGain);
            this.fxBus.connect(this.masterGain);

            this.samples = new Map();
            this.layers = new Map();
            this.transport = {
                bpm: options.bpm ?? 120,
                beatsPerBar: options.beatsPerBar ?? 4,
                startTime: null,
            };

            this.unlockListeners = [];
        }

        setTransport({ bpm, beatsPerBar }) {
            if (typeof bpm === 'number' && bpm > 0) {
                this.transport.bpm = bpm;
            }
            if (typeof beatsPerBar === 'number' && beatsPerBar > 0) {
                this.transport.beatsPerBar = beatsPerBar;
            }
            if (this.transport.startTime === null) {
                this.transport.startTime = this.context.currentTime;
            }
        }

        attachUnlockOn(elements, events = DEFAULT_UNLOCK_EVENTS) {
            const targets = Array.isArray(elements) ? elements : [elements || global.document.body];
            const handler = async () => {
                await this.unlock();
                this._removeUnlockListeners();
            };
            targets.forEach((el) => {
                if (!el) { return; }
                events.forEach((eventName) => {
                    el.addEventListener(eventName, handler, { once: true, passive: true });
                    this.unlockListeners.push({ el, eventName, handler });
                });
            });
        }

        async unlock() {
            if (this.context.state === 'suspended') {
                try {
                    await this.context.resume();
                } catch (error) {
                    console.warn('Audio context resume failed:', error);
                }
            }
            if (this.transport.startTime === null) {
                this.transport.startTime = this.context.currentTime;
            }
        }

        setMasterVolume(value, { time = 0.2 } = {}) {
            const target = Math.min(Math.max(value, 0), 1);
            const now = this.context.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(target, now + Math.max(time, 0.01));
        }

        async loadSample(name, url) {
            const buffer = await this._fetchAudioBuffer(url);
            this.samples.set(name, buffer);
            return buffer;
        }

        async loadSamples(sampleMap) {
            const entries = Object.entries(sampleMap);
            return Promise.all(entries.map(([name, url]) => this.loadSample(name, url)));
        }

        async registerMusicLayer(name, url, options = {}) {
            const buffer = await this._fetchAudioBuffer(url);
            const gainNode = this.context.createGain();
            gainNode.gain.value = 0;
            gainNode.connect(this.musicBus);

            const layer = {
                name,
                buffer,
                gainNode,
                loop: options.loop !== false,
                defaultGain: options.gain ?? 1,
                fadeTime: options.fadeTime ?? 0.8,
                source: null,
                bpm: options.bpm,
                beatsPerBar: options.beatsPerBar,
            };

            this.layers.set(name, layer);
            this._syncTransport(layer);
            return layer;
        }

        async _fetchAudioBuffer(url) {
            if (typeof fetch === 'function') {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch audio at ${url}`);
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    return this.context.decodeAudioData(arrayBuffer);
                } catch (error) {
                    if (this._shouldFallbackToXHR(error)) {
                        return this._fetchAudioBufferViaXHR(url);
                    }
                    throw error;
                }
            }
            return this._fetchAudioBufferViaXHR(url);
        }

        _shouldFallbackToXHR(error) {
            if (!error) return false;
            if (error.name === 'TypeError') {
                return true;
            }
            const message = String(error && error.message || '').toLowerCase();
            return message.includes('failed to fetch') || message.includes('access is denied');
        }

        _fetchAudioBufferViaXHR(url) {
            return new Promise((resolve, reject) => {
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = () => {
                        if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                            this.context.decodeAudioData(xhr.response).then(resolve).catch(reject);
                        } else {
                            reject(new Error(`XHR failed to load audio at ${url} (status ${xhr.status})`));
                        }
                    };
                    xhr.onerror = () => reject(new Error(`XHR network error while loading audio at ${url}`));
                    xhr.send();
                } catch (fallbackError) {
                    reject(fallbackError);
                }
            });
        }

        playMusicLayer(name, options = {}) {
            const layer = this.layers.get(name);
            if (!layer) {
                throw new Error(`Music layer "${name}" was not registered.`);
            }

            const now = this.context.currentTime;
            const startAtNextBar = options.startAtNextBar ?? true;
            const fadeTime = Math.max(options.fadeTime ?? layer.fadeTime, 0.01);
            const startOffset = options.offset ?? 0;
            const targetGain = options.targetGain ?? layer.defaultGain;

            const startTime = options.when ?? (startAtNextBar ? this._getNextBarTime() : now + 0.05);
            const source = this.context.createBufferSource();
            source.buffer = layer.buffer;
            source.loop = layer.loop;
            source.connect(layer.gainNode);

            if (layer.source) {
                this._fadeOutAndStop(layer.source, layer.gainNode, fadeTime, startTime);
            }

            layer.gainNode.gain.cancelScheduledValues(now);
            const currentValue = layer.gainNode.gain.value;
            layer.gainNode.gain.setValueAtTime(currentValue, now);
            layer.gainNode.gain.setValueAtTime(0, startTime);
            layer.gainNode.gain.linearRampToValueAtTime(targetGain, startTime + fadeTime);

            source.start(startTime, startOffset);
            layer.source = source;
            return source;
        }

        stopMusicLayer(name, { fadeTime = 0.5 } = {}) {
            const layer = this.layers.get(name);
            if (!layer || !layer.source) {
                return;
            }
            const now = this.context.currentTime;
            this._fadeOutAndStop(layer.source, layer.gainNode, fadeTime, now);
            layer.source = null;
        }

        setLayerMix(name, gain, { fadeTime = 0.2 } = {}) {
            const layer = this.layers.get(name);
            if (!layer) {
                throw new Error(`Music layer "${name}" was not registered.`);
            }
            const now = this.context.currentTime;
            const target = Math.max(0, gain);
            layer.gainNode.gain.cancelScheduledValues(now);
            layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
            layer.gainNode.gain.linearRampToValueAtTime(target, now + Math.max(fadeTime, 0.01));
        }

        playSample(name, options = {}) {
            const buffer = this.samples.get(name);
            if (!buffer) {
                throw new Error(`Sample "${name}" was not loaded.`);
            }

            const now = this.context.currentTime;
            const attack = Math.max(options.attack ?? 0.01, 0.001);
            const release = Math.max(options.release ?? 0.2, 0.01);
            const volume = options.volume ?? 1;
            const detune = options.detune ?? 0;
            const playbackRate = options.playbackRate ?? 1;
            const loop = !!options.loop;

            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.loop = loop;
            source.playbackRate.value = playbackRate;
            source.detune.value = detune;

            const gainNode = this.context.createGain();
            gainNode.gain.setValueAtTime(0, now);
            source.connect(gainNode);
            gainNode.connect(this.fxBus);

            const startTime = options.when ?? now;
            const sustainDuration = options.sustain ?? 0;
            const rawDuration = buffer.duration / playbackRate;
            const requestedDuration = options.duration ?? (loop ? rawDuration : Math.min(rawDuration, attack + sustainDuration + release));
            const playDuration = loop ? requestedDuration : Math.min(rawDuration, requestedDuration);
            const stopTime = startTime + playDuration;

            gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);

            if (!loop) {
                const releaseStart = Math.max(stopTime - release, startTime + attack);
                gainNode.gain.setValueAtTime(volume, releaseStart);
                gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);
                source.stop(stopTime);
            }

            source.start(startTime);

            return {
                source,
                gainNode,
                stop: (fade = release) => {
                    const nowStop = this.context.currentTime;
                    const effectiveFade = Math.max(fade, 0.01);
                    gainNode.gain.cancelScheduledValues(nowStop);
                    gainNode.gain.setValueAtTime(gainNode.gain.value, nowStop);
                    gainNode.gain.linearRampToValueAtTime(0.0001, nowStop + effectiveFade);
                    source.stop(nowStop + effectiveFade);
                },
            };
        }

        createOneShot({ type = 'sine', frequency = 440, attack = 0.01, release = 0.3, duration = 0.5, volume = 0.6 } = {}) {
            const now = this.context.currentTime;
            const osc = this.context.createOscillator();
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, now);

            const gainNode = this.context.createGain();
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + attack);
            gainNode.gain.linearRampToValueAtTime(0.0001, now + Math.max(duration - release, attack));

            osc.connect(gainNode);
            gainNode.connect(this.fxBus);

            osc.start(now);
            osc.stop(now + duration);

            return { osc, gainNode };
        }

        dispose() {
            this._removeUnlockListeners();
            this.layers.forEach((layer) => {
                this.stopMusicLayer(layer.name);
            });
            this.samples.clear();
            this.layers.clear();
            if (typeof this.context.close === 'function') {
                this.context.close().catch(() => {});
            }
        }

        _fadeOutAndStop(source, gainNode, fadeTime, startTime) {
            const stopAt = Math.max(startTime, this.context.currentTime);
            gainNode.gain.cancelScheduledValues(stopAt);
            gainNode.gain.setValueAtTime(gainNode.gain.value, stopAt);
            gainNode.gain.linearRampToValueAtTime(0.0001, stopAt + fadeTime);
            source.stop(stopAt + fadeTime + 0.01);
        }

        _getNextBarTime() {
            const now = this.context.currentTime;
            if (this.transport.startTime === null) {
                this.transport.startTime = now;
                return now;
            }
            const barDuration = this._getBarDuration();
            const elapsed = now - this.transport.startTime;
            const barsElapsed = Math.floor(elapsed / barDuration);
            const nextBarStart = this.transport.startTime + (barsElapsed + 1) * barDuration;
            return nextBarStart < now ? nextBarStart + barDuration : nextBarStart;
        }

        _getBarDuration() {
            const beatsPerSecond = this.transport.bpm / 60;
            return this.transport.beatsPerBar / beatsPerSecond;
        }

        _syncTransport(layer) {
            this.setTransport({
                bpm: layer.bpm ?? this.transport.bpm,
                beatsPerBar: layer.beatsPerBar ?? this.transport.beatsPerBar,
            });
        }

        _removeUnlockListeners() {
            this.unlockListeners.forEach(({ el, eventName, handler }) => {
                el.removeEventListener(eventName, handler);
            });
            this.unlockListeners = [];
        }
    }

    global.EonwispSoundModule = EonwispSoundModule;
})(window);
