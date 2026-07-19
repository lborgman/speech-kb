// @ts-check
const LOCAL_FILE_READER_VER = "0.0.1";
window["logConsoleHereIs"](`here is opfs.js, module, ${LOCAL_FILE_READER_VER}`);
if (document.currentScript) { throw "opfs.js is not loaded as module"; }

// Good description: https://web.dev/articles/origin-private-file-system

// @ts-ignore
const mkElt = window["mkElt"];

/** @type {undefined|string} */
let myOpfsSubDirName;
/* @type {undefined|FileSystemDirectoryHandle} */
/*
let myOpfsSubDirHandle;
async function getMyOpfsDirHandle() {
    const opfsRoot = await navigator.storage.getDirectory();
}
*/

/**
 * If the web page uses arbitrary file names it should have its own
 * sub directory. Just under the main directory.
 *
 * @param {string} subDirName
 */
export function setMyOpfsDirectory(subDirName) {
    if (!isValidOPFSName(subDirName)) {
        debugger;
        throw Error(`"${subDirName}" is not a valid OPFS directory name`);
    }
    myOpfsSubDirName = subDirName;
}

/**
 * Get a handle to the dir corresponding to setMyOpfsDirectory.
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
async function getMyOpfsRoot() {
    const opfsRoot = await navigator.storage.getDirectory();
    if (myOpfsSubDirName == undefined) {
        debugger;
        return opfsRoot;
    }
    const mySubdir = opfsRoot.getDirectoryHandle(myOpfsSubDirName, { create: true });
    return mySubdir;
}


/**
 * Validates if a string is a legal file or directory name in OPFS.
 * @param {string} name - The filename to validate.
 * @returns {boolean} - True if valid, false if invalid.
 */
function isValidOPFSName(name) {
    // 1. Must be a non-empty string
    if (typeof name !== 'string' || name.trim() === '') {
        return false;
    }

    // 2. Length check (Most filesystems max out at 255 characters)
    if (name.length > 255) {
        return false;
    }

    // 3. Reject forbidden characters
    // Blocks path separators (/ and \), control characters (0x00-0x1F, 0x7F), 
    // and characters illegal on Windows/macOS/Linux paths (< > : " | ? *)
    const forbiddenChars = /[\\\/:*?"<>|[\x00-\x1F\x7F]/;
    if (forbiddenChars.test(name)) {
        return false;
    }

    // 4. Reject names that are just dots (current or parent directory references)
    if (name === '.' || name === '..') {
        return false;
    }

    // 5. Reject trailing dots or spaces (causes issues on Windows)
    if (name.endsWith('.') || name.endsWith(' ')) {
        return false;
    }

    // 6. Reject Windows Reserved Names (case-insensitive, with or without extensions)
    // e.g., "con", "lpt1.txt", "PRN.tar.gz" are all blocked
    const reservedWindowsNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
    if (reservedWindowsNames.test(name)) {
        return false;
    }

    // 7. Ensure valid Unicode (OPFS uses USVString)
    // If the string contains unpaired surrogates, it's invalid
    try {
        // encodeURIComponent throws if it hits malformed Unicode strings
        encodeURIComponent(name);
    } catch (e) {
        return false;
    }

    return true;
}


// #region showOpenFilePicker
function makeFilePickerOptions(mediaTypes, title) {
    title = title || mediaTypes;
    if (typeof title != "string") throw Error(`title must be string`);

    const arrMediatypes = mediaTypes.split(",").map(mt => mt.trim());
    const validTypes = "application,audio,font,image,message,model,multipart,text,video,example";
    const typesArray = validTypes.split(",");
    arrMediatypes.forEach(mt => {
        const [mtType] = mt.split("/");
        const isValid = typesArray.includes(mtType);
        if (!isValid) {
            throw Error(`Invalid media type: "${mtType}" (${mt})`);
        }
    });

    /** @type {Record<string,string[]>} */
    const objAccept = {};
    arrMediatypes.forEach(mt => {
        let [mtType, mtSubtype] = mt.split("/");
        mtSubtype = mtSubtype || "*";
        objAccept[`${mtType}/${mtSubtype}`] = [];
    });

    function sanitizePickerId(inputString) {
        if (typeof inputString !== 'string') return '';
        return inputString.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    }

    return {
        id: sanitizePickerId(title),
        types: [{ description: title, accept: objAccept }],
        excludeAcceptAllOption: true,
    };
}

export async function selectFile(mediaTypes, title) {
    const pickerOptions = makeFilePickerOptions(mediaTypes, title);
    return selectFileAdvanced(pickerOptions);
}

/**
 * @param {Object} pickerOptions
 * @returns {Promise<FileSystemFileHandle|undefined>} Returns null if aborted
 */
export async function selectFileAdvanced(pickerOptions) {
    try {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker(pickerOptions);
        if (!handle) throw Error("SelectAndSaveFile: !handle");
        // const blob = await handle.getFile();
        // console.log({ blob });
        // debugger;

        return handle;
    } catch (err) {
        /*
        if (err instanceof Error && err.name === "AbortError") {
            return undefined; // Changing null to undefined to match standard optional returns
        }
        */
        // 1. "AbortError" = User clicked cancel
        // 2. "TypeError" = Browser rejected the options object format on cleanup
        if (err.name === "AbortError" || err instanceof TypeError) {
            console.warn(`File picker closed safely. Reason: ${err.message}`);
            return undefined;
        }

        console.error("File picker error:", err);
        throw err;
    }
}

export async function selectAndSaveFile(savedName, mediaTypes, title) {
    if (typeof savedName != "string") throw Error(`savedName must be string`);
    const pickerOptions = makeFilePickerOptions(mediaTypes, title);
    return selectAndSaveFileAdvanced(savedName, pickerOptions);
}

export async function selectAndSaveFileAdvanced(savedName, pickerOptions) {
    const fileHandle = await selectFileAdvanced(pickerOptions);
    if (!fileHandle) return false; // User cancelled
    // await saveToOpfs(savedName, fileHandle);
    await saveFileSystemHandleAsBlob(savedName, fileHandle);
    return true;
}

// #endregion



/**
 * 
 * @param {string} fileName 
 * @param {FileSystemFileHandle} fileHandle 
 */
async function saveFileSystemHandleAsBlob(fileName, fileHandle) {
    if (!fileHandle) {
        // Bug hunting:
        const msg = `!handle`;
        console.error(msg);
        debugger;
        throw Error(msg);
    }
    const file = await fileHandle.getFile();

    // const opfsRoot = await navigator.storage.getDirectory();
    // const opfsFileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
    const myDir = await getMyOpfsRoot();
    const opfsFileHandle = await myDir.getFileHandle(fileName, { create: true });

    const writable = await opfsFileHandle.createWritable();
    await writable.write(file);
    await writable.close();
}

/**
 * @param {string} fileName
 * @param {string} text
 * @return {Promise<undefined|FileSystemFileHandle>}
 */
export async function saveTextAsBlob(fileName, text) {
    // Just check to see we got the params in the right order:
    const lenFileName = fileName.length;
    const maxFileName = 50;
    if (lenFileName > maxFileName) {
        throw Error(`Max length saveName == ${maxFileName}, current length ${lenFileName}`)
    }
    let opfsFileHandle;
    try {
        // const opfsRoot = await navigator.storage.getDirectory();
        // opfsFileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
        const myDir = await getMyOpfsRoot();
        opfsFileHandle = await myDir.getFileHandle(fileName, { create: true });

        const writable = await opfsFileHandle.createWritable();
        await writable.write(text);
        await writable.close();
    } catch (error) {
        console.error("Failed to write data to OPFS:", error);
    }
    return opfsFileHandle;
}

/**
 * @param {string} savedName 
 * @returns {Promise<Blob|undefined>}
 */
export async function getSavedFileBlob(savedName) {
    const b = await getBlobFromOPFS(savedName);
    return b;
}

async function getOurDatabase() {
    debugger;
    throw Error("getOurDatabase called");
    return getDatabase('FileHandlesDB', 8);
}


/**
 * Fetches an image file from OPFS and creates a temporary Object URL.
 * @param {string} fileName - The name of the file inside OPFS
 * @returns {Promise<string>} The temporary blob:// URL
 */
async function getBlobUrlFromOPFS(fileName) {
    /*
    const root = await navigator.storage.getDirectory();

    // 1. Get the private handle for the file
    const fileHandle = await root.getFileHandle(fileName);

    // 2. Unpack it into a standard Web File/Blob object
    const fileBlob = await fileHandle.getFile();
    */

    const fileBlob = await getBlobFromOPFS(fileName);

    // 3. Generate the temporary URL pointing to these cached bytes
    return URL.createObjectURL(fileBlob);
}
/**
 * @param {string} fileName
 * @returns {Promise<FileSystemHandle|undefined}
 */
async function getHandleFromOPFS(fileName) {
    const opfsRoot = await navigator.storage.getDirectory();

    // 1. Get the private handle for the file
    try {
        const fileHandle = await opfsRoot.getFileHandle(fileName);
        return fileHandle;
    } catch (err) {
        if (!(err instanceof Error)) throw Error("err is not Error");
        if (err.name == "NotFoundError") {
            return undefined;
        }
        console.error(err);
        debugger;
        throw Error;
    }
}

/**
 * 
 * @param {string} fileName 
 * @returns {Promise<boolean>}
 */
export async function fileExistsInOPFS(fileName) {
    const fileHandle = await getHandleFromOPFS(fileName);
    return fileHandle != undefined;
}

/**
 * @param {string} fileName 
 * @returns {Promise<Blob|undefined>}
 */
async function getBlobFromOPFS(fileName) {
    const fileHandle = await getHandleFromOPFS(fileName);
    if (!fileHandle) return undefined;

    const fileBlob = await fileHandle.getFile();

    const blobStart = fileBlob.slice(0, 4096);
    const textStart = await blobStart.text();
    if (textStart.indexOf("<svg ") > -1) {
        const typedBlob = new Blob([fileBlob], { type: "image/svg+xml" });
        return typedBlob;
    }

    return fileBlob;
}

/**
 * Safely checks if an Object URL is active without throwing security errors.
 * @param {string} url - The blob:// URL to test
 * @returns {Promise<boolean>} True if valid, false if revoked or blocked
 */
export async function isObjectUrlValid(url) {
    if (!url || !url.startsWith('blob:')) {
        debugger;
        return false;
    }

    try {
        // 1. MUST use 'GET' instead of 'HEAD' for Blobs
        // 2. 'cors' ensures we don't trip over origin mismatches
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        return response.ok;
    } catch (error) {
        // If it catches an error, the URL is either revoked 
        // OR a strict Content Security Policy is blocking fetch() from blobs.
        console.warn("Blob validation fetch failed:", error.message);
        return false;
    }
}


/**
 * Developer script to reset OPFS data
 * (Please run on Chrome devtools console)
 */
export async function clearOPFS() {
    await (await navigator.storage.getDirectory()).remove({ recursive: true });
    return;
    const opfsRoot = await navigator.storage.getDirectory();
    for await (const entry of opfsRoot.values()) {
        console.log(`Remove: ${entry.name} (${entry.kind})`);
        await entry.remove();
    }
    console.log('OPFS has been cleared');
}

export async function OLDlistDirectoryContents(directoryHandle, depth) {
    depth = depth || 1;
    if (depth > 1) {
        debugger;
        throw Error("can only handle depth == 1 yet");
    }
    directoryHandle = directoryHandle || await navigator.storage.getDirectory();
    const entries = await directoryHandle.values();

    const filesNames = [];
    for await (const entry of entries) {
        // Add proper indentation based on the depth
        const indentation = '    '.repeat(depth);

        if (entry.kind === 'directory') {
            // If it's a directory, log its name 
            // and recursively list its contents
            console.log(`${indentation}${entry.name}/`);
            await listDirectoryContents(entry, depth + 1);
        } else {
            // If it's a file, log its name
            console.log(`${indentation}${entry.name}`);
            filesNames.push(entry.name);
        }
    }
    return filesNames;
}
export async function listMyDirectoryContents() {
    const myRoot = await getMyOpfsRoot();
    console.log({ myRoot });
    const list = await listDirectoryContents(myRoot);
    return list;
}
async function listDirectoryContents(directoryHandle) {
    // Fallback to Origin Private File System if no handle is passed
    const dir = directoryHandle || await navigator.storage.getDirectory();

    // FIX-ME:
    // const dv = await dir.values();
    // debugger;
    // const arrTemp = [...dv];
    // debugger;

    /** @type {FileSystemHandle[]} */
    const arrTemp = await Array.fromAsync(dir.values());

    /** @type {string[]} */
    const fileNames = [];
    /** @type {string[]} */
    const dirNames = [];

    // for await (const entry of dir.values()) {
    arrTemp.forEach(entry => {
        const isDir = entry.kind === 'directory';

        // Log directories with a trailing slash, files normally
        // console.log(`    ${entry.name}${isDir ? '/' : ''}`);

        if (!isDir) {
            fileNames.push(entry.name);
        } else {
            dirNames.push(entry.name)
        }
    });
    // return fileNames;
    return {
        files: fileNames.sort(),
        dirs: dirNames.sort(),
    }
}

/**
 * @param {FileSystemDirectoryHandle|null} [dirHandle]
 * @param {string} indent
 * @return {Promise<string[]>}
 */
// FIX-ME: make recursive, collect lines
export async function listOPFS(dirHandle, indent = "") {
    const tofIndent = typeof indent;
    if (tofIndent != "string") {
        console.error(`${tofIndent}`);
        debugger;
        throw Error(`${tofIndent}`);
    }
    /** @type {string[]} */
    const lines = []
    const addToLines = (txt) => {
        const tofTxt = typeof txt;
        if (tofTxt != "string") {
            debugger;
            throw Error("not string", { txt });
        }
        lines.push(txt);
    }
    // If no directory is passed, default to the root OPFS directory
    if (!dirHandle) {
        dirHandle = await navigator.storage.getDirectory();
        // console.log("📂 [OPFS Root]");
        const txt = "📂 [OPFS Root]";
        console.log(txt);
        addToLines(txt);
    }

    // await listOPFS(handle, indent + "  ");
    await listInner(dirHandle, "");
    async function listInner(dirHandle, indent) {
        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === "directory") {
                // console.log(`${indent}📁 ${name}/`);
                const txt = `${indent}📁 ${name}/`;
                console.log(txt);
                addToLines(txt);
                // Recursively list the contents of the subfolder
                // await listOPFS(handle, indent + "  ");
                await listInner(handle, indent + "  ");
            } else {
                // console.log(`${indent}📄 ${name}`);
                const txt = `${indent}📄 ${name}`;
                console.log(txt);
                addToLines(txt);
            }
        }
    }
    return lines;
}

// Run the function
console.log("BEFORE listOPFS");
await listOPFS();
console.log("AFTER listOPFS");

// await listDirectoryContents(dirHandle) {
// console.log("AFTER listDirectoryContents");

async function newListDirectoryContents(dirHandle) {
    console.log("-------- listDirectoryContents");
    // Loop asynchronously through the directory entries
    for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
            console.log(`📄 File: ${name}`);
        } else if (handle.kind === 'directory') {
            console.log(`📁 Directory: ${name}`);
        }
    }
}



// console.log("BEFORE listMyDirectoryContents");
// const ldcMy = await listMyDirectoryContents();
// console.log("AFTER listMyDirectoryContents", ldcMy);