// @ts-check

const BASIC_UI_VER = "0.0.01";
// @ts-ignore
logConsoleHereIs(`here is basic-ui.js, module,${BASIC_UI_VER}`);
if (document.currentScript) throw Error("import .currentScript"); // is module

// @ts-ignore
const mkElt = window["mkElt"];

/**
 * @param {function} [funClose]
 * @returns {HTMLButtonElement}
 */
export function mkXclose(funClose) {
    const xClose = mkElt("button", { class: "x-close" }, "✖");
    xClose.addEventListener("click", evt => {
        evt.stopPropagation();
        // debugger;
        if (funClose) {
            funClose();
            return;
        }
        (xClose.closest("dialog"))?.close();
    });
    return xClose;
}
export function addXclose(dialog) {
    const btnClose = dialog.querySelector("button[class=x-close]");
    if (btnClose) { return; }
    const elt = mkXclose();
    dialog.appendChild(elt);
    return elt;
}

document.documentElement.addEventListener("click",
    /** @param {MouseEvent} evt */
    evt => {
        // if (!evt.target) return;

        const target = /** @type {Element} */ (evt.target);

        const dialog = target;
        if (dialog instanceof HTMLDialogElement) {
            // FIX-ME: NOTE: first child element must covers the whole <dialog>
            const rect = dialog.getBoundingClientRect();
            const scrollbarWidth = dialog.offsetWidth - dialog.clientWidth;
            const xFromRight = rect.right - evt.clientX;
            // Ignore if click is in scrollbar area
            if (xFromRight <= scrollbarWidth && xFromRight > 0) {
                return;
            }
            evt.stopPropagation();
            evt.preventDefault();
            closeDialog(dialog);
            return;
        }

        const button = target.closest("button")
        if (button) {
            // console.log("----- button click", evt);
            if (!evt.isDelayedClick) {
                evt.stopImmediatePropagation();
                evt.preventDefault();
                // console.log("----- button click, !evt.isDelayedClick");
                addRippleAndClickDelayed(evt, button);
                return;
            }
            return;
        }
    }, { capture: true });

function addRippleAndClickDelayed(event, button) {
    const currentRipple = button.getElementsByClassName("ripple")[0];
    if (currentRipple) { return; }

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");



    const rippleDuration = getRootCssVarMs("--ripple-duration");
    console.log({ rippleDuration });
    // if (Number.isNaN(rippleDuration)) { throw Error("Did not get --ripple-timeout"); }
    // circle.addEventListener("animationend", () => { whenRippleFinishes(); });
    /* Much easier to use timeout.  And more flexible.  */
    setTimeout(whenRippleFinishes, rippleDuration * 0.5);



    function whenRippleFinishes() {
        console.log("whenRippleFinishes", { rippleDuration });
        circle.remove();
        const delayedClick = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        });
        delayedClick.isDelayedClick = true;
        button.dispatchEvent(delayedClick)
    }
    // getProperty

    button.appendChild(circle);
}

/*
const buttons = document.getElementsByTagName("button");
for (const button of buttons) {
  button.addEventListener("click", createRipple);
}
*/

/**
 * 
 * @param {HTMLDialogElement} dialog 
 */
function closeDialog(dialog) {
    console.log("closeDialog", dialog);
    dialog.close();
    if (!dialog.classList.contains("html-dialog")) {
        console.log("closeDialog remove");
        dialog.remove();
    }
}


/**
 * @param {any} icon 
 * @param {string} title 
 * @param {boolean} small 
 * @returns {HTMLButtonElement}
 */
export function mkFabButton(icon, title, small) {
    const btn = mkElt("button", undefined, icon);
    btn.classList.add("fab-button");
    btn.title = title;
    if (small) {
        btn.classList.add("fab-button-small");
    }
    return btn;
}

/**
 * 
 * @param {any} icon 
 * @param {string} title 
 * @returns {HTMLButtonElement}
 */
export function mkIconButton(icon, title) {
    const btn = mkElt("button", undefined, icon);
    btn.classList.add("icon-button");
    btn.title = title;
    return btn;
}



// Modify your dialog opening function to include this viewport verification check:
function openModalAndEnsureKeyboard(bdy) {
    const dlg = document.createElement("dialog");
    dlg.appendChild(bdy);
    document.documentElement.appendChild(dlg);

    // 1. Open the modal normally (browser will focus the Save button)
    dlg.showModal();

    // 2. Wait a split second for the mobile browser to process the focus change
    setTimeout(() => {
        if (!window.visualViewport) return;

        const visualHeight = window.visualViewport.height;
        const totalHeight = window.innerHeight;

        // 3. The Visual Viewport Check: 
        // If the difference is negligible, the keyboard DID NOT open.
        const keyboardIsOpen = (totalHeight - visualHeight) > 15;

        if (!keyboardIsOpen) {
            console.log("Viewport unchanged. Forcing focus to bring up keyboard.");

            // Look exclusively inside this dialog for the text element
            const textInput = dlg.querySelector(
                'textarea, input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), [contenteditable="true"]'
            );
            if (!(textInput instanceof HTMLElement)) {
                debugger;
                throw Error("textInput is not HTMLElement");
            }

            if (textInput) {
                textInput.focus();
                // textInput.click();
            }
        }
    }, 150); // 150ms gives the mobile OS time to trigger the viewport resize if it was going to
}



/**
 * Show a dialog.
 * To remove the upper right X close button
 * add CSS class "no-x-close-button" to bdy.
 * 
 * @param {HTMLDivElement} bdy 
 * @param {function|undefined} [retValFun]
 * @param {undefined|HTMLButtonElement[]} [buttons]
 * @param {string} [dialogClass]
 * @returns {Promise<any>}
 */
export async function showDialog(bdy, valFun, buttons, dialogClass) {
    if (valFun != undefined) {
        if (typeof valFun !== 'function') {
            debugger;
            throw new Error('Parameter "valFun" must be a function');
        }
        if (valFun.constructor.name !== 'AsyncFunction') {
            debugger;
            throw new Error('Function "valFun" must be async');
        }
        if (valFun.length !== 0) {
            debugger;
            throw new Error('Async function "valFun" must take 0 parameters');
        }
    }
    if (typeof bdy == "string") { bdy = mkElt("div", undefined, bdy); }
    if (!(bdy instanceof HTMLDivElement)) {
        debugger;
        throw Error("bdy is not <div>");
    }
    // bdy.classList.add("modal-scroll-body");
    const dlg = mkElt("dialog", undefined, bdy);
    if (dialogClass) dlg.classList.add(dialogClass);
    dlg.addEventListener("close", evt => { console.log("%%%%% dlg close"); });
    dlg.addEventListener("cancel", evt => { console.log("%%%%% dlg cancel"); });
    if (buttons) {
        let myButtons = buttons;
        if (!Array.isArray(myButtons)) { myButtons = [buttons]; }
        const eltButtons = mkElt("div", { class: "dialog-buttons" });
        myButtons.forEach(b => {
            if (!(b instanceof HTMLButtonElement)) {
                debugger;
                throw Error("showDialog: buttons must only contain <button>");
            }
            eltButtons.appendChild(b);
        });
        dlg.appendChild(eltButtons);
    }
    const eltX = addXclose(dlg);

    // Look exclusively inside this dialog for the text element
    const textInput = dlg.querySelector(
        'textarea, input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), [contenteditable="true"]'
    );
    if (textInput && !(textInput instanceof HTMLElement)) {
        debugger;
        throw Error("textInput is not HTMLElement");
    }

    if (textInput) {
        textInput.focus();
        dlg.classList.add("has-text-input");
        /** @type {HTMLDivElement|undefined} */
        const eltScroll = mkElt("div", {
            style: "height: 2px; background: red; padding: 0; margin:0;",
            class: "scroll-for-text-input"
        });
        dlg.insertBefore(eltScroll, dlg.firstElementChild);
        scrollForTextInput(dlg);
    }


    document.documentElement.appendChild(dlg);
    dlg.showModal();
    syncViewport();
    // openModalAndEnsureKeyboard(bdy);

    if (!valFun) return;
    const promClose = new Promise(resolve => {
        dlg.addEventListener("close", evt => { resolve("close"); });
    });
    // debugger;
    // const ans = await valFun();
    const ans = await Promise.race([valFun(), promClose]);
    const tofAns = typeof ans;
    if (tofAns != "boolean" && ans != "close") {
        debugger;
    }
    return ans;
}
/**
 * 
 * @param {HTMLDivElement} bdy 
 * @param {string} [ok]
 * @param {string} [cancel]
 */
export async function showDialogConfirm(bdy, ok, cancel, funOkButton) {
    bdy.classList.add("no-x-close-button"); // Remove the upper right X close button
    ok = ok || "OK";
    cancel = cancel || "Cancel";
    const btnTrue = mkElt("button", { class: "button-ok" }, ok);
    if (funOkButton) { funOkButton(btnTrue); }
    const btnFalse = mkElt("button", undefined, cancel);
    const funAns = async () => {
        return await new Promise(resolve => {
            btnTrue.addEventListener("click", evt => {
                resolve(true);
                closeMyDialog(btnTrue);
            });
            btnFalse.addEventListener("click", evt => {
                resolve(false);
                closeMyDialog(btnFalse);
            });
        });
    }
    const ans = await showDialog(bdy, funAns, [btnTrue, btnFalse]);
    if (ans == "close") {
        // Return false on close event
        return false;
    }
    const tofAns = typeof ans;
    if (tofAns != "boolean") {
        const msg = `showDialogConfirm: typeof ans == "${tofAns}`;
        console.error(msg);
        debugger;
        throw Error(msg);
    }
    return ans;
}
export function closeMyDialog(elt) {
    const dlg = elt.closest("dialog");
    dlg.close();
}

/**
 * Resolves after the browser completes its next layout and paint cycle.
 * 
 * @param {function} fun 
 * @returns 
 */
export function nextPaint(fun) {
    const tofFun = typeof fun;
    if (tofFun != "function") throw Error(`nextPaint, typeof fun == "${tofFun}"`);
    const lenFun = fun.length;
    if (lenFun != 0) throw Error(`nextPaint, fun.length == "${lenFun}"`);

    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            queueMicrotask(
                () => {
                    fun();
                    requestAnimationFrame(resolve);
                }
            );
        });
    });
}




/////////////
// Snackbars
/////////////

/** @returns {HTMLDivElement} */
function getEltSnackbar() {
    let elt = document.getElementById("snackbar");
    if (!elt) {
        // Native popover element configured manually so it doesn't light-dismiss
        elt = mkElt("div", { id: "snackbar", popover: "manual" });
        if (elt == null) { throw Error("elt == null"); }
        elt.addEventListener("click", evt => {
            evt.stopPropagation();
            toast.clearQueue();
        });
        document.body.appendChild(elt);
    }
    return /** @type {HTMLDivElement} */ (elt);
}
class SnackbarQueue {
    constructor() {
        this.snackbarPopover = getEltSnackbar();
        // this.queue = /** @type {string[]} */ [];
        /** @type {string[]} */
        this.queue = [];
        this.isDisplaying = false;

        // Allow clicking to dismiss early
        this.snackbarPopover.addEventListener('click', () => this.dismissCurrent());
    }

    /**
     * @param {string|HTMLDivElement} message
     * @param {number} duration
     */
    showBar(message, duration = 3000) {
        // Avoid queuing duplicate back-to-back messages
        if (this.queue.some(item => item.message === message)) return;

        this.queue.push({ message, duration });
        if (!this.isDisplaying) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.isDisplaying = false;
            console.log("processQueue: snackbar queue was empty");
            return;
        }

        this.isDisplaying = true;
        const { message, duration } = this.queue.shift();
        console.log("processQueue: snackbar duration", duration);

        // Set text directly on the popover container
        this.snackbarPopover = getEltSnackbar();
        this.snackbarPopover.textContent = "";
        this.snackbarPopover.append(message);
        this.snackbarPopover.showPopover();

        // Wait for display duration or manual click
        await new Promise((resolve) => {
            this.currentResolver = resolve;
            this.timeoutId = setTimeout(resolve, duration);
        });



        // From Gemini:
        dismissSnackbar(this.snackbarPopover);
        async function dismissSnackbar(popoverEl) {
            // Play the Material Design fast exit animation
            const animation = popoverEl.animate([
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(calc(100% + 2rem))' }
            ], {
                duration: 2000,
                easing: 'cubic-bezier(0.3, 0, 1, 1)'
            });

            // Wait for animation to finish before native hide
            await animation.finished;
            popoverEl.hidePopover();
            popoverEl.remove();
        }




        // Brief pause for CSS fade-out before showing the next snackbar
        setTimeout(() => this.processQueue(), 150);
    }

    dismissCurrent() {
        console.log("SnackbarQueue, dismissCurrent");
        if (this.currentResolver) {
            clearTimeout(this.timeoutId);
            this.currentResolver();
        }
    }

    clearQueue() {
        console.log("SnackbarQueue, clearQueue");
        this.queue.length = 0;
        this.dismissCurrent();
        this.snackbarPopover.hidePopover();
    }
}

// Usage:
const toast = new SnackbarQueue();
// toast.show('Microphone enabled');




/**
 * @param {string|HTMLDivElement} message
 * @param {number} duration
 *
 * @example
 *   snackbar('Microphone enabled');
 */
export function snackbar(message, duration) {
    toast.showBar(message, duration);
}

export function clearSnackbarQueue() {
    toast.clearQueue();
}

// Module-level variable to track the active timer
let tmrSnackbar = null;


setTimeout(() => { snackbar("Hi, welcome!", 8) }, 500);
// setTimeout(() => { snackbar("Hi, welcome!", 3, { bg: "red", clr: "yellow" }) }, 500);




// A native Web Component mimicking Google's Material Design Components Text Field.
// Supports both 'filled' and 'outlined' variants using clean CSS :has() logic.
// (Made by Gemini from a prompt in an incognito tab.)

class MdcInput extends HTMLElement {
    #internalValue = '';

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.renderShell();
    }

    static get observedAttributes() {
        return ['label', 'type', 'value', 'required', 'pattern', 'variant'];
    }

    // Exposes the underlying native HTMLInputElement.
    get inputElement() {
        return this.shadowRoot.querySelector('.mdc-text-field__input');
    }

    // Gets or sets the live value of the input field.
    get value() {
        return this.inputElement ? this.inputElement.value : this.#internalValue;
    }

    set value(val) {
        this.#internalValue = val;
        const input = this.inputElement;
        if (input) {
            input.value = val;
        }
    }

    // Gets or sets the floating label display text.
    get label() {
        return this.getAttribute('label') || '';
    }

    set label(/** @type {string} */ val) {
        this.setAttribute('label', val);
    }

    // Gets or sets the component's custom error styling state.
    get error() {
        return this.inputElement ? this.inputElement.classList.contains('has-error') : false;
    }

    set error(val) {
        const input = this.inputElement;
        if (input) {
            if (val) {
                input.classList.add('has-error');
            } else {
                input.classList.remove('has-error');
            }
        }
    }

    connectedCallback() {
        if (this.hasAttribute('value')) {
            this.value = this.getAttribute('value');
        }

        // Sync the initial text content for the label tag safely
        const labelText = this.shadowRoot.querySelector('.mdc-floating-label');
        if (labelText) {
            labelText.textContent = this.getAttribute('label') || '';
        }

        this.setupListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'value') {
            this.value = newValue;
            return;
        }

        const input = this.inputElement;
        const labelText = this.shadowRoot.querySelector('.mdc-floating-label');

        if (name === 'label' && labelText) labelText.textContent = newValue;
        if (name === 'type' && input) input.type = newValue;

        if (name === 'required' && input) {
            this.hasAttribute('required') ? input.setAttribute('required', '') : input.removeAttribute('required');
        }
        if (name === 'pattern' && input) {
            input.setAttribute('pattern', newValue);
        }
    }

    setupListeners() {
        const input = this.inputElement;
        if (!input) return;

        input.addEventListener('input', () => {
            this.#internalValue = input.value;
            // Dispatch standard input event so developers can listen directly to <mdc-input>
            this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        });
    }

    renderShell() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 100%;
          max-width: 300px;
          --primary-color: #6200ee;
          --text-color: #333;
          --bg-color: #f5f5f5;
          --border-color: rgba(0, 0, 0, 0.42);
          --error-color: #b00020;
          /* Page surface color for the outlined text cutout */
          --surface-color: #ffffff; 
          /* Configurable component height property */
          --input-height: 48px; 
        }
        
        /* BASE CONTAINER STYLES (FILLED VARIANT) */
        .mdc-text-field {
          position: relative;
          display: flex;
          width: 100%;
          height: var(--input-height);
          background-color: var(--bg-color);
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          box-sizing: border-box;
          cursor: text;
        }

        .mdc-text-field__input {
          width: 100%;
          border: none;
          border-bottom: 1px solid var(--border-color);
          background-color: transparent;
          /* Use a percentage or flexible calculation for vertical padding alignment */
          padding: calc(var(--input-height) * 0.35) 16px 4px;
          font-size: 16px;
          color: var(--text-color);
          outline: none;
          box-sizing: border-box;
          height: 100%;
        }

        /* FLOATING LABEL ARCHITECTURE */
        .mdc-floating-label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0, 0, 0, 0.6);
          font-size: 16px;
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), 
                      color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                      background-color 0.15s ease,
                      padding 0.15s ease;
          pointer-events: none;
          transform-origin: left top;
          /* Assures label draws correctly through parent container boundaries */
          z-index: 2; 
        }

        .mdc-line-ripple {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: var(--primary-color);
          transform: scaleX(0);
          transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ------------------------------------------------------------- */
        /* OUTLINED STYLE CONFIGURATION */
        /* ------------------------------------------------------------- */
        :host([variant="outlined"]) .mdc-text-field {
          background-color: transparent;
          border: 1px solid var(--border-color);
          border-radius: 4px;
        }

        :host([variant="outlined"]) .mdc-text-field__input {
          border-bottom: none;
          padding: 0 16px; /* Let flexbox grid vertical orientation align input value */
        }

        :host([variant="outlined"]) .mdc-line-ripple {
          display: none;
        }

        :host([variant="outlined"]) .mdc-text-field:has(.mdc-text-field__input:focus) {
          border: 2px solid var(--primary-color);
        }

        /* ------------------------------------------------------------- */
        /* CSS :has() ANIMATION LOGIC (HANDLES BOTH VARIANTS) */
        /* ------------------------------------------------------------- */
        
        /* Default Filled Active Float Condition */
        .mdc-text-field:has(.mdc-text-field__input:focus) .mdc-floating-label,
        .mdc-text-field:has(.mdc-text-field__input:not(:placeholder-shown)) .mdc-floating-label {
          transform: translateY(-100%) scale(0.75);
          color: var(--primary-color);
        }

        /* Absolute pixel displacement overrides for the Outlined active float position */
        :host([variant="outlined"]) .mdc-text-field:has(.mdc-text-field__input:focus) .mdc-floating-label,
        :host([variant="outlined"]) .mdc-text-field:has(.mdc-text-field__input:not(:placeholder-shown)) .mdc-floating-label {
          /* translateY(-24px) moves the text directly onto the horizontal line stroke regardless of field height */
          transform: translateY(-24px) scale(0.75);
          background-color: var(--surface-color);
          padding: 0 4px;
          margin-left: -4px;
        }

        /* Keep label text soft if field has value but is blurred */
        .mdc-text-field:has(.mdc-text-field__input:not(:placeholder-shown)):not(:has(.mdc-text-field__input:focus)) .mdc-floating-label {
          color: rgba(0, 0, 0, 0.6);
        }

        /* Enable bottom ripple accent bar on focus (Filled layout only) */
        .mdc-text-field:has(.mdc-text-field__input:focus) .mdc-line-ripple {
          transform: scaleX(1);
        }

        /* ------------------------------------------------------------- */
        /* COMPLEX VALIDATION SYSTEM */
        /* ------------------------------------------------------------- */
        .mdc-text-field:has(.mdc-text-field__input:user-invalid),
        .mdc-text-field:has(.mdc-text-field__input.has-error) {
          border-color: var(--error-color) !important;
        }
        .mdc-text-field:has(.mdc-text-field__input:user-invalid) .mdc-text-field__input,
        .mdc-text-field:has(.mdc-text-field__input.has-error) .mdc-text-field__input {
          border-bottom-color: var(--error-color);
        }
        .mdc-text-field:has(.mdc-text-field__input:user-invalid) .mdc-floating-label,
        .mdc-text-field:has(.mdc-text-field__input.has-error) .mdc-floating-label {
          color: var(--error-color) !important;
        }
      </style>

      <label class="mdc-text-field">
        <!-- space-placeholder is essential here to capture raw :placeholder-shown element state queries -->
        <input type="text" class="mdc-text-field__input" placeholder=" ">
        <span class="mdc-floating-label"></span>
        <div class="mdc-line-ripple"></div>
      </label>
    `;
    }
}

customElements.define('mdc-input', MdcInput);


/**
 * 
 * @param {string} variableName 
 * @param {string} className 
 * @returns {boolean}
 */
export function isCssVariableDefined(variableName, className) {
    // Ensure the variable name starts with '--'
    const formattedVar = variableName.startsWith('--') ? variableName : `--${variableName}`;

    const testElem = document.createElement('div');
    if (className) {
        testElem.className = className;
    }

    // Isolate the element completely out of the document flow
    testElem.style.position = 'fixed';
    testElem.style.top = '-9999px';
    testElem.style.visibility = 'hidden';

    document.body.appendChild(testElem);

    // Read the computed value of the variable
    const value = window.getComputedStyle(testElem).getPropertyValue(formattedVar).trim();

    document.body.removeChild(testElem);

    // If the variable doesn't exist, the browser returns an empty string
    return value !== '';
}

// Example 1: Check if a global variable exists on a class
// console.log(isCssVariableDefined('--theme-color', 'my-custom-class'));

// Example 2: Check if a global variable exists on the root/body level
// console.log(isCssVariableDefined('--main-bg-color')); 

// Instant, zero-overhead check for global theme variables
/*
const isDefined = window.getComputedStyle(document.documentElement)
                        .getPropertyValue('--my-variable')
                        .trim() !== '';
*/




//////////////////////////////
//// Menus

/**
 * @returns {HTMLDialogElement}
 */
export function mkDialogMenu() {
    const eltDialogMenuContainer = mkElt("dialog", { class: "menu-container" });
    // The bubbling:
    eltDialogMenuContainer.addEventListener("click", evt => {
        evt.stopPropagation();
        eltDialogMenuContainer.close();
        eltDialogMenuContainer.remove();
    });
    return eltDialogMenuContainer;
}

export function addMenuDivider(dialogMenu) {
    const divider = mkElt("div");
    divider.style = `
    height: 4px;
    background-color: lightgray;
    margin: 0;
    padding: 0;
  `;
    dialogMenu.appendChild(divider);
}
/**
 *
 * @param {HTMLDialogElement} dialogMenu 
 * @param {string} txt 
 * @param {function():void} fun 
 */
export function addMenuAlt(dialogMenu, txt, fun) {
    if (!(dialogMenu instanceof HTMLDialogElement)) {
        throw Error("dialogMenu is not <dialog>");
    }
    if (!(dialogMenu.classList.contains("menu-container"))) {
        throw Error("!dialogMenu.menu-container");
    }
    const tofTxt = typeof txt;
    if (tofTxt != "string") {
        if (!(txt instanceof HTMLSpanElement)) {
            // throw Error(`typeof txt: "${tofTxt} != "string`);
            throw Error(`Must be string or <span>`);
        }
    }
    if (fun) {
        const tofFun = typeof fun;
        if (tofFun != "function") {
            debugger;
            throw Error(`typeof fun: "${tofFun} != "function`);
        }
        if (fun.length > 0) {
            throw Error(`function fun should take 0 parameter: ${fun.length}`);
        }
    }

    const alt = mkMenuAlt(txt, fun);
    dialogMenu.appendChild(alt);
    function mkMenuAlt(txt, fun) {
        const btn = mkElt("button", { class: "menu-alt" }, txt);
        if (fun) {
            btn.addEventListener("click", evt => {
                // evt.stopPropagation();
                fun();
            });
        } else {
            /*
            btn.addEventListener("click", evt => {
              evt.stopPropagation();
            });
            */
            btn.disabled = true;
            btn.style.color = "currentColor";
        }
        return btn;
    }
}

/**
 * @param {HTMLDialogElement} dialogMenu
 * @param {Object} objDialogPosition
 */
export function displayMenu(dialogMenu, objDialogPosition) {
    const {
        parent,
        relativeX = "right-inner",
        ...rest
    } = objDialogPosition;
    if (Object.keys(rest).length > 0) {
        const unknownKeys = Object.keys(rest).join(", ");
        throw new Error(
            `Invalid options passed to displayMenu: ${unknownKeys}. ` +
            `Only allowed: parent, relativeX`
        );
    }
    const bcrParent = parent.getBoundingClientRect();
    dialogMenu.style.top = `${bcrParent.bottom}px`;
    switch (relativeX) {
        case "right-inner":
            {
                const distanceFromRightEdge = window.innerWidth - bcrParent.right;
                dialogMenu.style.right = `${distanceFromRightEdge}px`;
            }
            break;
        case "left-inner":
            dialogMenu.style.left = `${bcrParent.left}px`;
            break;
        default:
            throw Error(`Bad relativeX == "${relativeX}"`);
    }

    document.body.appendChild(dialogMenu);
    const bcr = dialogMenu.getBoundingClientRect();
    console.log("displayMenu:", { bcr }, dialogMenu);
    if (bcr.x < 0) {
        const right = dialogMenu.style.right;
        // debugger;
        const distanceFromRightEdge = window.innerWidth - bcrParent.right + bcr.x;
        dialogMenu.style.right = `${distanceFromRightEdge}px`;
    }
    dialogMenu.showModal();
}


// Global Mobile Viewport & Virtual Keyboard Handler
function OLDmonitorVisualViewPort() {
    console.log("OLDmonitorVisualViewPort");
    snackbar("OLDmonitorVisualViewPort", 8);
    if (window.visualViewport) {
        let isPending = false;

        // 1. The Core Measuring Function
        const globalSyncViewport = () => {
            if (isPending) return;
            isPending = true;

            requestAnimationFrame(() => {
                isPending = false;

                console.log("setting height variables");

                const visualHeight = window.visualViewport.height;
                const totalHeight = window.innerHeight;
                const keyboardHeight = Math.max(0, totalHeight - visualHeight);

                // Write values globally to the root <html> element
                document.documentElement.style.setProperty('--visible-height', `${visualHeight}px`);
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
            });
        };

        // 2. Continuous Listeners (Handles orientation flips, zooming, and standard keyboards)
        window.visualViewport.addEventListener('resize', globalSyncViewport);
        window.visualViewport.addEventListener('scroll', globalSyncViewport);

        // Initialize the values immediately on page load
        globalSyncViewport();

        // 3. Global Fallback for GBoard / Stuck Focus Bugs
        // Captures taps on any input or editable field globally
        document.addEventListener('pointerup', (event) => {
            const el = event.target;
            const isInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;

            if (isInput) {
                // Short delay lets GBoard finish sliding out before measuring
                setTimeout(globalSyncViewport, 150);
            }
        });
    }
}
// OLDmonitorVisualViewPort();


let resizeTimeout;
function syncViewport() {
    // Clear any pending debounced checks
    if (resizeTimeout) clearTimeout(resizeTimeout);

    const visualHeight = window.visualViewport.height;
    const totalHeight = window.innerHeight;

    // We add a tiny buffer (like 15px) because zoom or subpixel rendering 
    // can make innerHeight and visualViewport.height differ slightly even without a keyboard.
    const keyboardHeight = (totalHeight - visualHeight > 15) ? (totalHeight - visualHeight) : 0;

    document.documentElement.style.setProperty('--visible-height', `${visualHeight}px`);
    document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
};


// Suggested by Gemini:
function monitorVisualViewport() {
    if (!window.visualViewport) return;

    // let resizeTimeout;

    const OLDsyncViewport = () => {
        // Clear any pending debounced checks
        if (resizeTimeout) clearTimeout(resizeTimeout);

        const visualHeight = window.visualViewport.height;
        const totalHeight = window.innerHeight;

        // We add a tiny buffer (like 15px) because zoom or subpixel rendering 
        // can make innerHeight and visualViewport.height differ slightly even without a keyboard.
        const keyboardHeight = (totalHeight - visualHeight > 15) ? (totalHeight - visualHeight) : 0;

        document.documentElement.style.setProperty('--visible-height', `${visualHeight}px`);
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    };

    // 1. Listen to the native viewport events
    window.visualViewport.addEventListener('resize', () => {
        // syncViewport();
        // Safety Net: Keyboards on mobile (especially iOS & GBoard) often report 
        // intermediate sizes mid-animation. This ensures we catch the absolute final state.
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            syncViewport();
            const eltScroll = document.querySelector("dialog div.scroll-for-text-input");
            if (!eltScroll) return;
            const dlg = eltScroll.closest("dialog")
            if (!dlg) {
                debugger;
            }
            scrollForTextInput(dlg, 999);
        }, 100);
    });

    // window.visualViewport.addEventListener('scroll', syncViewport);

    // 2. Catch focus loss / keyboard dismissal
    // Tapping outside an input or pressing "done" needs to trigger a recalculation
    document.addEventListener('focusout', () => {
        // Small timeout gives the keyboard time to begin collapsing
        setTimeout(syncViewport, 100);
    });

    // Initial calculation
    // syncViewport();
    setTimeout(syncViewport, 500);
}



/**
 * @param {HTMLDialogElement} dlg
 * @param {number} msTimeout
 * @throws
 */
function scrollForTextInput(dlg, msTimeout = 300) {
    if (!(dlg instanceof HTMLDialogElement)) throw Error("not dialog elment");
    // if (!dlg.classList.contains("has-text-input")) return;
    setTimeout(() => {
        console.log("using textInput");
        const eltScroll = dlg.querySelector("div.scroll-for-text-input");
        if (!eltScroll) throw Error("!eltScroll");
        if (!(eltScroll instanceof HTMLDivElement)) throw Error("eltScroll is not div");
        syncViewport();
        eltScroll.scrollIntoView({ behavior: "smooth", block: "start" });
    }, msTimeout);
}


/**
* Waits for a list of elements to settle their layouts.
* @param {HTMLElement|HTMLElement[]|NodeList} elements - Single element or list of elements.
* @returns {Promise<WeakMap<HTMLElement, ResizeObserverEntry>>} Resolves with a WeakMap mapping elements to their final entries.
*/
export function waitForLayoutSilence(elements) {
    return new Promise((resolve) => {
        // Normalize input to an array so we can safely loop over it
        const targets = elements instanceof NodeList || Array.isArray(elements)
            ? Array.from(elements)
            : [elements];

        let rafId = null;

        // Create the WeakMap that will be passed back to the user
        const latestEntries = new WeakMap();

        const observer = new ResizeObserver((entries) => {
            // 1. Map the element directly to its latest resize data
            for (let entry of entries) {
                // latestEntries.set(entry.target, entry.contentRect);
                latestEntries.set(entry.target, entry.target.getBoundingClientRect());
            }

            // 2. Clear previous frame schedule if layout is still moving
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            // 3. Wait for one full frame of silence
            rafId = requestAnimationFrame(() => {
                observer.disconnect();

                // 4. Resolve the Promise directly with the WeakMap
                resolve(latestEntries);
            });
        });

        // Start observing all targeted elements
        targets.forEach(el => observer.observe(el));
    });
}

monitorVisualViewport();



/**
 * @param {string} cssVar -- 500ms, 0.5s
 * @returns {number}
 * @throws
 */
export function getRootCssVarMs(cssVar) {
    if (!cssVar.startsWith("--")) {
        debugger;
        throw Error(`${cssVar} is not a css variable name`);
    }
    let strCssVar =
        window.getComputedStyle(document.documentElement)
            .getPropertyValue(cssVar)
            .trim();
    if (strCssVar.length == 0) {
        debugger;
        throw Error(`${cssVar} not set on :root`);
    }
    const isSec = strCssVar.endsWith("s");
    const isMs = strCssVar.endsWith("ms");
    if (!isSec) {
        debugger;
        throw Error(`${cssVar} does not end with ms or s`);
    }
    strCssVar = strCssVar.slice(0, -1);
    if (isMs) { strCssVar = strCssVar.slice(0, -1); }
    if (strCssVar.endsWith(" ")) {
        debugger;
        throw Error(`${cssVar} space before ms`);
    }
    if (Number.isNaN(Number(strCssVar))) {
        debugger;
        throw Error(`${cssVar} does not have a number`);
    }
    let ms = parseFloat(strCssVar);
    if (!isMs) { ms = 1000 * ms; }
    return ms
}




/////////////////
//// Color themes


/**
 * Converts any valid CSS color string (name, rgb, hsl) to a hex string.
 * @param {string} colorName - e.g., "orange", "deepskyblue", "papayawhip"
 * @returns {string|null} Hex color string (e.g., "#f97316") or null if invalid
 */
export function colorNameToHex(colorName) {
    // Create an in-memory 1x1 canvas context
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;

    // ctx.fillStyle = colorName;
    // const computed = ctx.fillStyle;



    // 1. Set to a baseline color
    ctx.fillStyle = "#000000";
    ctx.fillStyle = colorName;

    // If assigning colorName failed and it didn't compute to black, it's invalid
    const computedFirst = ctx.fillStyle;

    // 2. Double-check against a second baseline to verify actual black input vs fallback
    ctx.fillStyle = "#ffffff";
    ctx.fillStyle = colorName;
    const computedSecond = ctx.fillStyle;

    // If the fillStyle didn't change with colorName, the input string is invalid
    if (computedFirst !== computedSecond) {
        return null;
    }

    const computed = computedFirst;




    // Browser resolves valid colors to hex "#rrggbb" or "rgba(...)"
    if (computed.startsWith("#")) {
        return computed;
    }

    // Handle rgb(r, g, b) return values from canvas
    const rgbMatch = computed.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
        const [r, g, b] = rgbMatch.map(Number);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    return null;
}


/**
 * Generates a minimal Material Design color palette.
 * @param {string} baseInput - Seed color hex code or standard CSS color name.
 * @param {boolean} [isDark=false] - Optional flag to generate dark mode tokens.
 * @returns {Record<string, string>} Object containing CSS custom properties.
 */
function generateMaterialPalette(baseInput, isDark = false) {
    // Convert color name or raw hex string to normalized 6-digit hex
    let hex = baseInput.startsWith("#") ? baseInput : colorNameToHex(baseInput);
    if (!hex) {
        throw new Error(`Invalid color format or name: "${baseInput}"`);
    }

    hex = hex.replace("#", "");
    if (hex.length === 3) {
        hex = hex.split("").map((c) => c + c).join("");
    }

    // Convert Hex to HSL
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);

    // Helper: HSL to Hex
    const hslToHex = (h, s, l) => {
        l = Math.min(100, Math.max(0, l)) / 100;
        s = Math.min(100, Math.max(0, s)) / 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, "0");
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    // Branch token calculations for Light vs Dark mode
    if (isDark) {
        return {
            "--primary": hslToHex(hDeg, Math.min(sPct + 10, 100), 75),
            "--primary-container": hslToHex(hDeg, sPct, 25),

            "--secondary": hslToHex((hDeg - 15 + 360) % 360, Math.max(sPct - 10, 10), 70),
            "--secondary-container": hslToHex((hDeg - 15 + 360) % 360, Math.max(sPct - 10, 10), 28),

            "--tertiary": hslToHex((hDeg + 170) % 360, Math.min(sPct + 10, 90), 68),
            "--tertiary-container": hslToHex((hDeg + 170) % 360, Math.min(sPct + 10, 90), 22),

            "--surface": hslToHex(hDeg, 10, 8),
            "--surface-variant": hslToHex(hDeg, 12, 19),

            "--on-surface": hslToHex(hDeg, 10, 90),
            "--on-surface-variant": hslToHex(hDeg, 12, 72),

            "--outline": hslToHex(hDeg, 8, 48),
            "--outline-variant": hslToHex(hDeg, 10, 24),

            "--inverse-surface": hslToHex(hDeg, 10, 92),
            "--inverse-primary": hslToHex(hDeg, sPct, 45),

            "--error": "#f87171",
            "--error-container": "#7f1d1d",

            // Dark Mode Backdrop
            "--backdrop": `hsl(${hDeg}deg 20% 5% / 72%)`,

            "--link-color": "hsl(212deg 100% 75%)",
            "--link-hover": "hsl(212deg 100% 85%)"
        };
    }

    // Light Mode (Default)
    return {
        "--primary": `#${hex}`,
        "--primary-container": hslToHex(hDeg, sPct, 92),

        "--secondary": hslToHex((hDeg - 15 + 360) % 360, Math.max(sPct - 10, 10), 44),
        "--secondary-container": hslToHex((hDeg - 15 + 360) % 360, Math.max(sPct - 10, 10), 94),

        "--tertiary": hslToHex((hDeg + 170) % 360, Math.min(sPct + 10, 90), 32),
        "--tertiary-container": hslToHex((hDeg + 170) % 360, Math.min(sPct + 10, 90), 90),

        "--surface": hslToHex(hDeg, 10, 98),
        "--surface-variant": hslToHex(hDeg, 12, 89),

        "--on-surface": hslToHex(hDeg, 10, 10),
        "--on-surface-variant": hslToHex(hDeg, 12, 32),

        "--outline": hslToHex(hDeg, 8, 64),
        "--outline-variant": hslToHex(hDeg, 12, 90),

        "--inverse-surface": hslToHex(hDeg, 10, 18),
        "--inverse-primary": hslToHex(hDeg, 90, 70),

        "--error": "#dc2626",
        "--error-container": "#fee2e2",

        // Light Mode Backdrop
        "--backdrop": `hsl(${hDeg}deg 20% 10% / 32%)`,

        "--link-color": "hsl(212deg 100% 36%)",
        "--link-hover": "hsl(212deg 100% 25%)"
    };
}

/**
 * Applies the generated palette directly to an element.
 * @param {string} baseColor - Color hex or name (e.g. "#4f46e5" or "indigo")
 * @param {boolean} [isDark=false] - Set to true for dark mode tokens
 * @param {HTMLElement} [targetElement=document.documentElement] - Optional target container element
 */
export function applyMaterialTheme(baseColor, isDark = false, targetElement = document.documentElement) {
    const palette = generateMaterialPalette(baseColor, isDark);
    Object.entries(palette).forEach(([prop, value]) => {
        targetElement.style.setProperty(prop, value);
    });
}


// Example usage:
// console.log(colorNameToHex("orange"));       // "#ffa500"
// console.log(colorNameToHex("coral"));        // "#ff7f50"
// console.log(colorNameToHex("teal"));         // "#008080"
// console.log(colorNameToHex("invalidname"));  // null

// Example Usage:
// applyMaterialTheme("#f97316"); // Generates and applies the Orange theme
// applyMaterialTheme("#00ff00");
applyMaterialTheme("yellow", true);