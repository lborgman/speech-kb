/**
 * Deepgram Real-time Speech-to-Text Client (ESM Module)
 * Uses AudioWorklet for modern browser compatibility + basic VAD.
 */
// @ts-check
const DEEPGRAM_grok_VER = "0.0.01";
// ts-ignore
// logConsole(`here is deepgram.js, module,${DEEPGRAM_VER}`);
console.log(`here is deepgram.js, module,${DEEPGRAM_grok_VER}`);
if (document.currentScript) throw Error("import .currentScript"); // is module


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
    const tofApiKey = typeof apiKey;
    if (tofApiKey != "string") {
        debugger;
        throw Error(`tofApiKey=="${tofApiKey}"`);
    }
    if (apiKey.length < 10) {
        debugger;
        throw Error(`apiKey.length < 10`);
    }
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

    // /** @type {HTMLElement | null} */ let transcriptElement = null;

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


    ////// mediaRecorder version is from Gemini
    /** @type {MediaRecorder|null} */
    let mediaRecorder = null;
    let chunkInterval = null;

    /**
     * Start real-time transcription from the microphone
     * @param {HTMLElement} [outputElement] - Optional DOM element to display live transcript
     * @returns {Promise<void>}
     */
    async function start() {
        if (isStreaming) return;
        // transcriptElement = outputElement;
        silenceFrameCount = 0;

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                // audio: true
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            // #region test mic code
            /*
            {
                // Add this right under your getUserMedia line to test the microphone
                const testAudioContext = new AudioContext();
                const testSource = testAudioContext.createMediaStreamSource(mediaStream);
                const testAnalyser = testAudioContext.createAnalyser();
                testSource.connect(testAnalyser);
                const dataArray = new Uint8Array(testAnalyser.frequencyBinCount);

                setInterval(() => {
                    testAnalyser.getByteFrequencyData(dataArray);
                    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    console.log("🎤 Actual Mic Signal Volume:", volume);
                    // If this stays at 0 while you talk, the browser is connected to a dead or muted microphone device.
                }, 1000);
            }
            */
            // #endregion test mic code


            //////// FIX-ME: send data!
            // #region old code
            /*
            // This code is probably not needed for DeepGram, see
            // https://gemini.google.com/app/71c1425c0f0725e3

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
            */
            // #endregion


            {
                console.log(apiKey.length, `"${apiKey}"`);
                // Connect to Deepgram
                const urlDg = new URL("wss://api.deepgram.com/v1/listen")
                const sp = urlDg.searchParams;


                //// https://gemini.google.com/app/71c1425c0f0725e3
                sp.set("model", "nova-2");
                sp.set("smart_format", "true");
                sp.set("interim_results", "true");

                // sp.set("encoding", "linear16");
                // sp.set("sample_rate", "16000");

                // sp.set("vad_events", "true");
                sp.set("endpoint", "1000");
                // sp.set("diarize", "true"); // Speaker detection
                // sp.set("paragraphs", "true"); // Changes the JSON output format


                socket = new WebSocket(
                    urlDg.href,
                    ['token', apiKey]
                );
            }

            socket.onopen = () => {
                // console.log('✅ Deepgram WebSocket connected (with basic VAD)');
                console.log('✅ Deepgram WebSocket connected (MediaRecord Stream)');
                isStreaming = true;
                callBackToUser("websocket-open", true);
                // 2. Initialize the MediaRecorder once the network socket is open
                // mediaRecorder = new MediaRecorder(mediaStream);

                // 🚀 CRITICAL FIX: Enforce a standard, predictable stream container
                let options = { mimeType: 'audio/webm;codecs=opus' };

                // Fallback for Safari/iOS which doesn't support WebM
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'audio/mp4' };
                }

                console.log(`Recording using mimeType: ${options.mimeType}`);
                mediaRecorder = new MediaRecorder(mediaStream, options);

                // 3. Listen for audio data chunks from the browser
                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
                        /*
                        // 🔍 CHECK 1: Log the raw browser file type being emitted
                        // console.log(`Blob Size: ${event.data.size} bytes | MimeType: ${event.data.type}`);

                        // 🔍 CHECK 2: Convert to ArrayBuffer to inspect the actual bytes
                        const buffer = await event.data.arrayBuffer();
                        const view = new Uint8Array(buffer);

                        // Log the first 4 bytes (The Magic Number Header)
                        const hexHeader = Array.from(view.slice(0, 4))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join(' ');
                        // console.log(`First 4 bytes of packet: [${hexHeader}]`);
                        */

                        // Send the compressed native container blob directly
                        socket.send(event.data);
                    }
                };

                // 4. Start recording and emit data chunks every 250 milliseconds
                // This continuous stream natively prevents the 1011 timeout error!
                // mediaRecorder.start(250);
                mediaRecorder.start();
                chunkInterval = setInterval(() => {
                    if (mediaRecorder == null) {
                        debugger;
                        throw Error(`mediaRecorder==null`);
                    }
                    if (mediaRecorder.state === "recording") {
                        mediaRecorder.requestData();
                    }
                }, 1000);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                // console.log("socket.onmessage", { data });
                // Core STT Fields
                if (data.channel.alternatives[0]) {
                    const alternative = data.channel.alternatives[0];
                    const transcript = alternative.transcript;
                    const isFinal = Boolean(data.is_final);
                    const speechFinal = Boolean(data.speech_final);
                    // words = alternative.words
                    // console.log(`onmessage, transcript: "${transcript}"`, isFinal, speechFinal, { alternative });

                    if (transcript.length > 0) {
                        callBackToUser("transcript", { transcript, isFinal, speechFinal });
                    }
                    if (speechFinal) {
                        callBackToUser("endpoint", { message: "User finished speaking", isFinal, speechFinal });
                    }
                }
            };

            socket.onerror = (evt) => {
                console.error('%cWebSocket error:', "color:red;font-size:20px;", evt);
                callBackToUser("websocket-error");
            }
            socket.onclose = (evt) => {
                isStreaming = false;
                const code = evt.code;
                const reason = evt.reason;
                const wasClean = evt.wasClean;
                console.log("WebSocket closed", { evt, code, reason, wasClean });
                callBackToUser("websocket-close", { code, reason, wasClean });
                if (code === 1006) {
                    debugger; // This should not happen now?
                    callBackToUser("websocket1006", true);
                }
                // Clean up recorder if it's still running natively
                if (mediaRecorder && mediaRecorder.state !== "inactive") {
                    mediaRecorder.stop();
                }
                /*
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
                */

            };

        } catch (err) {
            console.error('Failed to start Deepgram transcription:', err);
            debugger;
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
        // transcriptElement = null;
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