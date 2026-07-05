/**
 * Deepgram Real-time Speech-to-Text Client (ESM Module)
 * Uses AudioWorklet for modern browser compatibility.
 */

/**
 * Creates a Deepgram real-time transcriber instance.
 * 
 * @param {string} apiKey - Deepgram API key
 * @returns {DeepgramTranscriber} Transcriber instance
 */
export function createDeepgramTranscriber(apiKey, callBackToUser) {
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

    /**
     * Initialize the PCM AudioWorklet processor
     * @returns {Promise<void>}
     */
    async function initWorklet() {
        if (!audioContext) throw new Error('AudioContext is not initialized');

        const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0][0];
          if (input && input.length > 0) {
            const pcm = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              pcm[i] = Math.max(-1, Math.min(1, input[i])) * 0x7FFF;
            }
            this.port.postMessage(pcm.buffer);
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

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            await initWorklet();

            const source = audioContext.createMediaStreamSource(mediaStream);
            workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

            workletNode.port.onmessage = (event) => {
                if (socket?.readyState === WebSocket.OPEN) {
                    socket.send(event.data);
                }
            };

            source.connect(workletNode);
            // workletNode.connect(audioContext.destination); // Uncomment to hear yourself

            // Connect to Deepgram
            socket = new WebSocket(
                `wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&encoding=linear16&sample_rate=16000`,
                ['token', apiKey]
            );

            socket.onopen = () => {
                console.log('✅ Deepgram WebSocket connected');
                isStreaming = true;
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.channel?.alternatives?.[0]) {
                    const transcript = data.channel.alternatives[0].transcript;
                    const isFinal = Boolean(data.is_final);

                    if (isFinal) {
                        finalTranscript += transcript + ' ';
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
                    }
                }
            };

            socket.onerror = (err) => console.error('Deepgram WebSocket error:', err);
            socket.onclose = () => {
                console.log('Deepgram WebSocket closed');
                isStreaming = false;
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