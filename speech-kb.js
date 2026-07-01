// @ts-check
const SPEECH_KB_VER = "0.0.01";
// @ts-ignore
// logConsoleHereIs(`here is basic-ui.js, module,${SPEECH_KB_VER}`);
console.log(`here is basic-ui.js, module,${SPEECH_KB_VER}`);
if (document.currentScript) throw Error("import .currentScript"); // is module

// debugger;
export function dummyModule() {}

const modBasicUI = await importFc4i("basic-ui");
const modOPFS = await importFc4i("opfs");
// console.log({ modBasicUI, modOPFS });

const STORING_PREFIX = "SPEECH-KB-";
const modLocalSettings = await importFc4i("local-settings");
class OurLocalSetting extends modLocalSettings.LocalSetting {
    /**
     * @param {string} key
     * @param {number|boolean} definitionValue
     */
    constructor(key, definitionValue) {
        super(STORING_PREFIX, key, definitionValue);
    }
}



// debugger;
const eltMicStatus = document.getElementById("mic-status");
const langSelect = document.getElementById('speech-lang');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// CRITICAL: Set to true so the microphone stays open 
// even when you pause between words.
recognition.continuous = true;
recognition.interimResults = true; // Show results live as you speak
recognition.lang = 'en-US';

// --- CONTROLS ---

// 1. START: Turns on microphone, begins listening
function UserStartListening() {
    shouldKeepListening = true;
    recognition.lang = langSelect.value;
    recognition.start();
}

// 2. STOP: Stops listening and FINISHES processing current speech
function UserStopListening() {
    shouldKeepListening = false;
    recognition.stop();
}

// 3. ABORT: Instantly kills the microphone and THROWS AWAY current speech
function cancelListening() {
    recognition.abort();
    eltMicStatus.textContent = "Speech recognition canceled instantly.";
}

// --- LIFECYCLE EVENTS ---













///////////////////////////////////
// Testing Lovable:

const isAndroid = /android/i.test(navigator.userAgent);

let shouldKeepListening = false;
let hasCommitted = false;
let finalText = "";

recognition.continuous = !isAndroid;   // true on Windows, false on Android
recognition.interimResults = true;

recognition.addEventListener("start", () => {
    hasCommitted = false;
    finalText = "";
    // showListening(true);
});

recognition.onresult = (event) => {
    // Walk only new results this event delivered
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
            const utterance = r[0].transcript.trim();
            if (utterance) {
                // Desktop (continuous): commit each final utterance as it arrives
                // Android (single-shot): accumulate, commit once in this session
                if (isAndroid) {
                    finalText = utterance;
                } else {
                    yourAppHandleResult(utterance);
                }
            }
        }
    }

    if (isAndroid && finalText && !hasCommitted) {
        hasCommitted = true;
        yourAppHandleResult(finalText);
    }
};


function debugOutput(txt) {
    const elt = mkElt("div", undefined, txt);
    const eltDebug = document.getElementById("debug");
    eltDebug.appendChild(elt);
}
debugOutput("TEST DEBUG"); debugOutput("TEST again 2");
const lifeEvents = [
    "start", "audiostart", "soundstart", "speechstart",
    "speechend", "soundend", "audioend", "end"
];
lifeEvents.forEach(evtName => {
    recognition.addEventListener(evtName, evt => {
        debugOutput(evtName)
    })
})


// recognition.onerror = (e) => {
recognition.addEventListener("error", (e) => {
    debugOutput(`onerror: ${e.error}`);

    // no-speech / aborted are normal between phrases on Android
    if (e.error !== "no-speech" && e.error !== "aborted") {
        shouldKeepListening = false;
    }
    hasCommitted = true; // block stale commit in onend
});

recognition.addEventListener("end", () => {
    // Android safety net: commit if onresult never finalised
    if (isAndroid && !hasCommitted && finalText) {
        hasCommitted = true;
        yourAppHandleResult(finalText);
    }

    // Auto-restart:
    //  - Android: required after every utterance (continuous is ignored)
    //  - Windows: only restarts if the engine itself stopped (silence timeout, error)
    if (shouldKeepListening) {
        try {
            recognition.start();
        } catch (_) {
            // already starting — ignore
        }
    }
});











// Example: Replace with your app's function
function yourAppHandleResult(text) {
    console.log("Reporting to app:", text);
    // Your app logic here (e.g., update a textarea, send to server, etc.)
    const eltOut = mkElt("div", undefined, text);
    eltOut.classList.add("final-out");
    const eltOutputText = document.getElementById("output-text");
    eltOutputText.appendChild(eltOut);
    eltOut.scrollIntoView();
    const eltEditButtons = document.getElementById("edit-buttons");
    eltEditButtons.inert = false;
}
// Fires when the engine completely disconnects
/*
recognition.onend = () => {
    eltMicStatus.textContent = "Recognition session has fully ended.";
};
*/
// recognition.addEventListener("end", () => { debugOutput(`end:`) });

displayPage();
function displayPage() {
    // const btnStart = mkElt("button", { id: "btn-start" }, "Start");
    // const btnStop = mkElt("button", { id: "btn-stop" }, "Stop");
    // btnStop.inert = true;
    showListening(false);
    recognition.addEventListener("start", () => {
        showListening(true);
    });
    recognition.addEventListener("end", () => {
        showListening(false);
    });

    /*
    btnStart.addEventListener("click", evt => {
        evt.stopPropagation();
        UserStartListening();
    });
    btnStop.addEventListener("click", evt => {
        evt.stopPropagation();
        UserStopListening();
    });
    */

    const btnDoc = document.getElementById("doc");
    btnDoc.addEventListener("click", evt => {
        evt.stopPropagation()
        const dialogMenu = modBasicUI.mkDialogMenu();

        modBasicUI.addMenuAlt(dialogMenu, "Very New test here", () => {
            modBasicUI.snackbar("new Test here");
        });
        modBasicUI.addMenuAlt(dialogMenu, "Test two with a long name", () => {
            modBasicUI.snackbar("test 2 ver 2 is here");
        });


        const objDlgPosition = {
            parent: btnDoc,
            // relativeX: "right-inner",
            // relativeX: "left-inner",
        }
        modBasicUI.displayMenu(dialogMenu, objDlgPosition);

    })

    function showListening(on) {
        const eltMicStatus = document.getElementById("mic-status");
        if (on) {
            // btnStart.inert = true;
            // btnStop.inert = false;
            document.documentElement.classList.add("mic-on");
            eltMicStatus.textContent = "Microphone is on";
        } else {
            // btnStart.inert = false;
            // btnStop.inert = true;
            if (eltMicStatus) {
                // eltMicStatus.textContent = "Microphone is off.";
                eltMicStatus.textContent = "";
            }
            document.documentElement.classList.remove("mic-on");
        }
    }

    const eltMic = mkElt("div");
    eltMic.title = "- Turn mic on/off";
    eltMic.classList.add("mic-btn");
    eltMic.style = `
                background-image: url(./img/gmic.svg);
                background-size: contain;
                NOoutline: 1px dotted red;
                width: 48px;
                height: 48px;
                cursor: pointer;
            `;
    eltMic.addEventListener("click", evt => {
        evt.stopPropagation();
        const isOn = document.documentElement.classList.contains("mic-on");
        if (isOn) {
            UserStopListening();
        } else {
            UserStartListening();
        }
    });

    const eltMicStatus = mkElt("div", { id: "mic-status" }, "↫ Tap mic to speak");
    eltMicStatus.style = `
                display: flex;
                align-content: center;
                flex-wrap: wrap;
            `;

    const divOnOffButtons = document.getElementById("on-off-buttons");
    // divOnOffButtons.append(btnStart, btnStop, eltMic);
    divOnOffButtons.append(eltMic, eltMicStatus);


    /************** EDIT ***********/
    const btnDot = mkElt("button", undefined, ".");
    const btnExclamation = mkElt("button", undefined, "!");
    const btnQuestion = mkElt("button", undefined, "?");
    const btnDelete = mkElt("button", undefined, "⌫");
    const btnParagraph = mkElt("button", undefined, "¶");
    const btnEdit = mkElt("button", undefined, "✎");

    const divEditButtons = document.getElementById("edit-buttons");
    divEditButtons.append(
        btnDot,
        btnExclamation,
        btnQuestion,
        btnParagraph,
        btnEdit,
        btnDelete,
    );
    btnDot.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getLastFinalOut();
        UpperFirstCharPlusPunctuation(eltToEdit, ".");
    });
    btnExclamation.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getLastFinalOut();
        UpperFirstCharPlusPunctuation(eltToEdit, "!");
    });
    btnQuestion.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getLastFinalOut();
        UpperFirstCharPlusPunctuation(eltToEdit, "?");
    });
    btnParagraph.addEventListener("click", evt => {
        evt.stopPropagation();
        alert("not ready paragraph");
    });
    btnEdit.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getLastFinalOut();
        eltToEdit.setAttribute("contenteditable", true);
        eltToEdit.focus();
        // setTimeout(() => { eltToEdit.focus(); }, 200);
        eltToEdit.addEventListener("focusout", evt => {
            eltToEdit.setAttribute("contenteditable", false);
        });
    });
    btnDelete.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getLastFinalOut();
        console.log({ eltToEdit });
        // debugger;
        eltToEdit.remove();
        const eltOutputText = document.getElementById("output-text");
        const eltOut = eltOutputText.querySelector(".final-out");
        if (!eltOut) {
            const eltEditButtons = document.getElementById("edit-buttons");
            eltEditButtons.inert = true;
        }
    });
    function getLastFinalOut() {
        const eltOutputText = document.getElementById("output-text");
        const eltLast = eltOutputText.querySelector(":last-child");
        return eltLast;
    }
    /**
     * {HTMLElement} elt
     * {string} punctuation
     */
    function UpperFirstCharPlusPunctuation(eltToEdit, punctuation) {
        const orig = eltToEdit.textContent;
        const first = orig.slice(0, 1);
        let tail = orig.slice(1);
        const last = orig.slice(-1);
        if (".!?".indexOf(last) > -1) {
            tail = tail.slice(0, -1);
        }
        const uFirst = first.toLocaleUpperCase();
        const fixed = uFirst.concat(tail, punctuation);
        eltToEdit.textContent = fixed;
    }

}


//////////// Copy to clipboard
// FIX-ME: NOT READY!
async function SYNCcopyElementToClipboard(htmlContent) {
    try {
        // 1. Create your temporary element to format/verify content
        const tempEl = document.createElement('div');
        tempEl.innerHTML = htmlContent;

        // (Optional) Tweak styles inline here to ensure Google Docs reads them
        // Example: tempEl.querySelectorAll('p').forEach(p => p.style.color = 'blue');

        // 2. Extract the formatted HTML string and a plain text fallback
        const htmlString = tempEl.innerHTML;
        const plainText = tempEl.innerText;

        // 3. Convert both into Blobs with specific MIME types
        const htmlBlob = new Blob([htmlString], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });

        // 4. Write to the clipboard via the modern API
        await navigator.clipboard.write([
            new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': textBlob
            })
        ]);

        console.log('Copied directly via modern Clipboard API!');
    } catch (err) {
        console.error('Modern API failed. Error code/message:', err);
    }
}

async function TESTASYNCElementToClipboard() {
    document.getElementById('copy-button').addEventListener('click', () => {

        // 1. Construct Promises that handle the heavy lifting/element generation
        const htmlPromise = new Promise(async (resolve) => {
            // Simulate complex element creation or a quick network request
            const response = await fetch('/api/get-docs-template');
            const data = await response.json();

            const tempEl = document.createElement('div');
            tempEl.innerHTML = `<div style="font-family: Calibri;">${data.html}</div>`;
            resolve(new Blob([tempEl.innerHTML], { type: 'text/html' }));
        });

        const textPromise = new Promise(async (resolve) => {
            // Keep this synced with your HTML data payload
            const response = await fetch('/api/get-docs-template');
            const data = await response.json();
            resolve(new Blob([data.plainText], { type: 'text/plain' }));
        });

        // 2. Hand off the Promises synchronously inside the click handler
        // This satisfies the browser's strict security timing constraint!
        navigator.clipboard.write([
            new ClipboardItem({
                'text/html': htmlPromise,
                'text/plain': textPromise
            })
        ]).then(() => {
            console.log("Background processing complete. Written to Google Docs clipboard format!");
        }).catch((err) => {
            console.error("Clipboard assignment failed:", err);
        });
    });
}

/////// Storing
function debounce(func, wait) {
    let timeoutId;

    return function (...args) {
        const context = this;

        // Clear any existing active timer
        clearTimeout(timeoutId);

        // Set a new timer to execute the function
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/*
function handleInput() {
    console.log("------- handleInput");
}
const processInput = debounce(handleInput, 1000);
function checkInput() {
    processInput();
}
*/



// 2. Select the HTML element you want to monitor
const targetElement = document.getElementById('my-element');

// 3. Define the actual task you want to execute after changes stop
function handleDomChanges(mutations) {
    // console.log(`DOM stabilized. Processing ${mutations.length} bundled changes.`);

    // Example loop to see exactly what changed:
    mutations.forEach(mutation => {
        console.log(`Change type detected: ${mutation.type}`);
    });
    console.log({ modOPFS });
    debugger;
}
async function saveToOPFS(mutations) {
    try {
        const targetElement = document.getElementById("output-text");
        // Get text content from our observed element
        // const contentToSave = targetElement.innerText;
        const contentToSave = targetElement.innerHTML;

        // Get the root of the Origin Private File System
        const root = await navigator.storage.getDirectory();

        // Get (or create) a reference to your file
        const fileHandle = await root.getFileHandle("autosave.txt", { create: true });

        // Create a writeable stream access point
        const writable = await fileHandle.createWritable();

        // Write your DOM content and immediately close the stream to save disk space
        await writable.write(contentToSave);
        await writable.close();

        console.log(`Saved to OPFS at ${new Date().toLocaleTimeString()}! Data size: ${contentToSave.length} chars.`);
    } catch (error) {
        console.error("Failed to write data to OPFS:", error);
    }
}


// 4. Wrap your task function with debounce (e.g., wait 500ms of silence)
// const debouncedProcess = debounce(handleDomChanges, 3000);
const debouncedProcess = debounce(saveToOPFS, 3000);

// 5. Create the observer and pass the debounced function as the callback
const observerOutputText = new MutationObserver((mutationsList) => {
    // Pass the accumulated mutations list to your debounced handler
    debouncedProcess(mutationsList);
});

// 6. Define what to watch (Attributes, Child Elements, and Text)
const config = {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
};

function startMonitoringOutputText() {
    const targetElement = document.getElementById("output-text");
    observerOutputText.observe(targetElement, config);
    console.log("Observer activated.");
}
function stopMonitoringOutputText() {
    observerOutputText.disconnect();
    console.log("Observer stopped.");
}

// Get old text
const p = modOPFS.getSavedFileBlob("autosave.txt")
const t = await p;
const t2 = await t.text();
// output-text
const eltOutputText = document.getElementById("output-text");
eltOutputText.innerHTML = t2;

startMonitoringOutputText();

