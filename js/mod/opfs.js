// @ts-check
const LOCAL_FILE_READER_VER = "0.0.02";
window["logConsoleHereIs"](`here is opfs.js, module, ${LOCAL_FILE_READER_VER}`);
if (document.currentScript) { throw "opfs.js is not loaded as module"; }

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
 * @param {object} pickerOptions
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
export async function saveFileSystemHandleAsBlob(fileName, fileHandle) {
    // await saveToOpfs(fileName, fileHandle);
// }
// async function saveToOpfs(fileName, fileHandle) {
    if (!fileHandle) {
        // Bug hunting:
        const msg = `!handle`;
        console.error(msg);
        debugger;
        throw Error(msg);
    }
    const file = await fileHandle.getFile();

    const root = await navigator.storage.getDirectory();
    const opfsFileHandle = await root.getFileHandle(fileName, { create: true });

    const writable = await opfsFileHandle.createWritable();
    await writable.write(file);
    await writable.close();
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
    const root = await navigator.storage.getDirectory();

    // 1. Get the private handle for the file
    try {
        const fileHandle = await root.getFileHandle(fileName);
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
export async function resetOPFS() {
    if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        const root = await navigator.storage.getDirectory();
        for await (const entry of root.values()) {
            console.log(`Remove: ${entry.name} (${entry.kind})`);
            await entry.remove();
        }
        console.log('OPFS has been reset');
    } else {
        console.log('OPFS is not supported in this browser');
    }
}

export async function listDirectoryContents(directoryHandle, depth) {
    depth = depth || 1;
    directoryHandle = directoryHandle || await navigator.storage.getDirectory();
    const entries = await directoryHandle.values();

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
        }
    }
}