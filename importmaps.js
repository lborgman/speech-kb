// @ts-check
const MM4I_IMPORTMAPS_VER = "0.2.6";
/** @param {string} _msg */
window["logConsoleHereIs"](`here is mm4i-importmaps ${MM4I_IMPORTMAPS_VER}`);

const importFc4i_nocachenames = {};
const noCache = (() => {
    return false;
    const sp = new URLSearchParams(location.search);
    return !sp.has("cachemodules");
    const defaultNoCache = true;
    const getPWADisplayMode = () => {
        if (document.referrer.startsWith('android-app://'))
            return 'twa';
        if (window.matchMedia('(display-mode: browser)').matches)
            return 'browser';
        if (window.matchMedia('(display-mode: standalone)').matches)
            return 'standalone';
        if (window.matchMedia('(display-mode: minimal-ui)').matches)
            return 'minimal-ui';
        if (window.matchMedia('(display-mode: fullscreen)').matches)
            return 'fullscreen';
        if (window.matchMedia('(display-mode: window-controls-overlay)').matches)
            return 'window-controls-overlay';

        return 'unknown';
    }
    const displayMode = getPWADisplayMode();
    if (displayMode == "browser") return defaultNoCache;
    return false;
})();

if (noCache) {
    console.log("%cimportFc4i is avoiding browser caching", "background:yellow; color:red; font-size:18px;");
    document.addEventListener("DOMContentLoaded", _evt => {
        const eltSlow = document.createElement("div");
        eltSlow.style = `
        position: fixed;
        top: 70px;
        left: 20px;
        z-index: 9999;
        width: 200px;
        padding: 20px;
        background: blue;
        color: white;
        border: 2px solid currentColor;
        border-radius: 10px;
        display: flex;
        align-content: center;
        flex-wrap: wrap;
    `;
        eltSlow.textContent = "Slow loading because develper debugging is on for Mindmaps 4 Internet ...";
        document.body.appendChild(eltSlow);
        const msRemoveSlow = window.location.hostname == "localhost" ? 1000 : 4000;
        setTimeout(() => eltSlow.remove(), msRemoveSlow);
    });
}
const baseUrl = (() => {
    const b = [...document.getElementsByTagName("base")][0]
    if (b) {
        const bHref = b.href;
        // const wlOrigin = window.location.origin;
        // console.log({ bHref, wlOrigin });
        return bHref;
    }
    return window.location.origin;
})();
// console.log({ baseUrl });
// debugger;


/*
*/
/**
 * Tip from Grok. Using a cache for import().
 * Grok initually thought that this may save 200-250 ms on a modern laptop.
 * But actually it will only save a couple of ms.
 * However I do not think it can harm.
 * 
 * Cache of dynamically imported modules.
 * Keys: importFc4i keys (strings)
 * Values: Promises that resolve to the module namespace object
 * @type {Map<string, Promise<Object>}
 */
const cacheImportFc4i = new Map();



// https://github.com/WICG/import-maps/issues/92
{
    // https://www.npmjs.com/package/three?activeTab=versions, Current Tags
    // const threeVersion = "0.167.1";
    const relImports = {
        // https://github.com/vasturiano/3d-force-graph
        // Not a module?
        // Anyway ForceGraph3D will be defined in window by import("3d-force-graph")!
        // "three": "https://unpkg.com/three",
        // "three": "https://unpkg.com/three/build/three.module.js",
        // "three-spritetext": "https://unpkg.com/three-spritetext",

        // https://threejs.org/docs/index.html#manual/en/introduction/Installation
        // "three": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.module.js",
        // "three/addons/": "https://cdn.jsdelivr.net/npm/three@<version>/examples/jsm/"

        // "three": `https://cdn.jsdelivr.net/npm/three@${threeVersion}/build/three.module.js`,
        // "three/addons/": `https://cdn.jsdelivr.net/npm/three@${threeVersion}/examples/jsm/`,
        // "mod3d-force-graph": "https://unpkg.com/3d-force-graph",

        "acc-colors": "./js/mod/acc-colors.js",
        "basic-ui": "./js/mod/basic-ui.js",
        "color-tools": "./js/mod/color-tools.js",
        // "d3": "./ext/d3/d3.v7.js",
        // "db-mindmaps": "./js/db-mindmaps.js",

        // "donate": "./js/mod/donate.js",

        // "toast-ui-helpers": "./js/mod/toast-ui-helpers.js",

        // "jsmind": "https://cdn.jsdelivr.net/npm/jsmind@0.8.5/es6/jsmind.js",


        // "bell-engine": "/js/mod/bell-engine.js",

        "bell-engine": "../ext/bells/bell-engine.js",
        "user-sound": "../js/mod/user-sound.js",
        "safe-audio": "../js/mod/safe-audiocontext.js",
        "viz-volume": "../js/mod/viz-volume.js",


        "user-images": "../js/mod/user-images.js",
        "some-img-links": "../js/some-img-links.js",

        "canvas-fontsize": "../js/mod/canvas-fontsize.js",

        // "deepgram": "../js/mod/deepgram.js",
        "deepgram": "../js/mod/deepgram-grok.js",

        // "flashcards": "./src/js/mod/flashcards.js",
        // "idb-common": "./js/mod/idb-common.js",
        // "images": "./js/mod/images.js",
        // "is-displayed": "./js/mod/is-displayed.js",
        "google-icons": "../js/mod/google-icons.js",

        "local-settings": "./js/mod/local-settings.js",

        "moving-lines": "./moving-lines.js",
        "my-svg": "./js/mod/my-svg.js",

        "opfs": "./js/mod/opfs.js",

        "sharing-params": "./src/js/mod/sharing-params.js",
        "toolsJs": "../js/mod/tools.js",
        // "util-mdc": "../js/mod/util-mdc.js",
        "woff-codepoints": "../js/mod/woff-codepoints.js",
        // "google-symbols-codepoints": "./ext/mdc-fonts/codepoints.js",
        "woff2-mdc-symbols": "../js/mod/woff2-mdc-symbols.js",

        "supabase-sign-in": "../js/mod/supabase-sign-in.js",

        // Tests:
        "pwa": "./pwa.js",
        "mm4i-share": "./js/mm4i-share-link.js",
        "no-ui-slider": "./ext/no-ui-slider/nouislider.mjs",
        "peerjs": "https://esm.sh/peerjs@1.5.4?bundle-deps",
        "qrcode": "https://cdn.jsdelivr.net/npm/qrcode-esm/+esm",
        "qr-scanner": "https://cdn.jsdelivr.net/npm/qr-scanner@latest/qr-scanner.min.js",

        "delegate-events": "./js/mod/delegate-events.js",
        "delegate-fsm-xstate": "./js/mod/delegate-fsm-xstate.js",
        "delegate-fsm-jssm": "./js/mod/delegate-fsm-jssm.js",
        "xstate": "https://esm.sh/xstate",


        // new
        "shield-click": "./js/mod/shield-click.js",

        // "hashids": "https://cdn.jsdelivr.net/npm/hashids@2.3.0/dist/hashids.esm.js",
        "hashids": "https://esm.sh/hashids@2.3.0",

        "rxdb-setup-esbuild": "./rxdb-setup-esbuild.js",

        "idb-replicator": "./js/mod/idb-replicator.js",

        "css-specificity": "https://cdn.jsdelivr.net/npm/@bramus/specificity",
    };

    const isImporting = {};


    /** @param {string} idOrLink @returns {Promise<Object>} */
    async function importFc4i(idOrLink) {
        const oldModule = cacheImportFc4i.get(idOrLink);
        if (oldModule) return oldModule;
        // if (window["in-app-screen"]) return;
        const webBrowserInfo = await window["promWebBrowserInfo"];
        const isInApp = webBrowserInfo?.isInApp || false;
        const tofIsInApp = typeof isInApp;
        if (tofIsInApp != "boolean") {
            debugger; // eslint-disable-line no-debugger
            // throw Error(`tofIsInapp == "${tofIsInApp}"`);
        }
        if (idOrLink.startsWith("https://")) {
            return await import(idOrLink);
        }
        if (idOrLink.startsWith("/")) {
            console.error(`idOrLink should not start with "/" "${idOrLink}"`);
            throw Error(`idOrLink should not start with "/" "${idOrLink}"`);
        }
        const getStackTrace = function () {
            var obj = {};
            // https://v8.dev/docs/stack-trace-api
            // @ts-ignore
            Error.captureStackTrace(obj, getStackTrace);
            const s = obj.stack;
            return s.split(/\n\s*/);
        };

        if (isImporting[idOrLink]) {
            const prevStack = isImporting[idOrLink];
            const prev = `\n>>>PREV "${idOrLink}" stack: ` + prevStack.join("\n  >>>prev ");
            const currStack = getStackTrace();
            const curr = `\nCURR "${idOrLink}" stack: ` + currStack.join("\n  >>>curr ");
            const getStackPoints = (stack) => {
                // Skip Error and importFc4i
                // FIX-ME: check skip
                const points = stack.slice(2).map(row => {
                    const m = row.match(/\((.*?)\)/);
                    // if (!m) throw Error(`row did not match: ${row}`);
                    if (!m) return row.slice(3); // skip "at "
                    const m1 = m[1];
                    return m1;
                });
                return points;
            }
            const prevPoints = getStackPoints(prevStack);
            const currPoints = getStackPoints(currStack);


            //// FIX-ME: how do I see if it is cyclic????

            // const setPrev = new Set(prevPoints);
            // let samePoint;
            // currPoints.forEach(p => { if (setPrev.has(p)) samePoint = p; });
            // console.log("samePoint", samePoint);

            // Is starting point for curr in prev?
            const currStartPoint = currPoints.slice(-1);
            const inPrev = prevPoints.indexOf(currStartPoint) > -1;
            // console.log("inPrev", inPrev);
            if (inPrev) {
                console.warn(`Probably cyclic import for ${idOrLink}`, prev, curr, isImporting);
                debugger; // eslint-disable-line no-debugger
                throw Error(`Cyclic import for ${idOrLink} at ${currStartPoint}`);
            }
        }
        let ourImportLink;
        if (idOrLink.startsWith(".")) {
            // FIX-ME: why is this necessary when using <base ...>? file issue?
            // return await import(makeAbsLink(idOrLink));
            throw Error(`Start with . not tested: ${idOrLink}`);
        }
        if (!ourImportLink) {
            const relUrl = relImports[idOrLink];
            if (relUrl == undefined) {
                console.error(`modId "${idOrLink}" is not known by importFc4i`);
                throw Error(`modId "${idOrLink}" is not known by importFc4i`);
            }
            // FIX-ME: Should baseUrl be used here already?
            ourImportLink = relUrl;
            // ourImportLink = new URL(relUrl, baseUrl);
        }
        if (noCache || isInApp) {
            ////// This is for non-PWA.
            // Unfortunately there is no standard yet to discover if running as PWA.
            // Same problem with in-app web browser!
            // let objNotCached = importFc4i_nocachenames[ourImportLink];
            let objNotCached = importFc4i_nocachenames[idOrLink];
            if (!objNotCached) {
                objNotCached = {};
                // console.log("%cimportFc4i new avoid caching", "background:yellow; color:red;", ourImportLink);
                const getRandomString = () => {
                    return encodeURIComponent(Math.random().toString(36).slice(2));
                }
                const urlNotCached = new URL(ourImportLink, baseUrl);
                urlNotCached.searchParams.set("nocacheRand", getRandomString());
                objNotCached.href = urlNotCached.href;
                // importFc4i_nocachenames[ourImportLink] = objNotCached;
                importFc4i_nocachenames[idOrLink] = objNotCached;
            }
            if (!objNotCached.mod) {
                isImporting[idOrLink] = getStackTrace();
                const mod = await import(objNotCached.href);
                isImporting[idOrLink] = false;
                // There is no way to discover if a module has been imported so cache the module here:
                objNotCached.mod = mod;
            } else {
                // console.log("%cimportFc4i using old avoid caching", "background:white; color:red;", ourImportLink);
            }
            return objNotCached.mod;
        }
        isImporting[idOrLink] = getStackTrace();


        let prom;
        const u = new URL(ourImportLink, location);
        const absImportLink = u.href;
        try {
            // prom = import(ourImportLink);
            prom = import(absImportLink);
        } catch (err) {
            console.error("prom", absImportLink, err);
            debugger;
        }
        cacheImportFc4i.set(idOrLink, prom);
        let mod;
        try {
            mod = await prom;
        } catch (err) {
            console.error("mod", absImportLink, err);
            debugger;
            throw Error(`mod: ${err}, ${absImportLink}`);
        }


        isImporting[idOrLink] = false;
        {
            const objCached = { mod };
            importFc4i_nocachenames[idOrLink] = objCached;
        }
        return mod;
    }
    window["importFc4i"] = importFc4i;



    async function getWebBrowserInfo() {

        function getRealBrands() {
            const userAgentData = navigator["userAgentData"];
            if (!userAgentData || !userAgentData?.brands) return [];
            return userAgentData.brands.filter(brand =>
                !/[^a-zA-Z0-9]/.test(brand.brand)
            );
        }

        function isChromiumBased() {
            const brands = getRealBrands();
            return brands.some(brand =>
                /Chromium|Chrome|GoogleChrome|MicrosoftEdge|Opera|Brave/i.test(brand.brand)
            ) ||
                // !!window.chrome;
                !!window["chrome"];
        }

        function isMobileDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        // PWA
        function getDisplayMode() {
            const modes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
            for (const mode of modes) {
                if (window.matchMedia(`(display-mode: ${mode})`).matches) {
                    return mode;
                }
            }
            return 'browser'; // fallback
        }
        function getIsPWA() { return "browser" != getDisplayMode(); }

        function checkForSyntaxNx() {
            try {
                new Function('n?.x');
                return true;
            } catch (err) {
                console.log(err);
                console.error("Syntax n?.x not recognized");
                debugger; // eslint-disable-line no-debugger
                // missingFeatures.push("Syntax n?.x not recognized");
            }
            return false;
        }

        function getAndroidApp() {
            const referrer = document.referrer;
            if (referrer.startsWith('android-app://')) return referrer;
        }
        async function getHasSW() {
            const arrRegistrations = await navigator.serviceWorker.getRegistrations();
            if (!arrRegistrations) return false;
            if (arrRegistrations.length == 0) return false;
            return true;
        }

        function isAndroidWebView() {
            // https://developer.chrome.com/multidevice/user-agent
            return (navigator.userAgent.indexOf(" wv") !== -1);
        }


        async function detectEnvironment() {
            let modInappSpy;
            try {
                // @ts-ignore - the module link is ok
                modInappSpy = await import('https://cdn.jsdelivr.net/npm/inapp-spy@latest/dist/index.mjs');
            } catch (err) {
                console.log("detectEnvironment", err);
                return;
            }
            let isInApp = false, appKey = "(none)", appName = "(none)";
            if (modInappSpy) {
                ({ isInApp, appKey, appName } = modInappSpy.default());
            }
            const isAndroidApp = getAndroidApp();
            const isChromium = isChromiumBased();
            const isPWA = getIsPWA();
            const hasSW = await getHasSW();
            const isMobile = isMobileDevice();
            const isAndroidWView = isAndroidWebView();
            const canSyntaxNx = checkForSyntaxNx();
            const url = location.href;
            return {
                isChromium,
                isMobile,
                isAndroidWView,
                isPWA,
                hasSW,
                isAndroidApp,
                isInApp,
                inAppBrowserName: appName || null,
                inAppBrowserKey: appKey || null,
                url,
                canSyntaxNx,
            };
        }

        const env = await detectEnvironment();
        // console.log(env);
        return env;
    }
    const promWebBrowserInfo = getWebBrowserInfo();
    window["promWebBrowserInfo"] = promWebBrowserInfo;
    (async () => {
        const webBrowserInfo = await promWebBrowserInfo;
        if (webBrowserInfo?.isInApp) {
            tellOpenInExternalBrowser();
        }
    })();

    const sp = new URLSearchParams(location.search);
    // debugger;
    if (sp.has("inapp")) {
        tellOpenInExternalBrowser();
    }
    function tellOpenInExternalBrowser() {
        window["in-app-screen"] = true;
        let htmlWhat = `
            <p id="what">
                This is a link to MM4I.
            </p>
        `;
        const sp = new URLSearchParams(location.search);
        if (sp.has("sharepost")) {
            htmlWhat = `
                <p id="what">
                    This is a link to a MM4I mindmap.
                </p>
            `;
        }
        const doIt = () => {
            // FIX-ME: image...
            let innerHtml = `
        <head>
        <style>
            body {
                background: #808000;
                color: black;
                padding: 0px 30px;
            }
            #what {
                font-weight: bold;
            }
            #mm4i-image {
                background-image: url(https://mm4i.vercel.app/img/mm4i.svg);
                width: 200px;
                height: 100px;
                background-repeat: no-repeat;
                background-size: contain;
                background-position: center;
                opacity: 0.5;
            }
        </head>
        `;
            document.documentElement.innerHTML = innerHtml;
            const body = document.createElement("body");
            body.innerHTML = `
        <div>
            <h1>MM4i (Mindmap 4 Internet)</h1>
            ${htmlWhat}
            Please open this in your external web browser.
        </div>
        <p id="mm4i-image"></p>
        <details>
          <summary>How to open in external web browser</summary>
          <dl>
            <dt>On Android:</dt>
            <dd>
              Use the three-dot menu in the upper left corner.
            </dd>
            <dt>On iPhone:</dt>
            <dd style="font-style:italic; color:#eee">
              (No idea. Someone has to tell me.)
            </dd>
          </dl>
        </details>
        `;
            const oldBody = document.body;
            oldBody?.remove();
            document.documentElement.appendChild(body);
        }
        setTimeout(() => doIt(), 1000);
    }

}

/** @param {string} idOrLink @returns {Promise<Object>} */
window["importFc4i"];