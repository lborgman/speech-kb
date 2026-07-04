// @ts-check
const DEEPGRAM_VER = "0.0.01";
// ts-ignore
// logConsole(`here is deepgram.js, module,${DEEPGRAM_VER}`);
console.log(`here is deepgram.js, module,${DEEPGRAM_VER}`);
if (document.currentScript) throw Error("import .currentScript"); // is module


// https://deepgram.com/voice-ai-platform

// const apiKey = 'YOUR_DEEPGRAM_API_KEY';
let API_KEY = "";
export function setApiKey(key) {
    API_KEY = key;
}
/** @type {function|undefined} */
let callbackToCaller;
export function setCallBackFun(fun) {
    callbackToCaller = fun;
}

// From Google search AI:
// const startBtn = document.getElementById('start-btn');
// const stopBtn = document.getElementById('stop-btn');

// const statusSpan = document.getElementById('status');
/* @type {HTMLElement|undefined} */
/*
let statusSpan;
export function setStatusSpan(elt) {
    statusSpan = elt;
}
*/

// const transcriptParagraph = document.getElementById('transcript');
/* @type {HTMLElement|undefined} */
/*
let transcriptParagraph;
export function setTranscriptOutput(elt) {
    transcriptParagraph = elt;
}
*/

export function languageSelectInnerHtml() {
    return
    `
    <label for="language-select">Choose Language:</label>
<select id="language-select">
    <!-- Americas / West Europe -->
    <optgroup label="Americas / West Europe">
        <option value="en" selected>English (en)</option>
        <option value="es">Spanish (es)</option>
        <option value="es-419">Spanish - Latin America (es-419)</option>
        <option value="fr">French (fr)</option>
        <option value="fr-CA">French - Canada (fr-CA)</option>
        <option value="de">German (de)</option>
        <option value="de-CH">German - Switzerland (de-CH)</option>
        <option value="it">Italian (it)</option>
        <option value="nl">Dutch (nl)</option>
        <option value="pt">Portuguese (pt)</option>
        <option value="pt-BR">Portuguese - Brazil (pt-BR)</option>
        <option value="sv">Swedish (sv)</option>
        <option value="no">Norwegian (no)</option>
        <option value="da">Danish (da)</option>
        <option value="fi">Finnish (fi)</option>
        <option value="ca">Catalan (ca)</option>
    </optgroup>

    <!-- Asia & Middle East -->
    <optgroup label="Asia & Middle East">
        <option value="zh">Chinese - Mandarin (zh)</option>
        <option value="ja">Japanese (ja)</option>
        <option value="ko">Korean (ko)</option>
        <option value="id">Indonesian (id)</option>
        <option value="ms">Malay (ms)</option>
        <option value="th">Thai (th)</option>
        <option value="vi">Vietnamese (vi)</option>
        <option value="tr">Turkish (tr)</option>
        <option value="ar">Arabic (ar)</option>
        <option value="he">Hebrew (he)</option>
        <option value="fa">Persian / Farsi (fa)</option>
    </optgroup>

    <!-- South Asia -->
    <optgroup label="South Asia">
        <option value="hi">Hindi (hi)</option>
        <option value="bn">Bengali (bn)</option>
        <option value="ta">Tamil (ta)</option>
        <option value="te">Telugu (te)</option>
        <option value="mr">Marathi (mr)</option>
        <option value="kn">Kannada (kn)</option>
    </optgroup>

    <!-- Eastern Europe -->
    <optgroup label="Eastern Europe">
        <option value="ru">Russian (ru)</option>
        <option value="uk">Ukrainian (uk)</option>
        <option value="pl">Polish (pl)</option>
        <option value="ro">Romanian (ro)</option>
        <option value="el">Greek (el)</option>
        <option value="cs">Czech (cs)</option>
        <option value="hu">Hungarian (hu)</option>
    </optgroup>

    <!-- Other Global -->
    <optgroup label="Other Global">
        <option value="tl">Tagalog / Filipino (tl)</option>
        <option value="sw">Swahili (sw)</option>
    </optgroup>
</select>
    `;
}

let mediaRecorder;
let socket;

// startBtn.addEventListener('click', async () => {
export async function start() {
    if (API_KEY.length == 0) {
        throw Error("deepgram API key is not set");
    }
    const tofCallbackToCaller = typeof callbackToCaller;
    if (tofCallbackToCaller != "function") {
        throw Error(`callbackToCaller is "${tofCallbackToCaller}"`);
    }

    // 1. Request microphone access from the user
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Validate browser support for container format
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
        return alert('Your browser does not support audio/webm.');
    }

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    // 2. Establish a WebSocket connection directly to Deepgram
    // IN PRODUCTION: Route this through your own server to hide your API Key!
    // const apiKey = 'YOUR_DEEPGRAM_API_KEY';
    const apiKey = API_KEY;
    socket = new WebSocket('wss://://deepgram.com', [
        'token', apiKey
    ]);

    socket.onopen = () => {
        // statusSpan.textContent = 'Connected & Listening...';
        // startBtn.disabled = true;
        // stopBtn.disabled = false;
        console.log("%cdeepgram socket opened", "font-size:20px; color:red;");

        // 3. Send audio chunks to Deepgram every 250ms as they become available
        mediaRecorder.addEventListener('dataavailable', async (event) => {
            if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                socket.send(event.data);
            }
        });
        mediaRecorder.start(250);
    };

    // 4. Handle incoming transcription data from Deepgram
    socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;

        // Only print the transcript segment once Deepgram finalizes the sentence
        if (transcript && received.is_final) {
            transcriptParagraph.textContent += transcript + ' ';
        }
    };

    socket.onerror = (error) => console.error('WebSocket Error:', error);
    socket.onclose = () => {
        statusSpan.textContent = 'Disconnected';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };
    // });
}


/*
stopBtn.addEventListener('click', () => {
    if (mediaRecorder) mediaRecorder.stop();
    if (socket) socket.close();
});
*/
export function stop() {
    if (mediaRecorder) mediaRecorder.stop();
    if (socket) socket.close();
}
