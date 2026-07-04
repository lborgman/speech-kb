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
  dialog.appendChild(mkXclose());
}

document.documentElement.addEventListener("click", evt => {
  // evt.stopPropagation();
  // evt.preventDefault();
  // debugger;
  // NOTE: first child element must covers the whole <dialog>
  const dialog = evt.target;
  // if (dialog?.tagName == "DIALOG") {
  if (dialog instanceof HTMLDialogElement) {

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
  }
  // const currentTarget = evt.currentTarget;
  // const onDialog = dialog == currentTarget;
  // if (onDialog) dialog.close();
});

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

/**
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
  addXclose(dlg);
  document.documentElement.appendChild(dlg);
  dlg.showModal();

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


// Module-level variable to track the active timer
let tmrSnackbar = null;

export function snackbar(bdy, sec) {
  createSnackbarDiv(bdy, sec);
  return;
  // Default to 10 seconds if not provided or if 0 is passed mistakenly
  sec = sec === undefined ? 10 : sec;

  /** @type {HTMLDialogElement|null} */
  let dlg = document.getElementById("snackbar");

  if (dlg) {
    if (!(dlg instanceof HTMLDialogElement)) {
      const msg = "!(dlg instanceof HTMLDialogElement)";
      console.error(msg, dlg);
      throw Error(msg);
    }
    // Close it immediately if it's already open from a previous call
    if (dlg.open) {
      dlg.close();
    }
  }

  // 1. Clear any existing active timer to prevent premature closing
  if (tmrSnackbar) {
    clearTimeout(tmrSnackbar);
  }

  // 2. Create the element if it doesn't exist
  if (!dlg) {
    dlg = /** @type {HTMLDialogElement} */ (mkElt("dialog", undefined, bdy));
    dlg.id = "snackbar";
    // dlg.style.zIndex = "99999";
    // document.body.appendChild(dlg); // Typically better to append to body than documentElement

    // FIX-ME: last...
    const lastModal = document.querySelector("dialog:modal");
    const parent = lastModal || document.documentElement;
    // document.documentElement.appendChild(dlg); // Typically better to append to body than documentElement
    parent.appendChild(dlg); // Typically better to append to body than documentElement
  }

  // 3. Update content safely
  dlg.textContent = "";
  if (typeof bdy === "string") {
    dlg.textContent = bdy;
  } else {
    dlg.append(bdy);
  }

  // 4. Show the dialog (Use showModal() if you want backdrop/centering, otherwise show())
  if (!dlg.open) {
    // dlg.showModal();
    dlg.show();
    console.log("snackbar: After dlg.show()")
  }

  // 5. Save the timeout reference to our module-level variable!
  tmrSnackbar = setTimeout(() => {
    console.log("Timer fired, closing dialog...", { sec, dlg });
    try {
      if (dlg && dlg.open) {
        dlg.close();
        dlg.remove();
      }
    } catch (err) {
      console.error("Error closing dialog:", err);
    }
    tmrSnackbar = null; // Reset tracker after running
  }, sec * 1000);
}

setTimeout(() => { snackbar("Hi, welcome!", 3) }, 500);




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

// function createSnackbar(message, duration = 4000, hasButton = false, position = 'bottom-left') {
function OLDcreateSnackbarDiv(message, duration = 4, hasButton = false) {

  const snackbar = document.createElement('div');
  snackbar.id = "snackbar";

  snackbar.textContent = "";
  snackbar.append(message);

  const dismiss = () => {
    snackbar.hidePopover();
    snackbar.remove();
  };
  setTimeout(dismiss, duration * 1000);


  if (hasButton) {
    const button = document.createElement('button');
    button.textContent = 'Close';
    button.onclick = dismiss;
    snackbar.appendChild(button);
  }

  snackbar.popover = 'manual';
  snackbar.setAttribute('aria-live', 'polite');

  snackbar.style.display = 'flex';
  snackbar.style.justifyContent = "space-between";

  document.body.appendChild(snackbar);

  snackbar.showPopover();

}

/**
 * Creates and displays a non-modal snackbar notification using the HTML Popover API.
 * This guarantees the snackbar stays in the Top Layer above open modal dialogs.
 *
 * @param {string|Node} message - The message text or DOM element to display.
 * @param {number} [duration=4] - Visibility duration in seconds before auto-dismissing.
 * @param {boolean} [hasButton=false] - Whether to display an explicit dismiss button.
 * @param {Object} [coords={}] - Custom CSS layout overrides (e.g., top, bottom, left, right, width).
 * @param {string} [coords.top] - CSS top coordinate.
 * @param {string} [coords.bottom] - CSS bottom coordinate.
 * @param {string} [coords.left] - CSS left coordinate.
 * @param {string} [coords.right] - CSS right coordinate.
 * @param {string} [coords.width] - CSS width constraint.
 */
function createSnackbarDiv(message, duration = 4, hasButton = false, coords = {}) {
  // Validate conflicting coordinate properties
  if (coords.top !== undefined && coords.bottom !== undefined) {
    console.warn("Snackbar Conflict: Both 'top' and 'bottom' provided. 'top' will take priority.");
  }
  if (coords.left !== undefined && coords.right !== undefined) {
    console.warn("Snackbar Conflict: Both 'left' and 'right' provided. 'left' will take priority.");
  }

  const snackbar = document.createElement('div');
  snackbar.id = "snackbar";

  snackbar.textContent = "";
  snackbar.append(message);

  const dismiss = () => {
    snackbar.style.opacity = '0';
    snackbar.addEventListener('transitionend', () => {
      snackbar.hidePopover();
      snackbar.remove();
    }, { once: true });
  };

  setTimeout(dismiss, duration * 1000);

  if (hasButton) {
    const button = document.createElement('button');
    button.textContent = 'Close';
    button.onclick = dismiss;
    snackbar.appendChild(button);
  }

  snackbar.popover = 'manual';
  snackbar.setAttribute('aria-live', 'polite');
  snackbar.style.display = 'flex';
  snackbar.style.justifyContent = "space-between";

  // Assign requested positioning rules
  Object.assign(snackbar.style, coords);

  // Fallback defaults to clear browser center-locking mechanisms
  if (coords.top !== undefined) {
    snackbar.style.bottom = 'auto';
  } else if (coords.bottom !== undefined) {
    snackbar.style.top = 'auto';
  }

  if (coords.left !== undefined) {
    snackbar.style.right = 'auto';
  } else if (coords.right !== undefined) {
    snackbar.style.left = 'auto';
  }

  // Setup opacity animation baseline
  snackbar.style.opacity = '0';
  snackbar.style.transition = 'opacity 0.2s ease-out';

  document.body.appendChild(snackbar);
  snackbar.showPopover();

  // Kick off entry transition
  requestAnimationFrame(() => {
    snackbar.style.opacity = '1';
  });
}



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
      btn.addEventListener("click", evt => {
        evt.stopPropagation();
      });
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
  dialogMenu.showModal();
}
