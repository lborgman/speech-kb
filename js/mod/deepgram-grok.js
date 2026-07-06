/**
 * Deepgram Real-time Speech-to-Text Client (ESM Module)
 * Uses AudioWorklet for modern browser compatibility + basic VAD.
 */

let reportErrorCodeFun;
export function setReportErrorCodeFun(fun) {
    reportErrorCodeFun = fun;
}
/**
 * Creates a Deepgram real-time transcriber instance.
 *
 * @param {string} apiKey - Deepgram API key
 * @param {Function} [callBackToUser] - Optional callback for transcripts (transcript, isFinal)
 * @returns {DeepgramTranscriber} Transcriber instance
 */
export function createDeepgramTranscriber(apiKey, callBackToUser) {
    const tofCallbackToCaller = typeof callBackToUser;
    if (tofCallbackToCaller != "function") {
        debugger;
        throw Error(`tofCallbackToCaller=="${tofCallbackToCaller}`);
    }
    const lenCallBackToUser = callBackToUser.length;
    if (lenCallBackToUser != 2) {
        debugger;
        throw Error(`lenCallBackToUser==${lenCallBackToUser}`);
    }

    /** @type {WebSocket | null} */
    let socket = null;
    /** @type {AudioContext | null} */
    let audioContext = null;
    /** @type {MediaStream | null} */
    let mediaStream = null;
    /** @type {AudioWorkletNode | null} */
    let workletNode = null;
    /** @type {boolean} */
    let isStreaming = false;
    /** @type {string} */
    let finalTranscript = '';
    /** @type {HTMLElement | null} */
    let transcriptElement = null;

    // VAD Settings
    const SILENCE_THRESHOLD = 0.012;        // Adjust based on your mic/environment (0.008 - 0.025)
    const SILENCE_FRAMES_THRESHOLD = 12;    // ~300-400ms of silence
    let silenceFrameCount = 0;

    /**
     * Initialize the PCM AudioWorklet processor with RMS calculation
     * @returns {Promise<void>}
     */
    async function initWorklet() {
        if (!audioContext) throw new Error('AudioContext is not initialized');

        const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0][0];
          if (input && input.length > 0) {
            // Calculate RMS for VAD
            let sum = 0;
            for (let i = 0; i < input.length; i++) {
              sum += input[i] * input[i];
            }
            const rms = Math.sqrt(sum / input.length);

            const pcm = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              pcm[i] = Math.max(-1, Math.min(1, input[i])) * 0x7FFF;
            }

            this.port.postMessage({ pcm: pcm.buffer, rms });
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;

        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await audioContext.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
    }

    /**
     * Start real-time transcription from the microphone
     * @param {HTMLElement} [outputElement] - Optional DOM element to display live transcript
     * @returns {Promise<void>}
     */
    async function start(outputElement = null) {
        if (isStreaming) return;
        transcriptElement = outputElement;
        silenceFrameCount = 0;

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            await initWorklet();

            const source = audioContext.createMediaStreamSource(mediaStream);
            workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

            workletNode.port.onmessage = (event) => {
                const { pcm, rms } = event.data;
                const isSpeaking = rms > SILENCE_THRESHOLD;

                if (isSpeaking) {
                    silenceFrameCount = 0;
                } else {
                    silenceFrameCount++;
                }

                // Send audio if speaking or just after speech ends (for better context)
                if (isSpeaking || silenceFrameCount < SILENCE_FRAMES_THRESHOLD) {
                    if (socket?.readyState === WebSocket.OPEN) {
                        socket.send(pcm);
                    }
                }
            };

            source.connect(workletNode);
            // workletNode.connect(audioContext.destination); // Uncomment to hear yourself

            // Connect to Deepgram
            socket = new WebSocket(
                `wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&encoding=linear16&sample_rate=16000&vad_events=true`,
                ['token', apiKey]
            );

            socket.onopen = () => {
                console.log('✅ Deepgram WebSocket connected (with basic VAD)');
                isStreaming = true;
                callBackToUser("websocket-open", true);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.channel?.alternatives?.[0]) {
                    const transcript = data.channel.alternatives[0].transcript;
                    const isFinal = Boolean(data.is_final);

                    if (isFinal) {
                        finalTranscript += transcript + ' ';
                    }

                    // Call user callback if provided
                    if (typeof callBackToUser === 'function') {
                        callBackToUser("transcript", { transcript, isFinal });
                    }

                    if (transcriptElement) {
                        transcriptElement.innerHTML = `
              <strong>Final:</strong> ${finalTranscript}<br>
              <span style="color: #666; font-style: italic;">
                ${isFinal ? '' : transcript + '...'}
              </span>
            `;
                    } else {
                        console.log(isFinal ? '[FINAL]' : '[INTERIM]', transcript);
                        callBackToUser("transcript", {
                            transcript,
                            isFinal
                        });
                    }
                }
            };

            socket.onerror = (evt) => {
                console.error('WebSocket error:', evt);
            }
            socket.onclose = (evt) => {
                isStreaming = false;
                const code = evt.code;
                const reason = evt.reason;
                const wasClean = evt.wasClean;
                console.log("WebSocket closed", { evt, code, reason, wasClean });
                if (code === 1006) {
                    callBackToUser( "websocket1006", true);
                }
                switch (code) {
                    case 1000: // Normal Closure
                        break;

                    case 1002: // Protocol Error
                    case 1003: // Unsupported Data
                    case 1009: // Message too big
                        // FIX-ME: handle this better
                        throw Error(`WebSocket closed with code ${code}`);

                    case 1001: // Going Away
                    case 1005: // No Status Recieved
                    case 1006: // network problem or bad API credentials
                    // FIX-ME: note that this might be auth problem!
                    case 1011: // Server error
                    case 1015: // TLS Handshake Failure
                        console.error(`WebSocket close, code: ${code}`)
                        break;

                    default:
                        console.warn(`WebSocket close, unknown or private code: ${code}`)
                }

            };

        } catch (err) {
            console.error('Failed to start Deepgram transcription:', err);
            stop();
        }
    }

    /**
     * Stop transcription and clean up all resources
     */
    function stop() {
        if (workletNode) {
            workletNode.disconnect();
            workletNode = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (socket) {
            socket.close();
            socket = null;
        }
        if (audioContext) {
            audioContext.close().catch(console.error);
            audioContext = null;
        }

        isStreaming = false;
        finalTranscript = '';
        transcriptElement = null;
        silenceFrameCount = 0;
    }

    /**
     * Check if currently streaming
     * @returns {boolean}
     */
    function isCurrentlyStreaming() {
        return isStreaming;
    }

    return {
        start,
        stop,
        isStreaming: isCurrentlyStreaming
    };
}

// Default export for convenience
// export default createDeepgramTranscriber;