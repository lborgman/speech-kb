// @ts-check
const SPEECH_KB_VER = "0.0.01";
// @ts-ignore
// logConsoleHereIs(`here is basic-ui.js, module,${SPEECH_KB_VER}`);
console.log(`here is basic-ui.js, module,${SPEECH_KB_VER}`);
if (document.currentScript) throw Error("import .currentScript"); // is module

// @ts-ignore
const mkElt = window["mkElt"];

// debugger;
export function dummyMakeMeModule() { }

const modBasicUI = await importFc4i("basic-ui");
const modOPFS = await importFc4i("opfs");

const STORING_PREFIX = "SPEECH-KB-";
modOPFS.setMyOpfsDirectory(STORING_PREFIX);
const modLocalSettings = await importFc4i("local-settings");
class OurLocalSetting extends modLocalSettings.LocalSetting {
    /**
     * @param {string} key
     * @param {number|boolean|string} definitionValue
     */
    constructor(key, definitionValue) {
        super(STORING_PREFIX, key, definitionValue);
    }

}

class SettingSelect {
    constructor(storingPrefix, eltSelect, defaultValue) {
        this.eltSelect = eltSelect;
        const id = eltSelect.id;
        if (!id || id.length == 0) {
            const msg = "eltSelect has no id";
            console.error(msg, eltSelect);
            debugger;
            throw Error(msg);
        }
        this.storingPrefix = storingPrefix;
        const strDefault = defaultValue || eltSelect.value;
        const tofDefault = typeof strDefault;
        if (tofDefault != "string") {
            debugger;
            throw Error("strDefault is not a string");
        }
        const storer = new modLocalSettings.LocalSetting(storingPrefix, id, strDefault);
        this.storer = storer;
        eltSelect.value = storer.value;
        eltSelect.addEventListener("input", () => {
            debugger;
            storer.value = eltSelect.value;
        })
    }
}
const strNoDoc = "(no document)";
const settingCurrentDoc = new OurLocalSetting("current-doc", strNoDoc);
const settingAdvancedSpeech = new OurLocalSetting("advanced-speech", false);
const settingDeepgramApiKey = new OurLocalSetting("deepgram-api-key", "");
const settingWebsocket1006 = new OurLocalSetting("websocket-1005", false);


/**
 * @returns {HTMLDivElement}
 */
function getElementOutputText() {
    const eltOutputText = document.getElementById("output-text");
    if (!eltOutputText) throw Error("Did not find output-text");
    return eltOutputText;
}
const eltOutputText = document.getElementById("output-text");
if (!eltOutputText) throw Error("Did not find output-text");

const eltMicStatus = document.getElementById("mic-status");

const langSelectChrome = document.getElementById('speech-lang-chrome');
new SettingSelect(STORING_PREFIX, langSelectChrome);
const langSelectDeepgram = document.getElementById('speech-lang-deepgram');
new SettingSelect(STORING_PREFIX, langSelectDeepgram);

// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechRecognition = window.SpeechRecognition;
const recognition = new SpeechRecognition();

// CRITICAL: Set to true so the microphone stays open 
// even when you pause between words.
recognition.continuous = true;
recognition.interimResults = true; // Show results live as you speak
recognition.lang = 'en-US';

// --- CONTROLS ---

// 1. START: Turns on microphone, begins listening
let transcriber;


// 2. STOP: Stops listening and FINISHES processing current speech
function tellTapMic(eltMicSts) {
    eltMicSts.textContent = "↫ Tap mic to speak";
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
    if (!eltDebug) {
        debugger;
        throw Error('Did not find element "debug"');
    }
    // eltDebug.appendChild(elt);
    // elt.scrollIntoView();
    eltDebug.insertBefore(elt, eltDebug.firstElementChild);
}
debugOutput("--- DEBUG ---");
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
            recognition.lang = langSelectChrome.value;
            recognition.start();
        } catch (_) {
            // already starting — ignore
        }
    }
});











// Example: Replace with your app's function
function yourAppHandleResult(text) {
    // console.log("Reporting to app:", text);
    // Your app logic here (e.g., update a textarea, send to server, etc.)
    const eltOut = mkElt("div", undefined, text);
    eltOut.dataset.orig = text;
    UpperFirstCharPlusPunctuation(eltOut, ".");
    eltOut.classList.add("final-out");

    eltOutputText.appendChild(eltOut);
    eltOut.scrollIntoView({ block: "end", behavoir: "auto" });

    // Claude:
    eltOutputText.appendChild(eltOut);

    const cs = getComputedStyle(eltOutputText);
    /*
    console.log('overflow-y:', cs.overflowY, 'height:', cs.height, 'max-height:', cs.maxHeight);
    console.log('scrollTop:', eltOutputText.scrollTop,
        'scrollHeight:', eltOutputText.scrollHeight,
        'clientHeight:', eltOutputText.clientHeight);
    */

    eltOut.scrollIntoView();

    // console.log('AFTER scrollIntoView scrollTop:', eltOutputText.scrollTop);

    eltOutputText.scrollTop = eltOutputText.scrollHeight;
    // console.log('AFTER manual scrollTop set:', eltOutputText.scrollTop);




    // Handle the rendering race:
    // setTimeout(() => { eltOut.scrollIntoView(); }, 0);
    // setTimeout(() => { eltOut.scrollIntoView(); }, 1000);
    // Force the parent container scrollbar to match its maximum height
    // requestAnimationFrame(() => { eltOutputText.scrollTop = eltOutputText.scrollHeight; });
    // Wait a tiny fraction for layout engine synchronization
    setTimeout(() => { eltOutputText.scrollTop = eltOutputText.scrollHeight; }, 10);
    // The Fix: Force an impossibly high fallback value (like 9999999) 
    // setTimeout(() => { eltOutputText.scrollTop = 9e9 }, 10);

    // Force an instant layout jump, bypassing CSS transitions
    /*
    eltOutputText.style.scrollBehavior = 'auto';
    eltOutputText.scrollTop = eltOutputText.scrollHeight;

    // Put the smooth transition back for normal user scrolling
    requestAnimationFrame(() => {
        eltOutputText.style.scrollBehavior = 'smooth';
    });
    */

    // A simple function to cleanly separate your logic across browser event ticks
    /*
    const waitForRender = () => new Promise(resolve => setTimeout(resolve, 0));

    async function appendAndScroll() {
        eltOutputText.appendChild(eltOut);

        // Pause execution entirely until the browser flushes the layout queue
        await waitForRender();

        // Directly execute the scrolling movement
        eltOutputText.scrollTo({
            top: eltOutputText.scrollHeight,
            behavior: 'auto' // 'auto' ensures immediate jumping, bypassing transition freezes
        });
    }

    appendAndScroll();
    */


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
    // showListening(false);
    recognition.addEventListener("start", () => {
        showListening(true);
    });
    recognition.addEventListener("end", () => {
        showListening(false);
    });


    const btnDoc = document.getElementById("doc");
    btnDoc.addEventListener("click", evt => {
        evt.stopPropagation()
        const dialogMenu = modBasicUI.mkDialogMenu();

        modBasicUI.addMenuAlt(dialogMenu, "New document", async () => {
            const newName = prompt("New doc name:", "");
            if (newName == strNoDoc) {
                debugger;
                throw Error(`invalid doc name: ${newName}`)
            }
            userStopListening();
            // tap mic
            settingCurrentDoc.value = newName;
            displayDocInfo();
            eltOutputText.textContent = "";
        });
        modBasicUI.addMenuAlt(dialogMenu, "Open document", async () => {
            console.log({ modOPFS });
            const list = await modOPFS.listDirectoryContents();
            const files = list.files;
            console.log({ list, files });
            const eltFiles = mkElt("div", { id: "elt-docs" });
            eltFiles.style = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            const body = mkElt("div", undefined, [
                mkElt("h2", undefined, "Documents"),
                eltFiles,
            ]);
            if (files.length == 0) {
                eltFiles.textContent = "No documents";
            } else {
                files.forEach(f => {
                    const eltFile = mkOpenButton(f);
                    eltFiles.appendChild(eltFile);
                });
            }
            function mkOpenButton(fileName) {
                if (fileName == settingCurrentDoc.valueS) {
                    return mkElt("div", undefined, `${fileName} - current`);
                }
                const btn = mkElt("button", { class: "open-doc-button" }, fileName);
                btn.addEventListener("click", evt => {
                    // evt.stopPropagation();
                    // debugger;
                    settingCurrentDoc.value = fileName;
                    // userStopListening();
                    // displayDocInfo();
                    // loadDoc(fileName);
                    doTheDocLoading(fileName);
                    const dlg = btn.closest("dialog");
                    dlg.close();
                })
                return btn;
            }
            // const dlg = mkElt("dialog", undefined, body);
            modBasicUI.showDialog(body);
        });

        modBasicUI.addMenuDivider(dialogMenu);

        const eltDebugTitle = mkElt("span", { style: "background-color:red;padding:8px;" }, "DEBUGGING");
        modBasicUI.addMenuAlt(dialogMenu, eltDebugTitle);

        const eltClearOpfsTitle = mkElt("span", { style: "color:red;" }, "Clear whole OPFS (don't use!)");
        modBasicUI.addMenuAlt(dialogMenu, eltClearOpfsTitle, () => {
            console.log({ modOPFS });
            modOPFS.clearOPFS();
            settingCurrentDoc.reset();
            eltOutputText.innerText = "";
            displayDocInfo();
        });
        modBasicUI.addMenuAlt(dialogMenu, "List OPFS to console (debugging tool)", async () => {
            const divList = mkElt("div", undefined, [
                mkElt("h2", undefined, "OPFS list"),
            ]);
            // const list = await modOPFS.listOPFS(await modOPFS.getMyOpfsRoot());
            const list = await modOPFS.listOPFS();
            list.forEach(element => {
                divList.appendChild(mkElt("div", undefined, element));
            });
            modBasicUI.showDialog(divList);
            return;
            const opfsContent = await modOPFS.listDirectoryContents();
            console.log({ opfsContent });
        });


        const objDlgPosition = {
            parent: btnDoc,
            // relativeX: "right-inner",
            // relativeX: "left-inner",
        }
        modBasicUI.displayMenu(dialogMenu, objDlgPosition);

    })
    async function userStartListening() {
        shouldKeepListening = true;
        if (settingAdvancedSpeech.getValueB()) {
            if (!transcriber) {
                const modDeepgram = await importFc4i("deepgram")
                console.log({ modDeepgram });
                // const apiKey = settingDeepgramApiKey.valueS;
                const apiKey = settingDeepgramApiKey.getValueS();
                const langSelect = document.getElementById("speech-lang-deepgram");
                if (!(langSelect instanceof HTMLSelectElement)) {
                    debugger;
                    throw Error("Did not find speech-lang-deepgram");
                }
                const lang = langSelect.value;
                transcriber = modDeepgram.createDeepgramTranscriber(apiKey, lang, transcriberCallback);
                console.log({ transcriber });
            }
            transcriber.start();
        } else {
            recognition.lang = langSelectChrome.value;
            recognition.start();
        }
    }
    function userStopListening() {
        shouldKeepListening = false;
        if (settingAdvancedSpeech.getValueB()) {
            if (transcriber) {
                transcriber.stop();
            }
        } else {
            recognition.stop();
        }
        // const elt = document.getElementById("mic-status");
        // tellTapMic(elt);
    }


    function showListening(on) {
        const eltMicStatus = document.getElementById("mic-status");
        if (!eltMicStatus) {
            throw Error(`Did not find "mic-status"`);
        }
        if (on) {
            document.documentElement.classList.add("mic-is-on");
            eltMicStatus.textContent = "Microphone is on";
            document.querySelectorAll("select.select-lang").forEach(sel => sel.setAttribute("disabled", ""));
        } else {
            if (eltMicStatus) {
                tellTapMic(eltMicStatus);
            }
            document.documentElement.classList.remove("mic-is-on");
            document.querySelectorAll("select.select-lang").forEach(sel => sel.removeAttribute("disabled"));
        }
    }

    /*
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
        const isOn = document.documentElement.classList.contains("mic-is-on");
        if (isOn) {
            userStopListening();
        } else {
            userStartListening();
        }
    });
    */
    const eltMicOff = mkElt("div");
    eltMicOff.id = "mic-off";
    eltMicOff.classList.add("mic-btn");
    eltMicOff.style.backgroundImage = "url(./img/gmic-gray.svg)";
    eltMicOff.addEventListener("click", evt => {
        evt.stopPropagation();
        userStartListening();
    });

    const eltMicOn = mkElt("div");
    eltMicOn.id = "mic-on";
    eltMicOn.classList.add("mic-btn");
    eltMicOn.style.backgroundImage = "url(./img/gmic-greenyellow.svg)";
    eltMicOn.addEventListener("click", evt => {
        evt.stopPropagation();
        userStopListening();
    });

    // const eltMicStatus = mkElt("div", { id: "mic-status" }, "↫ Tap mic to speak");
    const eltMicStatus = mkElt("div", { id: "mic-status" });
    tellTapMic(eltMicStatus);

    eltMicStatus.style = `
                display: flex;
                align-content: center;
                flex-wrap: wrap;
                display: none;
            `;

    const divOnOffButtons = document.getElementById("on-off-buttons");
    // divOnOffButtons.append(btnStart, btnStop, eltMic);
    const eltBothMics = mkElt("div", undefined, [eltMicOff, eltMicOn])
    const eltTheMic = mkElt("span", { id: "the-mic" }, [eltBothMics, eltMicStatus]);
    const inpModel = settingAdvancedSpeech.getInputElement();
    inpModel.style.backgroundColor = "var(--color-for-advanced)";
    inpModel.style.borderColor = "var(--color-for-advanced)";
    inpModel.style.color = "var(--color-text-for-advanced)";
    const lblModel = mkElt("label", undefined, [
        "Advanced: ",
        inpModel
    ]);
    if (inpModel.checked) {
        document.documentElement.classList.add("websocket-model");
    }
    inpModel.addEventListener("change", async evt => {
        console.log(inpModel.checked);
        if (inpModel.checked) {
            document.documentElement.classList.add("websocket-model");
        } else {
            document.documentElement.classList.remove("websocket-model");
        }
        return;
        if (inpModel.checked) {
            // deepGramDialog();
            checkDeepGram();
        }
    });
    // const btnKey = modBasicUI.mkIconButton("⚿");
    const btnKey = modBasicUI.mkIconButton("⚲");
    btnKey.id = "btn-key";
    btnKey.addEventListener("click", evt => {
        evt.stopPropagation();
        deepGramDialog();
    })
    const eltKey = mkElt("span", undefined, btnKey)
    const eltModel = mkElt("span", { id: "the-model" }, [lblModel, eltKey]);
    /*
    eltModel.style = `
        display: flex;
        gap: 10px;
        align-items: center;
    `;
    */
    divOnOffButtons.append(eltTheMic, eltModel);


    /************** EDIT ***********/
    const btnDot = mkElt("button", undefined, ".");
    const btnExclamation = mkElt("button", undefined, "!");
    const btnQuestion = mkElt("button", undefined, "?");
    const btnParagraph = mkElt("button", undefined, "¶");
    const btnEdit = mkElt("button", undefined, "✎");
    const btnDelete = mkElt("button", undefined, "⌫");
    const btnRevert = mkElt("button", undefined, "⟲");

    // const divEditButtons = document.getElementById("edit-buttons");
    const divMinorEditButtons = document.getElementById("minor-edit-buttons");
    divMinorEditButtons.append(
        btnDot,
        btnExclamation,
        btnQuestion,
        btnParagraph,
    );
    const divMajorEditButtons = document.getElementById("major-edit-buttons");
    divMajorEditButtons.append(
        btnDelete,
        btnRevert,
        btnEdit,
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
        eltToEdit.remove();
        checkEditButtonsState();
        /*
        const eltOut = eltOutputText.querySelector(".final-out");
        if (!eltOut) {
            const eltEditButtons = document.getElementById("edit-buttons");
            eltEditButtons.inert = true;
        }
        */
    });
    btnRevert.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getLastFinalOut();
        eltToEdit.textContent = eltToEdit.dataset.orig;
    });
    function getLastFinalOut() {
        // const eltOutputText = document.getElementById("output-text");
        const eltLast = eltOutputText.querySelector(":last-child");
        return eltLast;
    }


    function transcriberCallback(what, objDetails) {
        const tofWhat = typeof what;
        if (tofWhat != "string") {
            debugger;
            throw Error(`tofWhat=="${tofWhat}"`);
        }

        // eltOutputText
        // console.warn("deepgramCallback: ", objDetails);
        switch (what) {
            case "websocket-open":
                debugOutput(what);
                showListening(true);
                break;
            case "websocket-close":
                debugOutput(what);
                showListening(false);
                break;
            case "websocket1006":
                debugOutput(what);
                debugger;
                settingWebsocket1006.value = objDetails;
                break;
            case "transcript":
                const isFinal = objDetails.isFinal;
                const tofIsFinal = typeof isFinal;
                if (tofIsFinal != "boolean") {
                    debugger;
                    throw Error(`tofIsFinal=="${tofIsFinal}"`);
                }
                const transcript = objDetails.transcript;
                const tofTranscript = typeof transcript;
                if (tofTranscript != "string") {
                    debugger;
                    throw Error(`tofTranscript=="${tofTranscript}"`);
                }
                debugOutput(`${what}:${isFinal}, transcript:"${transcript}"`);
                // console.log({transcript});
                if (isFinal) {
                    const text = transcript;
                    console.log("%cfinal", "color:red", text);
                    const eltOut = mkElt("div", undefined, text);
                    eltOut.dataset.orig = text;
                    eltOut.classList.add("final-out");
                    eltOutputText.appendChild(eltOut);
                    eltOut.scrollIntoView();
                }
                break;
            case "endpoint":
                // FIX-ME: what to do here??
                break;
            case "websocket-error":
                settingAdvancedSpeech.value = false;
                alert(what);
                break;
            default:
                console.error(`Unknown what=="${what}"`);
                debugger;
        }
    }

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
async function saveOutputTextToOPFS(mutations) {
    const fileName = settingCurrentDoc.getValueS();
    // const targetElement = document.getElementById("output-text");
    const contentToSave = eltOutputText.innerHTML;
    return modOPFS.saveTextAsBlob(fileName, contentToSave)

    /*
    try {
        const targetElement = document.getElementById("output-text");
        // Get text content from our observed element
        // const contentToSave = targetElement.innerText;
        const contentToSave = targetElement.innerHTML;

        // Get the root of the Origin Private File System
        const root = await navigator.storage.getDirectory();

        // Get (or create) a reference to your file
        const fileHandle = await root.getFileHandle(settingCurrentDoc.valueS, { create: true });

        // Create a writeable stream access point
        const writable = await fileHandle.createWritable();

        // Write your DOM content and immediately close the stream to save disk space
        await writable.write(contentToSave);
        await writable.close();

        console.log(`Saved to OPFS at ${new Date().toLocaleTimeString()}! Data size: ${contentToSave.length} chars.`);
    } catch (error) {
        console.error("Failed to write data to OPFS:", error);
    }
    */
}


// 4. Wrap your task function with debounce (e.g., wait 500ms of silence)
// const debouncedProcess = debounce(handleDomChanges, 3000);
const debouncedProcess = debounce(saveOutputTextToOPFS, 3000);

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

/*
function startMonitoringOutputText() {
    observerOutputText.observe(eltOutputText, config);
    console.log("Observer activated.");
}
function stopMonitoringOutputText() {
    observerOutputText.disconnect();
    console.log("Observer stopped.");
}
*/

{
    displayDocInfo();
    let theDocName = settingCurrentDoc.valueS;
    if (theDocName != strNoDoc) {
        doTheDocLoading(theDocName);
    }
}



function displayDocInfo() {
    const docName = settingCurrentDoc.valueS;
    if (docName != strNoDoc) {
        document.documentElement.classList.add("has-doc");
    } else {
        document.documentElement.classList.remove("has-doc");
    }
    const eltDocName = document.getElementById("doc-name");
    if (!eltDocName) throw Error("Did not find doc-name");
    eltDocName.textContent = docName;
    eltDocName.style.opacity = "1";
}

/**
 * @param {string} docName 
 */
async function loadDoc(docName) {
    // const eltOutputText = document.getElementById("output-text");
    // if (!eltOutputText) throw Error("Did not find output-text");
    eltOutputText.innerText = "";
    const promBlob = modOPFS.getSavedFileBlob(docName);
    const blob = await promBlob;
    if (blob) {
        const text = await blob.text();
        eltOutputText.innerHTML = text;
    }
}

async function doTheDocLoading(docName) {
    // userStopListening();
    await loadDoc(docName);
    displayDocInfo();
    checkEditButtonsState();
}
function checkEditButtonsState() {
    const eltEditButtons = document.getElementById("edit-buttons");
    const eltOut = eltOutputText.querySelector(".final-out");
    eltEditButtons.inert = !!!eltOut;
}

// startMonitoringOutputText();



async function checkDeepGram() {
    const keyVal = settingDeepgramApiKey.getValueS();
    if (keyVal == "") {
        settingAdvancedSpeech.value = false;
        deepGramDialog();
        return;
    }
    const sts1006 = settingWebsocket1006.getValueB();
    if (sts1006) {
        settingAdvancedSpeech.value = false;
        deepGramDialog();
        return;
    }
}
async function deepGramDialog() {
    const inpKey = settingDeepgramApiKey.getInputElement();
    inpKey.style.width = "100%";
    const keyVal = settingDeepgramApiKey.getValueS();
    const sts1006 = settingWebsocket1006.value;
    const eltKeyStatus = mkElt("div", { id: "elt-advanced-key-status" });
    // eltKeyStatus.style.padding = "4px";
    if (keyVal.length == 0) {
        eltKeyStatus.textContent = "(no saved key found)";
        eltKeyStatus.style.opacity = "0.5";
    } else {
        if (sts1006) {
            eltKeyStatus.style.color = "darkred";
            eltKeyStatus.textContent = "Your current key might be invalid!";
        } else {
            eltKeyStatus.style.color = "currentColor";
            eltKeyStatus.textContent = "As far as we know this key is ok.";
        }
    }
    inpKey.addEventListener("input", evt => {
        console.log("inpKey input event");
        eltKeyStatus.textContent = "(new key, unknown status)";
        eltKeyStatus.style.color = "unset";
        settingWebsocket1006.reset();
    });
    const aDeepgram = mkElt("a", {
        href: "https://deepgram.com/",
        target: "_blank"
    }, "Get new deepgram API key");
    const bdy = mkElt("div", undefined, [
        // mkElt("h2", { style: "color:red" }, "Better speech to text (not ready!)"),
        mkElt("h2", undefined, "Advanced speech to text"),
        mkElt("div", { style: "color:red" }, "(not quite ready!)"),
        mkElt("p", undefined, [
            `You need a valid API key for Deepgram for this!`
        ]),
        eltKeyStatus,
        mkElt("div", { style: "margin-bottom: 4px;" }, "Deepgram API key: "),
        inpKey,
        mkElt("p", undefined, aDeepgram)
    ]);
    // FIX-ME:
    const checkApiKeyWasGiven = async () => {
        // FIX-ME: This does not make showDialog async really
        // debugger;
        return false;
    }
    await modBasicUI.showDialog(bdy, checkApiKeyWasGiven);
    // debugger;
}
