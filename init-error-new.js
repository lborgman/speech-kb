const INIT_ERROR_VER = "0.1.8";

if (!document.currentScript) throw Error("init-error.js must not be loaded as a module");

// Simple tagged console logger
window.logConsoleHereIs = (msg) => {
    // console.log(`%c${msg}`, "color:white; background-color:blue; padding: 0px 5px;");
}

window.logConsoleHereIs(`here is init-error.js ${INIT_ERROR_VER}`);

{
    let numErrors = 0;

    /**
     * @param {ErrorEvent | PromiseRejectionEvent} evt
     */
    const doDisplay = (evt) => {
        if (window["in-app-screen"]) return;
        if (numErrors++ > 0) return;

        // Extract the actual Error object
        // ErrorEvent:             evt.error  (the thrown value)
        // PromiseRejectionEvent:  evt.reason (the rejected value)
        const errorObj = evt instanceof ErrorEvent ? evt.error : evt.reason;

        const message =
            (errorObj instanceof Error ? errorObj.message : String(errorObj)) ||
            evt.message || // ErrorEvent fallback
            "Unknown error";

        const stack = errorObj instanceof Error ? errorObj.stack : null;

        // Optional custom alert hook
        if (typeof window["alertError"] === "function") {
            window["alertError"](message, evt);
            return;
        }

        // Build hint text
        let hint = "";
        if (/SyntaxError/.test(message)) {
            hint += "The file did not parse.";
            if (/export/.test(message)) hint += " It should probably be loaded as a module.";
        }

        // Build dialog
        const dlg = Object.assign(document.createElement("dialog"), {
            style: "background:red; color:black; font-size:1rem; max-width:90vw;"
        });

        dlg.append(
            Object.assign(document.createElement("h2"), { textContent: "Error" }),
            Object.assign(document.createElement("p"),  { textContent: message }),
        );

        if (hint) {
            dlg.append(Object.assign(document.createElement("p"), { textContent: hint }));
        }

        const pre = Object.assign(document.createElement("pre"), {
            textContent: [location.href, stack ?? `${evt.filename ?? "No filename"}:${evt.lineno ?? "?"}`].join("\n\n"),
            style: "background:orange; padding:4px; text-wrap:wrap; overflow-wrap:break-word;"
        });
        dlg.append(pre);

        const btn = Object.assign(document.createElement("button"), { textContent: "Close" });
        btn.addEventListener("click", () => dlg.close());
        dlg.append(btn);

        document.body.appendChild(dlg);
        dlg.showModal();
    };

    const displayError = (evt) => {
        if (document.readyState !== "loading") { doDisplay(evt); return; }
        document.addEventListener("DOMContentLoaded", () => doDisplay(evt), { once: true });
    };

    window.addEventListener("error", displayError);

    window.addEventListener("unhandledrejection", (evt) => {
        console.log("unhandledrejection", evt);
        displayError(evt);
    });
}

/** @global */
window.mkElt = (() => {
    /**
     * @param {string} type 
     * @param {DynamicStringObject} [attrib]
     * @param {string|string[]|HTMLElement|HTMLElement[]} [inner]
     * @returns {HTMLElement}
     */
    function mkElt(type, attrib, inner) {
        const elt = document.createElement(type);

        /**
         * 
         * @param {HTMLElement | HTMLElement[] | string | string[]} inr 
         */
        function addInner(inr) {
            if (inr instanceof Element) {
                elt.appendChild(inr);
            } else {
                const txt = document.createTextNode(inr.toString());
                elt.appendChild(txt);
            }
        }
        if (inner) {
            if (Array.isArray(inner) && inner.length && typeof inner != "string") {
                for (var i = 0; i < inner.length; i++)
                    if (inner[i])
                        addInner(inner[i]);
            } else
                addInner(inner);
        }
        for (var x in attrib) {
            elt.setAttribute(x, attrib[x]);
        }
        return elt;
    }
    return mkElt;
})();


// https://stackoverflow.com/questions/61080783/handling-errors-in-async-event-handlers-in-javascript-in-the-web-browser
/** @global */
window.errorHandlerAsyncEvent = (() => {
    // Error handling with Async/Await in JS - ITNEXT
    // https://itnext.io/error-handling-with-async-await-in-js-26c3f20bc06a
    /**
     * 
     * @param {function} asyncFun 
     * @returns 
     */
    function errorHandlerAsyncEvent(asyncFun) {
        return function (evt) {
            asyncFun(evt).catch(err => {
                console.log("handler", err);
                throw err;
            })
        }
    }
    return errorHandlerAsyncEvent;
})();

/**
 * 
 * @param {string} relLink 
 * @returns {string}
 */
// eslint-disable-next-line no-unused-vars
function makeAbsLink(relLink) {
    if (relLink.startsWith("/")) throw Error(`relLink should not start with "/" "${relLink}`);
    const u = new URL(relLink, document.baseURI);
    return u.href;
}
// window.makeAbsLink = makeAbsLink;

// throw "Test error";