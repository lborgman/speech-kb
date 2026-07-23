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
            // debugger;
            storer.value = eltSelect.value;
        })
    }
}
const strNoDoc = "(Default doc, never saved)";
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

function getElementForOp() {
    if (!eltOutputText) {
        debugger;
        throw Error("!eltOutputText");
    }
    const eltOp = eltOutputText.querySelector(".selected")
        ||
        eltOutputText.querySelector(":last-child");
    if (!eltOp) {
        // debugger;
        throw Error("!eltOp");
    }
    return eltOp;
}
function tryGetElementForOp() {
    try {
        const eltOp = getElementForOp();
        return eltOp;
    } catch (err) {
        console.log({ err });
        if (!(err instanceof Error)) {
            debugger;
            throw Error("not Error");
        }
        if (err.message == "!eltOp") { return; }
        debugger;
        throw Error("some error here");
    }
}


const eltMicStatus = document.getElementById("mic-status");

const langSelectChrome = document.getElementById('speech-lang-chrome');
new SettingSelect(STORING_PREFIX, langSelectChrome);
const langSelectDeepgram = document.getElementById('speech-lang-deepgram');
new SettingSelect(STORING_PREFIX, langSelectDeepgram);
langSelectChrome?.addEventListener("input", _evt => {
    console.log("input langSelectChrome");
    getRecognStatus();
});

// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// const SpeechRecognition = window.SpeechRecognition;
// @ts-ignore
const recognition = new SpeechRecognition();
let msRecognitionSpeechEnd = -1;


// CRITICAL: Set to true so the microphone stays open 
// even when you pause between words.
recognition.continuous = true;
recognition.interimResults = true; // Show results live as you speak
// recognition.lang = 'en-US';
{
    const sel = document.getElementById("speech-lang-chrome");
    if (!sel) throw Error("!sel");
    const val = sel.value;
    const opt = sel.querySelector("option:checked");
    console.log(sel, val, opt);
    // debugger;
    recognition.lang = val;
}


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
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' || // IPv6
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) // IPv4 127.0.0.1/8
);

if (isLocalhost) {
    // debugger;
    console.log('Running on localhost');
}

let shouldKeepListening = false;
let hasCommitted = false;
let finalText = "";

// This does not seem to work any more 2026-07-17
recognition.continuous = !isAndroid;   // true on Windows, false on Android

recognition.interimResults = true;

recognition.addEventListener("start", () => {
    hasCommitted = false;
    finalText = "";
});

recognition.OLDonresult = (event) => {
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
recognition.onresult = (event) => {
    let currentAndroidUtterance = "";

    // Walk only new results this event delivered
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];

        if (r.isFinal) {
            // Safer extraction: explicitly check index 0 of the result alternative
            const utterance = r[0] ? r[0].transcript.trim() : "";

            if (utterance) {
                if (isAndroid) {
                    // On Android, always grab the absolute latest state of the string
                    currentAndroidUtterance = utterance;
                } else {
                    // Desktop: Immediately execute processing for this specific chunk
                    yourAppHandleResult(utterance);
                }
            }
        }
    }

    // Android Handling: Only commit if we found a valid, non-empty final string
    if (isAndroid && currentAndroidUtterance) {
        yourAppHandleResult(currentAndroidUtterance);
    }
};


function debugOutput(txt) {

    // Filter:
    if (txt.match("transcript:")) { return; }
    if (txt == "result") { return; }
    // if (txt == "start") { return; }
    if (txt == "audiostart") { return; }
    if (txt == "audioend") { return; }
    if (txt == "soundstart") { return; }
    if (txt == "soundend") { return; }
    if (txt == "speechstart") { return; }
    if (txt == "speechend") { return; }

    const elt = mkElt("div", undefined, txt);

    if (txt.match("start")) {
        elt.textContent = "S";
        elt.style.color = "greenyellow";
    }
    if (txt.match("websocket-open")) { elt.style.color = "greenyellow"; }
    if (txt.match("end")) {
        elt.textContent = "E";
        elt.style.color = "red";
    }
    if (txt.match("websocket-close")) { elt.style.color = "red"; }
    if (txt.match("onerror:")) {
        elt.style.color = "red";
        elt.style.fontStyle = "italic";
    }

    const eltDebug = document.getElementById("debug");
    if (!eltDebug) {
        debugger;
        throw Error('Did not find element "debug"');
    }
    // eltDebug.appendChild(elt);
    // elt.scrollIntoView();
    eltDebug.insertBefore(elt, eltDebug.firstElementChild);

    // const eltEditButtons = document.getElementById("edit-buttons");
    // if (!eltEditButtons) { throw Error(`Did not find "edit-buttons"`); }
    // eltEditButtons.inert = false;
    checkEditButtonsState();
}
debugOutput("-DEBUG-");
const lifeEvents = [
    "start", "audiostart", "soundstart", "speechstart",
    "speechend", "soundend", "audioend", "end", "result"
];
// debugger;
lifeEvents.forEach(evtName => {
    recognition.addEventListener(evtName, evt => {
        debugOutput(evtName)
    })
})


// recognition.onerror = (e) => {
recognition.addEventListener("error", (e) => {
    debugOutput(`onerror:${e.error}`);

    // no-speech / aborted are normal between phrases on Android
    if (e.error !== "no-speech" && e.error !== "aborted") {
        shouldKeepListening = false;
        // mic-is-on
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
    debugOutput(`SKL:${shouldKeepListening}`);
    if (shouldKeepListening) {
        const msSinceStart = Date.now() - msRecognitionSpeechEnd;
        // debugger;
        console.log("E,shouldKeepListening", msSinceStart);
        debugOutput(`E,skl,${msSinceStart}`);
        if (msSinceStart > 10 * 1000) {
            console.log("E,shouldKeepListening > 10");
            debugOutput(`E,skl,>10`);
            return;
        }
        try {
            recognition.lang = langSelectChrome.value;
            // msRecognitionStart = Date.now();
            recognition.start();
        } catch (_) {
            // already starting — ignore
            console.log("E,already starting — ignore");
            debugOutput("E,as");
        }
    } else {
        debugOutput(`NOT-SKL`);
    }
});
recognition.addEventListener("speechstart", () => {
    console.log("----- speechstart 2");
    msRecognitionSpeechEnd = Date.now();
});
recognition.addEventListener("speechend 2", () => {
    console.log("----- speechend");
    msRecognitionSpeechEnd = Date.now();
});











// Example: Replace with your app's function
function yourAppHandleResult(text) {
    // console.log("Reporting to app:", text);
    // Your app logic here (e.g., update a textarea, send to server, etc.)
    const eltOut = mkElt("div", undefined, text);
    eltOut.dataset.orig = text;
    UpperFirstCharPlusPunctuation(eltOut, ".");
    eltOut.classList.add("final-out");


    // eltOutputText.appendChild(eltOut);
    const eltOp = tryGetElementForOp();
    const eltOpNext = eltOp?.nextElementSibling;
    if (!eltOutputText) throw Error("!eltOutputText");
    eltOutputText.insertBefore(eltOut, eltOpNext);
    if (eltOp) {
        if (eltOp.classList.contains("selected")) {
            eltOp.classList.remove("selected");
            if (eltOut.nextElementSibling) {
                eltOut.classList.add("selected");
            }
        }
    }



    eltOut.scrollIntoView({ block: "end", behavoir: "auto" });

    // Claude:
    // eltOutputText.appendChild(eltOut);

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
    setTimeout(() => { eltOutputText.scrollTop = eltOutputText.scrollHeight; }, 10);

    // const eltEditButtons = document.getElementById("edit-buttons");
    // eltEditButtons.inert = false;
    checkEditButtonsState();
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
            if (newName == null) {
                modBasicUI.snackbar("Aborted...", 1.2, { bg: "black", clr: "white" });
                return;
            }
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
        modBasicUI.addMenuAlt(dialogMenu, "Documents", async () => {
            console.log({ modOPFS });
            const list = await modOPFS.listMyDirectoryContents();
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
                    const btnOpen = mkOpenButton(f);
                    const btnDelete = mkDeleteButton(f);
                    const eltFile = mkElt("div", undefined, [btnOpen, btnDelete]);
                    eltFile.style = `
                        display: flex;
                        gap: 20px;
                        justify-content: space-between;
                    `;
                    eltFiles.appendChild(eltFile);
                });
            }
            function mkOpenButton(fileName) {
                if (fileName == settingCurrentDoc.getValueS()) {
                    return mkElt("div", undefined, `${fileName} - current`);
                }
                const btn = mkElt("button", { class: "open-doc-button" }, fileName);
                btn.addEventListener("click", evt => {
                    settingCurrentDoc.value = fileName;
                    doTheDocLoading(fileName);
                    const dlg = btn.closest("dialog");
                    dlg.close();
                })
                return btn;
            }
            function mkDeleteButton(fileName) {
                const btn = mkElt("button", { class: "delete-doc-button" }, "DEL");
                btn.addEventListener("click", async evt => {
                    debugger;
                    await modOPFS.deleteSavedFileBlob(fileName);
                    btn.style.visibility = "hidden";
                    const parent = btn.parentElement;
                    parent.style.textDecoration = "line-through";
                    if (settingCurrentDoc.getValueS() == fileName) {
                        settingCurrentDoc.reset();
                        doTheDocLoading(settingCurrentDoc.getValueS());
                    }
                })
                return btn;
            }
            // const dlg = mkElt("dialog", undefined, body);
            modBasicUI.showDialog(body);
        });

        modBasicUI.addMenuDivider(dialogMenu);

        modBasicUI.addMenuAlt(dialogMenu, "Copy to clipboard", () => {
            if (!eltOutputText) throw Error("!eltOutputText");
            const text = eltOutputText?.textContent;
            copyTextToClipboard(text);
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
        modBasicUI.addMenuAlt(dialogMenu, "List OPFS (debugging)", async () => {
            const divList = mkElt("div", undefined, [
                mkElt("h2", undefined, "OPFS list"),
            ]);
            // const list = await modOPFS.listOPFS(await modOPFS.getMyOpfsRoot());
            const list = await modOPFS.listOPFS();
            list.forEach(lineText => {
                const txt = lineText.trimLeft();
                const numSpaces = lineText.length - txt.length;
                // console.log({lineText, numSpaces});
                const eltLine = mkElt("div", undefined, txt);
                eltLine.style.paddingLeft = `${numSpaces * 8}px`;
                divList.appendChild(eltLine);
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

    });
    let seenWebSocketError;
    async function userStartListening() {
        shouldKeepListening = true;
        if (settingAdvancedSpeech.getValueB()) {
            if (!transcriber) {
                const modDeepgram = await importFc4i("deepgram")
                console.log({ modDeepgram });
                const apiKey = settingDeepgramApiKey.getValueS();
                // debugger;
                if (apiKey.length == 0) {
                    shouldKeepListening = false;
                    const bdy = mkElt("div", undefined, [
                        mkElt("h2", { style: "color:red;" }, "No API key"),
                        mkElt("p", undefined, "You need an API key for Deepgram."),
                        mkElt("p", { style: "font-style:italic;" }, `
                            Tip: You can turn off Advanced mode.
                            The basic mode is totally free and does not require an API key.
                            `)

                    ]);
                    modBasicUI.showDialog(bdy);
                    return;
                }
                const langSelect = document.getElementById("speech-lang-deepgram");
                if (!(langSelect instanceof HTMLSelectElement)) {
                    debugger;
                    throw Error("Did not find speech-lang-deepgram");
                }
                const lang = langSelect.value;
                transcriber = modDeepgram.createDeepgramTranscriber(apiKey, lang, transcriberCallback);
                console.log({ transcriber });
            }
            seenWebSocketError = false;
            transcriber.start();
        } else {
            recognition.lang = langSelectChrome.value;
            msRecognitionSpeechEnd = Date.now();

            // https://github.com/WebAudio/web-speech-api/blob/main/explainers/on-device-speech-recognition.md
            //// Not available on Android yet:
            // https://chromestatus.com/feature/6090916291674112
            // SettingSelect

            /* @type {string} */
            // const status = await getRecognStatus();

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


    /**
     * @param {boolean} on 
     */
    function showListening(on) {
        console.warn("showListening", on);
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


    ////////////////////////////////
    // The four availability statuses:
    // available, downloadable, downloading, unavailable

    const eltRcgnLocalAvailable = mkElt("div", { id: "recogn-loc-available" }, [
        mkElt("div", { class: "recogn-loc-sym" })
    ]);
    const eltRcgnLocalUnvailable = mkElt("div", { id: "recogn-loc-unavailable" }, [
        mkElt("div", { class: "recogn-loc-sym" })
    ]);
    const eltRcgnLocalDownloadable = mkElt("div", { id: "recogn-loc-downloadable" }, [
        mkElt("div", { class: "recogn-loc-sym" })
    ]);
    const eltRcgnLocalDownloading = mkElt("div", { id: "recogn-loc-downloading" }, [
        mkElt("div", { class: "recogn-loc-sym" })
    ]);

    eltRcgnLocalDownloadable.addEventListener("click", async evt => {
        evt.stopPropagation();
        const ans = await dialogRecognDownloadSelectedLang();
        debugger;
        alert(`Not ready. ans==${ans}`);
    });


    const eltLocallyAvailability = mkElt("div", undefined, [
        eltRcgnLocalAvailable,
        eltRcgnLocalUnvailable,
        eltRcgnLocalDownloadable,
        eltRcgnLocalDownloading
    ]);




    const divOnOffButtons = document.getElementById("on-off-buttons");
    const eltBothMics = mkElt("div", { id: "mic-sym" }, [eltMicOff, eltMicOn])
    const eltTheMic = mkElt("span", { id: "the-mic" }, [
        eltBothMics,
        eltLocallyAvailability,
        eltMicStatus]);


    const inpModel = settingAdvancedSpeech.getInputElement();
    inpModel.style.backgroundColor = "var(--color-for-advanced)";
    inpModel.style.borderColor = "var(--color-for-advanced)";
    inpModel.style.color = "var(--color-text-for-advanced)";
    const lblModel = mkElt("label", undefined, [
        "DG: ",
        inpModel
    ]);
    if (inpModel.checked) {
        document.documentElement.classList.add("websocket-model");
    }
    inpModel.addEventListener("change", async evt => {
        // console.log(inpModel.checked);
        if (inpModel.checked) {
            document.documentElement.classList.add("websocket-model");
        } else {
            document.documentElement.classList.remove("websocket-model");
        }
        return;
        if (inpModel.checked) {
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
    const divEltModel = document.getElementById("elt-model");
    if (!divEltModel) throw Error("!divEltModel");
    divEltModel.appendChild(eltModel);



    // divOnOffButtons.append(eltTheMic, eltModel);
    divOnOffButtons.append(eltTheMic);


    /************** EDIT ***********/
    const btnDot = mkElt("button", undefined, ".");
    btnDot.title = "- punctuation dot";
    const btnExclamation = mkElt("button", undefined, "!");
    btnExclamation.title = "- punctuation exclamation";
    const btnQuestion = mkElt("button", undefined, "?");
    btnQuestion.title = "- punctuation question";
    const btnParagraph = mkElt("button", undefined, "¶");
    btnParagraph.title = "- add paragraph space";
    const btnEdit = mkElt("button", undefined, "✎");
    btnEdit.title = "- keyboard editing";
    const btnDelete = mkElt("button", undefined, "⌫");
    btnDelete.title = "- delete last sentence";
    const btnRevert = mkElt("button", undefined, "⟲");
    btnRevert.title = "- revert last sentence";

    const btnDebug = mkElt("button", undefined, "🐞");
    btnDebug.style = `
        background-color: lightblue;
        outline: 3px dotted red;
    `;
    btnDebug.addEventListener("click", evt => {
        evt.stopPropagation();
        document.documentElement.classList.toggle("show-debug");
    })

    const divMinorEditButtons = document.getElementById("minor-edit-buttons");
    if (!divMinorEditButtons) throw Error("!divMinorEditButtons");
    divMinorEditButtons.append(
        btnDot,
        btnExclamation,
        btnQuestion,
        btnParagraph,
    );
    const divMajorEditButtons = document.getElementById("major-edit-buttons");
    if (!divMajorEditButtons) throw Error("!divMajorEditButtons");
    divMajorEditButtons.append(
        btnDelete,
        btnRevert,
        btnEdit,
        btnDebug,
    );
    btnDot.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getElementForOp();
        UpperFirstCharPlusPunctuation(eltToEdit, ".");
    });
    btnExclamation.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getElementForOp();
        UpperFirstCharPlusPunctuation(eltToEdit, "!");
    });
    btnQuestion.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getElementForOp();
        UpperFirstCharPlusPunctuation(eltToEdit, "?");
    });
    btnParagraph.addEventListener("click", evt => {
        evt.stopPropagation();
        // alert("not ready paragraph");
        const eltToEdit = getElementForOp();
        if (!eltToEdit) { throw Error("Did not find elt to edit"); }
        const hadNewParagraph = eltToEdit.classList.contains("new-paragraph");
        const txt = eltToEdit.textContent;
        if (hadNewParagraph) {
            eltToEdit.textContent = txt.slice(2);
        } else {
            eltToEdit.textContent = `\n\n${txt}`;
        }
        eltToEdit.classList.toggle("new-paragraph");
    });
    btnEdit.addEventListener("click", async evt => {
        evt.stopPropagation();
        userStopListening();
        const ta = mkElt("textarea", { id: "textarea-edit" }, eltOutputText.textContent);
        const bdy = mkElt("div", undefined, [ta]);
        /*
        setTimeout(() => {
            // console.log({ta});
            // debugger;
            const s = ta.parentElement.nextElementSibling;
            const s1 = s.firstElementChild;
            const eltInfo = mkElt("span", undefined, "Keyboard");
            eltInfo.style.paddingRight = "20px";
            s.insertBefore(mkElt("span", undefined, eltInfo), s1);
        }, 200);
        */

        /*
        let isPending = false;
    
        function handleViewportChange() {
            if (isPending) return;
            isPending = true;
    
            // Syncs your UI update directly with the browser's next screen repaint
            requestAnimationFrame(() => {
                isPending = false;
    
                // Your heavy layout calculations go here
                // const { height, width, scale } = window.visualViewport;
                // console.log(`Viewport: ${width}x${height} at scale ${scale}`);
    
                // Get the exact physical pixel height currently visible to the human eye
                const currentVisualHeight = window.visualViewport.height;
                // Feed this raw number straight into your CSS variable
                document.documentElement.style.setProperty('--visible-height', `${currentVisualHeight}px`)
            });
        }
    
        // Attach the same listener to both scroll and resize for total accuracy
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
            // window.visualViewport.addEventListener('scroll', handleViewportChange); // Necessary for mobile pinch-zooming
        }
        */


        const ans = await modBasicUI.showDialogConfirm(bdy, "Save");
        console.log({ ans });
        if (!ans) {
            modBasicUI.snackbar("Aborted", 2);
            return;
        }
        debugger;
        const arrEltFinalOut = docStringToHtml(ta.value);
        eltOutputText.textContent = "";
        eltOutputText.append(...arrEltFinalOut);
        // arrEltFinalOut.forEach()
        return;

        const eltToEdit = getElementForOp();
        eltToEdit.setAttribute("contenteditable", true);
        eltToEdit.focus();
        // setTimeout(() => { eltToEdit.focus(); }, 200);
        eltToEdit.addEventListener("focusout", evt => {
            eltToEdit.setAttribute("contenteditable", false);
        });
    });
    btnDelete.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getElementForOp();
        console.log({ eltToEdit });
        eltToEdit.remove();
        checkEditButtonsState();
    });
    btnRevert.addEventListener("click", evt => {
        evt.stopPropagation();
        const eltToEdit = getElementForOp();
        eltToEdit.textContent = eltToEdit.dataset.orig;
    });


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
                // debugger;
                settingWebsocket1006.value = objDetails;
                {
                    // debugger;
                    const bdy = mkElt("div", undefined, [
                        mkElt("h2", { style: "color:red;" }, "Could not connect"),
                        mkElt("p", { style: "font-weight:bold;" }, "Your API key for Deepgram might be invalid."),
                        mkElt("p", { style: "font-style:italic;" }, `
                            Tip: You can turn off Advanced mode.
                            The basic mode is totally free and does not require an API key.
                            `)
                    ]);
                    modBasicUI.showDialog(bdy);
                }

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
                // settingAdvancedSpeech.value = false;
                seenWebSocketError = true;
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
    requestSave();
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
async function saveOutputTextToOPFS() {
    console.log("%c================= saveOutputTextToOPFS", "color:red;font-size:20px;");
    const fileName = settingCurrentDoc.getValueS();
    if (!fileName) {
        debugger;
    }
    if (!eltOutputText) {
        debugger;
        throw Error("!eltOutputText");
    }
    // const targetElement = document.getElementById("output-text");
    // const contentToSave = eltOutputText.innerHTML;
    // const contentToSave = eltOutputText.textContent;
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
const requestSave = debounce(saveOutputTextToOPFS, 3000);

// 5. Create the observer and pass the debounced function as the callback
/*
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
*/

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
    let theDocName = settingCurrentDoc.getValueS();
    if (theDocName != strNoDoc) {
        doTheDocLoading(theDocName);
    }
}



function displayDocInfo() {
    const docName = settingCurrentDoc.getValueS();
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
    const foundEltOut = !!eltOut;
    console.log({ foundEltOut, eltOut });
    // eltEditButtons.inert = !foundEltOut;
    document.documentElement.classList.remove("has-text");
    if (!foundEltOut) return;
    document.documentElement.classList.add("has-text");
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
        // settingAdvancedSpeech.value = false;
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



////// Edit
function docStringToHtml(str) {
    if (str.trim() == "") {
        return [];
    }
    const arrStr = str.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
    const arrHtml = arrStr.map(text => {
        const eltOut = mkElt("div", undefined, text);
        eltOut.dataset.orig = text;
        eltOut.classList.add("final-out");
        return eltOut;
    });
    return arrHtml;
}
function docHtmlToString(eltHtml) {
    return eltHtml.textContent;
}

async function getSizesForOutputText() {
    const eltOutputText = document.getElementById("output-text");
    const eltButtons = document.getElementById("edit-buttons");
    const sizes = await modBasicUI.waitForLayoutSilence([
        eltOutputText,
        eltButtons,
    ]);
    console.log({ sizes });
    const top = (sizes.get(eltOutputText)).top;
    const height = (sizes.get(eltButtons)).height;
    console.log({ top, height });
    const need = top + height;
    document.documentElement.style.setProperty('--output-text-extra', `${need}px`);
}
getSizesForOutputText();

function setupForSelectSentence() {
    const eltOutputText = document.getElementById("output-text");
    eltOutputText?.addEventListener("click", evt => {
        evt.stopPropagation();
        const target = evt.target;
        // debugger;
        if (!(target instanceof HTMLDivElement)) { return; }
        // if (target.tagName !="DIV") { return; }
        if (!target.classList.contains("final-out")) { return; }
        console.log({ target });
        if (target.classList.contains("selected")) {
            target.classList.remove("selected");
            return;
        }
        const eltsSelected = [...eltOutputText.querySelectorAll("div.selected")];
        if (eltsSelected.length > 1) {
            debugger;
            throw Error("More than one was selected");
        }
        if (eltsSelected.length == 1) {
            eltsSelected[0].classList.remove("selected");
        }
        if (target.nextElementSibling) {
            target.classList.add("selected");
        }
    });
}
setupForSelectSentence();

/**
 * @param {string} text
 */
async function copyTextToClipboard(text) {
    try {
        await navigator.clipboard.write([
            new ClipboardItem({
                // 'text/html': htmlBlob,
                'text/plain': text
            })
        ]);
        modBasicUI.snackbar("Copied to clipboard");
    } catch (err) {
        debugger;
        alert(`error copying to clipboard, ${err}`);
    }
}

const eltLogo = document.getElementById("logo");
if (!eltLogo) throw ("!eltLogo");
eltLogo.addEventListener("click", evt => {
    const aInfo = mkElt("a", {
        href: "https://lborgman.github.io/speech-kb/",
        target: "_blank"
    });
    aInfo.click();
})

async function getRecognStatus() {
    const lang = langSelectChrome.value;
    recognition.lang = lang;
    const options = { langs: [lang], processLocally: true };
    // const options = { langs: ['en-US'], processLocally: true };
    let status;
    try {
        status = await SpeechRecognition.available(options);
        // alert(`recognition locally for ${lang}: ${status}`);
    } catch (err) {
        // alert(`NO recognition locally for ${lang}: ${status}: ${err.name} - ${err.message}`);
        throw Error(`NO recognition locally for ${lang}: ${status}: ${err.name} - ${err.message}`);
    }
    document.documentElement.classList.remove(`recogn-loc-downloadable`);
    document.documentElement.classList.remove(`recogn-loc-downloading`);
    document.documentElement.classList.remove(`recogn-loc-available`);
    document.documentElement.classList.remove(`recogn-loc-unavailable`);
    document.documentElement.classList.add(`recogn-loc-${status}`);
    switch (status) {
        case "downloadable": {
            if (status == "downloadable") {
                // if (confirm(`${lang} can be recognized locally. Download this language?`)) {
                if (false) {
                    try {
                        console.log(`Starting model ${lang} download... This may take a minute.`);

                        // This triggers the browser's native permission/download prompt
                        const success = await SpeechRecognition.install(options);

                        if (success) {
                            alert(`Model downloaded successfully! You can now use offline for ${lang}.`);
                        } else {
                            alert("The download was cancelled or failed.");
                        }
                    } catch (err) {
                        alert(`Installation error: ${err.name} - ${err.message}`);
                    }
                }
            }
            break;
        }
        case "unavailable":
            recognition.options = {
                langs: [lang],
                processLocally: false
            };
            break;
        case "available":
            recognition.options = {
                langs: [lang],
                processLocally: true
            };
            break;
        default:
            throw Error(`status == "${status}`);
    }
    return status;
}

await getRecognStatus();


/**
 * @param {string} lang 
 */
async function recognDownloadLang(lang) {
    try {
        console.log(`Starting languagemodel ${lang} download... This may take a minute.`);

        // This triggers the browser's native permission/download prompt
        const success = await SpeechRecognition.install(options);

        if (success) {
            alert(`Model downloaded successfully! You can now use offline for ${lang}.`);
        } else {
            alert("The download was cancelled or failed.");
        }
    } catch (err) {
        alert(`Installation error: ${err.name} - ${err.message}`);
    }
}
async function dialogRecognDownloadSelectedLang() {
    const sel = document.getElementById("speech-lang-chrome");
    if (!sel) throw Error("!sel");
    const val = sel.value;
    const opt = sel.querySelector("option:checked");
    if (!opt) throw Error("!opt");
    const bdy = mkElt("div", undefined, [
        mkElt("h3", undefined, `Download ${opt.textContent} (${val}) for offline speech recognition?`),
    ]);
    const ans = await modBasicUI.showDialogConfirm(bdy);
    console.log({ ans });
    return ans;
}
