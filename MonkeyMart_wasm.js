var Module = typeof Module !== "undefined" ? Module : {};
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function(status, toThrow) {
    throw toThrow
};
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";

function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;
if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require("path").dirname(scriptDirectory) + "/"
    } else {
        scriptDirectory = __dirname + "/"
    }
    read_ = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        return nodeFS["readFileSync"](filename, binary ? null : "utf8")
    };
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    };
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", function(ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function(status) {
        process["exit"](status)
    };
    Module["inspect"] = function() {
        return "[Emscripten Module object]"
    }
} else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
        read_ = function shell_read(f) {
            return read(f)
        }
    }
    readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data
    };
    if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs
    } else if (typeof arguments != "undefined") {
        arguments_ = arguments
    }
    if (typeof quit === "function") {
        quit_ = function(status) {
            quit(status)
        }
    }
    // if (typeof print !== "undefined") {
    //     if (typeof console === "undefined") console = {};
    //     console.log = print;
    //     console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
    // }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (typeof document !== "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    } {
        read_ = function shell_read(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText
        };
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = function readBinary(url) {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        readAsync = function readAsync(url, onload, onerror) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function xhr_onload() {
                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return
                }
                onerror()
            };
            xhr.onerror = onerror;
            xhr.send(null)
        }
    }
    setWindowTitle = function(title) {
        document.title = title
    }
} else {}
// var out = Module["print"] || console.log.bind(console);
// var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];
var STACK_ALIGN = 16;

function alignMemory(size, factor) {
    if (!factor) factor = STACK_ALIGN;
    return Math.ceil(size / factor) * factor
}

function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text)
    }
}
var tempRet0 = 0;
var setTempRet0 = function(value) {
    tempRet0 = value
};
var getTempRet0 = function() {
    return tempRet0
};
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime;
if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
if (typeof WebAssembly !== "object") {
    abort("no native wasm support detected")
}

function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
    }
}

function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            return HEAP8[ptr >> 0];
        case "i8":
            return HEAP8[ptr >> 0];
        case "i16":
            return HEAP16[ptr >> 1];
        case "i32":
            return HEAP32[ptr >> 2];
        case "i64":
            return HEAP32[ptr >> 2];
        case "float":
            return HEAPF32[ptr >> 2];
        case "double":
            return HEAPF64[ptr >> 3];
        default:
            abort("invalid type for getValue: " + type)
    }
    return null
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;

function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}

function getCFunc(ident) {
    var func = Module["_" + ident];
    assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
    return func
}

function ccall(ident, returnType, argTypes, args, opts) {
    var toC = {
        "string": function(str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = stackAlloc(len);
                stringToUTF8(str, ret, len)
            }
            return ret
        },
        "array": function(arr) {
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }
    };

    function convertReturnValue(ret) {
        if (returnType === "string") return UTF8ToString(ret);
        if (returnType === "boolean") return Boolean(ret);
        return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0) stack = stackSave();
                cArgs[i] = converter(args[i])
            } else {
                cArgs[i] = args[i]
            }
        }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0) stackRestore(stack);
    return ret
}
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;

function allocate(slab, allocator) {
    var ret;
    if (allocator == ALLOC_STACK) {
        ret = stackAlloc(slab.length)
    } else {
        ret = _malloc(slab.length)
    }
    if (slab.subarray || slab.slice) {
        HEAPU8.set(slab, ret)
    } else {
        HEAPU8.set(new Uint8Array(slab), ret)
    }
    return ret
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr))
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = heap[idx++];
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            var u1 = heap[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            var u2 = heap[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
    return str
}

function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) ++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4
    }
    return len
}

function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}

function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}

function writeStringToMemory(string, buffer, dontAddNull) {
    warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
    var lastChar, end;
    if (dontAddNull) {
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end]
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull) HEAP8[end] = lastChar
}

function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
}

function alignUp(x, multiple) {
    if (x % multiple > 0) {
        x += multiple - x % multiple
    }
    return x
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"]
} else {
    wasmMemory = new WebAssembly.Memory({
        "initial": INITIAL_MEMORY / 65536,
        "maximum": 2147483648 / 65536
    })
}
if (wasmMemory) {
    buffer = wasmMemory.buffer
}
INITIAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}

function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    TTY.init();
    SOCKFS.root = FS.mount(SOCKFS, {}, null);
    callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
    runtimeExited = true
}

function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}

function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
    return id
}

function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}

function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};

function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what)
    }
    what += "";
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e
}

function hasPrefix(str, prefix) {
    return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0
}
var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
    return hasPrefix(filename, dataURIPrefix)
}
var fileURIPrefix = "file://";

function isFileURI(filename) {
    return hasPrefix(filename, fileURIPrefix)
}
var wasmBinaryFile = "dmengine.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}

function getBinary(file) {
    try {
        if (file == wasmBinaryFile && wasmBinary) {
            return new Uint8Array(wasmBinary)
        }
        if (readBinary) {
            return readBinary(file)
        } else {
            throw "both async and sync fetching of the wasm failed"
        }
    } catch (err) {
        abort(err)
    }
}

function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
        return fetch(wasmBinaryFile, {
            credentials: "same-origin"
        }).then(function(response) {
            if (!response["ok"]) {
                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
            }
            return response["arrayBuffer"]()
        }).catch(function() {
            return getBinary(wasmBinaryFile)
        })
    }
    return Promise.resolve().then(function() {
        return getBinary(wasmBinaryFile)
    })
}

function createWasm() {
    var info = {
        "a": asmLibraryArg
    };

    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        wasmTable = Module["asm"]["ui"];
        removeRunDependency("wasm-instantiate")
    }
    addRunDependency("wasm-instantiate");

    function receiveInstantiatedSource(output) {
        receiveInstance(output["instance"])
    }

    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
            return WebAssembly.instantiate(binary, info)
        }).then(receiver, function(reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason)
        })
    }

    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiatedSource, function(reason) {
                    err("wasm streaming compile failed: " + reason);
                    err("falling back to ArrayBuffer instantiation");
                    return instantiateArrayBuffer(receiveInstantiatedSource)
                })
            })
        } else {
            return instantiateArrayBuffer(receiveInstantiatedSource)
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports
        } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false
        }
    }
    instantiateAsync();
    return {}
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    1314: function() {
        if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
            console.log("%c    %c    Made with Defold    %c    %c    https://www.defold.com", "background: #fd6623; padding:5px 0; border: 5px;", "background: #272c31; color: #fafafa; padding:5px 0;", "background: #39a3e4; padding:5px 0;", "background: #ffffff; color: #000000; padding:5px 0;")
        } else {
            console.log("Made with Defold -=[ https://www.defold.com ]=-")
        }
    },
    179651: function($0) {
        var jsResult;
        var isSuccess = 1;
        try {
            jsResult = eval(UTF8ToString($0))
        } catch (err) {
            isSuccess = 0;
            jsResult = err
        }
        _dmScript_Html5ReportOperationSuccess(isSuccess);
        jsResult += "";
        var lengthBytes = lengthBytesUTF8(jsResult) + 1;
        var stringOnWasmHeap = _malloc(lengthBytes);
        stringToUTF8(jsResult, stringOnWasmHeap, lengthBytes);
        return stringOnWasmHeap
    },
    180095: function() {
        document.removeEventListener("click", Module.__defold_interaction_listener);
        document.removeEventListener("keyup", Module.__defold_interaction_listener);
        document.removeEventListener("touchend", Module.__defold_interaction_listener);
        Module.__defold_interaction_listener = undefined
    },
    180409: function() {
        Module.__defold_interaction_listener = function() {
            _dmScript_RunInteractionCallback()
        };
        document.addEventListener("click", Module.__defold_interaction_listener);
        document.addEventListener("keyup", Module.__defold_interaction_listener);
        document.addEventListener("touchend", Module.__defold_interaction_listener)
    }
};

function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback(Module);
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                wasmTable.get(func)()
            } else {
                wasmTable.get(func)(callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}

function demangle(func) {
    return func
}

function demangleAll(text) {
    var regex = /\b_Z[\w\d_]+/g;
    return text.replace(regex, function(x) {
        var y = demangle(x);
        return x === y ? x : y + " [" + x + "]"
    })
}

function jsStackTrace() {
    var error = new Error;
    if (!error.stack) {
        try {
            throw new Error
        } catch (e) {
            error = e
        }
        if (!error.stack) {
            return "(no stack trace available)"
        }
    }
    return error.stack.toString()
}

function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js)
}
var PokiSdk = {
    _callback: null,
    _urlCallback: null,
    _urlParameters: null,
    _commercialBreakCallback: function() {
        wasmTable.get(PokiSdk._callback)()
    },
    _rewardedBreakCallback: function(success) {
        var msg = success ? 1 : 0;
        wasmTable.get(PokiSdk._callback)(msg)
    },
    _shareableURLCallback: function(url) {
        var url_arr = intArrayFromString(url, true);
        var _url = allocate(url_arr, ALLOC_NORMAL);
        wasmTable.get(PokiSdk._urlCallback)(_url, url_arr.length);
        Module._free(_url)
    }
};

function _PokiSdkJs_AddParameterForURL(key, value) {
    if (PokiSdk._urlParameters == null) {
        PokiSdk._urlParameters = {}
    }
    PokiSdk._urlParameters[UTF8ToString(key)] = UTF8ToString(value)
}

function _PokiSdkJs_CaptureError(error) {}

function _PokiSdkJs_CommercialBreak(callback) {
    PokiSdk._callback = callback;
    new Promise((function (n) {
         window.parent.postMessage("next", "*");
                    // 定义iframe通信对象MIAD_NEXT
                    window.parent.MIAD_NEXT = {};
                    // 插屏广告播放成功
                    window.parent.MIAD_NEXT._callback = function () {
                      
                    };
                    // 插屏广告播放失败（注意原因可能是频次太快，建议在failback也能继续游戏流程）
                    window.parent.MIAD_NEXT._failback = function () {
                       
                    };
   
    }))
    PokiSdk._commercialBreakCallback()
}

function _PokiSdkJs_GameplayStart() {

}

function _PokiSdkJs_GameplayStop() {

}

function _PokiSdkJs_GetURLParam(key) {
    var key = UTF8ToString(key);

    return allocate(intArrayFromString(true), ALLOC_STACK)
}

function _PokiSdkJs_IsAdBlocked() {
    return false
}

function _PokiSdkJs_RewardedBreak(callback) {
    PokiSdk._callback = callback;

    new Promise((function (n) {

        window.parent.postMessage("reward", "*");
        // 定义iframe通信对象MIAD
        var __this = this;
        window.parent.MIAD = {};
        // 定义激励视频播放完成 发放奖励
        window.parent.MIAD._callback = function () {
            PokiSdk._rewardedBreakCallback(true);
        };
        // 定义激励视频播放失败 不发放奖励
        window.parent.MIAD._failback = function () {
            PokiSdk._rewardedBreakCallback(false);
        };
    }))



    // JumpGame.showReward({
    //     beforeShowAd: () => {

    //     },
    //     afterShowAd: (flag) => {
    //         PokiSdk._rewardedBreakCallback(flag);
    //     }
    // })
}

function _PokiSdkJs_SetDebug(value) {

}

function _PokiSdkJs_ShareableURL(callback) {
    PokiSdk._urlCallback = callback;
    PokiSdk._urlParameters = null
}

function ___assert_fail(condition, filename, line, func) {
    abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
}
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6
    }
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow
} else _emscripten_get_now = function() {
    return performance.now()
};
var _emscripten_get_now_is_monotonic = true;

function setErrNo(value) {
    HEAP32[___errno_location() >> 2] = value;
    return value
}

function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now()
    } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
        now = _emscripten_get_now()
    } else {
        setErrNo(28);
        return -1
    }
    HEAP32[tp >> 2] = now / 1e3 | 0;
    HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
    return 0
}

function ___clock_gettime(a0, a1) {
    return _clock_gettime(a0, a1)
}

function _gmtime_r(time, tmPtr) {
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getUTCSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
    HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
    HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
    HEAP32[tmPtr + 36 >> 2] = 0;
    HEAP32[tmPtr + 32 >> 2] = 0;
    var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    if (!_gmtime_r.GMTString) _gmtime_r.GMTString = allocateUTF8("GMT");
    HEAP32[tmPtr + 40 >> 2] = _gmtime_r.GMTString;
    return tmPtr
}

function ___gmtime_r(a0, a1) {
    return _gmtime_r(a0, a1)
}

function _tzset() {
    if (_tzset.called) return;
    _tzset.called = true;
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAP32[__get_timezone() >> 2] = stdTimezoneOffset * 60;
    HEAP32[__get_daylight() >> 2] = Number(winterOffset != summerOffset);

    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocateUTF8(winterName);
    var summerNamePtr = allocateUTF8(summerName);
    if (summerOffset < winterOffset) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
    } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
    }
}

function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var start = new Date(date.getFullYear(), 0, 1);
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst;
    var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
    HEAP32[tmPtr + 40 >> 2] = zonePtr;
    return tmPtr
}

function ___localtime_r(a0, a1) {
    return _localtime_r(a0, a1)
}
var PATH = {
    splitPath: function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    },
    normalizeArray: function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    },
    normalize: function(path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    },
    dirname: function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    },
    basename: function(path) {
        if (path === "/") return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    },
    extname: function(path) {
        return PATH.splitPath(path)[3]
    },
    join: function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    },
    join2: function(l, r) {
        return PATH.normalize(l + "/" + r)
    }
};

function getRandomDevice() {
    if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
        var randomBuffer = new Uint8Array(1);
        return function() {
            crypto.getRandomValues(randomBuffer);
            return randomBuffer[0]
        }
    } else if (ENVIRONMENT_IS_NODE) {
        try {
            var crypto_module = require("crypto");
            return function() {
                return crypto_module["randomBytes"](1)[0]
            }
        } catch (e) {}
    }
    return function() {
        abort("randomDevice")
    }
}
var PATH_FS = {
    resolve: function() {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
            return !!p
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    },
    relative: function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var TTY = {
    ttys: [],
    init: function() {},
    shutdown: function() {},
    register: function(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open: function(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        flush: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        read: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        },
        write: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char: function(tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    try {
                        bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null)
                    } catch (e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        },
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    },
    default_tty1_ops: {
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    }
};

function mmapAlloc(size) {
    var alignedSize = alignMemory(size, 16384);
    var ptr = _malloc(alignedSize);
    while (size < alignedSize) HEAP8[ptr + size++] = 0;
    return ptr
}
var MEMFS = {
    ops_table: null,
    mount: function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    },
    createNode: function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node
        }
        return node
    },
    getFileDataAsRegularArray: function(node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr
        }
        return node.contents
    },
    getFileDataAsTypedArray: function(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage: function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
        return
    },
    resizeFileStorage: function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize;
            return
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else
            while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize
    },
    node_ops: {
        getattr: function(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr: function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup: function(parent, name) {
            throw FS.genericErrors[44]
        },
        mknod: function(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename: function(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir
        },
        unlink: function(parent, name) {
            delete parent.contents[name]
        },
        rmdir: function(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55)
            }
            delete parent.contents[name]
        },
        readdir: function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink: function(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28)
            }
            return node.link
        }
    },
    stream_ops: {
        read: function(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write: function(stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false
            }
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position)
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        },
        allocate: function(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        },
        mmap: function(stream, address, length, position, prot, flags) {
            assert(address === 0);
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === buffer) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48)
                }
                HEAP8.set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        },
        msync: function(stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: function() {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    },
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: function(mount) {
        return MEMFS.mount.apply(null, arguments)
    },
    syncfs: function(mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, function(err, remote) {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            })
        })
    },
    getDB: function(name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = function(e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        };
        req.onsuccess = function() {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    getLocalSet: function(mount, callback) {
        var entries = {};

        function isRealDir(p) {
            return p !== "." && p !== ".."
        }

        function toAbsolute(root) {
            return function(p) {
                return PATH.join2(root, p)
            }
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                "timestamp": stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    },
    getRemoteSet: function(mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
            if (err) return callback(err);
            try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                transaction.onerror = function(e) {
                    callback(this.error);
                    e.preventDefault()
                };
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index("timestamp");
                index.openKeyCursor().onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (!cursor) {
                        return callback(null, {
                            type: "remote",
                            db: db,
                            entries: entries
                        })
                    }
                    entries[cursor.primaryKey] = {
                        "timestamp": cursor.key
                    };
                    cursor.continue()
                }
            } catch (e) {
                return callback(e)
            }
        })
    },
    loadLocalEntry: function(path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                "timestamp": stat.mtime,
                "mode": stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                "timestamp": stat.mtime,
                "mode": stat.mode,
                "contents": node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    },
    storeLocalEntry: function(path, entry, callback) {
        try {
            if (FS.isDir(entry["mode"])) {
                FS.mkdir(path, entry["mode"])
            } else if (FS.isFile(entry["mode"])) {
                FS.writeFile(path, entry["contents"], {
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry["mode"]);
            FS.utime(path, entry["timestamp"], entry["timestamp"])
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    removeLocalEntry: function(path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    loadRemoteEntry: function(store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) {
            callback(null, event.target.result)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    storeRemoteEntry: function(store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() {
            callback(null)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    removeRemoteEntry: function(store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() {
            callback(null)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    reconcile: function(src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function(key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e["timestamp"].getTime() != e2["timestamp"].getTime()) {
                create.push(key);
                total++
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function(key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++
            }
        });
        if (!total) {
            return callback(null)
        }
        var errored = false;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err)
            }
        }
        transaction.onerror = function(e) {
            done(this.error);
            e.preventDefault()
        };
        transaction.oncomplete = function(e) {
            if (!errored) {
                callback(null)
            }
        };
        create.sort().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                })
            } else {
                IDBFS.loadLocalEntry(path, function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                })
            }
        });
        remove.sort().reverse().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        })
    }
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    lookupPath: function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32)
        }
        var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !!p
        }), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    },
    getPath: function(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    },
    hashName: function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode: function(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode: function(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode: function(node) {
        FS.hashRemoveNode(node)
    },
    isRoot: function(node) {
        return node === node.parent
    },
    isMountpoint: function(node) {
        return !!node.mounted
    },
    isFile: function(mode) {
        return (mode & 61440) === 32768
    },
    isDir: function(mode) {
        return (mode & 61440) === 16384
    },
    isLink: function(mode) {
        return (mode & 61440) === 40960
    },
    isChrdev: function(mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev: function(mode) {
        return (mode & 61440) === 24576
    },
    isFIFO: function(mode) {
        return (mode & 61440) === 4096
    },
    isSocket: function(mode) {
        return (mode & 49152) === 49152
    },
    flagModes: {
        "r": 0,
        "r+": 2,
        "w": 577,
        "w+": 578,
        "a": 1089,
        "a+": 1090
    },
    modeStringToFlags: function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    },
    flagsToPermissionString: function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions: function(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return 2
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return 2
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return 2
        }
        return 0
    },
    mayLookup: function(dir) {
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0
    },
    mayCreate: function(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete: function(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31
            }
        }
        return 0
    },
    mayOpen: function(node, flags) {
        if (!node) {
            return 44
        }
        if (FS.isLink(node.mode)) {
            return 32
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(33)
    },
    getStream: function(fd) {
        return FS.streams[fd]
    },
    createStream: function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function() {};
            FS.FSStream.prototype = {
                object: {
                    get: function() {
                        return this.node
                    },
                    set: function(val) {
                        this.node = val
                    }
                },
                isRead: {
                    get: function() {
                        return (this.flags & 2097155) !== 1
                    }
                },
                isWrite: {
                    get: function() {
                        return (this.flags & 2097155) !== 0
                    }
                },
                isAppend: {
                    get: function() {
                        return this.flags & 1024
                    }
                }
            }
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream: function(fd) {
        FS.streams[fd] = null
    },
    chrdev_stream_ops: {
        open: function(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        },
        llseek: function() {
            throw new FS.ErrnoError(70)
        }
    },
    major: function(dev) {
        return dev >> 8
    },
    minor: function(dev) {
        return dev & 255
    },
    makedev: function(ma, mi) {
        return ma << 8 | mi
    },
    registerDevice: function(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: function(dev) {
        return FS.devices[dev]
    },
    getMounts: function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    },
    syncfs: function(populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode)
        }

        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(function(mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        })
    },
    mount: function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount: function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function(hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1)
    },
    lookup: function(parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod: function(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    create: function(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir: function(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree: function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != 20) throw e
            }
        }
    },
    mkdev: function(path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink: function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename: function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, {
            parent: true
        });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, {
            parent: true
        });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            err("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    },
    rmdir: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54)
        }
        return node.node_ops.readdir(node)
    },
    unlink: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readlink: function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    },
    stat: function(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63)
        }
        return node.node_ops.getattr(node)
    },
    lstat: function(path) {
        return FS.stat(path, true)
    },
    chmod: function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    },
    lchmod: function(path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod: function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chmod(stream.node, mode)
    },
    chown: function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    },
    lchown: function(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown: function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        FS.chown(stream.node, uid, gid)
    },
    truncate: function(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    },
    ftruncate: function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
        }
        FS.truncate(stream.node, len)
    },
    utime: function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    },
    open: function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(44)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                err("FS.trackingDelegate error on read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            err("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    },
    close: function(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed: function(stream) {
        return stream.fd === null
    },
    llseek: function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read: function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            err("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    },
    allocate: function(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138)
        }
        stream.stream_ops.allocate(stream, offset, length)
    },
    mmap: function(stream, address, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags)
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    munmap: function(stream) {
        return 0
    },
    ioctl: function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile: function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile: function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: function() {
        return FS.currentPath
    },
    chdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories: function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices: function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function() {
                return 0
            },
            write: function(stream, buffer, offset, length, pos) {
                return length
            }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device = getRandomDevice();
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories: function() {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: function() {
                var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: function(parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(8);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: function() {
                                    return stream.path
                                }
                            }
                        };
                        ret.parent = ret;
                        return ret
                    }
                };
                return node
            }
        }, {}, "/proc/self/fd")
    },
    createStandardStreams: function() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1)
    },
    ensureErrnoError: function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function(errno) {
                this.errno = errno
            };
            this.setErrno(errno);
            this.message = "FS error"
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        })
    },
    staticInit: function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS
        }
    },
    init: function(input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    },
    quit: function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    },
    getMode: function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    },
    findObject: function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            return null
        }
    },
    analyzePath: function(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    },
    createPath: function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    },
    createFile: function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    },
    createDevice: function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function(stream) {
                stream.seekable = false
            },
            close: function(stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            },
            read: function(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write: function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    forceLoadFile: function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
    },
    createLazyFile: function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    }
                },
                chunkSize: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function() {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments)
            }
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            FS.forceLoadFile(node);
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    },
    createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);

        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function(plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, function() {
                        if (onerror) onerror();
                        removeRunDependency(dep)
                    });
                    handled = true
                }
            });
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, function(byteArray) {
                processData(byteArray)
            }, onerror)
        } else {
            processData(url)
        }
    },
    indexedDB: function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    },
    DB_NAME: function() {
        return "EM_FS_" + window.location.pathname
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            out("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    },
    loadFilesFromDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }
};
var SYSCALLS = {
    mappings: {},
    DEFAULT_POLLMASK: 5,
    umask: 511,
    calculateAt: function(dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd()
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(8);
                dir = dirstream.path
            }
            path = PATH.join2(dir, path)
        }
        return path
    },
    doStat: function(func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
        HEAP32[buf + 48 >> 2] = 4096;
        HEAP32[buf + 52 >> 2] = stat.blocks;
        HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 76 >> 2] = 0;
        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
        return 0
    },
    doMsync: function(addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags)
    },
    doMkdir: function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    },
    doMknod: function(path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -28
        }
        FS.mknod(path, mode, dev);
        return 0
    },
    doReadlink: function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    },
    doAccess: function(path, amode) {
        if (amode & ~7) {
            return -28
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        if (!node) {
            return -44
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2
        }
        return 0
    },
    doDup: function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    },
    doReadv: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    },
    doWritev: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr
        }
        return ret
    },
    varargs: undefined,
    get: function() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    },
    getStr: function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    },
    getStreamFromFD: function(fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream
    },
    get64: function(low, high) {
        return low
    }
};

function ___sys__newselect(nfds, readfds, writefds, exceptfds, timeout) {
    try {
        var total = 0;
        var srcReadLow = readfds ? HEAP32[readfds >> 2] : 0,
            srcReadHigh = readfds ? HEAP32[readfds + 4 >> 2] : 0;
        var srcWriteLow = writefds ? HEAP32[writefds >> 2] : 0,
            srcWriteHigh = writefds ? HEAP32[writefds + 4 >> 2] : 0;
        var srcExceptLow = exceptfds ? HEAP32[exceptfds >> 2] : 0,
            srcExceptHigh = exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0;
        var dstReadLow = 0,
            dstReadHigh = 0;
        var dstWriteLow = 0,
            dstWriteHigh = 0;
        var dstExceptLow = 0,
            dstExceptHigh = 0;
        var allLow = (readfds ? HEAP32[readfds >> 2] : 0) | (writefds ? HEAP32[writefds >> 2] : 0) | (exceptfds ? HEAP32[exceptfds >> 2] : 0);
        var allHigh = (readfds ? HEAP32[readfds + 4 >> 2] : 0) | (writefds ? HEAP32[writefds + 4 >> 2] : 0) | (exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0);
        var check = function(fd, low, high, val) {
            return fd < 32 ? low & val : high & val
        };
        for (var fd = 0; fd < nfds; fd++) {
            var mask = 1 << fd % 32;
            if (!check(fd, allLow, allHigh, mask)) {
                continue
            }
            var stream = FS.getStream(fd);
            if (!stream) throw new FS.ErrnoError(8);
            var flags = SYSCALLS.DEFAULT_POLLMASK;
            if (stream.stream_ops.poll) {
                flags = stream.stream_ops.poll(stream)
            }
            if (flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)) {
                fd < 32 ? dstReadLow = dstReadLow | mask : dstReadHigh = dstReadHigh | mask;
                total++
            }
            if (flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)) {
                fd < 32 ? dstWriteLow = dstWriteLow | mask : dstWriteHigh = dstWriteHigh | mask;
                total++
            }
            if (flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)) {
                fd < 32 ? dstExceptLow = dstExceptLow | mask : dstExceptHigh = dstExceptHigh | mask;
                total++
            }
        }
        if (readfds) {
            HEAP32[readfds >> 2] = dstReadLow;
            HEAP32[readfds + 4 >> 2] = dstReadHigh
        }
        if (writefds) {
            HEAP32[writefds >> 2] = dstWriteLow;
            HEAP32[writefds + 4 >> 2] = dstWriteHigh
        }
        if (exceptfds) {
            HEAP32[exceptfds >> 2] = dstExceptLow;
            HEAP32[exceptfds + 4 >> 2] = dstExceptHigh
        }
        return total
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_dup2(oldfd, suggestFD) {
    try {
        var old = SYSCALLS.getStreamFromFD(oldfd);
        if (old.fd === suggestFD) return suggestFD;
        return SYSCALLS.doDup(old.path, old.flags, suggestFD)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_dup3(fd, suggestFD, flags) {
    try {
        var old = SYSCALLS.getStreamFromFD(fd);
        if (old.fd === suggestFD) return -28;
        return SYSCALLS.doDup(old.path, old.flags, suggestFD)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0:
                {
                    var arg = SYSCALLS.get();
                    if (arg < 0) {
                        return -28
                    }
                    var newStream;newStream = FS.open(stream.path, stream.flags, 0, arg);
                    return newStream.fd
                }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4:
                {
                    var arg = SYSCALLS.get();stream.flags |= arg;
                    return 0
                }
            case 12:
                {
                    var arg = SYSCALLS.get();
                    var offset = 0;HEAP16[arg + offset >> 1] = 2;
                    return 0
                }
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -28;
            case 9:
                setErrNo(28);
                return -1;
            default:
                {
                    return -28
                }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509:
            case 21505:
                {
                    if (!stream.tty) return -59;
                    return 0
                }
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508:
                {
                    if (!stream.tty) return -59;
                    return 0
                }
            case 21519:
                {
                    if (!stream.tty) return -59;
                    var argp = SYSCALLS.get();HEAP32[argp >> 2] = 0;
                    return 0
                }
            case 21520:
                {
                    if (!stream.tty) return -59;
                    return -28
                }
            case 21531:
                {
                    var argp = SYSCALLS.get();
                    return FS.ioctl(stream, op, argp)
                }
            case 21523:
                {
                    if (!stream.tty) return -59;
                    return 0
                }
            case 21524:
                {
                    if (!stream.tty) return -59;
                    return 0
                }
            default:
                abort("bad ioctl syscall " + op)
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_lstat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.lstat, path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_mkdir(path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doMkdir(path, mode)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_open(path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(path);
        var mode = varargs ? SYSCALLS.get() : 0;
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_poll(fds, nfds, timeout) {
    try {
        var nonzero = 0;
        for (var i = 0; i < nfds; i++) {
            var pollfd = fds + 8 * i;
            var fd = HEAP32[pollfd >> 2];
            var events = HEAP16[pollfd + 4 >> 1];
            var mask = 32;
            var stream = FS.getStream(fd);
            if (stream) {
                mask = SYSCALLS.DEFAULT_POLLMASK;
                if (stream.stream_ops.poll) {
                    mask = stream.stream_ops.poll(stream)
                }
            }
            mask &= events | 8 | 16;
            if (mask) nonzero++;
            HEAP16[pollfd + 6 >> 1] = mask
        }
        return nonzero
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_rename(old_path, new_path) {
    try {
        old_path = SYSCALLS.getStr(old_path);
        new_path = SYSCALLS.getStr(new_path);
        FS.rename(old_path, new_path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_rmdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var ERRNO_CODES = {
    EPERM: 63,
    ENOENT: 44,
    ESRCH: 71,
    EINTR: 27,
    EIO: 29,
    ENXIO: 60,
    E2BIG: 1,
    ENOEXEC: 45,
    EBADF: 8,
    ECHILD: 12,
    EAGAIN: 6,
    EWOULDBLOCK: 6,
    ENOMEM: 48,
    EACCES: 2,
    EFAULT: 21,
    ENOTBLK: 105,
    EBUSY: 10,
    EEXIST: 20,
    EXDEV: 75,
    ENODEV: 43,
    ENOTDIR: 54,
    EISDIR: 31,
    EINVAL: 28,
    ENFILE: 41,
    EMFILE: 33,
    ENOTTY: 59,
    ETXTBSY: 74,
    EFBIG: 22,
    ENOSPC: 51,
    ESPIPE: 70,
    EROFS: 69,
    EMLINK: 34,
    EPIPE: 64,
    EDOM: 18,
    ERANGE: 68,
    ENOMSG: 49,
    EIDRM: 24,
    ECHRNG: 106,
    EL2NSYNC: 156,
    EL3HLT: 107,
    EL3RST: 108,
    ELNRNG: 109,
    EUNATCH: 110,
    ENOCSI: 111,
    EL2HLT: 112,
    EDEADLK: 16,
    ENOLCK: 46,
    EBADE: 113,
    EBADR: 114,
    EXFULL: 115,
    ENOANO: 104,
    EBADRQC: 103,
    EBADSLT: 102,
    EDEADLOCK: 16,
    EBFONT: 101,
    ENOSTR: 100,
    ENODATA: 116,
    ETIME: 117,
    ENOSR: 118,
    ENONET: 119,
    ENOPKG: 120,
    EREMOTE: 121,
    ENOLINK: 47,
    EADV: 122,
    ESRMNT: 123,
    ECOMM: 124,
    EPROTO: 65,
    EMULTIHOP: 36,
    EDOTDOT: 125,
    EBADMSG: 9,
    ENOTUNIQ: 126,
    EBADFD: 127,
    EREMCHG: 128,
    ELIBACC: 129,
    ELIBBAD: 130,
    ELIBSCN: 131,
    ELIBMAX: 132,
    ELIBEXEC: 133,
    ENOSYS: 52,
    ENOTEMPTY: 55,
    ENAMETOOLONG: 37,
    ELOOP: 32,
    EOPNOTSUPP: 138,
    EPFNOSUPPORT: 139,
    ECONNRESET: 15,
    ENOBUFS: 42,
    EAFNOSUPPORT: 5,
    EPROTOTYPE: 67,
    ENOTSOCK: 57,
    ENOPROTOOPT: 50,
    ESHUTDOWN: 140,
    ECONNREFUSED: 14,
    EADDRINUSE: 3,
    ECONNABORTED: 13,
    ENETUNREACH: 40,
    ENETDOWN: 38,
    ETIMEDOUT: 73,
    EHOSTDOWN: 142,
    EHOSTUNREACH: 23,
    EINPROGRESS: 26,
    EALREADY: 7,
    EDESTADDRREQ: 17,
    EMSGSIZE: 35,
    EPROTONOSUPPORT: 66,
    ESOCKTNOSUPPORT: 137,
    EADDRNOTAVAIL: 4,
    ENETRESET: 39,
    EISCONN: 30,
    ENOTCONN: 53,
    ETOOMANYREFS: 141,
    EUSERS: 136,
    EDQUOT: 19,
    ESTALE: 72,
    ENOTSUP: 138,
    ENOMEDIUM: 148,
    EILSEQ: 25,
    EOVERFLOW: 61,
    ECANCELED: 11,
    ENOTRECOVERABLE: 56,
    EOWNERDEAD: 62,
    ESTRPIPE: 135
};
var SOCKFS = {
    mount: function(mount) {
        Module["websocket"] = Module["websocket"] && "object" === typeof Module["websocket"] ? Module["websocket"] : {};
        Module["websocket"]._callbacks = {};
        Module["websocket"]["on"] = function(event, callback) {
            if ("function" === typeof callback) {
                this._callbacks[event] = callback
            }
            return this
        };
        Module["websocket"].emit = function(event, param) {
            if ("function" === typeof this._callbacks[event]) {
                this._callbacks[event].call(this, param)
            }
        };
        return FS.createNode(null, "/", 16384 | 511, 0)
    },
    createSocket: function(family, type, protocol) {
        type &= ~526336;
        var streaming = type == 1;
        if (protocol) {
            assert(streaming == (protocol == 6))
        }
        var sock = {
            family: family,
            type: type,
            protocol: protocol,
            server: null,
            error: null,
            peers: {},
            pending: [],
            recv_queue: [],
            sock_ops: SOCKFS.websocket_sock_ops
        };
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        var stream = FS.createStream({
            path: name,
            node: node,
            flags: 2,
            seekable: false,
            stream_ops: SOCKFS.stream_ops
        });
        sock.stream = stream;
        return sock
    },
    getSocket: function(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
            return null
        }
        return stream.node.sock
    },
    stream_ops: {
        poll: function(stream) {
            var sock = stream.node.sock;
            return sock.sock_ops.poll(sock)
        },
        ioctl: function(stream, request, varargs) {
            var sock = stream.node.sock;
            return sock.sock_ops.ioctl(sock, request, varargs)
        },
        read: function(stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            var msg = sock.sock_ops.recvmsg(sock, length);
            if (!msg) {
                return 0
            }
            buffer.set(msg.buffer, offset);
            return msg.buffer.length
        },
        write: function(stream, buffer, offset, length, position) {
            var sock = stream.node.sock;
            return sock.sock_ops.sendmsg(sock, buffer, offset, length)
        },
        close: function(stream) {
            var sock = stream.node.sock;
            sock.sock_ops.close(sock)
        }
    },
    nextname: function() {
        if (!SOCKFS.nextname.current) {
            SOCKFS.nextname.current = 0
        }
        return "socket[" + SOCKFS.nextname.current++ + "]"
    },
    websocket_sock_ops: {
        createPeer: function(sock, addr, port) {
            var ws;
            if (typeof addr === "object") {
                ws = addr;
                addr = null;
                port = null
            }
            if (ws) {
                if (ws._socket) {
                    addr = ws._socket.remoteAddress;
                    port = ws._socket.remotePort
                } else {
                    var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
                    if (!result) {
                        throw new Error("WebSocket URL must be in the format ws(s)://address:port")
                    }
                    addr = result[1];
                    port = parseInt(result[2], 10)
                }
            } else {
                try {
                    var runtimeConfig = Module["websocket"] && "object" === typeof Module["websocket"];
                    var url = "ws:#".replace("#", "//");
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["url"]) {
                            url = Module["websocket"]["url"]
                        }
                    }
                    if (url === "ws://" || url === "wss://") {
                        var parts = addr.split("/");
                        url = url + parts[0] + ":" + port + "/" + parts.slice(1).join("/")
                    }
                    var subProtocols = "binary";
                    if (runtimeConfig) {
                        if ("string" === typeof Module["websocket"]["subprotocol"]) {
                            subProtocols = Module["websocket"]["subprotocol"]
                        }
                    }
                    var opts = undefined;
                    if (subProtocols !== "null") {
                        subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
                        opts = ENVIRONMENT_IS_NODE ? {
                            "protocol": subProtocols.toString()
                        } : subProtocols
                    }
                    if (runtimeConfig && null === Module["websocket"]["subprotocol"]) {
                        subProtocols = "null";
                        opts = undefined
                    }
                    var WebSocketConstructor;
                    if (ENVIRONMENT_IS_NODE) {
                        WebSocketConstructor = require("ws")
                    } else {
                        WebSocketConstructor = WebSocket
                    }
                    ws = new WebSocketConstructor(url, opts);
                    ws.binaryType = "arraybuffer"
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH)
                }
            }
            var peer = {
                addr: addr,
                port: port,
                socket: ws,
                dgram_send_queue: []
            };
            SOCKFS.websocket_sock_ops.addPeer(sock, peer);
            SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
            if (sock.type === 2 && typeof sock.sport !== "undefined") {
                peer.dgram_send_queue.push(new Uint8Array([255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), (sock.sport & 65280) >> 8, sock.sport & 255]))
            }
            return peer
        },
        getPeer: function(sock, addr, port) {
            return sock.peers[addr + ":" + port]
        },
        addPeer: function(sock, peer) {
            sock.peers[peer.addr + ":" + peer.port] = peer
        },
        removePeer: function(sock, peer) {
            delete sock.peers[peer.addr + ":" + peer.port]
        },
        handlePeerEvents: function(sock, peer) {
            var first = true;
            var handleOpen = function() {
                Module["websocket"].emit("open", sock.stream.fd);
                try {
                    var queued = peer.dgram_send_queue.shift();
                    while (queued) {
                        peer.socket.send(queued);
                        queued = peer.dgram_send_queue.shift()
                    }
                } catch (e) {
                    peer.socket.close()
                }
            };

            function handleMessage(data) {
                if (typeof data === "string") {
                    var encoder = new TextEncoder;
                    data = encoder.encode(data)
                } else {
                    assert(data.byteLength !== undefined);
                    if (data.byteLength == 0) {
                        return
                    } else {
                        data = new Uint8Array(data)
                    }
                }
                var wasfirst = first;
                first = false;
                if (wasfirst && data.length === 10 && data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 && data[4] === "p".charCodeAt(0) && data[5] === "o".charCodeAt(0) && data[6] === "r".charCodeAt(0) && data[7] === "t".charCodeAt(0)) {
                    var newport = data[8] << 8 | data[9];
                    SOCKFS.websocket_sock_ops.removePeer(sock, peer);
                    peer.port = newport;
                    SOCKFS.websocket_sock_ops.addPeer(sock, peer);
                    return
                }
                sock.recv_queue.push({
                    addr: peer.addr,
                    port: peer.port,
                    data: data
                });
                Module["websocket"].emit("message", sock.stream.fd)
            }
            if (ENVIRONMENT_IS_NODE) {
                peer.socket.on("open", handleOpen);
                peer.socket.on("message", function(data, flags) {
                    if (!flags.binary) {
                        return
                    }
                    handleMessage(new Uint8Array(data).buffer)
                });
                peer.socket.on("close", function() {
                    Module["websocket"].emit("close", sock.stream.fd)
                });
                peer.socket.on("error", function(error) {
                    sock.error = ERRNO_CODES.ECONNREFUSED;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"])
                })
            } else {
                peer.socket.onopen = handleOpen;
                peer.socket.onclose = function() {
                    Module["websocket"].emit("close", sock.stream.fd)
                };
                peer.socket.onmessage = function peer_socket_onmessage(event) {
                    handleMessage(event.data)
                };
                peer.socket.onerror = function(error) {
                    sock.error = ERRNO_CODES.ECONNREFUSED;
                    Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"])
                }
            }
        },
        poll: function(sock) {
            if (sock.type === 1 && sock.server) {
                return sock.pending.length ? 64 | 1 : 0
            }
            var mask = 0;
            var dest = sock.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
            if (sock.recv_queue.length || !dest || dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
                mask |= 64 | 1
            }
            if (!dest || dest && dest.socket.readyState === dest.socket.OPEN) {
                mask |= 4
            }
            if (dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
                mask |= 16
            }
            return mask
        },
        ioctl: function(sock, request, arg) {
            switch (request) {
                case 21531:
                    var bytes = 0;
                    if (sock.recv_queue.length) {
                        bytes = sock.recv_queue[0].data.length
                    }
                    HEAP32[arg >> 2] = bytes;
                    return 0;
                default:
                    return ERRNO_CODES.EINVAL
            }
        },
        close: function(sock) {
            if (sock.server) {
                try {
                    sock.server.close()
                } catch (e) {}
                sock.server = null
            }
            var peers = Object.keys(sock.peers);
            for (var i = 0; i < peers.length; i++) {
                var peer = sock.peers[peers[i]];
                try {
                    peer.socket.close()
                } catch (e) {}
                SOCKFS.websocket_sock_ops.removePeer(sock, peer)
            }
            return 0
        },
        bind: function(sock, addr, port) {
            if (typeof sock.saddr !== "undefined" || typeof sock.sport !== "undefined") {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            sock.saddr = addr;
            sock.sport = port;
            if (sock.type === 2) {
                if (sock.server) {
                    sock.server.close();
                    sock.server = null
                }
                try {
                    sock.sock_ops.listen(sock, 0)
                } catch (e) {
                    if (!(e instanceof FS.ErrnoError)) throw e;
                    if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e
                }
            }
        },
        connect: function(sock, addr, port) {
            if (sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
            }
            if (typeof sock.daddr !== "undefined" && typeof sock.dport !== "undefined") {
                var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                if (dest) {
                    if (dest.socket.readyState === dest.socket.CONNECTING) {
                        throw new FS.ErrnoError(ERRNO_CODES.EALREADY)
                    } else {
                        throw new FS.ErrnoError(ERRNO_CODES.EISCONN)
                    }
                }
            }
            var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
            sock.daddr = peer.addr;
            sock.dport = peer.port;
            throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS)
        },
        listen: function(sock, backlog) {
            if (!ENVIRONMENT_IS_NODE) {
                throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
            }
            if (sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            var WebSocketServer = require("ws").Server;
            var host = sock.saddr;
            sock.server = new WebSocketServer({
                host: host,
                port: sock.sport
            });
            Module["websocket"].emit("listen", sock.stream.fd);
            sock.server.on("connection", function(ws) {
                if (sock.type === 1) {
                    var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
                    var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
                    newsock.daddr = peer.addr;
                    newsock.dport = peer.port;
                    sock.pending.push(newsock);
                    Module["websocket"].emit("connection", newsock.stream.fd)
                } else {
                    SOCKFS.websocket_sock_ops.createPeer(sock, ws);
                    Module["websocket"].emit("connection", sock.stream.fd)
                }
            });
            sock.server.on("closed", function() {
                Module["websocket"].emit("close", sock.stream.fd);
                sock.server = null
            });
            sock.server.on("error", function(error) {
                sock.error = ERRNO_CODES.EHOSTUNREACH;
                Module["websocket"].emit("error", [sock.stream.fd, sock.error, "EHOSTUNREACH: Host is unreachable"])
            })
        },
        accept: function(listensock) {
            if (!listensock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            var newsock = listensock.pending.shift();
            newsock.stream.flags = listensock.stream.flags;
            return newsock
        },
        getname: function(sock, peer) {
            var addr, port;
            if (peer) {
                if (sock.daddr === undefined || sock.dport === undefined) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                }
                addr = sock.daddr;
                port = sock.dport
            } else {
                addr = sock.saddr || 0;
                port = sock.sport || 0
            }
            return {
                addr: addr,
                port: port
            }
        },
        sendmsg: function(sock, buffer, offset, length, addr, port) {
            if (sock.type === 2) {
                if (addr === undefined || port === undefined) {
                    addr = sock.daddr;
                    port = sock.dport
                }
                if (addr === undefined || port === undefined) {
                    throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ)
                }
            } else {
                addr = sock.daddr;
                port = sock.dport
            }
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
            if (sock.type === 1) {
                if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                } else if (dest.socket.readyState === dest.socket.CONNECTING) {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                }
            }
            if (ArrayBuffer.isView(buffer)) {
                offset += buffer.byteOffset;
                buffer = buffer.buffer
            }
            var data;
            data = buffer.slice(offset, offset + length);
            if (sock.type === 2) {
                if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
                    if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port)
                    }
                    dest.dgram_send_queue.push(data);
                    return length
                }
            }
            try {
                dest.socket.send(data);
                return length
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
        },
        recvmsg: function(sock, length) {
            if (sock.type === 1 && sock.server) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
            }
            var queued = sock.recv_queue.shift();
            if (!queued) {
                if (sock.type === 1) {
                    var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
                    if (!dest) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN)
                    } else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                        return null
                    } else {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                    }
                } else {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                }
            }
            var queuedLength = queued.data.byteLength || queued.data.length;
            var queuedOffset = queued.data.byteOffset || 0;
            var queuedBuffer = queued.data.buffer || queued.data;
            var bytesRead = Math.min(length, queuedLength);
            var res = {
                buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
                addr: queued.addr,
                port: queued.port
            };
            if (sock.type === 1 && bytesRead < queuedLength) {
                var bytesRemaining = queuedLength - bytesRead;
                queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
                sock.recv_queue.unshift(queued)
            }
            return res
        }
    }
};

function __inet_pton4_raw(str) {
    var b = str.split(".");
    for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp
    }
    return (b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24) >>> 0
}

function jstoi_q(str) {
    return parseInt(str)
}

function __inet_pton6_raw(str) {
    var words;
    var w, offset, z;
    var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
    var parts = [];
    if (!valid6regx.test(str)) {
        return null
    }
    if (str === "::") {
        return [0, 0, 0, 0, 0, 0, 0, 0]
    }
    if (str.indexOf("::") === 0) {
        str = str.replace("::", "Z:")
    } else {
        str = str.replace("::", ":Z:")
    }
    if (str.indexOf(".") > 0) {
        str = str.replace(new RegExp("[.]", "g"), ":");
        words = str.split(":");
        words[words.length - 4] = jstoi_q(words[words.length - 4]) + jstoi_q(words[words.length - 3]) * 256;
        words[words.length - 3] = jstoi_q(words[words.length - 2]) + jstoi_q(words[words.length - 1]) * 256;
        words = words.slice(0, words.length - 2)
    } else {
        words = str.split(":")
    }
    offset = 0;
    z = 0;
    for (w = 0; w < words.length; w++) {
        if (typeof words[w] === "string") {
            if (words[w] === "Z") {
                for (z = 0; z < 8 - words.length + 1; z++) {
                    parts[w + z] = 0
                }
                offset = z - 1
            } else {
                parts[w + offset] = _htons(parseInt(words[w], 16))
            }
        } else {
            parts[w + offset] = words[w]
        }
    }
    return [parts[1] << 16 | parts[0], parts[3] << 16 | parts[2], parts[5] << 16 | parts[4], parts[7] << 16 | parts[6]]
}
var DNS = {
    address_map: {
        id: 1,
        addrs: {},
        names: {}
    },
    lookup_name: function(name) {
        var res = __inet_pton4_raw(name);
        if (res !== null) {
            return name
        }
        res = __inet_pton6_raw(name);
        if (res !== null) {
            return name
        }
        var addr;
        if (DNS.address_map.addrs[name]) {
            addr = DNS.address_map.addrs[name]
        } else {
            var id = DNS.address_map.id++;
            assert(id < 65535, "exceeded max address mappings of 65535");
            addr = "172.29." + (id & 255) + "." + (id & 65280);
            DNS.address_map.names[addr] = name;
            DNS.address_map.addrs[name] = addr
        }
        return addr
    },
    lookup_addr: function(addr) {
        if (DNS.address_map.names[addr]) {
            return DNS.address_map.names[addr]
        }
        return null
    }
};

function __inet_ntop4_raw(addr) {
    return (addr & 255) + "." + (addr >> 8 & 255) + "." + (addr >> 16 & 255) + "." + (addr >> 24 & 255)
}

function __inet_ntop6_raw(ints) {
    var str = "";
    var word = 0;
    var longest = 0;
    var lastzero = 0;
    var zstart = 0;
    var len = 0;
    var i = 0;
    var parts = [ints[0] & 65535, ints[0] >> 16, ints[1] & 65535, ints[1] >> 16, ints[2] & 65535, ints[2] >> 16, ints[3] & 65535, ints[3] >> 16];
    var hasipv4 = true;
    var v4part = "";
    for (i = 0; i < 5; i++) {
        if (parts[i] !== 0) {
            hasipv4 = false;
            break
        }
    }
    if (hasipv4) {
        v4part = __inet_ntop4_raw(parts[6] | parts[7] << 16);
        if (parts[5] === -1) {
            str = "::ffff:";
            str += v4part;
            return str
        }
        if (parts[5] === 0) {
            str = "::";
            if (v4part === "0.0.0.0") v4part = "";
            if (v4part === "0.0.0.1") v4part = "1";
            str += v4part;
            return str
        }
    }
    for (word = 0; word < 8; word++) {
        if (parts[word] === 0) {
            if (word - lastzero > 1) {
                len = 0
            }
            lastzero = word;
            len++
        }
        if (len > longest) {
            longest = len;
            zstart = word - longest + 1
        }
    }
    for (word = 0; word < 8; word++) {
        if (longest > 1) {
            if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
                if (word === zstart) {
                    str += ":";
                    if (zstart === 0) str += ":"
                }
                continue
            }
        }
        str += Number(_ntohs(parts[word] & 65535)).toString(16);
        str += word < 7 ? ":" : ""
    }
    return str
}

function __read_sockaddr(sa, salen) {
    var family = HEAP16[sa >> 1];
    var port = _ntohs(HEAPU16[sa + 2 >> 1]);
    var addr;
    switch (family) {
        case 2:
            if (salen !== 16) {
                return {
                    errno: 28
                }
            }
            addr = HEAP32[sa + 4 >> 2];
            addr = __inet_ntop4_raw(addr);
            break;
        case 10:
            if (salen !== 28) {
                return {
                    errno: 28
                }
            }
            addr = [HEAP32[sa + 8 >> 2], HEAP32[sa + 12 >> 2], HEAP32[sa + 16 >> 2], HEAP32[sa + 20 >> 2]];
            addr = __inet_ntop6_raw(addr);
            break;
        default:
            return {
                errno: 5
            }
    }
    return {
        family: family,
        addr: addr,
        port: port
    }
}

function __write_sockaddr(sa, family, addr, port, addrlen) {
    switch (family) {
        case 2:
            addr = __inet_pton4_raw(addr);
            if (addrlen) {
                HEAP32[addrlen >> 2] = 16
            }
            HEAP16[sa >> 1] = family;
            HEAP32[sa + 4 >> 2] = addr;
            HEAP16[sa + 2 >> 1] = _htons(port);
            break;
        case 10:
            addr = __inet_pton6_raw(addr);
            if (addrlen) {
                HEAP32[addrlen >> 2] = 28
            }
            HEAP32[sa >> 2] = family;
            HEAP32[sa + 8 >> 2] = addr[0];
            HEAP32[sa + 12 >> 2] = addr[1];
            HEAP32[sa + 16 >> 2] = addr[2];
            HEAP32[sa + 20 >> 2] = addr[3];
            HEAP16[sa + 2 >> 1] = _htons(port);
            HEAP32[sa + 4 >> 2] = 0;
            HEAP32[sa + 24 >> 2] = 0;
            break;
        default:
            return 5
    }
    return 0
}

function ___sys_socketcall(call, socketvararg) {
    try {
        SYSCALLS.varargs = socketvararg;
        var getSocketFromFD = function() {
            var socket = SOCKFS.getSocket(SYSCALLS.get());
            if (!socket) throw new FS.ErrnoError(8);
            return socket
        };
        var getSocketAddress = function(allowNull) {
            var addrp = SYSCALLS.get(),
                addrlen = SYSCALLS.get();
            if (allowNull && addrp === 0) return null;
            var info = __read_sockaddr(addrp, addrlen);
            if (info.errno) throw new FS.ErrnoError(info.errno);
            info.addr = DNS.lookup_addr(info.addr) || info.addr;
            return info
        };
        switch (call) {
            case 1:
                {
                    var domain = SYSCALLS.get(),
                        type = SYSCALLS.get(),
                        protocol = SYSCALLS.get();
                    var sock = SOCKFS.createSocket(domain, type, protocol);
                    return sock.stream.fd
                }
            case 2:
                {
                    var sock = getSocketFromFD(),
                        info = getSocketAddress();sock.sock_ops.bind(sock, info.addr, info.port);
                    return 0
                }
            case 3:
                {
                    var sock = getSocketFromFD(),
                        info = getSocketAddress();sock.sock_ops.connect(sock, info.addr, info.port);
                    return 0
                }
            case 4:
                {
                    var sock = getSocketFromFD(),
                        backlog = SYSCALLS.get();sock.sock_ops.listen(sock, backlog);
                    return 0
                }
            case 5:
                {
                    var sock = getSocketFromFD(),
                        addr = SYSCALLS.get(),
                        addrlen = SYSCALLS.get();
                    var newsock = sock.sock_ops.accept(sock);
                    if (addr) {
                        var errno = __write_sockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport, addrlen)
                    }
                    return newsock.stream.fd
                }
            case 6:
                {
                    var sock = getSocketFromFD(),
                        addr = SYSCALLS.get(),
                        addrlen = SYSCALLS.get();
                    var errno = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || "0.0.0.0"), sock.sport, addrlen);
                    return 0
                }
            case 7:
                {
                    var sock = getSocketFromFD(),
                        addr = SYSCALLS.get(),
                        addrlen = SYSCALLS.get();
                    if (!sock.daddr) {
                        return -53
                    }
                    var errno = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.daddr), sock.dport, addrlen);
                    return 0
                }
            case 11:
                {
                    var sock = getSocketFromFD(),
                        message = SYSCALLS.get(),
                        length = SYSCALLS.get(),
                        flags = SYSCALLS.get(),
                        dest = getSocketAddress(true);
                    if (!dest) {
                        return FS.write(sock.stream, HEAP8, message, length)
                    } else {
                        return sock.sock_ops.sendmsg(sock, HEAP8, message, length, dest.addr, dest.port)
                    }
                }
            case 12:
                {
                    var sock = getSocketFromFD(),
                        buf = SYSCALLS.get(),
                        len = SYSCALLS.get(),
                        flags = SYSCALLS.get(),
                        addr = SYSCALLS.get(),
                        addrlen = SYSCALLS.get();
                    var msg = sock.sock_ops.recvmsg(sock, len);
                    if (!msg) return 0;
                    if (addr) {
                        var errno = __write_sockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen)
                    }
                    HEAPU8.set(msg.buffer, buf);
                    return msg.buffer.byteLength
                }
            case 14:
                {
                    return -50
                }
            case 15:
                {
                    var sock = getSocketFromFD(),
                        level = SYSCALLS.get(),
                        optname = SYSCALLS.get(),
                        optval = SYSCALLS.get(),
                        optlen = SYSCALLS.get();
                    if (level === 1) {
                        if (optname === 4) {
                            HEAP32[optval >> 2] = sock.error;
                            HEAP32[optlen >> 2] = 4;
                            sock.error = null;
                            return 0
                        }
                    }
                    return -50
                }
            case 16:
                {
                    var sock = getSocketFromFD(),
                        message = SYSCALLS.get(),
                        flags = SYSCALLS.get();
                    var iov = HEAP32[message + 8 >> 2];
                    var num = HEAP32[message + 12 >> 2];
                    var addr, port;
                    var name = HEAP32[message >> 2];
                    var namelen = HEAP32[message + 4 >> 2];
                    if (name) {
                        var info = __read_sockaddr(name, namelen);
                        if (info.errno) return -info.errno;
                        port = info.port;
                        addr = DNS.lookup_addr(info.addr) || info.addr
                    }
                    var total = 0;
                    for (var i = 0; i < num; i++) {
                        total += HEAP32[iov + (8 * i + 4) >> 2]
                    }
                    var view = new Uint8Array(total);
                    var offset = 0;
                    for (var i = 0; i < num; i++) {
                        var iovbase = HEAP32[iov + (8 * i + 0) >> 2];
                        var iovlen = HEAP32[iov + (8 * i + 4) >> 2];
                        for (var j = 0; j < iovlen; j++) {
                            view[offset++] = HEAP8[iovbase + j >> 0]
                        }
                    }
                    return sock.sock_ops.sendmsg(sock, view, 0, total, addr, port)
                }
            case 17:
                {
                    var sock = getSocketFromFD(),
                        message = SYSCALLS.get(),
                        flags = SYSCALLS.get();
                    var iov = HEAP32[message + 8 >> 2];
                    var num = HEAP32[message + 12 >> 2];
                    var total = 0;
                    for (var i = 0; i < num; i++) {
                        total += HEAP32[iov + (8 * i + 4) >> 2]
                    }
                    var msg = sock.sock_ops.recvmsg(sock, total);
                    if (!msg) return 0;
                    var name = HEAP32[message >> 2];
                    if (name) {
                        var errno = __write_sockaddr(name, sock.family, DNS.lookup_name(msg.addr), msg.port)
                    }
                    var bytesRead = 0;
                    var bytesRemaining = msg.buffer.byteLength;
                    for (var i = 0; bytesRemaining > 0 && i < num; i++) {
                        var iovbase = HEAP32[iov + (8 * i + 0) >> 2];
                        var iovlen = HEAP32[iov + (8 * i + 4) >> 2];
                        if (!iovlen) {
                            continue
                        }
                        var length = Math.min(iovlen, bytesRemaining);
                        var buf = msg.buffer.subarray(bytesRead, bytesRead + length);
                        HEAPU8.set(buf, iovbase + bytesRead);
                        bytesRead += length;
                        bytesRemaining -= length
                    }
                    return bytesRead
                }
            default:
                {
                    return -52
                }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_stat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_uname(buf) {
    try {
        if (!buf) return -21;
        var layout = {
            "__size__": 390,
            "domainname": 325,
            "machine": 260,
            "nodename": 65,
            "release": 130,
            "sysname": 0,
            "version": 195
        };
        var copyString = function(element, value) {
            var offset = layout[element];
            writeAsciiToMemory(value, buf + offset)
        };
        copyString("sysname", "Emscripten");
        copyString("nodename", "emscripten");
        copyString("release", "1.0");
        copyString("version", "#1");
        copyString("machine", "x86-JS");
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___sys_unlink(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.unlink(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function _abort() {
    abort()
}

function _clock() {
    if (_clock.start === undefined) _clock.start = Date.now();
    return (Date.now() - _clock.start) * (1e6 / 1e3) | 0
}

function _difftime(time1, time0) {
    return time1 - time0
}
var DefoldSoundDevice = {
    TryResumeAudio: function() {
        var audioCtx = window._dmJSDeviceShared.audioCtx;
        if (audioCtx !== undefined && audioCtx.state != "running") {
            audioCtx.resume()
        }
    }
};

function _dmDeviceJSFreeBufferSlots(id) {
    return window._dmJSDeviceShared.devices[id]._freeBufferSlots()
}

function _dmDeviceJSOpen(bufferCount) {
    var shared = window._dmJSDeviceShared;
    if (shared === undefined) {
        shared = {
            count: 0,
            devices: {}
        };
        window._dmJSDeviceShared = shared
    }
    var id = shared.count++;
    var device;
    if (window.AudioContext || window.webkitAudioContext) {
        if (shared.audioCtx === undefined) {
            shared.audioCtx = new(window.AudioContext || window.webkitAudioContext)
        }
        device = {
            sampleRate: shared.audioCtx.sampleRate,
            bufferedTo: 0,
            bufferDuration: 0,
            _queue: function(samples, sample_count) {
                var buf = shared.audioCtx.createBuffer(2, sample_count, this.sampleRate);
                var c0 = buf.getChannelData(0);
                var c1 = buf.getChannelData(1);
                for (var i = 0; i < sample_count; i++) {
                    c0[i] = getValue(samples + 4 * i, "i16") / 32768;
                    c1[i] = getValue(samples + 4 * i + 2, "i16") / 32768
                }
                var source = shared.audioCtx.createBufferSource();
                source.buffer = buf;
                source.connect(shared.audioCtx.destination);
                var len = sample_count / this.sampleRate;
                var t = shared.audioCtx.currentTime;
                if (this.bufferedTo <= t) {
                    source.start(t);
                    this.bufferedTo = t + len
                } else {
                    source.start(this.bufferedTo);
                    this.bufferedTo = this.bufferedTo + len
                }
                this.bufferDuration = len
            },
            _freeBufferSlots: function() {
                if (this.bufferDuration == 0) return 1;
                var ahead = this.bufferedTo - shared.audioCtx.currentTime;
                var inqueue = Math.ceil(ahead / this.bufferDuration);
                if (inqueue < 0) {
                    inqueue = 0
                }
                var left = bufferCount - inqueue;
                if (left < 0) {
                    return 0
                }
                return left
            }
        }
    }
    if (device != null) {
        shared.devices[id] = device;
        return id
    }
    return -1
}

function _dmDeviceJSQueue(id, samples, sample_count) {
    window._dmJSDeviceShared.devices[id]._queue(samples, sample_count)
}

function _dmGetDeviceSampleRate(id) {
    return window._dmJSDeviceShared.devices[id].sampleRate
}
var ResZip = {
    _preloads: {}
};

function _dmResZipRequestFileAsync(url, context, onprogress, onerror, onload) {
    var callbacks = {
        onprogress: function(loaded, total) {
            wasmTable.get(onprogress)(context, loaded, total)
        },
        onerror: function(err) {
            var pError = allocate(intArrayFromString(err), "i8", ALLOC_NORMAL);
            wasmTable.get(onerror)(context, pError);
            _free(pError)
        },
        onload: function(response) {
            var ab = new Uint8Array(response);
            var b = allocate(ab, "i8", ALLOC_NORMAL);
            wasmTable.get(onload)(context, b, ab.length);
            _free(b)
        }
    };
    if (context === undefined) {
        var preload = {
            events: {},
            handler: function() {
                var args = Array.prototype.slice.call(arguments);
                var name = args.shift();
                preload.events[name] = args
            }
        };
        ResZip._preloads[url] = preload;
        FileLoader.load(url, "arraybuffer", 0, function(loaded, total) {
            preload.handler("onprogress", loaded, total)
        }, function(err) {
            preload.handler("onerror", err)
        }, function(response) {
            preload.handler("onload", response)
        });
        return
    }
    url = UTF8ToString(url);
    if (ResZip._preloads[url]) {
        var preload = ResZip._preloads[url];
        delete ResZip._preloads[url];
        preload.handler = function() {
            var args = Array.prototype.slice.call(arguments);
            var name = args.shift();
            callbacks[name].apply(null, args)
        };
        ["onprogress", "onerror", "onload"].forEach(function(name) {
            var args = preload.events[name];
            if (args !== undefined) {
                callbacks[name].apply(null, args)
            }
        })
    } else {
        FileLoader.load(url, "arraybuffer", 0, callbacks.onprogress, callbacks.onerror, callbacks.onload)
    }
}

function _dmScriptHttpRequestAsync(method, url, headers, arg, onload, onerror, send_data, send_data_length, timeout) {
    var xhr = new XMLHttpRequest;

    function listener() {
        var resp_headers = xhr.getAllResponseHeaders();
        resp_headers = resp_headers.replace(new RegExp("\r", "g"), "");
        resp_headers += "\n";
        if (xhr.status != 0) {
            var ab = new Uint8Array(xhr.response);
            var b = allocate(ab, ALLOC_NORMAL);
            var resp_headers_buffer = allocate(intArrayFromString(resp_headers), ALLOC_NORMAL);
            wasmTable.get(onload)(arg, xhr.status, b, ab.length, resp_headers_buffer);
            _free(b)
        } else {
            wasmTable.get(onerror)(arg, xhr.status)
        }
    }
    xhr.onload = listener;
    xhr.onerror = listener;
    xhr.ontimeout = listener;
    xhr.open(UTF8ToString(method), UTF8ToString(url), true);
    xhr.responseType = "arraybuffer";
    if (timeout > 0) {
        xhr.timeout = timeout / 1e3
    }
    var headersArray = UTF8ToString(headers).split("\n");
    for (var i = 0; i < headersArray.length; i++) {
        if (headersArray[i].trim() != "") {
            var a = headersArray[i].split(":");
            xhr.setRequestHeader(a[0], a[1])
        }
    }
    if (send_data_length > 0) {
        xhr.send(HEAPU8.subarray(send_data, send_data + send_data_length))
    } else {
        xhr.send()
    }
}
var DMSYS = {
    _folder: "/data",
    _cstr: null,
    GetUserPersistentDataRoot: function() {
        if (typeof window !== "undefined") return DMSYS._folder;
        else return ""
    },
    PumpMessageQueue: function() {
        if (typeof window === "undefined") {
            var uvrun = require("uvrun");
            uvrun.runOnce()
        }
    }
};

function _dmSysGetApplicationPath() {
    var path = location.href.substring(0, location.href.lastIndexOf("/"));
    var lengthBytes = lengthBytesUTF8(path) + 1;
    var buffer = _malloc(lengthBytes);
    Module.stringToUTF8(path, buffer, lengthBytes);
    return buffer
}

function _dmSysGetUserAgent() {
    var useragent = navigator.userAgent;
    var buffer = _malloc(useragent.length + 1);
    Module.stringToUTF8(useragent, buffer, useragent.length + 1);
    return buffer
}

function _dmSysGetUserPersistentDataRoot() {
    if (null == DMSYS._cstr) {
        var str = DMSYS.GetUserPersistentDataRoot();
        DMSYS._cstr = _malloc(str.length + 1);
        Module.stringToUTF8(str, DMSYS._cstr, str.length + 1)
    }
    return DMSYS._cstr
}

function _dmSysGetUserPreferredLanguage(defaultlang) {
    var jsdefault = UTF8ToString(defaultlang);
    var preferred = navigator == undefined ? jsdefault : navigator.languages ? navigator.languages[0] || jsdefault : navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || jsdefault;
    var buffer = _malloc(preferred.length + 1);
    Module.stringToUTF8(preferred, buffer, preferred.length + 1);
    return buffer
}
var JSEvents = {
    inEventHandler: 0,
    removeAllEventListeners: function() {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i)
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = []
    },
    registerRemoveEventListeners: function() {
        if (!JSEvents.removeEventListenersRegistered) {
            __ATEXIT__.push(JSEvents.removeAllEventListeners);
            JSEvents.removeEventListenersRegistered = true
        }
    },
    deferredCalls: [],
    deferCall: function(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false
            }
            return true
        }
        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return
            }
        }
        JSEvents.deferredCalls.push({
            targetFunction: targetFunction,
            precedence: precedence,
            argsList: argsList
        });
        JSEvents.deferredCalls.sort(function(x, y) {
            return x.precedence < y.precedence
        })
    },
    removeDeferredCalls: function(targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i
            }
        }
    },
    canPerformEventHandlerRequests: function() {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
    },
    runDeferredCalls: function() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1);
            --i;
            call.targetFunction.apply(null, call.argsList)
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: function(target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--)
            }
        }
    },
    _removeHandler: function(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1)
    },
    registerOrRemoveHandler: function(eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls();
            --JSEvents.inEventHandler
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler);
            JSEvents.registerRemoveEventListeners()
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--)
                }
            }
        }
    },
    getNodeNameForTarget: function(target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target && target.nodeName ? target.nodeName : ""
    },
    fullscreenEnabled: function() {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled
    }
};

function _dmSysOpenURL(url, target) {
    var jsurl = UTF8ToString(url);
    var jstarget = UTF8ToString(target);
    if (jstarget == 0) {
        jstarget = "_self"
    }
    if (window.open(jsurl, jstarget) == null) {
        window.location = jsurl
    }
    return true
}

function _emscripten_asm_const_int(code, sigPtr, argbuf) {
    var args = readAsmConstArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args)
}

function _emscripten_set_main_loop_timing(mode, value) {
    Browser.mainLoop.timingMode = mode;
    Browser.mainLoop.timingValue = value;
    if (!Browser.mainLoop.func) {
        return 1
    }
    if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(Browser.mainLoop.runner, timeUntilNextTick)
        };
        Browser.mainLoop.method = "timeout"
    } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
            Browser.requestAnimationFrame(Browser.mainLoop.runner)
        };
        Browser.mainLoop.method = "rAF"
    } else if (mode == 2) {
        if (typeof setImmediate === "undefined") {
            var setImmediates = [];
            var emscriptenMainLoopMessageId = "setimmediate";
            var Browser_setImmediate_messageHandler = function(event) {
                if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                    event.stopPropagation();
                    setImmediates.shift()()
                }
            };
            addEventListener("message", Browser_setImmediate_messageHandler, true);
            setImmediate = function Browser_emulated_setImmediate(func) {
                setImmediates.push(func);
                if (ENVIRONMENT_IS_WORKER) {
                    if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
                    Module["setImmediates"].push(func);
                    postMessage({
                        target: emscriptenMainLoopMessageId
                    })
                } else postMessage(emscriptenMainLoopMessageId, "*")
            }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
            setImmediate(Browser.mainLoop.runner)
        };
        Browser.mainLoop.method = "immediate"
    }
    return 0
}

function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
    noExitRuntime = true;
    assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
    Browser.mainLoop.func = browserIterationFunc;
    Browser.mainLoop.arg = arg;
    var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
    Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = Browser.mainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (Browser.mainLoop.remainingBlockers) {
                var remaining = Browser.mainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    Browser.mainLoop.remainingBlockers = next
                } else {
                    next = next + .5;
                    Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9
                }
            }
            console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
            Browser.mainLoop.updateStatus();
            if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
            setTimeout(Browser.mainLoop.runner, 0);
            return
        }
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
            Browser.mainLoop.scheduler();
            return
        } else if (Browser.mainLoop.timingMode == 0) {
            Browser.mainLoop.tickStartTime = _emscripten_get_now()
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler()
    };
    if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps);
        else _emscripten_set_main_loop_timing(1, 1);
        Browser.mainLoop.scheduler()
    }
    if (simulateInfiniteLoop) {
        throw "unwind"
    }
}
var Browser = {
    mainLoop: {
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function() {
            Browser.mainLoop.scheduler = null;
            Browser.mainLoop.currentlyRunningMainloop++
        },
        resume: function() {
            Browser.mainLoop.currentlyRunningMainloop++;
            var timingMode = Browser.mainLoop.timingMode;
            var timingValue = Browser.mainLoop.timingValue;
            var func = Browser.mainLoop.func;
            Browser.mainLoop.func = null;
            setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
            _emscripten_set_main_loop_timing(timingMode, timingValue);
            Browser.mainLoop.scheduler()
        },
        updateStatus: function() {
            if (Module["setStatus"]) {
                var message = Module["statusMessage"] || "Please wait...";
                var remaining = Browser.mainLoop.remainingBlockers;
                var expected = Browser.mainLoop.expectedBlockers;
                if (remaining) {
                    if (remaining < expected) {
                        Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")")
                    } else {
                        Module["setStatus"](message)
                    }
                } else {
                    Module["setStatus"]("")
                }
            }
        },
        runIter: function(func) {
            if (ABORT) return;
            if (Module["preMainLoop"]) {
                var preRet = Module["preMainLoop"]();
                if (preRet === false) {
                    return
                }
            }
            try {
                func()
            } catch (e) {
                if (e instanceof ExitStatus) {
                    return
                } else if (e == "unwind") {
                    return
                } else {
                    if (e && typeof e === "object" && e.stack) err("exception thrown: " + [e, e.stack]);
                    throw e
                }
            }
            if (Module["postMainLoop"]) Module["postMainLoop"]()
        }
    },
    isFullscreen: false,
    pointerLock: false,
    moduleContextCreatedCallbacks: [],
    workers: [],
    init: function() {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        if (Browser.initted) return;
        Browser.initted = true;
        try {
            new Blob;
            Browser.hasBlobConstructor = true
        } catch (e) {
            Browser.hasBlobConstructor = false;
            console.log("warning: no blob constructor, cannot create blobs with mimetypes")
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
        Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
            console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
            Module.noImageDecoding = true
        }
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
            return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name)
        };
        imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
            var b = null;
            if (Browser.hasBlobConstructor) {
                try {
                    b = new Blob([byteArray], {
                        type: Browser.getMimetype(name)
                    });
                    if (b.size !== byteArray.length) {
                        b = new Blob([new Uint8Array(byteArray).buffer], {
                            type: Browser.getMimetype(name)
                        })
                    }
                } catch (e) {
                    warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder")
                }
            }
            if (!b) {
                var bb = new Browser.BlobBuilder;
                bb.append(new Uint8Array(byteArray).buffer);
                b = bb.getBlob()
            }
            var url = Browser.URLObject.createObjectURL(b);
            var img = new Image;
            img.onload = function img_onload() {
                assert(img.complete, "Image " + name + " could not be decoded");
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                Module["preloadedImages"][name] = canvas;
                Browser.URLObject.revokeObjectURL(url);
                if (onload) onload(byteArray)
            };
            img.onerror = function img_onerror(event) {
                console.log("Image " + url + " could not be decoded");
                if (onerror) onerror()
            };
            img.src = url
        };
        Module["preloadPlugins"].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
            return !Module.noAudioDecoding && name.substr(-4) in {
                ".ogg": 1,
                ".wav": 1,
                ".mp3": 1
            }
        };
        audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
            var done = false;

            function finish(audio) {
                if (done) return;
                done = true;
                Module["preloadedAudios"][name] = audio;
                if (onload) onload(byteArray)
            }

            function fail() {
                if (done) return;
                done = true;
                Module["preloadedAudios"][name] = new Audio;
                if (onerror) onerror()
            }
            if (Browser.hasBlobConstructor) {
                try {
                    var b = new Blob([byteArray], {
                        type: Browser.getMimetype(name)
                    })
                } catch (e) {
                    return fail()
                }
                var url = Browser.URLObject.createObjectURL(b);
                var audio = new Audio;
                audio.addEventListener("canplaythrough", function() {
                    finish(audio)
                }, false);
                audio.onerror = function audio_onerror(event) {
                    if (done) return;
                    console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");

                    function encode64(data) {
                        var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                        var PAD = "=";
                        var ret = "";
                        var leftchar = 0;
                        var leftbits = 0;
                        for (var i = 0; i < data.length; i++) {
                            leftchar = leftchar << 8 | data[i];
                            leftbits += 8;
                            while (leftbits >= 6) {
                                var curr = leftchar >> leftbits - 6 & 63;
                                leftbits -= 6;
                                ret += BASE[curr]
                            }
                        }
                        if (leftbits == 2) {
                            ret += BASE[(leftchar & 3) << 4];
                            ret += PAD + PAD
                        } else if (leftbits == 4) {
                            ret += BASE[(leftchar & 15) << 2];
                            ret += PAD
                        }
                        return ret
                    }
                    audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
                    finish(audio)
                };
                audio.src = url;
                Browser.safeSetTimeout(function() {
                    finish(audio)
                }, 1e4)
            } else {
                return fail()
            }
        };
        Module["preloadPlugins"].push(audioPlugin);

        function pointerLockChange() {
            Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"]
        }
        var canvas = Module["canvas"];
        if (canvas) {
            canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function() {};
            canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function() {};
            canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
            document.addEventListener("pointerlockchange", pointerLockChange, false);
            document.addEventListener("mozpointerlockchange", pointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
            document.addEventListener("mspointerlockchange", pointerLockChange, false);
            if (Module["elementPointerLock"]) {
                canvas.addEventListener("click", function(ev) {
                    if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                        Module["canvas"].requestPointerLock();
                        ev.preventDefault()
                    }
                }, false)
            }
        }
    },
    createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
            var contextAttributes = {
                antialias: false,
                alpha: false,
                majorVersion: typeof WebGL2RenderingContext !== "undefined" ? 2 : 1
            };
            if (webGLContextAttributes) {
                for (var attribute in webGLContextAttributes) {
                    contextAttributes[attribute] = webGLContextAttributes[attribute]
                }
            }
            if (typeof GL !== "undefined") {
                contextHandle = GL.createContext(canvas, contextAttributes);
                if (contextHandle) {
                    ctx = GL.getContext(contextHandle).GLctx
                }
            }
        } else {
            ctx = canvas.getContext("2d")
        }
        if (!ctx) return null;
        if (setInModule) {
            if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
            Module.ctx = ctx;
            if (useWebGL) GL.makeContextCurrent(contextHandle);
            Module.useWebGL = useWebGL;
            Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
                callback()
            });
            Browser.init()
        }
        return ctx
    },
    destroyContext: function(canvas, useWebGL, setInModule) {},
    fullscreenHandlersInstalled: false,
    lockPointer: undefined,
    resizeCanvas: undefined,
    requestFullscreen: function(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
        var canvas = Module["canvas"];

        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer) canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            }
            if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
            if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen)
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener("fullscreenchange", fullscreenChange, false);
            document.addEventListener("mozfullscreenchange", fullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
            document.addEventListener("MSFullscreenChange", fullscreenChange, false)
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function() {
            canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"])
        } : null) || (canvasContainer["webkitRequestFullScreen"] ? function() {
            canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"])
        } : null);
        canvasContainer.requestFullscreen()
    },
    exitFullscreen: function() {
        if (!Browser.isFullscreen) {
            return false
        }
        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {};
        CFS.apply(document, []);
        return true
    },
    nextRAF: 0,
    fakeRequestAnimationFrame: function(func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
            Browser.nextRAF = now + 1e3 / 60
        } else {
            while (now + 2 >= Browser.nextRAF) {
                Browser.nextRAF += 1e3 / 60
            }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay)
    },
    requestAnimationFrame: function(func) {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(func);
            return
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func)
    },
    safeCallback: function(func) {
        return function() {
            if (!ABORT) return func.apply(null, arguments)
        }
    },
    allowAsyncCallbacks: true,
    queuedAsyncCallbacks: [],
    pauseAsyncCallbacks: function() {
        Browser.allowAsyncCallbacks = false
    },
    resumeAsyncCallbacks: function() {
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
            var callbacks = Browser.queuedAsyncCallbacks;
            Browser.queuedAsyncCallbacks = [];
            callbacks.forEach(function(func) {
                func()
            })
        }
    },
    safeRequestAnimationFrame: function(func) {
        return Browser.requestAnimationFrame(function() {
            if (ABORT) return;
            if (Browser.allowAsyncCallbacks) {
                func()
            } else {
                Browser.queuedAsyncCallbacks.push(func)
            }
        })
    },
    safeSetTimeout: function(func, timeout) {
        noExitRuntime = true;
        return setTimeout(function() {
            if (ABORT) return;
            if (Browser.allowAsyncCallbacks) {
                func()
            } else {
                Browser.queuedAsyncCallbacks.push(func)
            }
        }, timeout)
    },
    safeSetInterval: function(func, timeout) {
        noExitRuntime = true;
        return setInterval(function() {
            if (ABORT) return;
            if (Browser.allowAsyncCallbacks) {
                func()
            }
        }, timeout)
    },
    getMimetype: function(name) {
        return {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "bmp": "image/bmp",
            "ogg": "audio/ogg",
            "wav": "audio/wav",
            "mp3": "audio/mpeg"
        }[name.substr(name.lastIndexOf(".") + 1)]
    },
    getUserMedia: function(func) {
        if (!window.getUserMedia) {
            window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"]
        }
        window.getUserMedia(func)
    },
    getMovementX: function(event) {
        return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
    },
    getMovementY: function(event) {
        return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
    },
    getMouseWheelDelta: function(event) {
        var delta = 0;
        switch (event.type) {
            case "DOMMouseScroll":
                delta = event.detail / 3;
                break;
            case "mousewheel":
                delta = event.wheelDelta / 120;
                break;
            case "wheel":
                delta = event.deltaY;
                switch (event.deltaMode) {
                    case 0:
                        delta /= 100;
                        break;
                    case 1:
                        delta /= 3;
                        break;
                    case 2:
                        delta *= 80;
                        break;
                    default:
                        throw "unrecognized mouse wheel delta mode: " + event.deltaMode
                }
                break;
            default:
                throw "unrecognized mouse wheel event: " + event.type
        }
        return delta
    },
    mouseX: 0,
    mouseY: 0,
    mouseMovementX: 0,
    mouseMovementY: 0,
    touches: {},
    lastTouches: {},
    calculateMouseEvent: function(event) {
        if (Browser.pointerLock) {
            if (event.type != "mousemove" && "mozMovementX" in event) {
                Browser.mouseMovementX = Browser.mouseMovementY = 0
            } else {
                Browser.mouseMovementX = Browser.getMovementX(event);
                Browser.mouseMovementY = Browser.getMovementY(event)
            }
            if (typeof SDL != "undefined") {
                Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                Browser.mouseY = SDL.mouseY + Browser.mouseMovementY
            } else {
                Browser.mouseX += Browser.mouseMovementX;
                Browser.mouseY += Browser.mouseMovementY
            }
        } else {
            var rect = Module["canvas"].getBoundingClientRect();
            var cw = Module["canvas"].width;
            var ch = Module["canvas"].height;
            var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
            var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
            if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                var touch = event.touch;
                if (touch === undefined) {
                    return
                }
                var adjustedX = touch.pageX - (scrollX + rect.left);
                var adjustedY = touch.pageY - (scrollY + rect.top);
                adjustedX = adjustedX * (cw / rect.width);
                adjustedY = adjustedY * (ch / rect.height);
                var coords = {
                    x: adjustedX,
                    y: adjustedY
                };
                if (event.type === "touchstart") {
                    Browser.lastTouches[touch.identifier] = coords;
                    Browser.touches[touch.identifier] = coords
                } else if (event.type === "touchend" || event.type === "touchmove") {
                    var last = Browser.touches[touch.identifier];
                    if (!last) last = coords;
                    Browser.lastTouches[touch.identifier] = last;
                    Browser.touches[touch.identifier] = coords
                }
                return
            }
            var x = event.pageX - (scrollX + rect.left);
            var y = event.pageY - (scrollY + rect.top);
            x = x * (cw / rect.width);
            y = y * (ch / rect.height);
            Browser.mouseMovementX = x - Browser.mouseX;
            Browser.mouseMovementY = y - Browser.mouseY;
            Browser.mouseX = x;
            Browser.mouseY = y
        }
    },
    asyncLoad: function(url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
        readAsync(url, function(arrayBuffer) {
            assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
            onload(new Uint8Array(arrayBuffer));
            if (dep) removeRunDependency(dep)
        }, function(event) {
            if (onerror) {
                onerror()
            } else {
                throw 'Loading data file "' + url + '" failed.'
            }
        });
        if (dep) addRunDependency(dep)
    },
    resizeListeners: [],
    updateResizeListeners: function() {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach(function(listener) {
            listener(canvas.width, canvas.height)
        })
    },
    setCanvasSize: function(width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners()
    },
    windowedWidth: 0,
    windowedHeight: 0,
    setFullscreenCanvasSize: function() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags | 8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    setWindowedCanvasSize: function() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags & ~8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    updateCanvasDimensions: function(canvas, wNative, hNative) {
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
            if (w / h < Module["forcedAspectRatio"]) {
                w = Math.round(h * Module["forcedAspectRatio"])
            } else {
                h = Math.round(w / Module["forcedAspectRatio"])
            }
        }
        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor)
        }
        if (Browser.resizeCanvas) {
            if (canvas.width != w) canvas.width = w;
            if (canvas.height != h) canvas.height = h;
            if (typeof canvas.style != "undefined") {
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height")
            }
        } else {
            if (canvas.width != wNative) canvas.width = wNative;
            if (canvas.height != hNative) canvas.height = hNative;
            if (typeof canvas.style != "undefined") {
                if (w != wNative || h != hNative) {
                    canvas.style.setProperty("width", w + "px", "important");
                    canvas.style.setProperty("height", h + "px", "important")
                } else {
                    canvas.style.removeProperty("width");
                    canvas.style.removeProperty("height")
                }
            }
        }
    },
    wgetRequests: {},
    nextWgetRequestHandle: 0,
    getNextWgetRequestHandle: function() {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle
    }
};

function _emscripten_cancel_main_loop() {
    Browser.mainLoop.pause();
    Browser.mainLoop.func = null
}

function __webgl_enable_ANGLE_instanced_arrays(ctx) {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = function(index, divisor) {
            ext["vertexAttribDivisorANGLE"](index, divisor)
        };
        ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
            ext["drawArraysInstancedANGLE"](mode, first, count, primcount)
        };
        ctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
            ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount)
        };
        return 1
    }
}

function __webgl_enable_OES_vertex_array_object(ctx) {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = function() {
            return ext["createVertexArrayOES"]()
        };
        ctx["deleteVertexArray"] = function(vao) {
            ext["deleteVertexArrayOES"](vao)
        };
        ctx["bindVertexArray"] = function(vao) {
            ext["bindVertexArrayOES"](vao)
        };
        ctx["isVertexArray"] = function(vao) {
            return ext["isVertexArrayOES"](vao)
        };
        return 1
    }
}

function __webgl_enable_WEBGL_draw_buffers(ctx) {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = function(n, bufs) {
            ext["drawBuffersWEBGL"](n, bufs)
        };
        return 1
    }
}

function __webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(ctx) {
    return !!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"))
}

function __webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(ctx) {
    return !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"))
}

function __webgl_enable_WEBGL_multi_draw(ctx) {
    return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"))
}
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    uniforms: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    timerQueriesEXT: [],
    queries: [],
    samplers: [],
    transformFeedbacks: [],
    syncs: [],
    programInfos: {},
    stringCache: {},
    stringiCache: {},
    unpackAlignment: 4,
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode
        }
    },
    getNewId: function(table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null
        }
        return ret
    },
    getSource: function(shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[length + i * 4 >> 2] : -1;
            source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len)
        }
        return source
    },
    createContext: function(canvas, webGLContextAttributes) {
        var ctx = webGLContextAttributes.majorVersion > 1 ? canvas.getContext("webgl2", webGLContextAttributes) : canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle
    },
    registerContext: function(ctx, webGLContextAttributes) {
        var handle = GL.getNewId(GL.contexts);
        var context = {
            handle: handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx
        };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context)
        }
        return handle
    },
    makeContextCurrent: function(contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx)
    },
    getContext: function(contextHandle) {
        return GL.contexts[contextHandle]
    },
    deleteContext: function(contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        GL.contexts[contextHandle] = null
    },
    initExtensions: function(context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        __webgl_enable_ANGLE_instanced_arrays(GLctx);
        __webgl_enable_OES_vertex_array_object(GLctx);
        __webgl_enable_WEBGL_draw_buffers(GLctx);
        __webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
        __webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        __webgl_enable_WEBGL_multi_draw(GLctx);
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function(ext) {
            if (ext.indexOf("lose_context") < 0 && ext.indexOf("debug") < 0) {
                GLctx.getExtension(ext)
            }
        })
    },
    populateUniformTable: function(program) {
        var p = GL.programs[program];
        var ptable = GL.programInfos[program] = {
            uniforms: {},
            maxUniformLength: 0,
            maxAttributeLength: -1,
            maxUniformBlockNameLength: -1
        };
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);
        for (var i = 0; i < numUniforms; ++i) {
            var u = GLctx.getActiveUniform(p, i);
            var name = u.name;
            ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
            if (name.slice(-1) == "]") {
                name = name.slice(0, name.lastIndexOf("["))
            }
            var loc = GLctx.getUniformLocation(p, name);
            if (loc) {
                var id = GL.getNewId(GL.uniforms);
                utable[name] = [u.size, id];
                GL.uniforms[id] = loc;
                for (var j = 1; j < u.size; ++j) {
                    var n = name + "[" + j + "]";
                    loc = GLctx.getUniformLocation(p, n);
                    id = GL.getNewId(GL.uniforms);
                    GL.uniforms[id] = loc
                }
            }
        }
    }
};

function _emscripten_glActiveTexture(x0) {
    GLctx["activeTexture"](x0)
}

function _emscripten_glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}

function _emscripten_glBeginQuery(target, id) {
    GLctx["beginQuery"](target, GL.queries[id])
}

function _emscripten_glBeginQueryEXT(target, id) {
    GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.timerQueriesEXT[id])
}

function _emscripten_glBeginTransformFeedback(x0) {
    GLctx["beginTransformFeedback"](x0)
}

function _emscripten_glBindAttribLocation(program, index, name) {
    GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name))
}

function _emscripten_glBindBuffer(target, buffer) {
    if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer
    } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer
    }
    GLctx.bindBuffer(target, GL.buffers[buffer])
}

function _emscripten_glBindBufferBase(target, index, buffer) {
    GLctx["bindBufferBase"](target, index, GL.buffers[buffer])
}

function _emscripten_glBindBufferRange(target, index, buffer, offset, ptrsize) {
    GLctx["bindBufferRange"](target, index, GL.buffers[buffer], offset, ptrsize)
}

function _emscripten_glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}

function _emscripten_glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}

function _emscripten_glBindSampler(unit, sampler) {
    GLctx["bindSampler"](unit, GL.samplers[sampler])
}

function _emscripten_glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture])
}

function _emscripten_glBindTransformFeedback(target, id) {
    GLctx["bindTransformFeedback"](target, GL.transformFeedbacks[id])
}

function _emscripten_glBindVertexArray(vao) {
    GLctx["bindVertexArray"](GL.vaos[vao])
}

function _emscripten_glBindVertexArrayOES(vao) {
    GLctx["bindVertexArray"](GL.vaos[vao])
}

function _emscripten_glBlendColor(x0, x1, x2, x3) {
    GLctx["blendColor"](x0, x1, x2, x3)
}

function _emscripten_glBlendEquation(x0) {
    GLctx["blendEquation"](x0)
}

function _emscripten_glBlendEquationSeparate(x0, x1) {
    GLctx["blendEquationSeparate"](x0, x1)
}

function _emscripten_glBlendFunc(x0, x1) {
    GLctx["blendFunc"](x0, x1)
}

function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) {
    GLctx["blendFuncSeparate"](x0, x1, x2, x3)
}

function _emscripten_glBlitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) {
    GLctx["blitFramebuffer"](x0, x1, x2, x3, x4, x5, x6, x7, x8, x9)
}

function _emscripten_glBufferData(target, size, data, usage) {
    if (GL.currentContext.version >= 2) {
        if (data) {
            GLctx.bufferData(target, HEAPU8, usage, data, size)
        } else {
            GLctx.bufferData(target, size, usage)
        }
    } else {
        GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
    }
}

function _emscripten_glBufferSubData(target, offset, size, data) {
    if (GL.currentContext.version >= 2) {
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return
    }
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
}

function _emscripten_glCheckFramebufferStatus(x0) {
    return GLctx["checkFramebufferStatus"](x0)
}

function _emscripten_glClear(x0) {
    GLctx["clear"](x0)
}

function _emscripten_glClearBufferfi(x0, x1, x2, x3) {
    GLctx["clearBufferfi"](x0, x1, x2, x3)
}

function _emscripten_glClearBufferfv(buffer, drawbuffer, value) {
    GLctx["clearBufferfv"](buffer, drawbuffer, HEAPF32, value >> 2)
}

function _emscripten_glClearBufferiv(buffer, drawbuffer, value) {
    GLctx["clearBufferiv"](buffer, drawbuffer, HEAP32, value >> 2)
}

function _emscripten_glClearBufferuiv(buffer, drawbuffer, value) {
    GLctx["clearBufferuiv"](buffer, drawbuffer, HEAPU32, value >> 2)
}

function _emscripten_glClearColor(x0, x1, x2, x3) {
    GLctx["clearColor"](x0, x1, x2, x3)
}

function _emscripten_glClearDepthf(x0) {
    GLctx["clearDepth"](x0)
}

function _emscripten_glClearStencil(x0) {
    GLctx["clearStencil"](x0)
}

function convertI32PairToI53(lo, hi) {
    return (lo >>> 0) + hi * 4294967296
}

function _emscripten_glClientWaitSync(sync, flags, timeoutLo, timeoutHi) {
    return GLctx.clientWaitSync(GL.syncs[sync], flags, convertI32PairToI53(timeoutLo, timeoutHi))
}

function _emscripten_glColorMask(red, green, blue, alpha) {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
}

function _emscripten_glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader])
}

function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, imageSize, data)
        } else {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _emscripten_glCompressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data) {
    if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["compressedTexImage3D"](target, level, internalFormat, width, height, depth, border, imageSize, data)
    } else {
        GLctx["compressedTexImage3D"](target, level, internalFormat, width, height, depth, border, HEAPU8, data, imageSize)
    }
}

function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, imageSize, data)
        } else {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _emscripten_glCompressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data) {
    if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["compressedTexSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data)
    } else {
        GLctx["compressedTexSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, HEAPU8, data, imageSize)
    }
}

function _emscripten_glCopyBufferSubData(x0, x1, x2, x3, x4) {
    GLctx["copyBufferSubData"](x0, x1, x2, x3, x4)
}

function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}

function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}

function _emscripten_glCopyTexSubImage3D(x0, x1, x2, x3, x4, x5, x6, x7, x8) {
    GLctx["copyTexSubImage3D"](x0, x1, x2, x3, x4, x5, x6, x7, x8)
}

function _emscripten_glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    GL.programs[id] = program;
    return id
}

function _emscripten_glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
}

function _emscripten_glCullFace(x0) {
    GLctx["cullFace"](x0)
}

function _emscripten_glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0
    }
}

function _emscripten_glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[framebuffers + i * 4 >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null
    }
}

function _emscripten_glDeleteProgram(id) {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
    GL.programInfos[id] = null
}

function _emscripten_glDeleteQueries(n, ids) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[ids + i * 4 >> 2];
        var query = GL.queries[id];
        if (!query) continue;
        GLctx["deleteQuery"](query);
        GL.queries[id] = null
    }
}

function _emscripten_glDeleteQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[ids + i * 4 >> 2];
        var query = GL.timerQueriesEXT[id];
        if (!query) continue;
        GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
        GL.timerQueriesEXT[id] = null
    }
}

function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[renderbuffers + i * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null
    }
}

function _emscripten_glDeleteSamplers(n, samplers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[samplers + i * 4 >> 2];
        var sampler = GL.samplers[id];
        if (!sampler) continue;
        GLctx["deleteSampler"](sampler);
        sampler.name = 0;
        GL.samplers[id] = null
    }
}

function _emscripten_glDeleteShader(id) {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
}

function _emscripten_glDeleteSync(id) {
    if (!id) return;
    var sync = GL.syncs[id];
    if (!sync) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteSync(sync);
    sync.name = 0;
    GL.syncs[id] = null
}

function _emscripten_glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
}

function _emscripten_glDeleteTransformFeedbacks(n, ids) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[ids + i * 4 >> 2];
        var transformFeedback = GL.transformFeedbacks[id];
        if (!transformFeedback) continue;
        GLctx["deleteTransformFeedback"](transformFeedback);
        transformFeedback.name = 0;
        GL.transformFeedbacks[id] = null
    }
}

function _emscripten_glDeleteVertexArrays(n, vaos) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[vaos + i * 4 >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null
    }
}

function _emscripten_glDeleteVertexArraysOES(n, vaos) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[vaos + i * 4 >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null
    }
}

function _emscripten_glDepthFunc(x0) {
    GLctx["depthFunc"](x0)
}

function _emscripten_glDepthMask(flag) {
    GLctx.depthMask(!!flag)
}

function _emscripten_glDepthRangef(x0, x1) {
    GLctx["depthRange"](x0, x1)
}

function _emscripten_glDetachShader(program, shader) {
    GLctx.detachShader(GL.programs[program], GL.shaders[shader])
}

function _emscripten_glDisable(x0) {
    GLctx["disable"](x0)
}

function _emscripten_glDisableVertexAttribArray(index) {
    GLctx.disableVertexAttribArray(index)
}

function _emscripten_glDrawArrays(mode, first, count) {
    GLctx.drawArrays(mode, first, count)
}

function _emscripten_glDrawArraysInstanced(mode, first, count, primcount) {
    GLctx["drawArraysInstanced"](mode, first, count, primcount)
}

function _emscripten_glDrawArraysInstancedANGLE(mode, first, count, primcount) {
    GLctx["drawArraysInstanced"](mode, first, count, primcount)
}

function _emscripten_glDrawArraysInstancedARB(mode, first, count, primcount) {
    GLctx["drawArraysInstanced"](mode, first, count, primcount)
}

function _emscripten_glDrawArraysInstancedEXT(mode, first, count, primcount) {
    GLctx["drawArraysInstanced"](mode, first, count, primcount)
}

function _emscripten_glDrawArraysInstancedNV(mode, first, count, primcount) {
    GLctx["drawArraysInstanced"](mode, first, count, primcount)
}
var tempFixedLengthArray = [];

function _emscripten_glDrawBuffers(n, bufs) {
    var bufArray = tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[bufs + i * 4 >> 2]
    }
    GLctx["drawBuffers"](bufArray)
}

function _emscripten_glDrawBuffersEXT(n, bufs) {
    var bufArray = tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[bufs + i * 4 >> 2]
    }
    GLctx["drawBuffers"](bufArray)
}

function _emscripten_glDrawBuffersWEBGL(n, bufs) {
    var bufArray = tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[bufs + i * 4 >> 2]
    }
    GLctx["drawBuffers"](bufArray)
}

function _emscripten_glDrawElements(mode, count, type, indices) {
    GLctx.drawElements(mode, count, type, indices)
}

function _emscripten_glDrawElementsInstanced(mode, count, type, indices, primcount) {
    GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}

function _emscripten_glDrawElementsInstancedANGLE(mode, count, type, indices, primcount) {
    GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}

function _emscripten_glDrawElementsInstancedARB(mode, count, type, indices, primcount) {
    GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}

function _emscripten_glDrawElementsInstancedEXT(mode, count, type, indices, primcount) {
    GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}

function _emscripten_glDrawElementsInstancedNV(mode, count, type, indices, primcount) {
    GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}

function _glDrawElements(mode, count, type, indices) {
    GLctx.drawElements(mode, count, type, indices)
}

function _emscripten_glDrawRangeElements(mode, start, end, count, type, indices) {
    _glDrawElements(mode, count, type, indices)
}

function _emscripten_glEnable(x0) {
    GLctx["enable"](x0)
}

function _emscripten_glEnableVertexAttribArray(index) {
    GLctx.enableVertexAttribArray(index)
}

function _emscripten_glEndQuery(x0) {
    GLctx["endQuery"](x0)
}

function _emscripten_glEndQueryEXT(target) {
    GLctx.disjointTimerQueryExt["endQueryEXT"](target)
}

function _emscripten_glEndTransformFeedback() {
    GLctx["endTransformFeedback"]()
}

function _emscripten_glFenceSync(condition, flags) {
    var sync = GLctx.fenceSync(condition, flags);
    if (sync) {
        var id = GL.getNewId(GL.syncs);
        sync.name = id;
        GL.syncs[id] = sync;
        return id
    } else {
        return 0
    }
}

function _emscripten_glFinish() {
    GLctx["finish"]()
}

function _emscripten_glFlush() {
    GLctx["flush"]()
}

function _emscripten_glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}

function _emscripten_glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}

function _emscripten_glFramebufferTextureLayer(target, attachment, texture, level, layer) {
    GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer)
}

function _emscripten_glFrontFace(x0) {
    GLctx["frontFace"](x0)
}

function __glGenObject(n, buffers, createFunction, objectTable) {
    for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer
        } else {
            GL.recordError(1282)
        }
        HEAP32[buffers + i * 4 >> 2] = id
    }
}

function _emscripten_glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
}

function _emscripten_glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}

function _emscripten_glGenQueries(n, ids) {
    __glGenObject(n, ids, "createQuery", GL.queries)
}

function _emscripten_glGenQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
        if (!query) {
            GL.recordError(1282);
            while (i < n) HEAP32[ids + i++ * 4 >> 2] = 0;
            return
        }
        var id = GL.getNewId(GL.timerQueriesEXT);
        query.name = id;
        GL.timerQueriesEXT[id] = query;
        HEAP32[ids + i * 4 >> 2] = id
    }
}

function _emscripten_glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}

function _emscripten_glGenSamplers(n, samplers) {
    __glGenObject(n, samplers, "createSampler", GL.samplers)
}

function _emscripten_glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures)
}

function _emscripten_glGenTransformFeedbacks(n, ids) {
    __glGenObject(n, ids, "createTransformFeedback", GL.transformFeedbacks)
}

function _emscripten_glGenVertexArrays(n, arrays) {
    __glGenObject(n, arrays, "createVertexArray", GL.vaos)
}

function _emscripten_glGenVertexArraysOES(n, arrays) {
    __glGenObject(n, arrays, "createVertexArray", GL.vaos)
}

function _emscripten_glGenerateMipmap(x0) {
    GLctx["generateMipmap"](x0)
}

function __glGetActiveAttribOrUniform(funcName, program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx[funcName](program, index);
    if (info) {
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
        if (size) HEAP32[size >> 2] = info.size;
        if (type) HEAP32[type >> 2] = info.type
    }
}

function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
    __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name)
}

function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
    __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name)
}

function _emscripten_glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, length, uniformBlockName) {
    program = GL.programs[program];
    var result = GLctx["getActiveUniformBlockName"](program, uniformBlockIndex);
    if (!result) return;
    if (uniformBlockName && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(result, uniformBlockName, bufSize);
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
    } else {
        if (length) HEAP32[length >> 2] = 0
    }
}

function _emscripten_glGetActiveUniformBlockiv(program, uniformBlockIndex, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    program = GL.programs[program];
    switch (pname) {
        case 35393:
            var name = GLctx["getActiveUniformBlockName"](program, uniformBlockIndex);
            HEAP32[params >> 2] = name.length + 1;
            return;
        default:
            var result = GLctx["getActiveUniformBlockParameter"](program, uniformBlockIndex, pname);
            if (!result) return;
            if (typeof result == "number") {
                HEAP32[params >> 2] = result
            } else {
                for (var i = 0; i < result.length; i++) {
                    HEAP32[params + i * 4 >> 2] = result[i]
                }
            }
    }
}

function _emscripten_glGetActiveUniformsiv(program, uniformCount, uniformIndices, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    if (uniformCount > 0 && uniformIndices == 0) {
        GL.recordError(1281);
        return
    }
    program = GL.programs[program];
    var ids = [];
    for (var i = 0; i < uniformCount; i++) {
        ids.push(HEAP32[uniformIndices + i * 4 >> 2])
    }
    var result = GLctx["getActiveUniforms"](program, ids, pname);
    if (!result) return;
    var len = result.length;
    for (var i = 0; i < len; i++) {
        HEAP32[params + i * 4 >> 2] = result[i]
    }
}

function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
    var result = GLctx.getAttachedShaders(GL.programs[program]);
    var len = result.length;
    if (len > maxCount) {
        len = maxCount
    }
    HEAP32[count >> 2] = len;
    for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[shaders + i * 4 >> 2] = id
    }
}

function _emscripten_glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
}

function writeI53ToI64(ptr, num) {
    HEAPU32[ptr >> 2] = num;
    HEAPU32[ptr + 4 >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296
}

function emscriptenWebGLGet(name_, p, type) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    var ret = undefined;
    switch (name_) {
        case 36346:
            ret = 1;
            break;
        case 36344:
            if (type != 0 && type != 1) {
                GL.recordError(1280)
            }
            return;
        case 34814:
        case 36345:
            ret = 0;
            break;
        case 34466:
            var formats = GLctx.getParameter(34467);
            ret = formats ? formats.length : 0;
            break;
        case 33309:
            if (GL.currentContext.version < 2) {
                GL.recordError(1282);
                return
            }
            var exts = GLctx.getSupportedExtensions() || [];
            ret = 2 * exts.length;
            break;
        case 33307:
        case 33308:
            if (GL.currentContext.version < 2) {
                GL.recordError(1280);
                return
            }
            ret = name_ == 33307 ? 3 : 0;
            break
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
            case "number":
                ret = result;
                break;
            case "boolean":
                ret = result ? 1 : 0;
                break;
            case "string":
                GL.recordError(1280);
                return;
            case "object":
                if (result === null) {
                    switch (name_) {
                        case 34964:
                        case 35725:
                        case 34965:
                        case 36006:
                        case 36007:
                        case 32873:
                        case 34229:
                        case 36662:
                        case 36663:
                        case 35053:
                        case 35055:
                        case 36010:
                        case 35097:
                        case 35869:
                        case 32874:
                        case 36389:
                        case 35983:
                        case 35368:
                        case 34068:
                            {
                                ret = 0;
                                break
                            }
                        default:
                            {
                                GL.recordError(1280);
                                return
                            }
                    }
                } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                    for (var i = 0; i < result.length; ++i) {
                        switch (type) {
                            case 0:
                                HEAP32[p + i * 4 >> 2] = result[i];
                                break;
                            case 2:
                                HEAPF32[p + i * 4 >> 2] = result[i];
                                break;
                            case 4:
                                HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                                break
                        }
                    }
                    return
                } else {
                    try {
                        ret = result.name | 0
                    } catch (e) {
                        GL.recordError(1280);
                        err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                        return
                    }
                }
                break;
            default:
                GL.recordError(1280);
                err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
                return
        }
    }
    switch (type) {
        case 1:
            writeI53ToI64(p, ret);
            break;
        case 0:
            HEAP32[p >> 2] = ret;
            break;
        case 2:
            HEAPF32[p >> 2] = ret;
            break;
        case 4:
            HEAP8[p >> 0] = ret ? 1 : 0;
            break
    }
}

function _emscripten_glGetBooleanv(name_, p) {
    emscriptenWebGLGet(name_, p, 4)
}

function _emscripten_glGetBufferParameteri64v(target, value, data) {
    if (!data) {
        GL.recordError(1281);
        return
    }
    writeI53ToI64(data, GLctx.getBufferParameter(target, value))
}

function _emscripten_glGetBufferParameteriv(target, value, data) {
    if (!data) {
        GL.recordError(1281);
        return
    }
    HEAP32[data >> 2] = GLctx.getBufferParameter(target, value)
}

function _emscripten_glGetError() {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error
}

function _emscripten_glGetFloatv(name_, p) {
    emscriptenWebGLGet(name_, p, 2)
}

function _emscripten_glGetFragDataLocation(program, name) {
    return GLctx["getFragDataLocation"](GL.programs[program], UTF8ToString(name))
}

function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
    var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
    if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
        result = result.name | 0
    }
    HEAP32[params >> 2] = result
}

function emscriptenWebGLGetIndexed(target, index, data, type) {
    if (!data) {
        GL.recordError(1281);
        return
    }
    var result = GLctx["getIndexedParameter"](target, index);
    var ret;
    switch (typeof result) {
        case "boolean":
            ret = result ? 1 : 0;
            break;
        case "number":
            ret = result;
            break;
        case "object":
            if (result === null) {
                switch (target) {
                    case 35983:
                    case 35368:
                        ret = 0;
                        break;
                    default:
                        {
                            GL.recordError(1280);
                            return
                        }
                }
            } else if (result instanceof WebGLBuffer) {
                ret = result.name | 0
            } else {
                GL.recordError(1280);
                return
            }
            break;
        default:
            GL.recordError(1280);
            return
    }
    switch (type) {
        case 1:
            writeI53ToI64(data, ret);
            break;
        case 0:
            HEAP32[data >> 2] = ret;
            break;
        case 2:
            HEAPF32[data >> 2] = ret;
            break;
        case 4:
            HEAP8[data >> 0] = ret ? 1 : 0;
            break;
        default:
            throw "internal emscriptenWebGLGetIndexed() error, bad type: " + type
    }
}

function _emscripten_glGetInteger64i_v(target, index, data) {
    emscriptenWebGLGetIndexed(target, index, data, 1)
}

function _emscripten_glGetInteger64v(name_, p) {
    emscriptenWebGLGet(name_, p, 1)
}

function _emscripten_glGetIntegeri_v(target, index, data) {
    emscriptenWebGLGetIndexed(target, index, data, 0)
}

function _emscripten_glGetIntegerv(name_, p) {
    emscriptenWebGLGet(name_, p, 0)
}

function _emscripten_glGetInternalformativ(target, internalformat, pname, bufSize, params) {
    if (bufSize < 0) {
        GL.recordError(1281);
        return
    }
    if (!params) {
        GL.recordError(1281);
        return
    }
    var ret = GLctx["getInternalformatParameter"](target, internalformat, pname);
    if (ret === null) return;
    for (var i = 0; i < ret.length && i < bufSize; ++i) {
        HEAP32[params + i >> 2] = ret[i]
    }
}

function _emscripten_glGetProgramBinary(program, bufSize, length, binaryFormat, binary) {
    GL.recordError(1282)
}

function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _emscripten_glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    var ptable = GL.programInfos[program];
    if (!ptable) {
        GL.recordError(1282);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength
    } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
            program = GL.programs[program];
            var numAttribs = GLctx.getProgramParameter(program, 35721);
            ptable.maxAttributeLength = 0;
            for (var i = 0; i < numAttribs; ++i) {
                var activeAttrib = GLctx.getActiveAttrib(program, i);
                ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxAttributeLength
    } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
            program = GL.programs[program];
            var numBlocks = GLctx.getProgramParameter(program, 35382);
            ptable.maxUniformBlockNameLength = 0;
            for (var i = 0; i < numBlocks; ++i) {
                var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname)
    }
}

function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    writeI53ToI64(params, ret)
}

function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    HEAP32[params >> 2] = ret
}

function _emscripten_glGetQueryObjectui64vEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    writeI53ToI64(params, ret)
}

function _emscripten_glGetQueryObjectuiv(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.queries[id];
    var param = GLctx["getQueryParameter"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    HEAP32[params >> 2] = ret
}

function _emscripten_glGetQueryObjectuivEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    HEAP32[params >> 2] = ret
}

function _emscripten_glGetQueryiv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx["getQuery"](target, pname)
}

function _emscripten_glGetQueryivEXT(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname)
}

function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname)
}

function _emscripten_glGetSamplerParameterfv(sampler, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    sampler = GL.samplers[sampler];
    HEAPF32[params >> 2] = GLctx["getSamplerParameter"](sampler, pname)
}

function _emscripten_glGetSamplerParameteriv(sampler, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    sampler = GL.samplers[sampler];
    HEAP32[params >> 2] = GLctx["getSamplerParameter"](sampler, pname)
}

function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
    var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
    HEAP32[range >> 2] = result.rangeMin;
    HEAP32[range + 4 >> 2] = result.rangeMax;
    HEAP32[precision >> 2] = result.precision
}

function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
    var result = GLctx.getShaderSource(GL.shaders[shader]);
    if (!result) return;
    var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _emscripten_glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
}

function stringToNewUTF8(jsString) {
    var length = lengthBytesUTF8(jsString) + 1;
    var cString = _malloc(length);
    stringToUTF8(jsString, cString, length);
    return cString
}

function _emscripten_glGetString(name_) {
    if (GL.stringCache[name_]) return GL.stringCache[name_];
    var ret;
    switch (name_) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function(e) {
                return "GL_" + e
            }));
            ret = stringToNewUTF8(exts.join(" "));
            break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
                GL.recordError(1280)
            }
            ret = stringToNewUTF8(s);
            break;
        case 7938:
            var glVersion = GLctx.getParameter(7938);
            if (GL.currentContext.version >= 2) glVersion = "OpenGL ES 3.0 (" + glVersion + ")";
            else {
                glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
            }
            ret = stringToNewUTF8(glVersion);
            break;
        case 35724:
            var glslVersion = GLctx.getParameter(35724);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
                if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
            }
            ret = stringToNewUTF8(glslVersion);
            break;
        default:
            GL.recordError(1280);
            return 0
    }
    GL.stringCache[name_] = ret;
    return ret
}

function _emscripten_glGetStringi(name, index) {
    if (GL.currentContext.version < 2) {
        GL.recordError(1282);
        return 0
    }
    var stringiCache = GL.stringiCache[name];
    if (stringiCache) {
        if (index < 0 || index >= stringiCache.length) {
            GL.recordError(1281);
            return 0
        }
        return stringiCache[index]
    }
    switch (name) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function(e) {
                return "GL_" + e
            }));
            exts = exts.map(function(e) {
                return stringToNewUTF8(e)
            });
            stringiCache = GL.stringiCache[name] = exts;
            if (index < 0 || index >= stringiCache.length) {
                GL.recordError(1281);
                return 0
            }
            return stringiCache[index];
        default:
            GL.recordError(1280);
            return 0
    }
}

function _emscripten_glGetSynciv(sync, pname, bufSize, length, values) {
    if (bufSize < 0) {
        GL.recordError(1281);
        return
    }
    if (!values) {
        GL.recordError(1281);
        return
    }
    var ret = GLctx.getSyncParameter(GL.syncs[sync], pname);
    HEAP32[length >> 2] = ret;
    if (ret !== null && length) HEAP32[length >> 2] = 1
}

function _emscripten_glGetTexParameterfv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname)
}

function _emscripten_glGetTexParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.getTexParameter(target, pname)
}

function _emscripten_glGetTransformFeedbackVarying(program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx["getTransformFeedbackVarying"](program, index);
    if (!info) return;
    if (name && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
    } else {
        if (length) HEAP32[length >> 2] = 0
    }
    if (size) HEAP32[size >> 2] = info.size;
    if (type) HEAP32[type >> 2] = info.type
}

function _emscripten_glGetUniformBlockIndex(program, uniformBlockName) {
    return GLctx["getUniformBlockIndex"](GL.programs[program], UTF8ToString(uniformBlockName))
}

function _emscripten_glGetUniformIndices(program, uniformCount, uniformNames, uniformIndices) {
    if (!uniformIndices) {
        GL.recordError(1281);
        return
    }
    if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
        GL.recordError(1281);
        return
    }
    program = GL.programs[program];
    var names = [];
    for (var i = 0; i < uniformCount; i++) names.push(UTF8ToString(HEAP32[uniformNames + i * 4 >> 2]));
    var result = GLctx["getUniformIndices"](program, names);
    if (!result) return;
    var len = result.length;
    for (var i = 0; i < len; i++) {
        HEAP32[uniformIndices + i * 4 >> 2] = result[i]
    }
}

function _emscripten_glGetUniformLocation(program, name) {
    name = UTF8ToString(name);
    var arrayIndex = 0;
    if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace)
    }
    var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
    if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex
    } else {
        return -1
    }
}

function emscriptenWebGLGetUniform(program, location, params, type) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
    if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[params + i * 4 >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[params + i * 4 >> 2] = data[i];
                    break
            }
        }
    }
}

function _emscripten_glGetUniformfv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 2)
}

function _emscripten_glGetUniformiv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 0)
}

function _emscripten_glGetUniformuiv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 0)
}

function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var data = GLctx.getVertexAttrib(index, pname);
    if (pname == 34975) {
        HEAP32[params >> 2] = data && data["name"]
    } else if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break;
            case 5:
                HEAP32[params >> 2] = Math.fround(data);
                break
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[params + i * 4 >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[params + i * 4 >> 2] = data[i];
                    break;
                case 5:
                    HEAP32[params + i * 4 >> 2] = Math.fround(data[i]);
                    break
            }
        }
    }
}

function _emscripten_glGetVertexAttribIiv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 0)
}

function _emscripten_glGetVertexAttribIuiv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 0)
}

function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
    if (!pointer) {
        GL.recordError(1281);
        return
    }
    HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname)
}

function _emscripten_glGetVertexAttribfv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 2)
}

function _emscripten_glGetVertexAttribiv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 5)
}

function _emscripten_glHint(x0, x1) {
    GLctx["hint"](x0, x1)
}

function _emscripten_glInvalidateFramebuffer(target, numAttachments, attachments) {
    var list = tempFixedLengthArray[numAttachments];
    for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[attachments + i * 4 >> 2]
    }
    GLctx["invalidateFramebuffer"](target, list)
}

function _emscripten_glInvalidateSubFramebuffer(target, numAttachments, attachments, x, y, width, height) {
    var list = tempFixedLengthArray[numAttachments];
    for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[attachments + i * 4 >> 2]
    }
    GLctx["invalidateSubFramebuffer"](target, list, x, y, width, height)
}

function _emscripten_glIsBuffer(buffer) {
    var b = GL.buffers[buffer];
    if (!b) return 0;
    return GLctx.isBuffer(b)
}

function _emscripten_glIsEnabled(x0) {
    return GLctx["isEnabled"](x0)
}

function _emscripten_glIsFramebuffer(framebuffer) {
    var fb = GL.framebuffers[framebuffer];
    if (!fb) return 0;
    return GLctx.isFramebuffer(fb)
}

function _emscripten_glIsProgram(program) {
    program = GL.programs[program];
    if (!program) return 0;
    return GLctx.isProgram(program)
}

function _emscripten_glIsQuery(id) {
    var query = GL.queries[id];
    if (!query) return 0;
    return GLctx["isQuery"](query)
}

function _emscripten_glIsQueryEXT(id) {
    var query = GL.timerQueriesEXT[id];
    if (!query) return 0;
    return GLctx.disjointTimerQueryExt["isQueryEXT"](query)
}

function _emscripten_glIsRenderbuffer(renderbuffer) {
    var rb = GL.renderbuffers[renderbuffer];
    if (!rb) return 0;
    return GLctx.isRenderbuffer(rb)
}

function _emscripten_glIsSampler(id) {
    var sampler = GL.samplers[id];
    if (!sampler) return 0;
    return GLctx["isSampler"](sampler)
}

function _emscripten_glIsShader(shader) {
    var s = GL.shaders[shader];
    if (!s) return 0;
    return GLctx.isShader(s)
}

function _emscripten_glIsSync(sync) {
    return GLctx.isSync(GL.syncs[sync])
}

function _emscripten_glIsTexture(id) {
    var texture = GL.textures[id];
    if (!texture) return 0;
    return GLctx.isTexture(texture)
}

function _emscripten_glIsTransformFeedback(id) {
    return GLctx["isTransformFeedback"](GL.transformFeedbacks[id])
}

function _emscripten_glIsVertexArray(array) {
    var vao = GL.vaos[array];
    if (!vao) return 0;
    return GLctx["isVertexArray"](vao)
}

function _emscripten_glIsVertexArrayOES(array) {
    var vao = GL.vaos[array];
    if (!vao) return 0;
    return GLctx["isVertexArray"](vao)
}

function _emscripten_glLineWidth(x0) {
    GLctx["lineWidth"](x0)
}

function _emscripten_glLinkProgram(program) {
    GLctx.linkProgram(GL.programs[program]);
    GL.populateUniformTable(program)
}

function _emscripten_glPauseTransformFeedback() {
    GLctx["pauseTransformFeedback"]()
}

function _emscripten_glPixelStorei(pname, param) {
    if (pname == 3317) {
        GL.unpackAlignment = param
    }
    GLctx.pixelStorei(pname, param)
}

function _emscripten_glPolygonOffset(x0, x1) {
    GLctx["polygonOffset"](x0, x1)
}

function _emscripten_glProgramBinary(program, binaryFormat, binary, length) {
    GL.recordError(1280)
}

function _emscripten_glProgramParameteri(program, pname, value) {
    GL.recordError(1280)
}

function _emscripten_glQueryCounterEXT(id, target) {
    GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.timerQueriesEXT[id], target)
}

function _emscripten_glReadBuffer(x0) {
    GLctx["readBuffer"](x0)
}

function computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
    function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y
    }
    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize
}

function __colorChannelsInGlTextureFormat(format) {
    var colorChannels = {
        5: 3,
        6: 4,
        8: 2,
        29502: 3,
        29504: 4,
        26917: 2,
        26918: 2,
        29846: 3,
        29847: 4
    };
    return colorChannels[format - 6402] || 1
}

function heapObjectForWebGLType(type) {
    type -= 5120;
    if (type == 0) return HEAP8;
    if (type == 1) return HEAPU8;
    if (type == 2) return HEAP16;
    if (type == 4) return HEAP32;
    if (type == 6) return HEAPF32;
    if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return HEAPU32;
    return HEAPU16
}

function heapAccessShiftForWebGLHeap(heap) {
    return 31 - Math.clz32(heap.BYTES_PER_ELEMENT)
}

function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
    var heap = heapObjectForWebGLType(type);
    var shift = heapAccessShiftForWebGLHeap(heap);
    var byteSize = 1 << shift;
    var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    return heap.subarray(pixels >> shift, pixels + bytes >> shift)
}

function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelPackBufferBinding) {
            GLctx.readPixels(x, y, width, height, format, type, pixels)
        } else {
            var heap = heapObjectForWebGLType(type);
            GLctx.readPixels(x, y, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
        }
        return
    }
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
}

function _emscripten_glReleaseShaderCompiler() {}

function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx["renderbufferStorage"](x0, x1, x2, x3)
}

function _emscripten_glRenderbufferStorageMultisample(x0, x1, x2, x3, x4) {
    GLctx["renderbufferStorageMultisample"](x0, x1, x2, x3, x4)
}

function _emscripten_glResumeTransformFeedback() {
    GLctx["resumeTransformFeedback"]()
}

function _emscripten_glSampleCoverage(value, invert) {
    GLctx.sampleCoverage(value, !!invert)
}

function _emscripten_glSamplerParameterf(sampler, pname, param) {
    GLctx["samplerParameterf"](GL.samplers[sampler], pname, param)
}

function _emscripten_glSamplerParameterfv(sampler, pname, params) {
    var param = HEAPF32[params >> 2];
    GLctx["samplerParameterf"](GL.samplers[sampler], pname, param)
}

function _emscripten_glSamplerParameteri(sampler, pname, param) {
    GLctx["samplerParameteri"](GL.samplers[sampler], pname, param)
}

function _emscripten_glSamplerParameteriv(sampler, pname, params) {
    var param = HEAP32[params >> 2];
    GLctx["samplerParameteri"](GL.samplers[sampler], pname, param)
}

function _emscripten_glScissor(x0, x1, x2, x3) {
    GLctx["scissor"](x0, x1, x2, x3)
}

function _emscripten_glShaderBinary() {
    GL.recordError(1280)
}

function _emscripten_glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
}

function _emscripten_glStencilFunc(x0, x1, x2) {
    GLctx["stencilFunc"](x0, x1, x2)
}

function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) {
    GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
}

function _emscripten_glStencilMask(x0) {
    GLctx["stencilMask"](x0)
}

function _emscripten_glStencilMaskSeparate(x0, x1) {
    GLctx["stencilMaskSeparate"](x0, x1)
}

function _emscripten_glStencilOp(x0, x1, x2) {
    GLctx["stencilOp"](x0, x1, x2)
}

function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) {
    GLctx["stencilOpSeparate"](x0, x1, x2, x3)
}

function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels)
        } else if (pixels) {
            var heap = heapObjectForWebGLType(type);
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null)
        }
        return
    }
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}

function _emscripten_glTexImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels) {
    if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, pixels)
    } else if (pixels) {
        var heap = heapObjectForWebGLType(type);
        GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
    } else {
        GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, null)
    }
}

function _emscripten_glTexParameterf(x0, x1, x2) {
    GLctx["texParameterf"](x0, x1, x2)
}

function _emscripten_glTexParameterfv(target, pname, params) {
    var param = HEAPF32[params >> 2];
    GLctx.texParameterf(target, pname, param)
}

function _emscripten_glTexParameteri(x0, x1, x2) {
    GLctx["texParameteri"](x0, x1, x2)
}

function _emscripten_glTexParameteriv(target, pname, params) {
    var param = HEAP32[params >> 2];
    GLctx.texParameteri(target, pname, param)
}

function _emscripten_glTexStorage2D(x0, x1, x2, x3, x4) {
    GLctx["texStorage2D"](x0, x1, x2, x3, x4)
}

function _emscripten_glTexStorage3D(x0, x1, x2, x3, x4, x5) {
    GLctx["texStorage3D"](x0, x1, x2, x3, x4, x5)
}

function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels)
        } else if (pixels) {
            var heap = heapObjectForWebGLType(type);
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null)
        }
        return
    }
    var pixelData = null;
    if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
}

function _emscripten_glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) {
    if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels)
    } else if (pixels) {
        var heap = heapObjectForWebGLType(type);
        GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
    } else {
        GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null)
    }
}

function _emscripten_glTransformFeedbackVaryings(program, count, varyings, bufferMode) {
    program = GL.programs[program];
    var vars = [];
    for (var i = 0; i < count; i++) vars.push(UTF8ToString(HEAP32[varyings + i * 4 >> 2]));
    GLctx["transformFeedbackVaryings"](program, vars, bufferMode)
}

function _emscripten_glUniform1f(location, v0) {
    GLctx.uniform1f(GL.uniforms[location], v0)
}
var miniTempWebGLFloatBuffers = [];

function _emscripten_glUniform1fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform1fv(GL.uniforms[location], HEAPF32, value >> 2, count);
        return
    }
    if (count <= 288) {
        var view = miniTempWebGLFloatBuffers[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAPF32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2)
    }
    GLctx.uniform1fv(GL.uniforms[location], view)
}

function _emscripten_glUniform1i(location, v0) {
    GLctx.uniform1i(GL.uniforms[location], v0)
}
var __miniTempWebGLIntBuffers = [];

function _emscripten_glUniform1iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform1iv(GL.uniforms[location], HEAP32, value >> 2, count);
        return
    }
    if (count <= 288) {
        var view = __miniTempWebGLIntBuffers[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAP32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2)
    }
    GLctx.uniform1iv(GL.uniforms[location], view)
}

function _emscripten_glUniform1ui(location, v0) {
    GLctx.uniform1ui(GL.uniforms[location], v0)
}

function _emscripten_glUniform1uiv(location, count, value) {
    GLctx.uniform1uiv(GL.uniforms[location], HEAPU32, value >> 2, count)
}

function _emscripten_glUniform2f(location, v0, v1) {
    GLctx.uniform2f(GL.uniforms[location], v0, v1)
}

function _emscripten_glUniform2fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform2fv(GL.uniforms[location], HEAPF32, value >> 2, count * 2);
        return
    }
    if (count <= 144) {
        var view = miniTempWebGLFloatBuffers[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2)
    }
    GLctx.uniform2fv(GL.uniforms[location], view)
}

function _emscripten_glUniform2i(location, v0, v1) {
    GLctx.uniform2i(GL.uniforms[location], v0, v1)
}

function _emscripten_glUniform2iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform2iv(GL.uniforms[location], HEAP32, value >> 2, count * 2);
        return
    }
    if (count <= 144) {
        var view = __miniTempWebGLIntBuffers[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 8 >> 2)
    }
    GLctx.uniform2iv(GL.uniforms[location], view)
}

function _emscripten_glUniform2ui(location, v0, v1) {
    GLctx.uniform2ui(GL.uniforms[location], v0, v1)
}

function _emscripten_glUniform2uiv(location, count, value) {
    GLctx.uniform2uiv(GL.uniforms[location], HEAPU32, value >> 2, count * 2)
}

function _emscripten_glUniform3f(location, v0, v1, v2) {
    GLctx.uniform3f(GL.uniforms[location], v0, v1, v2)
}

function _emscripten_glUniform3fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform3fv(GL.uniforms[location], HEAPF32, value >> 2, count * 3);
        return
    }
    if (count <= 96) {
        var view = miniTempWebGLFloatBuffers[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3fv(GL.uniforms[location], view)
}

function _emscripten_glUniform3i(location, v0, v1, v2) {
    GLctx.uniform3i(GL.uniforms[location], v0, v1, v2)
}

function _emscripten_glUniform3iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform3iv(GL.uniforms[location], HEAP32, value >> 2, count * 3);
        return
    }
    if (count <= 96) {
        var view = __miniTempWebGLIntBuffers[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAP32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3iv(GL.uniforms[location], view)
}

function _emscripten_glUniform3ui(location, v0, v1, v2) {
    GLctx.uniform3ui(GL.uniforms[location], v0, v1, v2)
}

function _emscripten_glUniform3uiv(location, count, value) {
    GLctx.uniform3uiv(GL.uniforms[location], HEAPU32, value >> 2, count * 3)
}

function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
    GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3)
}

function _emscripten_glUniform4fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value >> 2, count * 4);
        return
    }
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 4 * count; i += 4) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4fv(GL.uniforms[location], view)
}

function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
    GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3)
}

function _emscripten_glUniform4iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform4iv(GL.uniforms[location], HEAP32, value >> 2, count * 4);
        return
    }
    if (count <= 72) {
        var view = __miniTempWebGLIntBuffers[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAP32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4iv(GL.uniforms[location], view)
}

function _emscripten_glUniform4ui(location, v0, v1, v2, v3) {
    GLctx.uniform4ui(GL.uniforms[location], v0, v1, v2, v3)
}

function _emscripten_glUniform4uiv(location, count, value) {
    GLctx.uniform4uiv(GL.uniforms[location], HEAPU32, value >> 2, count * 4)
}

function _emscripten_glUniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding) {
    program = GL.programs[program];
    GLctx["uniformBlockBinding"](program, uniformBlockIndex, uniformBlockBinding)
}

function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 4);
        return
    }
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view)
}

function _emscripten_glUniformMatrix2x3fv(location, count, transpose, value) {
    GLctx.uniformMatrix2x3fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 6)
}

function _emscripten_glUniformMatrix2x4fv(location, count, transpose, value) {
    GLctx.uniformMatrix2x4fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 8)
}

function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 9);
        return
    }
    if (count <= 32) {
        var view = miniTempWebGLFloatBuffers[9 * count - 1];
        for (var i = 0; i < 9 * count; i += 9) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2)
    }
    GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view)
}

function _emscripten_glUniformMatrix3x2fv(location, count, transpose, value) {
    GLctx.uniformMatrix3x2fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 6)
}

function _emscripten_glUniformMatrix3x4fv(location, count, transpose, value) {
    GLctx.uniformMatrix3x4fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 12)
}

function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 16);
        return
    }
    if (count <= 18) {
        var view = miniTempWebGLFloatBuffers[16 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 16 * count; i += 16) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
            view[i + 4] = heap[dst + 4];
            view[i + 5] = heap[dst + 5];
            view[i + 6] = heap[dst + 6];
            view[i + 7] = heap[dst + 7];
            view[i + 8] = heap[dst + 8];
            view[i + 9] = heap[dst + 9];
            view[i + 10] = heap[dst + 10];
            view[i + 11] = heap[dst + 11];
            view[i + 12] = heap[dst + 12];
            view[i + 13] = heap[dst + 13];
            view[i + 14] = heap[dst + 14];
            view[i + 15] = heap[dst + 15]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
    }
    GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view)
}

function _emscripten_glUniformMatrix4x2fv(location, count, transpose, value) {
    GLctx.uniformMatrix4x2fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 8)
}

function _emscripten_glUniformMatrix4x3fv(location, count, transpose, value) {
    GLctx.uniformMatrix4x3fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 12)
}

function _emscripten_glUseProgram(program) {
    GLctx.useProgram(GL.programs[program])
}

function _emscripten_glValidateProgram(program) {
    GLctx.validateProgram(GL.programs[program])
}

function _emscripten_glVertexAttrib1f(x0, x1) {
    GLctx["vertexAttrib1f"](x0, x1)
}

function _emscripten_glVertexAttrib1fv(index, v) {
    GLctx.vertexAttrib1f(index, HEAPF32[v >> 2])
}

function _emscripten_glVertexAttrib2f(x0, x1, x2) {
    GLctx["vertexAttrib2f"](x0, x1, x2)
}

function _emscripten_glVertexAttrib2fv(index, v) {
    GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2])
}

function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) {
    GLctx["vertexAttrib3f"](x0, x1, x2, x3)
}

function _emscripten_glVertexAttrib3fv(index, v) {
    GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2])
}

function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) {
    GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4)
}

function _emscripten_glVertexAttrib4fv(index, v) {
    GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2])
}

function _emscripten_glVertexAttribDivisor(index, divisor) {
    GLctx["vertexAttribDivisor"](index, divisor)
}

function _emscripten_glVertexAttribDivisorANGLE(index, divisor) {
    GLctx["vertexAttribDivisor"](index, divisor)
}

function _emscripten_glVertexAttribDivisorARB(index, divisor) {
    GLctx["vertexAttribDivisor"](index, divisor)
}

function _emscripten_glVertexAttribDivisorEXT(index, divisor) {
    GLctx["vertexAttribDivisor"](index, divisor)
}

function _emscripten_glVertexAttribDivisorNV(index, divisor) {
    GLctx["vertexAttribDivisor"](index, divisor)
}

function _emscripten_glVertexAttribI4i(x0, x1, x2, x3, x4) {
    GLctx["vertexAttribI4i"](x0, x1, x2, x3, x4)
}

function _emscripten_glVertexAttribI4iv(index, v) {
    GLctx.vertexAttribI4i(index, HEAP32[v >> 2], HEAP32[v + 4 >> 2], HEAP32[v + 8 >> 2], HEAP32[v + 12 >> 2])
}

function _emscripten_glVertexAttribI4ui(x0, x1, x2, x3, x4) {
    GLctx["vertexAttribI4ui"](x0, x1, x2, x3, x4)
}

function _emscripten_glVertexAttribI4uiv(index, v) {
    GLctx.vertexAttribI4ui(index, HEAPU32[v >> 2], HEAPU32[v + 4 >> 2], HEAPU32[v + 8 >> 2], HEAPU32[v + 12 >> 2])
}

function _emscripten_glVertexAttribIPointer(index, size, type, stride, ptr) {
    GLctx["vertexAttribIPointer"](index, size, type, stride, ptr)
}

function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}

function _emscripten_glViewport(x0, x1, x2, x3) {
    GLctx["viewport"](x0, x1, x2, x3)
}

function _emscripten_glWaitSync(sync, flags, timeoutLo, timeoutHi) {
    GLctx.waitSync(GL.syncs[sync], flags, convertI32PairToI53(timeoutLo, timeoutHi))
}

function _longjmp(env, value) {
    _setThrew(env, value || 1);
    throw "longjmp"
}

function _emscripten_longjmp(a0, a1) {
    return _longjmp(a0, a1)
}

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
}

function _emscripten_pause_main_loop() {
    Browser.mainLoop.pause()
}

function _emscripten_get_heap_size() {
    return HEAPU8.length
}

function emscripten_realloc_buffer(size) {
    try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1
    } catch (e) {}
}

function _emscripten_resize_heap(requestedSize) {
    requestedSize = requestedSize >>> 0;
    var oldSize = _emscripten_get_heap_size();
    var maxHeapSize = 2147483648;
    if (requestedSize > maxHeapSize) {
        return false
    }
    var minHeapSize = 16777216;
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), 65536));
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
            return true
        }
    }
    return false
}

function _emscripten_set_main_loop_arg(func, arg, fps, simulateInfiniteLoop) {
    var browserIterationFunc = function() {
        wasmTable.get(func)(arg)
    };
    setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg)
}

function _emscripten_thread_sleep(msecs) {
    var start = _emscripten_get_now();
    while (_emscripten_get_now() - start < msecs) {}
}

function _emscripten_webgl_enable_extension(contextHandle, extension) {
    var context = GL.getContext(contextHandle);
    var extString = UTF8ToString(extension);
    if (extString.indexOf("GL_") == 0) extString = extString.substr(3);
    if (extString == "ANGLE_instanced_arrays") __webgl_enable_ANGLE_instanced_arrays(GLctx);
    if (extString == "OES_vertex_array_object") __webgl_enable_OES_vertex_array_object(GLctx);
    if (extString == "WEBGL_draw_buffers") __webgl_enable_WEBGL_draw_buffers(GLctx);
    if (extString == "WEBGL_draw_instanced_base_vertex_base_instance") __webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
    if (extString == "WEBGL_multi_draw_instanced_base_vertex_base_instance") __webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
    if (extString == "WEBGL_multi_draw") __webgl_enable_WEBGL_multi_draw(GLctx);
    var ext = context.GLctx.getExtension(extString);
    return !!ext
}

function _emscripten_webgl_do_get_current_context() {
    return GL.currentContext ? GL.currentContext.handle : 0
}

function _emscripten_webgl_get_current_context() {
    return _emscripten_webgl_do_get_current_context()
}
var ENV = {};

function getExecutableName() {
    return thisProgram || "./this.program"
}

function getEnvStrings() {
    if (!getEnvStrings.strings) {
        var lang = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
        var env = {
            "USER": "web_user",
            "LOGNAME": "web_user",
            "PATH": "/",
            "PWD": "/",
            "HOME": "/home/web_user",
            "LANG": lang,
            "_": getExecutableName()
        };
        for (var x in ENV) {
            env[x] = ENV[x]
        }
        var strings = [];
        for (var x in env) {
            strings.push(x + "=" + env[x])
        }
        getEnvStrings.strings = strings
    }
    return getEnvStrings.strings
}

function _environ_get(__environ, environ_buf) {
    try {
        var bufSize = 0;
        getEnvStrings().forEach(function(string, i) {
            var ptr = environ_buf + bufSize;
            HEAP32[__environ + i * 4 >> 2] = ptr;
            writeAsciiToMemory(string, ptr);
            bufSize += string.length + 1
        });
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
    try {
        var strings = getEnvStrings();
        HEAP32[penviron_count >> 2] = strings.length;
        var bufSize = 0;
        strings.forEach(function(string) {
            bufSize += string.length + 1
        });
        HEAP32[penviron_buf_size >> 2] = bufSize;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _exit(status) {
    exit(status)
}

function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61
        }
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}

function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return e.errno
    }
}
var GAI_ERRNO_MESSAGES = {};

function _gai_strerror(val) {
    var buflen = 256;
    if (!_gai_strerror.buffer) {
        _gai_strerror.buffer = _malloc(buflen);
        GAI_ERRNO_MESSAGES["0"] = "Success";
        GAI_ERRNO_MESSAGES["" + -1] = "Invalid value for 'ai_flags' field";
        GAI_ERRNO_MESSAGES["" + -2] = "NAME or SERVICE is unknown";
        GAI_ERRNO_MESSAGES["" + -3] = "Temporary failure in name resolution";
        GAI_ERRNO_MESSAGES["" + -4] = "Non-recoverable failure in name res";
        GAI_ERRNO_MESSAGES["" + -6] = "'ai_family' not supported";
        GAI_ERRNO_MESSAGES["" + -7] = "'ai_socktype' not supported";
        GAI_ERRNO_MESSAGES["" + -8] = "SERVICE not supported for 'ai_socktype'";
        GAI_ERRNO_MESSAGES["" + -10] = "Memory allocation failure";
        GAI_ERRNO_MESSAGES["" + -11] = "System error returned in 'errno'";
        GAI_ERRNO_MESSAGES["" + -12] = "Argument buffer overflow"
    }
    var msg = "Unknown error";
    if (val in GAI_ERRNO_MESSAGES) {
        if (GAI_ERRNO_MESSAGES[val].length > buflen - 1) {
            msg = "Message too long"
        } else {
            msg = GAI_ERRNO_MESSAGES[val]
        }
    }
    writeAsciiToMemory(msg, _gai_strerror.buffer);
    return _gai_strerror.buffer
}

function _getTempRet0() {
    return getTempRet0() | 0
}

function _getaddrinfo(node, service, hint, out) {
    var addr = 0;
    var port = 0;
    var flags = 0;
    var family = 0;
    var type = 0;
    var proto = 0;
    var ai;

    function allocaddrinfo(family, type, proto, canon, addr, port) {
        var sa, salen, ai;
        var errno;
        salen = family === 10 ? 28 : 16;
        addr = family === 10 ? __inet_ntop6_raw(addr) : __inet_ntop4_raw(addr);
        sa = _malloc(salen);
        errno = __write_sockaddr(sa, family, addr, port);
        assert(!errno);
        ai = _malloc(32);
        HEAP32[ai + 4 >> 2] = family;
        HEAP32[ai + 8 >> 2] = type;
        HEAP32[ai + 12 >> 2] = proto;
        HEAP32[ai + 24 >> 2] = canon;
        HEAP32[ai + 20 >> 2] = sa;
        if (family === 10) {
            HEAP32[ai + 16 >> 2] = 28
        } else {
            HEAP32[ai + 16 >> 2] = 16
        }
        HEAP32[ai + 28 >> 2] = 0;
        return ai
    }
    if (hint) {
        flags = HEAP32[hint >> 2];
        family = HEAP32[hint + 4 >> 2];
        type = HEAP32[hint + 8 >> 2];
        proto = HEAP32[hint + 12 >> 2]
    }
    if (type && !proto) {
        proto = type === 2 ? 17 : 6
    }
    if (!type && proto) {
        type = proto === 17 ? 2 : 1
    }
    if (proto === 0) {
        proto = 6
    }
    if (type === 0) {
        type = 1
    }
    if (!node && !service) {
        return -2
    }
    if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
        return -1
    }
    if (hint !== 0 && HEAP32[hint >> 2] & 2 && !node) {
        return -1
    }
    if (flags & 32) {
        return -2
    }
    if (type !== 0 && type !== 1 && type !== 2) {
        return -7
    }
    if (family !== 0 && family !== 2 && family !== 10) {
        return -6
    }
    if (service) {
        service = UTF8ToString(service);
        port = parseInt(service, 10);
        if (isNaN(port)) {
            if (flags & 1024) {
                return -2
            }
            return -8
        }
    }
    if (!node) {
        if (family === 0) {
            family = 2
        }
        if ((flags & 1) === 0) {
            if (family === 2) {
                addr = _htonl(2130706433)
            } else {
                addr = [0, 0, 0, 1]
            }
        }
        ai = allocaddrinfo(family, type, proto, null, addr, port);
        HEAP32[out >> 2] = ai;
        return 0
    }
    node = UTF8ToString(node);
    addr = __inet_pton4_raw(node);
    if (addr !== null) {
        if (family === 0 || family === 2) {
            family = 2
        } else if (family === 10 && flags & 8) {
            addr = [0, 0, _htonl(65535), addr];
            family = 10
        } else {
            return -2
        }
    } else {
        addr = __inet_pton6_raw(node);
        if (addr !== null) {
            if (family === 0 || family === 10) {
                family = 10
            } else {
                return -2
            }
        }
    }
    if (addr != null) {
        ai = allocaddrinfo(family, type, proto, node, addr, port);
        HEAP32[out >> 2] = ai;
        return 0
    }
    if (flags & 4) {
        return -2
    }
    node = DNS.lookup_name(node);
    addr = __inet_pton4_raw(node);
    if (family === 0) {
        family = 2
    } else if (family === 10) {
        addr = [0, 0, _htonl(65535), addr]
    }
    ai = allocaddrinfo(family, type, proto, null, addr, port);
    HEAP32[out >> 2] = ai;
    return 0
}

function getHostByName(name) {
    var ret = _malloc(20);
    var nameBuf = _malloc(name.length + 1);
    stringToUTF8(name, nameBuf, name.length + 1);
    HEAP32[ret >> 2] = nameBuf;
    var aliasesBuf = _malloc(4);
    HEAP32[aliasesBuf >> 2] = 0;
    HEAP32[ret + 4 >> 2] = aliasesBuf;
    var afinet = 2;
    HEAP32[ret + 8 >> 2] = afinet;
    HEAP32[ret + 12 >> 2] = 4;
    var addrListBuf = _malloc(12);
    HEAP32[addrListBuf >> 2] = addrListBuf + 8;
    HEAP32[addrListBuf + 4 >> 2] = 0;
    HEAP32[addrListBuf + 8 >> 2] = __inet_pton4_raw(DNS.lookup_name(name));
    HEAP32[ret + 16 >> 2] = addrListBuf;
    return ret
}

function _gethostbyaddr(addr, addrlen, type) {
    if (type !== 2) {
        setErrNo(5);
        return null
    }
    addr = HEAP32[addr >> 2];
    var host = __inet_ntop4_raw(addr);
    var lookup = DNS.lookup_addr(host);
    if (lookup) {
        host = lookup
    }
    return getHostByName(host)
}

function _gethostbyname(name) {
    return getHostByName(UTF8ToString(name))
}

function _getnameinfo(sa, salen, node, nodelen, serv, servlen, flags) {
    var info = __read_sockaddr(sa, salen);
    if (info.errno) {
        return -6
    }
    var port = info.port;
    var addr = info.addr;
    var overflowed = false;
    if (node && nodelen) {
        var lookup;
        if (flags & 1 || !(lookup = DNS.lookup_addr(addr))) {
            if (flags & 8) {
                return -2
            }
        } else {
            addr = lookup
        }
        var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);
        if (numBytesWrittenExclNull + 1 >= nodelen) {
            overflowed = true
        }
    }
    if (serv && servlen) {
        port = "" + port;
        var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);
        if (numBytesWrittenExclNull + 1 >= servlen) {
            overflowed = true
        }
    }
    if (overflowed) {
        return -12
    }
    return 0
}

function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[ptr >> 2] = now / 1e3 | 0;
    HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
    return 0
}

function _glActiveTexture(x0) {
    GLctx["activeTexture"](x0)
}

function _glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}

function _glBindBuffer(target, buffer) {
    if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer
    } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer
    }
    GLctx.bindBuffer(target, GL.buffers[buffer])
}

function _glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}

function _glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}

function _glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture])
}

function _glBlendFunc(x0, x1) {
    GLctx["blendFunc"](x0, x1)
}

function _glBufferData(target, size, data, usage) {
    if (GL.currentContext.version >= 2) {
        if (data) {
            GLctx.bufferData(target, HEAPU8, usage, data, size)
        } else {
            GLctx.bufferData(target, size, usage)
        }
    } else {
        GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
    }
}

function _glBufferSubData(target, offset, size, data) {
    if (GL.currentContext.version >= 2) {
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return
    }
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
}

function _glCheckFramebufferStatus(x0) {
    return GLctx["checkFramebufferStatus"](x0)
}

function _glClear(x0) {
    GLctx["clear"](x0)
}

function _glClearColor(x0, x1, x2, x3) {
    GLctx["clearColor"](x0, x1, x2, x3)
}

function _glClearDepthf(x0) {
    GLctx["clearDepth"](x0)
}

function _glClearStencil(x0) {
    GLctx["clearStencil"](x0)
}

function _glColorMask(red, green, blue, alpha) {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
}

function _glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader])
}

function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, imageSize, data)
        } else {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, imageSize, data)
        } else {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    GL.programs[id] = program;
    return id
}

function _glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
}

function _glCullFace(x0) {
    GLctx["cullFace"](x0)
}

function _glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0
    }
}

function _glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[framebuffers + i * 4 >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null
    }
}

function _glDeleteProgram(id) {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
    GL.programInfos[id] = null
}

function _glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[renderbuffers + i * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null
    }
}

function _glDeleteShader(id) {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
}

function _glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
}

function _glDepthFunc(x0) {
    GLctx["depthFunc"](x0)
}

function _glDepthMask(flag) {
    GLctx.depthMask(!!flag)
}

function _glDisable(x0) {
    GLctx["disable"](x0)
}

function _glDisableVertexAttribArray(index) {
    GLctx.disableVertexAttribArray(index)
}

function _glDrawArrays(mode, first, count) {
    GLctx.drawArrays(mode, first, count)
}

function _glEnable(x0) {
    GLctx["enable"](x0)
}

function _glEnableVertexAttribArray(index) {
    GLctx.enableVertexAttribArray(index)
}

function _glFlush() {
    GLctx["flush"]()
}

function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}

function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}

function _glFrontFace(x0) {
    GLctx["frontFace"](x0)
}

function _glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
}

function _glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}

function _glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}

function _glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures)
}

function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
    __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name)
}

function _glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
}

function _glGetError() {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error
}

function _glGetFloatv(name_, p) {
    emscriptenWebGLGet(name_, p, 2)
}

function _glGetIntegerv(name_, p) {
    emscriptenWebGLGet(name_, p, 0)
}

function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    var ptable = GL.programInfos[program];
    if (!ptable) {
        GL.recordError(1282);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength
    } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
            program = GL.programs[program];
            var numAttribs = GLctx.getProgramParameter(program, 35721);
            ptable.maxAttributeLength = 0;
            for (var i = 0; i < numAttribs; ++i) {
                var activeAttrib = GLctx.getActiveAttrib(program, i);
                ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxAttributeLength
    } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
            program = GL.programs[program];
            var numBlocks = GLctx.getProgramParameter(program, 35382);
            ptable.maxUniformBlockNameLength = 0;
            for (var i = 0; i < numBlocks; ++i) {
                var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname)
    }
}

function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
}

function _glGetString(name_) {
    if (GL.stringCache[name_]) return GL.stringCache[name_];
    var ret;
    switch (name_) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function(e) {
                return "GL_" + e
            }));
            ret = stringToNewUTF8(exts.join(" "));
            break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
                GL.recordError(1280)
            }
            ret = stringToNewUTF8(s);
            break;
        case 7938:
            var glVersion = GLctx.getParameter(7938);
            if (GL.currentContext.version >= 2) glVersion = "OpenGL ES 3.0 (" + glVersion + ")";
            else {
                glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
            }
            ret = stringToNewUTF8(glVersion);
            break;
        case 35724:
            var glslVersion = GLctx.getParameter(35724);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
                if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
            }
            ret = stringToNewUTF8(glslVersion);
            break;
        default:
            GL.recordError(1280);
            return 0
    }
    GL.stringCache[name_] = ret;
    return ret
}

function _glGetUniformLocation(program, name) {
    name = UTF8ToString(name);
    var arrayIndex = 0;
    if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace)
    }
    var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
    if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex
    } else {
        return -1
    }
}

function _glLinkProgram(program) {
    GLctx.linkProgram(GL.programs[program]);
    GL.populateUniformTable(program)
}

function _glPixelStorei(pname, param) {
    if (pname == 3317) {
        GL.unpackAlignment = param
    }
    GLctx.pixelStorei(pname, param)
}

function _glPolygonOffset(x0, x1) {
    GLctx["polygonOffset"](x0, x1)
}

function _glReadPixels(x, y, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelPackBufferBinding) {
            GLctx.readPixels(x, y, width, height, format, type, pixels)
        } else {
            var heap = heapObjectForWebGLType(type);
            GLctx.readPixels(x, y, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
        }
        return
    }
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
}

function _glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx["renderbufferStorage"](x0, x1, x2, x3)
}

function _glScissor(x0, x1, x2, x3) {
    GLctx["scissor"](x0, x1, x2, x3)
}

function _glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
}

function _glStencilFunc(x0, x1, x2) {
    GLctx["stencilFunc"](x0, x1, x2)
}

function _glStencilFuncSeparate(x0, x1, x2, x3) {
    GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
}

function _glStencilMask(x0) {
    GLctx["stencilMask"](x0)
}

function _glStencilOp(x0, x1, x2) {
    GLctx["stencilOp"](x0, x1, x2)
}

function _glStencilOpSeparate(x0, x1, x2, x3) {
    GLctx["stencilOpSeparate"](x0, x1, x2, x3)
}

function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels)
        } else if (pixels) {
            var heap = heapObjectForWebGLType(type);
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null)
        }
        return
    }
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}

function _glTexParameterf(x0, x1, x2) {
    GLctx["texParameterf"](x0, x1, x2)
}

function _glTexParameteri(x0, x1, x2) {
    GLctx["texParameteri"](x0, x1, x2)
}

function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels)
        } else if (pixels) {
            var heap = heapObjectForWebGLType(type);
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null)
        }
        return
    }
    var pixelData = null;
    if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
}

function _glUniform1i(location, v0) {
    GLctx.uniform1i(GL.uniforms[location], v0)
}

function _glUniform4fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value >> 2, count * 4);
        return
    }
    if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 4 * count; i += 4) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4fv(GL.uniforms[location], view)
}

function _glUniformMatrix4fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 16);
        return
    }
    if (count <= 18) {
        var view = miniTempWebGLFloatBuffers[16 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 16 * count; i += 16) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
            view[i + 4] = heap[dst + 4];
            view[i + 5] = heap[dst + 5];
            view[i + 6] = heap[dst + 6];
            view[i + 7] = heap[dst + 7];
            view[i + 8] = heap[dst + 8];
            view[i + 9] = heap[dst + 9];
            view[i + 10] = heap[dst + 10];
            view[i + 11] = heap[dst + 11];
            view[i + 12] = heap[dst + 12];
            view[i + 13] = heap[dst + 13];
            view[i + 14] = heap[dst + 14];
            view[i + 15] = heap[dst + 15]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
    }
    GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view)
}

function _glUseProgram(program) {
    GLctx.useProgram(GL.programs[program])
}

function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}

function _glViewport(x0, x1, x2, x3) {
    GLctx["viewport"](x0, x1, x2, x3)
}
var GLFW = {
    keyFunc: null,
    charFunc: null,
    markedTextFunc: null,
    gamepadFunc: null,
    mouseButtonFunc: null,
    mousePosFunc: null,
    mouseWheelFunc: null,
    resizeFunc: null,
    closeFunc: null,
    refreshFunc: null,
    focusFunc: null,
    iconifyFunc: null,
    touchFunc: null,
    params: null,
    initTime: null,
    wheelPos: 0,
    buttons: 0,
    keys: 0,
    initWindowWidth: 640,
    initWindowHeight: 480,
    windowX: 0,
    windowY: 0,
    windowWidth: 0,
    windowHeight: 0,
    prevWidth: 0,
    prevHeight: 0,
    prevNonFSWidth: 0,
    prevNonFSHeight: 0,
    isFullscreen: false,
    isPointerLocked: false,
    dpi: 1,
    mouseTouchId: null,
    DOMToGLFWKeyCode: function(keycode, code) {
        switch (keycode) {
            case 8:
                return 295;
            case 9:
                return 293;
            case 13:
                return 294;
            case 27:
                return 257;
            case 106:
                return 313;
            case 107:
                return 315;
            case 109:
                return 314;
            case 110:
                return 316;
            case 111:
                return 312;
            case 112:
                return 258;
            case 113:
                return 259;
            case 114:
                return 260;
            case 115:
                return 261;
            case 116:
                return 262;
            case 117:
                return 263;
            case 118:
                return 264;
            case 119:
                return 265;
            case 120:
                return 266;
            case 121:
                return 267;
            case 122:
                return 268;
            case 123:
                return 269;
            case 37:
                return 285;
            case 38:
                return 283;
            case 39:
                return 286;
            case 40:
                return 284;
            case 33:
                return 298;
            case 34:
                return 299;
            case 36:
                return 300;
            case 35:
                return 301;
            case 45:
                return 296;
            case 16:
                return 287;
            case 5:
                return 287;
            case 6:
                return 288;
            case 17:
                return 289;
            case 3:
                return 289;
            case 4:
                return 290;
            case 18:
                return 291;
            case 2:
                return 291;
            case 1:
                return 292;
            case 96:
                return 302;
            case 97:
                return 303;
            case 98:
                return 304;
            case 99:
                return 305;
            case 100:
                return 306;
            case 101:
                return 307;
            case 102:
                return 308;
            case 103:
                return 309;
            case 104:
                return 310;
            case 105:
                return 311
        }
        switch (code) {
            case "Minus":
                return 45;
            case "Period":
                return 46;
            case "Comma":
                return 44;
            case "Slash":
                return 47;
            case "Backslash":
                return 92;
            case "IntlRo":
                return 92;
            case "IntlYen":
                return 92;
            case "IntlBackslash":
                return 92;
            case "Backquote":
                return 96;
            case "BracketLeft":
                return 91;
            case "BracketRight":
                return 93;
            case "Equal":
                return 61;
            case "Quote":
                return 39;
            case "Semicolon":
                return 59;
            case "NumpadComma":
                return 316
        }
        return keycode
    },
    DOMtoGLFWButton: function(button) {
        if (button == 1) {
            button = 2
        } else if (button == 2) {
            button = 1
        }
        return button
    },
    getUnicodeChar: function(value) {
        var output = "";
        if (value > 65535) {
            value -= 65536;
            output += String.fromCharCode(value >>> 10 & 1023 | 55296);
            value = 56320 | value & 1023
        }
        output += String.fromCharCode(value);
        return output
    },
    addEventListener: function(type, listener, useCapture) {
        if (typeof window !== "undefined") {
            window.addEventListener(type, listener, useCapture)
        }
    },
    removeEventListener: function(type, listener, useCapture) {
        if (typeof window !== "undefined") {
            window.removeEventListener(type, listener, useCapture)
        }
    },
    addEventListenerCanvas: function(type, listener, useCapture) {
        if (typeof Module["canvas"] !== "undefined") {
            Module["canvas"].addEventListener(type, listener, useCapture)
        }
    },
    removeEventListenerCanvas: function(type, listener, useCapture) {
        if (typeof Module["canvas"] !== "undefined") {
            Module["canvas"].removeEventListener(type, listener, useCapture)
        }
    },
    isCanvasActive: function(event) {
        var res = typeof document.activeElement == "undefined" || document.activeElement == Module["canvas"];
        if (!res) {
            res = event.target == Module["canvas"]
        }
        if (event.target.focus) event.target.focus();
        return res
    },
    onKeyPress: function(event) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        if (event.charCode) {
            var char = GLFW.getUnicodeChar(event.charCode);
            if (char !== null && GLFW.charFunc) {
                wasmTable.get(GLFW.charFunc)(event.charCode, 1)
            }
        }
    },
    onKeyChanged: function(event, status) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        var key = GLFW.DOMToGLFWKeyCode(event.keyCode, event.code);
        if (key) {
            GLFW.keys[key] = status;
            if (GLFW.keyFunc) {
                wasmTable.get(GLFW.keyFunc)(key, status)
            }
        }
    },
    onKeydown: function(event) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        switch (event.keyCode) {
            case 37:
            case 38:
            case 39:
            case 40:
            case 32:
                event.preventDefault();
                event.stopPropagation();
            default:
                break
        }
        GLFW.onKeyChanged(event, 1);
        if (event.keyCode === 32) {
            if (GLFW.charFunc) {
                wasmTable.get(GLFW.charFunc)(32, 1);
                event.preventDefault()
            }
        } else if (event.keyCode === 8 || event.keyCode === 9 || event.keyCode === 13) {
            event.preventDefault()
        }
    },
    onKeyup: function(event) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        GLFW.onKeyChanged(event, 0)
    },
    onMousemove: function(event) {
        var lastX = Browser.mouseX;
        var lastY = Browser.mouseY;
        Browser.calculateMouseEvent(event);
        var newX = Browser.mouseX;
        var newY = Browser.mouseY;
        if (event.target == Module["canvas"] && GLFW.mousePosFunc) {
            event.preventDefault();
            wasmTable.get(GLFW.mousePosFunc)(lastX, lastY)
        }
    },
    onMouseButtonChanged: function(event, status) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        if (GLFW.mouseButtonFunc == null) {
            return
        }
        Browser.calculateMouseEvent(event);
        if (event.target != Module["canvas"]) {
            return
        }
        if (status == 1) {
            try {
                event.target.setCapture()
            } catch (e) {}
        }
        event.preventDefault();
        var eventButton = GLFW.DOMtoGLFWButton(event["button"]);
        wasmTable.get(GLFW.mouseButtonFunc)(eventButton, status)
    },
    fillTouch: function(id, x, y, phase) {
        if (GLFW.touchFunc) {
            wasmTable.get(GLFW.touchFunc)(id, x, y, phase)
        }
    },
    touchWasFinished: function(event, phase) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        for (var i = 0; i < event.changedTouches.length; ++i) {
            var touch = event.changedTouches[i];
            var coord = GLFW.convertCoordinatesFromMonitorToWebGLPixels(touch.clientX, touch.clientY);
            var canvasX = coord[0];
            var canvasY = coord[1];
            GLFW.fillTouch(touch.identifier, canvasX, canvasY, phase);
            if (touch.identifier == GLFW.mouseTouchId) {
                GLFW.mouseTouchId = null;
                GLFW.buttons &= ~(1 << 0)
            }
        }
        if (event.touches.length == 0) {
            GLFW.buttons &= ~(1 << 0)
        }
        if (typeof DefoldSoundDevice != "undefined" && DefoldSoundDevice != null) {
            DefoldSoundDevice.TryResumeAudio()
        }
        event.preventDefault()
    },
    onTouchEnd: function(event) {
        GLFW.touchWasFinished(event, GLFW.GLFW_PHASE_ENDED)
    },
    onTouchCancel: function(event) {
        GLFW.touchWasFinished(event, GLFW.GLFW_PHASE_CANCELLED)
    },
    convertCoordinatesFromMonitorToWebGLPixels: function(x, y) {
        var rect = Module["canvas"].getBoundingClientRect();
        var canvasWidth = rect.right - rect.left;
        var canvasHeight = rect.bottom - rect.top;
        var canvasX = x - rect.left;
        var canvasY = y - rect.top;
        var canvasXNormalized = canvasX / canvasWidth;
        var canvasYNormalized = canvasY / canvasHeight;
        var finalX = Module["canvas"].width * canvasXNormalized;
        var finalY = Module["canvas"].height * canvasYNormalized;
        return [finalX, finalY]
    },
    onTouchMove: function(event) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        var e = event;
        var touch;
        var coord;
        var canvasX;
        var canvasY;
        for (var i = 0; i < e.changedTouches.length; ++i) {
            touch = e.changedTouches[i];
            coord = GLFW.convertCoordinatesFromMonitorToWebGLPixels(touch.clientX, touch.clientY);
            canvasX = coord[0];
            canvasY = coord[1];
            if (touch.identifier == GLFW.mouseTouchId) {
                Browser.mouseX = canvasX;
                Browser.mouseY = canvasY
            }
            GLFW.fillTouch(touch.identifier, canvasX, canvasY, GLFW.GLFW_PHASE_MOVED)
        }
        event.preventDefault()
    },
    onTouchStart: function(event) {
        if (event.target != Module["canvas"]) {
            return
        }
        var e = event;
        var touch;
        var coord;
        var canvasX;
        var canvasY;
        for (var i = 0; i < e.changedTouches.length; ++i) {
            touch = e.changedTouches[i];
            coord = GLFW.convertCoordinatesFromMonitorToWebGLPixels(touch.clientX, touch.clientY);
            canvasX = coord[0];
            canvasY = coord[1];
            if (i == 0 && GLFW.mouseTouchId == null) {
                GLFW.mouseTouchId = touch.identifier;
                GLFW.buttons |= 1 << 0;
                Browser.mouseX = canvasX;
                Browser.mouseY = canvasY
            }
            GLFW.fillTouch(touch.identifier, canvasX, canvasY, GLFW.GLFW_PHASE_BEGAN)
        }
        event.preventDefault()
    },
    onMouseButtonDown: function(event) {
        if (event.target != Module["canvas"]) {
            return
        }
        GLFW.buttons |= 1 << event["button"];
        GLFW.onMouseButtonChanged(event, 1)
    },
    onMouseButtonUp: function(event) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        GLFW.buttons &= ~(1 << event["button"]);
        GLFW.onMouseButtonChanged(event, 0);
        if (typeof DefoldSoundDevice != "undefined" && DefoldSoundDevice != null) {
            DefoldSoundDevice.TryResumeAudio()
        }
    },
    onMouseWheel: function(event) {
        if (!GLFW.isCanvasActive(event)) {
            return
        }
        GLFW.wheelPos += Browser.getMouseWheelDelta(event);
        if (event.target == Module["canvas"]) {
            if (GLFW.mouseWheelFunc) {
                wasmTable.get(GLFW.mouseWheelFunc)(GLFW.wheelPos)
            }
            if (event.cancelable) {
                event.preventDefault()
            }
        }
    },
    onFocusChanged: function(focus) {
        if (focus == 0) {
            for (var i = 0; i < GLFW.keys.length; i++) {
                GLFW.keys[i] = 0
            }
        }
        if (GLFW.focusFunc) {
            wasmTable.get(GLFW.focusFunc)(focus)
        }
    },
    onFocus: function(event) {
        GLFW.onFocusChanged(1)
    },
    onBlur: function(event) {
        GLFW.onFocusChanged(0)
    },
    onFullScreenEventChange: function(event) {
        GLFW.isFullscreen = document["fullScreen"] || document["mozFullScreen"] || document["webkitIsFullScreen"] || document["msIsFullScreen"];
        if (!GLFW.isFullscreen) {
            document.removeEventListener("fullscreenchange", GLFW.onFullScreenEventChange, true);
            document.removeEventListener("mozfullscreenchange", GLFW.onFullScreenEventChange, true);
            document.removeEventListener("webkitfullscreenchange", GLFW.onFullScreenEventChange, true);
            document.removeEventListener("msfullscreenchange", GLFW.onFullScreenEventChange, true)
        }
        GLFW.prevWidth = 0;
        GLFW.prevHeight = 0
    },
    requestFullScreen: function(element) {
        element = element || Module["fullScreenContainer"] || Module["canvas"];
        if (!element) {
            return
        }
        document.addEventListener("fullscreenchange", GLFW.onFullScreenEventChange, true);
        document.addEventListener("mozfullscreenchange", GLFW.onFullScreenEventChange, true);
        document.addEventListener("webkitfullscreenchange", GLFW.onFullScreenEventChange, true);
        document.addEventListener("msfullscreenchange", GLFW.onFullScreenEventChange, true);
        var RFS = element["requestFullscreen"] || element["requestFullScreen"] || element["mozRequestFullScreen"] || element["webkitRequestFullScreen"] || element["msRequestFullScreen"] || function() {};
        RFS.apply(element, [])
    },
    cancelFullScreen: function() {
        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["webkitCancelFullScreen"] || document["msExitFullscreen"] || function() {};
        CFS.apply(document, [])
    },
    onJoystickConnected: function(event) {
        GLFW.refreshJoysticks()
    },
    onJoystickDisconnected: function(event) {
        GLFW.refreshJoysticks(true)
    },
    onPointerLockEventChange: function(event) {
        GLFW.isPointerLocked = !!document["pointerLockElement"];
        if (!GLFW.isPointerLocked) {
            document.removeEventListener("pointerlockchange", GLFW.onPointerLockEventChange, true)
        }
    },
    requestPointerLock: function(element) {
        element = element || Module["canvas"];
        if (!element) {
            return
        }
        if (!GLFW.isPointerLocked) {
            document.addEventListener("pointerlockchange", GLFW.onPointerLockEventChange, true);
            var RPL = element.requestPointerLock || function() {};
            RPL.apply(element, [])
        }
    },
    cancelPointerLock: function() {
        var EPL = document.exitPointerLock || function() {};
        EPL.apply(document, [])
    },
    disconnectJoystick: function(joy) {
        _free(GLFW.joys[joy].id);
        delete GLFW.joys[joy];
        if (GLFW.gamepadFunc) {
            wasmTable.get(GLFW.gamepadFunc)(joy, 0)
        }
    },
    joys: {},
    lastGamepadState: null,
    lastGamepadStateFrame: null,
    refreshJoysticks: function(forceUpdate) {
        if (forceUpdate || Browser.mainLoop.currentFrameNumber !== GLFW.lastGamepadStateFrame || !Browser.mainLoop.currentFrameNumber) {
            GLFW.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads : null;
            if (!GLFW.lastGamepadState) {
                return
            }
            GLFW.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
            for (var joy = 0; joy < GLFW.lastGamepadState.length; ++joy) {
                var gamepad = GLFW.lastGamepadState[joy];
                if (gamepad) {
                    if (!GLFW.joys[joy] || GLFW.joys[joy].id_string != gamepad.id) {
                        if (GLFW.joys[joy]) {
                            GLFW.disconnectJoystick(joy)
                        }
                        GLFW.joys[joy] = {
                            id: allocate(intArrayFromString(gamepad.id), ALLOC_NORMAL),
                            id_string: gamepad.id,
                            axesCount: gamepad.axes.length,
                            buttonsCount: gamepad.buttons.length
                        };
                        if (GLFW.gamepadFunc) {
                            wasmTable.get(GLFW.gamepadFunc)(joy, 1)
                        }
                    }
                    GLFW.joys[joy].buttons = gamepad.buttons;
                    GLFW.joys[joy].axes = gamepad.axes
                } else {
                    if (GLFW.joys[joy]) {
                        GLFW.disconnectJoystick(joy)
                    }
                }
            }
        }
    }
};

function _glfwAccelerometerEnable() {}

function _glfwCloseWindow() {
    if (GLFW.closeFunc) {
        wasmTable.get(GLFW.closeFunc)()
    }
    Module.ctx = Browser.destroyContext(Module["canvas"], true, true)
}

function _glfwDisable(token) {
    GLFW.params[token] = false;
    if (token == 196609) {
        GLFW.requestPointerLock()
    }
}

function _glfwEnable(token) {
    GLFW.params[token] = true;
    if (token == 196609) {
        GLFW.cancelPointerLock()
    }
}

function _glfwGetAcceleration(x, y, z) {
    return 0
}

function _glfwGetDefaultFramebuffer() {
    return 0
}

function _glfwGetDisplayScaleFactor() {
    return 1
}

function _glfwGetJoystickButtons(joy, buttons, numbuttons) {
    GLFW.refreshJoysticks();
    var state = GLFW.joys[joy];
    if (!state || !state.buttons) {
        for (var i = 0; i < numbuttons; i++) {
            setValue(buttons + i, 0, "i8")
        }
        return
    }
    for (var i = 0; i < Math.min(numbuttons, state.buttonsCount); i++) {
        setValue(buttons + i, state.buttons[i].pressed, "i8")
    }
}

function _glfwGetJoystickDeviceId(joy, device_id) {
    if (GLFW.joys[joy]) {
        setValue(device_id, GLFW.joys[joy].id, "*");
        return 1
    } else {
        return 0
    }
}

function _glfwGetJoystickHats(joy, buttons, numhats) {
    return 0
}

function _glfwGetJoystickParam(joy, param) {
    var result = 0;
    if (GLFW.joys[joy]) {
        switch (GLFW.params[param]) {
            case 0:
                result = 1;
                break;
            case 1:
                result = GLFW.joys[joy].axesCount;
                break;
            case 2:
                result = GLFW.joys[joy].buttonsCount;
                break
        }
    }
    return result
}

function _glfwGetJoystickPos(joy, pos, numaxes) {
    GLFW.refreshJoysticks();
    var state = GLFW.joys[joy];
    if (!state || !state.axes) {
        for (var i = 0; i < numaxes; i++) {
            setValue(pos + i * 4, 0, "float")
        }
        return
    }
    for (var i = 0; i < numaxes; i++) {
        setValue(pos + i * 4, state.axes[i], "float")
    }
}

function _glfwGetKey(key) {
    return GLFW.keys[key]
}

function _glfwGetMouseButton(button) {
    return (GLFW.buttons & 1 << GLFW.DOMtoGLFWButton(button)) > 0
}

function _glfwGetMouseLocked() {
    return GLFW.isPointerLocked ? 1 : 0
}

function _glfwGetMousePos(xpos, ypos) {
    setValue(xpos, Browser.mouseX, "i32");
    setValue(ypos, Browser.mouseY, "i32")
}

function _glfwGetMouseWheel() {
    return GLFW.wheelPos
}

function _glfwGetProcAddress(procname) {
    return _getProcAddress(procname)
}

function _glfwGetWindowParam(param) {
    return GLFW.params[param]
}

function _glfwGetWindowRefreshRate() {
    return 0
}

function _glfwGetWindowSize(width, height) {
    setValue(width, Module["canvas"].width, "i32");
    setValue(height, Module["canvas"].height, "i32")
}

function _glfwIconifyWindow() {}

function _glfwInitJS() {
    GLFW.initTime = Date.now() / 1e3;
    GLFW.addEventListener("gamepadconnected", GLFW.onJoystickConnected, true);
    GLFW.addEventListener("gamepaddisconnected", GLFW.onJoystickDisconnected, true);
    GLFW.addEventListener("keydown", GLFW.onKeydown, true);
    GLFW.addEventListener("keypress", GLFW.onKeyPress, true);
    GLFW.addEventListener("keyup", GLFW.onKeyup, true);
    GLFW.addEventListener("mousemove", GLFW.onMousemove, true);
    GLFW.addEventListener("mousedown", GLFW.onMouseButtonDown, true);
    GLFW.addEventListener("mouseup", GLFW.onMouseButtonUp, true);
    GLFW.addEventListener("DOMMouseScroll", GLFW.onMouseWheel, {
        capture: true,
        passive: false
    });
    GLFW.addEventListener("mousewheel", GLFW.onMouseWheel, {
        capture: true,
        passive: false
    });
    GLFW.addEventListenerCanvas("touchstart", GLFW.onTouchStart, true);
    GLFW.addEventListenerCanvas("touchend", GLFW.onTouchEnd, true);
    GLFW.addEventListenerCanvas("touchcancel", GLFW.onTouchCancel, true);
    GLFW.addEventListenerCanvas("touchmove", GLFW.onTouchMove, true);
    GLFW.addEventListenerCanvas("focus", GLFW.onFocus, true);
    GLFW.addEventListenerCanvas("blur", GLFW.onBlur, true);
    __ATEXIT__.push({
        func: function() {
            GLFW.removeEventListener("gamepadconnected", GLFW.onJoystickConnected, true);
            GLFW.removeEventListener("gamepaddisconnected", GLFW.onJoystickDisconnected, true);
            GLFW.removeEventListener("keydown", GLFW.onKeydown, true);
            GLFW.removeEventListener("keypress", GLFW.onKeyPress, true);
            GLFW.removeEventListener("keyup", GLFW.onKeyup, true);
            GLFW.removeEventListener("mousemove", GLFW.onMousemove, true);
            GLFW.removeEventListener("mousedown", GLFW.onMouseButtonDown, true);
            GLFW.removeEventListener("mouseup", GLFW.onMouseButtonUp, true);
            GLFW.removeEventListener("DOMMouseScroll", GLFW.onMouseWheel, {
                capture: true,
                passive: false
            });
            GLFW.removeEventListener("mousewheel", GLFW.onMouseWheel, {
                capture: true,
                passive: false
            });
            GLFW.removeEventListenerCanvas("touchstart", GLFW.onTouchStart, true);
            GLFW.removeEventListenerCanvas("touchend", GLFW.onTouchEnd, true);
            GLFW.removeEventListenerCanvas("touchcancel", GLFW.onTouchEnd, true);
            GLFW.removeEventListenerCanvas("touchmove", GLFW.onTouchMove, true);
            GLFW.removeEventListenerCanvas("focus", GLFW.onFocus, true);
            GLFW.removeEventListenerCanvas("blur", GLFW.onBlur, true);
            var canvas = Module["canvas"];
            if (typeof canvas !== "undefined") {
                Module["canvas"].width = Module["canvas"].height = 1
            }
        }
    });
    GLFW.params = new Array;
    GLFW.params[196609] = true;
    GLFW.params[196610] = false;
    GLFW.params[196611] = true;
    GLFW.params[196612] = false;
    GLFW.params[196613] = false;
    GLFW.params[196614] = true;
    GLFW.params[131073] = true;
    GLFW.params[131074] = true;
    GLFW.params[131075] = false;
    GLFW.params[131076] = true;
    GLFW.params[131077] = 0;
    GLFW.params[131078] = 0;
    GLFW.params[131079] = 0;
    GLFW.params[131080] = 0;
    GLFW.params[131081] = 0;
    GLFW.params[131082] = 0;
    GLFW.params[131083] = 0;
    GLFW.params[131084] = 0;
    GLFW.params[131085] = 0;
    GLFW.params[131086] = 0;
    GLFW.params[131087] = 0;
    GLFW.params[131088] = 0;
    GLFW.params[131089] = 0;
    GLFW.params[131090] = 0;
    GLFW.params[131091] = 0;
    GLFW.params[131092] = 0;
    GLFW.params[131093] = 0;
    GLFW.params[131094] = 0;
    GLFW.params[131095] = 0;
    GLFW.params[131096] = 0;
    GLFW.params[327681] = 0;
    GLFW.params[327682] = 1;
    GLFW.params[327683] = 2;
    GLFW.params[131097] = 0;
    GLFW.keys = new Array;
    GLFW.GLFW_PHASE_BEGAN = 0;
    GLFW.GLFW_PHASE_MOVED = 1;
    GLFW.GLFW_PHASE_ENDED = 3;
    GLFW.GLFW_PHASE_CANCELLED = 4;
    return 1
}

function _glfwOpenWindow(width, height, redbits, greenbits, bluebits, alphabits, depthbits, stencilbits, mode) {
    if (width == 0 && height > 0) {
        width = 4 * height / 3
    }
    if (width > 0 && height == 0) {
        height = 3 * width / 4
    }
    GLFW.params[131077] = redbits;
    GLFW.params[131078] = greenbits;
    GLFW.params[131079] = bluebits;
    GLFW.params[131080] = alphabits;
    GLFW.params[131081] = depthbits;
    GLFW.params[131082] = stencilbits;
    if (mode == 65537) {
        GLFW.initWindowWidth = width;
        GLFW.initWindowHeight = height;
        GLFW.params[196611] = true
    } else if (mode == 65538) {
        GLFW.requestFullScreen();
        GLFW.params[196611] = false
    } else {
        throw "Invalid glfwOpenWindow mode."
    }
    var contextAttributes = {
        antialias: GLFW.params[131091] > 1,
        depth: GLFW.params[131081] > 0,
        stencil: GLFW.params[131082] > 0
    };
    var iOSVersion = false;
    try {
        iOSVersion = parseFloat(("" + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ""])[1]).replace("undefined", "3_2").replace("_", ".").replace("_", "")) || false
    } catch (e) {}
    if (iOSVersion && iOSVersion < 15.2) {
        contextAttributes.majorVersion = 1
    }
    Module.ctx = Browser.createContext(Module["canvas"], true, true, contextAttributes);
    if (Module.ctx == null) {
        contextAttributes.majorVersion = 1;
        Module.ctx = Browser.createContext(Module["canvas"], true, true, contextAttributes)
    }
    return 1
}

function _glfwOpenWindowHint(target, hint) {
    GLFW.params[target] = hint;
    if (target == 131097) {
        if (hint != 0) {
            GLFW.dpi = window.devicePixelRatio || 1
        }
    }
}

function _glfwPollEvents() {}

function _glfwResetKeyboard() {}

function _glfwSetCharCallback(cbfun) {
    GLFW.charFunc = cbfun;
    return 1
}

function _glfwSetGamepadCallback(cbfun) {
    GLFW.gamepadFunc = cbfun;
    GLFW.refreshJoysticks();
    return 1
}

function _glfwSetMarkedTextCallback(cbfun) {
    GLFW.markedTextFunc = cbfun;
    return 1
}

function _glfwSetTouchCallback(cbfun) {
    GLFW.touchFunc = cbfun;
    return 1
}

function _glfwSetWindowBackgroundColor() {}

function _glfwSetWindowCloseCallback(cbfun) {
    GLFW.closeFunc = cbfun
}

function _glfwSetWindowFocusCallback(cbfun) {
    GLFW.focusFunc = cbfun
}

function _glfwSetWindowIconifyCallback(cbfun) {
    GLFW.iconifyFunc = cbfun
}

function _glfwSetWindowSize(width, height) {
    Browser.setCanvasSize(width, height);
    if (GLFW.resizeFunc) {
        wasmTable.get(GLFW.resizeFunc)(width, height)
    }
}

function _glfwSetWindowSizeCallback(cbfun) {
    GLFW.resizeFunc = cbfun
}

function _glfwShowKeyboard(show_keyboard) {
    Module["canvas"].contentEditable = show_keyboard ? true : false;
    if (show_keyboard) {
        Module["canvas"].focus()
    }
}

function _glfwSwapBuffers() {
    var width = Module["canvas"].width;
    var height = Module["canvas"].height;
    if (GLFW.prevWidth != width || GLFW.prevHeight != height) {
        if (GLFW.isFullscreen) {
            width = Math.floor(window.innerWidth * GLFW.dpi);
            height = Math.floor(window.innerHeight * GLFW.dpi)
        } else {
            width = Math.floor(width * GLFW.dpi);
            height = Math.floor(height * GLFW.dpi)
        }
        GLFW.prevWidth = width;
        GLFW.prevHeight = height;
        _glfwSetWindowSize(width, height)
    }
}

function _glfwSwapInterval(interval) {}

function _glfwTerminate() {}
var listener = {
    onRemoteConfigsUpdated: function() {
        _js_remote_configs_callback()
    }
};

function _js_addBusinessEvent(currency, amount, itemType, itemId, cartType, fields, mergeFields) {
    var fieldsString = UTF8ToString(fields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.addBusinessEvent(UTF8ToString(currency), amount, UTF8ToString(itemType), UTF8ToString(itemId), UTF8ToString(cartType), JSON.parse(fieldsString), mergeFields)
}

function _js_addDesignEvent(eventId, fields, mergeFields) {
    var fieldsString = UTF8ToString(fields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.addDesignEvent(UTF8ToString(eventId), JSON.parse(fieldsString), mergeFields)
}

function _js_addDesignEventWithValue(eventId, value, fields, mergeFields) {
    var fieldsString = UTF8ToString(fields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.addDesignEvent(UTF8ToString(eventId), value, JSON.parse(fieldsString), mergeFields)
}

function _js_addErrorEvent(severity, message, fields, mergeFields) {
    var fieldsString = UTF8ToString(fields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.addErrorEvent(severity, UTF8ToString(message), JSON.parse(fieldsString), mergeFields)
}

function _js_addProgressionEvent(progressionStatus, progression01, progression02, progression03, fields, mergeFields) {
    var fieldsString = UTF8ToString(fields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.addProgressionEvent(progressionStatus, UTF8ToString(progression01), UTF8ToString(progression02), UTF8ToString(progression03), JSON.parse(fieldsString), mergeFields)
}

function _js_addProgressionEventWithScore(progressionStatus, progression01, progression02, progression03, score, fields, mergeFields) {
    var fieldsString = UTF8ToString(fields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.addProgressionEvent(progressionStatus, UTF8ToString(progression01), UTF8ToString(progression02), UTF8ToString(progression03), score, JSON.parse(fieldsString), mergeFields)
}

function _js_addResourceEvent(flowType, currency, amount, itemType, itemId, fields, mergeFields) {
    var fieldsString = UTF8ToString(fields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.addResourceEvent(flowType, UTF8ToString(currency), amount, UTF8ToString(itemType), UTF8ToString(itemId), JSON.parse(fieldsString), mergeFields)
}

function _js_configureAvailableCustomDimensions01(list) {
    gameanalytics.GameAnalytics.configureAvailableCustomDimensions01(JSON.parse(UTF8ToString(list)))
}

function _js_configureAvailableCustomDimensions02(list) {
    gameanalytics.GameAnalytics.configureAvailableCustomDimensions02(JSON.parse(UTF8ToString(list)))
}

function _js_configureAvailableCustomDimensions03(list) {
    gameanalytics.GameAnalytics.configureAvailableCustomDimensions03(JSON.parse(UTF8ToString(list)))
}

function _js_configureAvailableResourceCurrencies(list) {
    gameanalytics.GameAnalytics.configureAvailableResourceCurrencies(JSON.parse(UTF8ToString(list)))
}

function _js_configureAvailableResourceItemTypes(list) {
    gameanalytics.GameAnalytics.configureAvailableResourceItemTypes(JSON.parse(UTF8ToString(list)))
}

function _js_configureBuild(build) {
    gameanalytics.GameAnalytics.configureBuild(UTF8ToString(build))
}

function _js_configureGameEngineVersion(version) {
    gameanalytics.GameAnalytics.configureGameEngineVersion(UTF8ToString(version))
}

function _js_configureSdkGameEngineVersion(version) {
    gameanalytics.GameAnalytics.configureSdkGameEngineVersion(UTF8ToString(version))
}

function _js_configureUserId(userId) {
    gameanalytics.GameAnalytics.configureUserId(UTF8ToString(userId))
}

function _js_endSession() {
    gameanalytics.GameAnalytics.endSession()
}

function _js_getRemoteConfigsContentAsString() {
    var returnStr = gameanalytics.GameAnalytics.getRemoteConfigsContentAsString();
    var bufferSize = lengthBytesUTF8(returnStr) + 1;
    var buffer = _malloc(bufferSize);
    stringToUTF8(returnStr, buffer, bufferSize);
    return buffer
}

function _js_getRemoteConfigsValueAsStringWithDefaultValue(key, defaultValue) {
    var returnStr = gameanalytics.GameAnalytics.getRemoteConfigsValueAsString(UTF8ToString(key), UTF8ToString(defaultValue));
    var bufferSize = lengthBytesUTF8(returnStr) + 1;
    var buffer = _malloc(bufferSize);
    stringToUTF8(returnStr, buffer, bufferSize);
    return buffer
}

function _js_initialize(gamekey, gamesecret) {
    gameanalytics.GameAnalytics.addRemoteConfigsListener(listener);
    gameanalytics.GameAnalytics.initialize(UTF8ToString(gamekey), UTF8ToString(gamesecret))
}

function _js_isRemoteConfigsReady() {
    return gameanalytics.GameAnalytics.isRemoteConfigsReady()
}

function _js_setCustomDimension01(customDimension) {
    gameanalytics.GameAnalytics.setCustomDimension01(UTF8ToString(customDimension))
}

function _js_setCustomDimension02(customDimension) {
    gameanalytics.GameAnalytics.setCustomDimension02(UTF8ToString(customDimension))
}

function _js_setCustomDimension03(customDimension) {
    gameanalytics.GameAnalytics.setCustomDimension03(UTF8ToString(customDimension))
}

function _js_setEnabledInfoLog(enabled) {
    gameanalytics.GameAnalytics.setEnabledInfoLog(enabled)
}

function _js_setEnabledVerboseLog(enabled) {
    gameanalytics.GameAnalytics.setEnabledVerboseLog(enabled)
}

function _js_setEventSubmission(enabled) {
    gameanalytics.GameAnalytics.setEnabledEventSubmission(enabled)
}

function _js_setGlobalCustomEventFields(customFields) {
    var fieldsString = UTF8ToString(customFields);
    fieldsString = fieldsString ? fieldsString : "{}";
    gameanalytics.GameAnalytics.setCustomDimension03(JSON.parse(fieldsString))
}

function _js_setManualSessionHandling(enabled) {
    gameanalytics.GameAnalytics.setEnabledManualSessionHandling(enabled)
}

function _js_startSession() {
    gameanalytics.GameAnalytics.startSession()
}

function _mktime(tmPtr) {
    _tzset();
    var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
    var dst = HEAP32[tmPtr + 32 >> 2];
    var guessedOffset = date.getTimezoneOffset();
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dstOffset = Math.min(winterOffset, summerOffset);
    if (dst < 0) {
        HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
    } else if (dst > 0 != (dstOffset == guessedOffset)) {
        var nonDstOffset = Math.max(winterOffset, summerOffset);
        var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
        date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
    }
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    return date.getTime() / 1e3 | 0
}

function _pthread_create() {
    return 6
}

function _pthread_join() {
    return 28
}

function _setTempRet0($i) {
    setTempRet0($i | 0)
}
var __sigalrm_handler = 0;

function _signal(sig, func) {
    if (sig == 14) {
        __sigalrm_handler = func
    } else {}
    return 0
}

function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]) {}
    return sum
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function __addDays(date, days) {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1)
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
        }
    }
    return newDate
}

function _strftime(s, maxsize, format, tm) {
    var tm_zone = HEAP32[tm + 40 >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[tm + 4 >> 2],
        tm_hour: HEAP32[tm + 8 >> 2],
        tm_mday: HEAP32[tm + 12 >> 2],
        tm_mon: HEAP32[tm + 16 >> 2],
        tm_year: HEAP32[tm + 20 >> 2],
        tm_wday: HEAP32[tm + 24 >> 2],
        tm_yday: HEAP32[tm + 28 >> 2],
        tm_isdst: HEAP32[tm + 32 >> 2],
        tm_gmtoff: HEAP32[tm + 36 >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str
        }
        return str
    }

    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0")
    }

    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate())
            }
        }
        return compare
    }

    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
                return new Date(janFourth.getFullYear() - 1, 11, 30)
        }
    }

    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1
            } else {
                return thisDate.getFullYear()
            }
        } else {
            return thisDate.getFullYear() - 1
        }
    }
    var EXPANSION_RULES_2 = {
        "%a": function(date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3)
        },
        "%A": function(date) {
            return WEEKDAYS[date.tm_wday]
        },
        "%b": function(date) {
            return MONTHS[date.tm_mon].substring(0, 3)
        },
        "%B": function(date) {
            return MONTHS[date.tm_mon]
        },
        "%C": function(date) {
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
        },
        "%d": function(date) {
            return leadingNulls(date.tm_mday, 2)
        },
        "%e": function(date) {
            return leadingSomething(date.tm_mday, 2, " ")
        },
        "%g": function(date) {
            return getWeekBasedYear(date).toString().substring(2)
        },
        "%G": function(date) {
            return getWeekBasedYear(date)
        },
        "%H": function(date) {
            return leadingNulls(date.tm_hour, 2)
        },
        "%I": function(date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12;
            else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
        },
        "%j": function(date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
        },
        "%m": function(date) {
            return leadingNulls(date.tm_mon + 1, 2)
        },
        "%M": function(date) {
            return leadingNulls(date.tm_min, 2)
        },
        "%n": function() {
            return "\n"
        },
        "%p": function(date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM"
            } else {
                return "PM"
            }
        },
        "%S": function(date) {
            return leadingNulls(date.tm_sec, 2)
        },
        "%t": function() {
            return "\t"
        },
        "%u": function(date) {
            return date.tm_wday || 7
        },
        "%U": function(date) {
            var janFirst = new Date(date.tm_year + 1900, 0, 1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstSunday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
        },
        "%V": function(date) {
            var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
            var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                return "53"
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                return "01"
            }
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
            } else {
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2)
        },
        "%w": function(date) {
            return date.tm_wday
        },
        "%W": function(date) {
            var janFirst = new Date(date.tm_year, 0, 1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
        },
        "%y": function(date) {
            return (date.tm_year + 1900).toString().substring(2)
        },
        "%Y": function(date) {
            return date.tm_year + 1900
        },
        "%z": function(date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
        },
        "%Z": function(date) {
            return date.tm_zone
        },
        "%%": function() {
            return "%"
        }
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
        }
    }
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1
}

function _sysconf(name) {
    switch (name) {
        case 30:
            return 16384;
        case 85:
            var maxHeapSize = 2147483648;
            return maxHeapSize / 16384;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
        case 79:
            return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
            return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
            return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
            return 1024;
        case 31:
        case 42:
        case 72:
            return 32;
        case 87:
        case 26:
        case 33:
            return 2147483647;
        case 34:
        case 1:
            return 47839;
        case 38:
        case 36:
            return 99;
        case 43:
        case 37:
            return 2048;
        case 0:
            return 2097152;
        case 3:
            return 65536;
        case 28:
            return 32768;
        case 44:
            return 32767;
        case 75:
            return 16384;
        case 39:
            return 1e3;
        case 89:
            return 700;
        case 71:
            return 256;
        case 40:
            return 255;
        case 2:
            return 100;
        case 180:
            return 64;
        case 25:
            return 20;
        case 5:
            return 16;
        case 6:
            return 6;
        case 73:
            return 4;
        case 84:
            {
                if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
                return 1
            }
    }
    setErrNo(28);
    return -1
}

function _system(command) {
    if (ENVIRONMENT_IS_NODE) {
        if (!command) return 1;
        var cmdstr = UTF8ToString(command);
        if (!cmdstr.length) return 0;
        var cp = require("child_process");
        var ret = cp.spawnSync(cmdstr, [], {
            shell: true,
            stdio: "inherit"
        });
        var _W_EXITCODE = function(ret, sig) {
            return ret << 8 | sig
        };
        if (ret.status === null) {
            var signalToNumber = function(sig) {
                switch (sig) {
                    case "SIGHUP":
                        return 1;
                    case "SIGINT":
                        return 2;
                    case "SIGQUIT":
                        return 3;
                    case "SIGFPE":
                        return 8;
                    case "SIGKILL":
                        return 9;
                    case "SIGALRM":
                        return 14;
                    case "SIGTERM":
                        return 15
                }
                return 2
            };
            return _W_EXITCODE(0, signalToNumber(ret.signal))
        }
        return _W_EXITCODE(ret.status, 0)
    }
    if (!command) return 0;
    setErrNo(6);
    return -1
}

function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret
    }
    return ret
}
var readAsmConstArgsArray = [];

function readAsmConstArgs(sigPtr, buf) {
    readAsmConstArgsArray.length = 0;
    var ch;
    buf >>= 2;
    while (ch = HEAPU8[sigPtr++]) {
        var double = ch < 105;
        if (double && buf & 1) buf++;
        readAsmConstArgsArray.push(double ? HEAPF64[buf++ >> 1] : HEAP32[buf]);
        ++buf
    }
    return readAsmConstArgsArray
}
var FSNode = function(parent, name, mode, rdev) {
    if (!parent) {
        parent = this
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: function() {
            return (this.mode & readMode) === readMode
        },
        set: function(val) {
            val ? this.mode |= readMode : this.mode &= ~readMode
        }
    },
    write: {
        get: function() {
            return (this.mode & writeMode) === writeMode
        },
        set: function(val) {
            val ? this.mode |= writeMode : this.mode &= ~writeMode
        }
    },
    isFolder: {
        get: function() {
            return FS.isDir(this.mode)
        }
    },
    isDevice: {
        get: function() {
            return FS.isChrdev(this.mode)
        }
    }
});
FS.FSNode = FSNode;
FS.staticInit();
Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
    Browser.requestFullscreen(lockPointer, resizeCanvas)
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
    Browser.requestAnimationFrame(func)
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
    Browser.setCanvasSize(width, height, noUpdates)
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
    Browser.mainLoop.pause()
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
    Browser.mainLoop.resume()
};
Module["getUserMedia"] = function Module_getUserMedia() {
    Browser.getUserMedia()
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
    return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes)
};
var GLctx;
for (var i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1)
}
var __miniTempWebGLIntBuffersStorage = new Int32Array(288);
for (var i = 0; i < 288; ++i) {
    __miniTempWebGLIntBuffers[i] = __miniTempWebGLIntBuffersStorage.subarray(0, i + 1)
}

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
__ATINIT__.push({
    func: function() {
        ___wasm_call_ctors()
    }
});
var asmLibraryArg = {
    "ti": _PokiSdkJs_AddParameterForURL,
    "si": _PokiSdkJs_CaptureError,
    "ri": _PokiSdkJs_CommercialBreak,
    "qi": _PokiSdkJs_GameplayStart,
    "pi": _PokiSdkJs_GameplayStop,
    "oi": _PokiSdkJs_GetURLParam,
    "ni": _PokiSdkJs_IsAdBlocked,
    "mi": _PokiSdkJs_RewardedBreak,
    "li": _PokiSdkJs_SetDebug,
    "ki": _PokiSdkJs_ShareableURL,
    "b": ___assert_fail,
    "ji": ___clock_gettime,
    "ii": ___gmtime_r,
    "hi": ___localtime_r,
    "fi": ___sys__newselect,
    "Yh": ___sys_dup2,
    "bi": ___sys_dup3,
    "j": ___sys_fcntl64,
    "Zh": ___sys_ioctl,
    "ci": ___sys_lstat64,
    "$h": ___sys_mkdir,
    "ca": ___sys_open,
    "ei": ___sys_poll,
    "ai": ___sys_rename,
    "_h": ___sys_rmdir,
    "k": ___sys_socketcall,
    "di": ___sys_stat64,
    "gi": ___sys_uname,
    "da": ___sys_unlink,
    "D": _abort,
    "Vh": _clock,
    "Uh": _difftime,
    "Th": _dmDeviceJSFreeBufferSlots,
    "Sh": _dmDeviceJSOpen,
    "Rh": _dmDeviceJSQueue,
    "Qh": _dmGetDeviceSampleRate,
    "Ph": _dmResZipRequestFileAsync,
    "Oh": _dmScriptHttpRequestAsync,
    "Nh": _dmSysGetApplicationPath,
    "Mh": _dmSysGetUserAgent,
    "Lh": _dmSysGetUserPersistentDataRoot,
    "Kh": _dmSysGetUserPreferredLanguage,
    "Jh": _dmSysOpenURL,
    "Q": _emscripten_asm_const_int,
    "Ih": _emscripten_cancel_main_loop,
    "Hh": _emscripten_glActiveTexture,
    "Gh": _emscripten_glAttachShader,
    "Fh": _emscripten_glBeginQuery,
    "Eh": _emscripten_glBeginQueryEXT,
    "Dh": _emscripten_glBeginTransformFeedback,
    "Ch": _emscripten_glBindAttribLocation,
    "Bh": _emscripten_glBindBuffer,
    "Ah": _emscripten_glBindBufferBase,
    "zh": _emscripten_glBindBufferRange,
    "yh": _emscripten_glBindFramebuffer,
    "xh": _emscripten_glBindRenderbuffer,
    "wh": _emscripten_glBindSampler,
    "vh": _emscripten_glBindTexture,
    "uh": _emscripten_glBindTransformFeedback,
    "th": _emscripten_glBindVertexArray,
    "sh": _emscripten_glBindVertexArrayOES,
    "rh": _emscripten_glBlendColor,
    "qh": _emscripten_glBlendEquation,
    "ph": _emscripten_glBlendEquationSeparate,
    "oh": _emscripten_glBlendFunc,
    "nh": _emscripten_glBlendFuncSeparate,
    "mh": _emscripten_glBlitFramebuffer,
    "lh": _emscripten_glBufferData,
    "kh": _emscripten_glBufferSubData,
    "jh": _emscripten_glCheckFramebufferStatus,
    "ih": _emscripten_glClear,
    "hh": _emscripten_glClearBufferfi,
    "gh": _emscripten_glClearBufferfv,
    "fh": _emscripten_glClearBufferiv,
    "eh": _emscripten_glClearBufferuiv,
    "dh": _emscripten_glClearColor,
    "ch": _emscripten_glClearDepthf,
    "bh": _emscripten_glClearStencil,
    "ah": _emscripten_glClientWaitSync,
    "$g": _emscripten_glColorMask,
    "_g": _emscripten_glCompileShader,
    "Zg": _emscripten_glCompressedTexImage2D,
    "Yg": _emscripten_glCompressedTexImage3D,
    "Xg": _emscripten_glCompressedTexSubImage2D,
    "Wg": _emscripten_glCompressedTexSubImage3D,
    "Vg": _emscripten_glCopyBufferSubData,
    "Ug": _emscripten_glCopyTexImage2D,
    "Tg": _emscripten_glCopyTexSubImage2D,
    "Sg": _emscripten_glCopyTexSubImage3D,
    "Rg": _emscripten_glCreateProgram,
    "Qg": _emscripten_glCreateShader,
    "Pg": _emscripten_glCullFace,
    "Og": _emscripten_glDeleteBuffers,
    "Ng": _emscripten_glDeleteFramebuffers,
    "Mg": _emscripten_glDeleteProgram,
    "Lg": _emscripten_glDeleteQueries,
    "Kg": _emscripten_glDeleteQueriesEXT,
    "Jg": _emscripten_glDeleteRenderbuffers,
    "Ig": _emscripten_glDeleteSamplers,
    "Hg": _emscripten_glDeleteShader,
    "Gg": _emscripten_glDeleteSync,
    "Fg": _emscripten_glDeleteTextures,
    "Eg": _emscripten_glDeleteTransformFeedbacks,
    "Dg": _emscripten_glDeleteVertexArrays,
    "Cg": _emscripten_glDeleteVertexArraysOES,
    "Bg": _emscripten_glDepthFunc,
    "Ag": _emscripten_glDepthMask,
    "zg": _emscripten_glDepthRangef,
    "yg": _emscripten_glDetachShader,
    "xg": _emscripten_glDisable,
    "wg": _emscripten_glDisableVertexAttribArray,
    "vg": _emscripten_glDrawArrays,
    "ug": _emscripten_glDrawArraysInstanced,
    "tg": _emscripten_glDrawArraysInstancedANGLE,
    "sg": _emscripten_glDrawArraysInstancedARB,
    "rg": _emscripten_glDrawArraysInstancedEXT,
    "qg": _emscripten_glDrawArraysInstancedNV,
    "pg": _emscripten_glDrawBuffers,
    "og": _emscripten_glDrawBuffersEXT,
    "ng": _emscripten_glDrawBuffersWEBGL,
    "mg": _emscripten_glDrawElements,
    "lg": _emscripten_glDrawElementsInstanced,
    "kg": _emscripten_glDrawElementsInstancedANGLE,
    "jg": _emscripten_glDrawElementsInstancedARB,
    "ig": _emscripten_glDrawElementsInstancedEXT,
    "hg": _emscripten_glDrawElementsInstancedNV,
    "gg": _emscripten_glDrawRangeElements,
    "fg": _emscripten_glEnable,
    "eg": _emscripten_glEnableVertexAttribArray,
    "dg": _emscripten_glEndQuery,
    "cg": _emscripten_glEndQueryEXT,
    "bg": _emscripten_glEndTransformFeedback,
    "ag": _emscripten_glFenceSync,
    "$f": _emscripten_glFinish,
    "_f": _emscripten_glFlush,
    "Zf": _emscripten_glFramebufferRenderbuffer,
    "Yf": _emscripten_glFramebufferTexture2D,
    "Xf": _emscripten_glFramebufferTextureLayer,
    "Wf": _emscripten_glFrontFace,
    "Vf": _emscripten_glGenBuffers,
    "Uf": _emscripten_glGenFramebuffers,
    "Tf": _emscripten_glGenQueries,
    "Sf": _emscripten_glGenQueriesEXT,
    "Rf": _emscripten_glGenRenderbuffers,
    "Qf": _emscripten_glGenSamplers,
    "Pf": _emscripten_glGenTextures,
    "Of": _emscripten_glGenTransformFeedbacks,
    "Nf": _emscripten_glGenVertexArrays,
    "Mf": _emscripten_glGenVertexArraysOES,
    "Lf": _emscripten_glGenerateMipmap,
    "Kf": _emscripten_glGetActiveAttrib,
    "Jf": _emscripten_glGetActiveUniform,
    "If": _emscripten_glGetActiveUniformBlockName,
    "Hf": _emscripten_glGetActiveUniformBlockiv,
    "Gf": _emscripten_glGetActiveUniformsiv,
    "Ff": _emscripten_glGetAttachedShaders,
    "Ef": _emscripten_glGetAttribLocation,
    "Df": _emscripten_glGetBooleanv,
    "Cf": _emscripten_glGetBufferParameteri64v,
    "Bf": _emscripten_glGetBufferParameteriv,
    "Af": _emscripten_glGetError,
    "zf": _emscripten_glGetFloatv,
    "yf": _emscripten_glGetFragDataLocation,
    "xf": _emscripten_glGetFramebufferAttachmentParameteriv,
    "wf": _emscripten_glGetInteger64i_v,
    "vf": _emscripten_glGetInteger64v,
    "uf": _emscripten_glGetIntegeri_v,
    "tf": _emscripten_glGetIntegerv,
    "sf": _emscripten_glGetInternalformativ,
    "rf": _emscripten_glGetProgramBinary,
    "qf": _emscripten_glGetProgramInfoLog,
    "pf": _emscripten_glGetProgramiv,
    "of": _emscripten_glGetQueryObjecti64vEXT,
    "nf": _emscripten_glGetQueryObjectivEXT,
    "mf": _emscripten_glGetQueryObjectui64vEXT,
    "lf": _emscripten_glGetQueryObjectuiv,
    "kf": _emscripten_glGetQueryObjectuivEXT,
    "jf": _emscripten_glGetQueryiv,
    "hf": _emscripten_glGetQueryivEXT,
    "gf": _emscripten_glGetRenderbufferParameteriv,
    "ff": _emscripten_glGetSamplerParameterfv,
    "ef": _emscripten_glGetSamplerParameteriv,
    "df": _emscripten_glGetShaderInfoLog,
    "cf": _emscripten_glGetShaderPrecisionFormat,
    "bf": _emscripten_glGetShaderSource,
    "af": _emscripten_glGetShaderiv,
    "$e": _emscripten_glGetString,
    "_e": _emscripten_glGetStringi,
    "Ze": _emscripten_glGetSynciv,
    "Ye": _emscripten_glGetTexParameterfv,
    "Xe": _emscripten_glGetTexParameteriv,
    "We": _emscripten_glGetTransformFeedbackVarying,
    "Ve": _emscripten_glGetUniformBlockIndex,
    "Ue": _emscripten_glGetUniformIndices,
    "Te": _emscripten_glGetUniformLocation,
    "Se": _emscripten_glGetUniformfv,
    "Re": _emscripten_glGetUniformiv,
    "Qe": _emscripten_glGetUniformuiv,
    "Pe": _emscripten_glGetVertexAttribIiv,
    "Oe": _emscripten_glGetVertexAttribIuiv,
    "Ne": _emscripten_glGetVertexAttribPointerv,
    "Me": _emscripten_glGetVertexAttribfv,
    "Le": _emscripten_glGetVertexAttribiv,
    "Ke": _emscripten_glHint,
    "Je": _emscripten_glInvalidateFramebuffer,
    "Ie": _emscripten_glInvalidateSubFramebuffer,
    "He": _emscripten_glIsBuffer,
    "Ge": _emscripten_glIsEnabled,
    "Fe": _emscripten_glIsFramebuffer,
    "Ee": _emscripten_glIsProgram,
    "De": _emscripten_glIsQuery,
    "Ce": _emscripten_glIsQueryEXT,
    "Be": _emscripten_glIsRenderbuffer,
    "Ae": _emscripten_glIsSampler,
    "ze": _emscripten_glIsShader,
    "ye": _emscripten_glIsSync,
    "xe": _emscripten_glIsTexture,
    "we": _emscripten_glIsTransformFeedback,
    "ve": _emscripten_glIsVertexArray,
    "ue": _emscripten_glIsVertexArrayOES,
    "te": _emscripten_glLineWidth,
    "se": _emscripten_glLinkProgram,
    "re": _emscripten_glPauseTransformFeedback,
    "qe": _emscripten_glPixelStorei,
    "pe": _emscripten_glPolygonOffset,
    "oe": _emscripten_glProgramBinary,
    "ne": _emscripten_glProgramParameteri,
    "me": _emscripten_glQueryCounterEXT,
    "le": _emscripten_glReadBuffer,
    "ke": _emscripten_glReadPixels,
    "je": _emscripten_glReleaseShaderCompiler,
    "ie": _emscripten_glRenderbufferStorage,
    "he": _emscripten_glRenderbufferStorageMultisample,
    "ge": _emscripten_glResumeTransformFeedback,
    "fe": _emscripten_glSampleCoverage,
    "ee": _emscripten_glSamplerParameterf,
    "de": _emscripten_glSamplerParameterfv,
    "ce": _emscripten_glSamplerParameteri,
    "be": _emscripten_glSamplerParameteriv,
    "ae": _emscripten_glScissor,
    "$d": _emscripten_glShaderBinary,
    "_d": _emscripten_glShaderSource,
    "Zd": _emscripten_glStencilFunc,
    "Yd": _emscripten_glStencilFuncSeparate,
    "Xd": _emscripten_glStencilMask,
    "Wd": _emscripten_glStencilMaskSeparate,
    "Vd": _emscripten_glStencilOp,
    "Ud": _emscripten_glStencilOpSeparate,
    "Td": _emscripten_glTexImage2D,
    "Sd": _emscripten_glTexImage3D,
    "Rd": _emscripten_glTexParameterf,
    "Qd": _emscripten_glTexParameterfv,
    "Pd": _emscripten_glTexParameteri,
    "Od": _emscripten_glTexParameteriv,
    "Nd": _emscripten_glTexStorage2D,
    "Md": _emscripten_glTexStorage3D,
    "Ld": _emscripten_glTexSubImage2D,
    "Kd": _emscripten_glTexSubImage3D,
    "Jd": _emscripten_glTransformFeedbackVaryings,
    "Id": _emscripten_glUniform1f,
    "Hd": _emscripten_glUniform1fv,
    "Gd": _emscripten_glUniform1i,
    "Fd": _emscripten_glUniform1iv,
    "Ed": _emscripten_glUniform1ui,
    "Dd": _emscripten_glUniform1uiv,
    "Cd": _emscripten_glUniform2f,
    "Bd": _emscripten_glUniform2fv,
    "Ad": _emscripten_glUniform2i,
    "zd": _emscripten_glUniform2iv,
    "yd": _emscripten_glUniform2ui,
    "xd": _emscripten_glUniform2uiv,
    "wd": _emscripten_glUniform3f,
    "vd": _emscripten_glUniform3fv,
    "ud": _emscripten_glUniform3i,
    "td": _emscripten_glUniform3iv,
    "sd": _emscripten_glUniform3ui,
    "rd": _emscripten_glUniform3uiv,
    "qd": _emscripten_glUniform4f,
    "pd": _emscripten_glUniform4fv,
    "od": _emscripten_glUniform4i,
    "nd": _emscripten_glUniform4iv,
    "md": _emscripten_glUniform4ui,
    "ld": _emscripten_glUniform4uiv,
    "kd": _emscripten_glUniformBlockBinding,
    "jd": _emscripten_glUniformMatrix2fv,
    "id": _emscripten_glUniformMatrix2x3fv,
    "hd": _emscripten_glUniformMatrix2x4fv,
    "gd": _emscripten_glUniformMatrix3fv,
    "fd": _emscripten_glUniformMatrix3x2fv,
    "ed": _emscripten_glUniformMatrix3x4fv,
    "dd": _emscripten_glUniformMatrix4fv,
    "cd": _emscripten_glUniformMatrix4x2fv,
    "bd": _emscripten_glUniformMatrix4x3fv,
    "ad": _emscripten_glUseProgram,
    "$c": _emscripten_glValidateProgram,
    "_c": _emscripten_glVertexAttrib1f,
    "Zc": _emscripten_glVertexAttrib1fv,
    "Yc": _emscripten_glVertexAttrib2f,
    "Xc": _emscripten_glVertexAttrib2fv,
    "Wc": _emscripten_glVertexAttrib3f,
    "Vc": _emscripten_glVertexAttrib3fv,
    "Uc": _emscripten_glVertexAttrib4f,
    "Tc": _emscripten_glVertexAttrib4fv,
    "Sc": _emscripten_glVertexAttribDivisor,
    "Rc": _emscripten_glVertexAttribDivisorANGLE,
    "Qc": _emscripten_glVertexAttribDivisorARB,
    "Pc": _emscripten_glVertexAttribDivisorEXT,
    "Oc": _emscripten_glVertexAttribDivisorNV,
    "Nc": _emscripten_glVertexAttribI4i,
    "Mc": _emscripten_glVertexAttribI4iv,
    "Lc": _emscripten_glVertexAttribI4ui,
    "Kc": _emscripten_glVertexAttribI4uiv,
    "Jc": _emscripten_glVertexAttribIPointer,
    "Ic": _emscripten_glVertexAttribPointer,
    "Hc": _emscripten_glViewport,
    "Gc": _emscripten_glWaitSync,
    "g": _emscripten_longjmp,
    "Fc": _emscripten_memcpy_big,
    "Ec": _emscripten_pause_main_loop,
    "Dc": _emscripten_resize_heap,
    "aa": _emscripten_set_main_loop_arg,
    "Cc": _emscripten_thread_sleep,
    "f": _emscripten_webgl_enable_extension,
    "Bc": _emscripten_webgl_get_current_context,
    "Xh": _environ_get,
    "Wh": _environ_sizes_get,
    "Ba": _exit,
    "E": _fd_close,
    "Ca": _fd_read,
    "Ka": _fd_seek,
    "ba": _fd_write,
    "C": _gai_strerror,
    "e": _getTempRet0,
    "w": _getaddrinfo,
    "Ac": _gethostbyaddr,
    "zc": _gethostbyname,
    "v": _getnameinfo,
    "r": _gettimeofday,
    "Aa": _glActiveTexture,
    "P": _glAttachShader,
    "i": _glBindBuffer,
    "$": _glBindFramebuffer,
    "B": _glBindRenderbuffer,
    "O": _glBindTexture,
    "yc": _glBlendFunc,
    "za": _glBufferData,
    "ya": _glBufferSubData,
    "_": _glCheckFramebufferStatus,
    "xc": _glClear,
    "wc": _glClearColor,
    "vc": _glClearDepthf,
    "uc": _glClearStencil,
    "tc": _glColorMask,
    "N": _glCompileShader,
    "q": _glCompressedTexImage2D,
    "p": _glCompressedTexSubImage2D,
    "xa": _glCreateProgram,
    "Z": _glCreateShader,
    "sc": _glCullFace,
    "wa": _glDeleteBuffers,
    "rc": _glDeleteFramebuffers,
    "M": _glDeleteProgram,
    "Y": _glDeleteRenderbuffers,
    "A": _glDeleteShader,
    "va": _glDeleteTextures,
    "qc": _glDepthFunc,
    "pc": _glDepthMask,
    "oc": _glDisable,
    "nc": _glDisableVertexAttribArray,
    "mc": _glDrawArrays,
    "lc": _glDrawElements,
    "kc": _glEnable,
    "ua": _glEnableVertexAttribArray,
    "jc": _glFlush,
    "X": _glFramebufferRenderbuffer,
    "ic": _glFramebufferTexture2D,
    "hc": _glFrontFace,
    "ta": _glGenBuffers,
    "gc": _glGenFramebuffers,
    "L": _glGenRenderbuffers,
    "fc": _glGenTextures,
    "ec": _glGetActiveUniform,
    "dc": _glGetAttribLocation,
    "c": _glGetError,
    "cc": _glGetFloatv,
    "z": _glGetIntegerv,
    "sa": _glGetProgramInfoLog,
    "y": _glGetProgramiv,
    "ra": _glGetShaderInfoLog,
    "K": _glGetShaderiv,
    "x": _glGetString,
    "bc": _glGetUniformLocation,
    "W": _glLinkProgram,
    "qa": _glPixelStorei,
    "ac": _glPolygonOffset,
    "$b": _glReadPixels,
    "V": _glRenderbufferStorage,
    "_b": _glScissor,
    "J": _glShaderSource,
    "Zb": _glStencilFunc,
    "Yb": _glStencilFuncSeparate,
    "Xb": _glStencilMask,
    "Wb": _glStencilOp,
    "Vb": _glStencilOpSeparate,
    "o": _glTexImage2D,
    "Ub": _glTexParameterf,
    "I": _glTexParameteri,
    "n": _glTexSubImage2D,
    "Tb": _glUniform1i,
    "Sb": _glUniform4fv,
    "Rb": _glUniformMatrix4fv,
    "pa": _glUseProgram,
    "oa": _glVertexAttribPointer,
    "Qb": _glViewport,
    "Pb": _glfwAccelerometerEnable,
    "Ob": _glfwCloseWindow,
    "Nb": _glfwDisable,
    "Mb": _glfwEnable,
    "Lb": _glfwGetAcceleration,
    "na": _glfwGetDefaultFramebuffer,
    "Kb": _glfwGetDisplayScaleFactor,
    "Jb": _glfwGetJoystickButtons,
    "Ib": _glfwGetJoystickDeviceId,
    "Hb": _glfwGetJoystickHats,
    "H": _glfwGetJoystickParam,
    "Gb": _glfwGetJoystickPos,
    "Fb": _glfwGetKey,
    "l": _glfwGetMouseButton,
    "Eb": _glfwGetMouseLocked,
    "Db": _glfwGetMousePos,
    "Cb": _glfwGetMouseWheel,
    "U": _glfwGetProcAddress,
    "Bb": _glfwGetWindowParam,
    "Ab": _glfwGetWindowRefreshRate,
    "ma": _glfwGetWindowSize,
    "zb": _glfwIconifyWindow,
    "yb": _glfwInitJS,
    "xb": _glfwOpenWindow,
    "T": _glfwOpenWindowHint,
    "wb": _glfwPollEvents,
    "vb": _glfwResetKeyboard,
    "ub": _glfwSetCharCallback,
    "tb": _glfwSetGamepadCallback,
    "sb": _glfwSetMarkedTextCallback,
    "rb": _glfwSetTouchCallback,
    "qb": _glfwSetWindowBackgroundColor,
    "pb": _glfwSetWindowCloseCallback,
    "ob": _glfwSetWindowFocusCallback,
    "nb": _glfwSetWindowIconifyCallback,
    "la": _glfwSetWindowSize,
    "mb": _glfwSetWindowSizeCallback,
    "ka": _glfwShowKeyboard,
    "lb": _glfwSwapBuffers,
    "ja": _glfwSwapInterval,
    "kb": _glfwTerminate,
    "jb": _gmtime_r,
    "u": invoke_ii,
    "G": invoke_iii,
    "S": invoke_iiii,
    "Ja": invoke_jii,
    "t": invoke_vi,
    "F": invoke_vii,
    "ia": invoke_viii,
    "h": invoke_viiii,
    "s": invoke_viiiii,
    "ib": _js_addBusinessEvent,
    "hb": _js_addDesignEvent,
    "gb": _js_addDesignEventWithValue,
    "fb": _js_addErrorEvent,
    "eb": _js_addProgressionEvent,
    "db": _js_addProgressionEventWithScore,
    "cb": _js_addResourceEvent,
    "bb": _js_configureAvailableCustomDimensions01,
    "ab": _js_configureAvailableCustomDimensions02,
    "$a": _js_configureAvailableCustomDimensions03,
    "_a": _js_configureAvailableResourceCurrencies,
    "Za": _js_configureAvailableResourceItemTypes,
    "Ya": _js_configureBuild,
    "Xa": _js_configureGameEngineVersion,
    "Wa": _js_configureSdkGameEngineVersion,
    "Va": _js_configureUserId,
    "Ua": _js_endSession,
    "Ta": _js_getRemoteConfigsContentAsString,
    "Sa": _js_getRemoteConfigsValueAsStringWithDefaultValue,
    "Ra": _js_initialize,
    "Qa": _js_isRemoteConfigsReady,
    "Pa": _js_setCustomDimension01,
    "Oa": _js_setCustomDimension02,
    "Na": _js_setCustomDimension03,
    "ha": _js_setEnabledInfoLog,
    "ga": _js_setEnabledVerboseLog,
    "fa": _js_setEventSubmission,
    "Ma": _js_setGlobalCustomEventFields,
    "ea": _js_setManualSessionHandling,
    "La": _js_startSession,
    "a": wasmMemory,
    "R": _mktime,
    "Ia": _pthread_create,
    "Ha": _pthread_join,
    "d": _setTempRet0,
    "Ga": _signal,
    "Fa": _strftime,
    "Ea": _sysconf,
    "Da": _system,
    "m": _time
};
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
    return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["vi"]).apply(null, arguments)
};
var _dmExportedSymbols = Module["_dmExportedSymbols"] = function() {
    return (_dmExportedSymbols = Module["_dmExportedSymbols"] = Module["asm"]["wi"]).apply(null, arguments)
};
var _main = Module["_main"] = function() {
    return (_main = Module["_main"] = Module["asm"]["xi"]).apply(null, arguments)
};
var _malloc = Module["_malloc"] = function() {
    return (_malloc = Module["_malloc"] = Module["asm"]["yi"]).apply(null, arguments)
};
var _free = Module["_free"] = function() {
    return (_free = Module["_free"] = Module["asm"]["zi"]).apply(null, arguments)
};
var _js_remote_configs_callback = Module["_js_remote_configs_callback"] = function() {
    return (_js_remote_configs_callback = Module["_js_remote_configs_callback"] = Module["asm"]["Ai"]).apply(null, arguments)
};
var _htonl = Module["_htonl"] = function() {
    return (_htonl = Module["_htonl"] = Module["asm"]["Bi"]).apply(null, arguments)
};
var _dmScript_Html5ReportOperationSuccess = Module["_dmScript_Html5ReportOperationSuccess"] = function() {
    return (_dmScript_Html5ReportOperationSuccess = Module["_dmScript_Html5ReportOperationSuccess"] = Module["asm"]["Ci"]).apply(null, arguments)
};
var _dmScript_RunInteractionCallback = Module["_dmScript_RunInteractionCallback"] = function() {
    return (_dmScript_RunInteractionCallback = Module["_dmScript_RunInteractionCallback"] = Module["asm"]["Di"]).apply(null, arguments)
};
var ___errno_location = Module["___errno_location"] = function() {
    return (___errno_location = Module["___errno_location"] = Module["asm"]["Ei"]).apply(null, arguments)
};
var _htons = Module["_htons"] = function() {
    return (_htons = Module["_htons"] = Module["asm"]["Fi"]).apply(null, arguments)
};
var _ntohs = Module["_ntohs"] = function() {
    return (_ntohs = Module["_ntohs"] = Module["asm"]["Gi"]).apply(null, arguments)
};
var _JSWriteDump = Module["_JSWriteDump"] = function() {
    return (_JSWriteDump = Module["_JSWriteDump"] = Module["asm"]["Hi"]).apply(null, arguments)
};
var __get_tzname = Module["__get_tzname"] = function() {
    return (__get_tzname = Module["__get_tzname"] = Module["asm"]["Ii"]).apply(null, arguments)
};
var __get_daylight = Module["__get_daylight"] = function() {
    return (__get_daylight = Module["__get_daylight"] = Module["asm"]["Ji"]).apply(null, arguments)
};
var __get_timezone = Module["__get_timezone"] = function() {
    return (__get_timezone = Module["__get_timezone"] = Module["asm"]["Ki"]).apply(null, arguments)
};
var stackSave = Module["stackSave"] = function() {
    return (stackSave = Module["stackSave"] = Module["asm"]["Li"]).apply(null, arguments)
};
var stackRestore = Module["stackRestore"] = function() {
    return (stackRestore = Module["stackRestore"] = Module["asm"]["Mi"]).apply(null, arguments)
};
var stackAlloc = Module["stackAlloc"] = function() {
    return (stackAlloc = Module["stackAlloc"] = Module["asm"]["Ni"]).apply(null, arguments)
};
var _setThrew = Module["_setThrew"] = function() {
    return (_setThrew = Module["_setThrew"] = Module["asm"]["Oi"]).apply(null, arguments)
};
var dynCall_jii = Module["dynCall_jii"] = function() {
    return (dynCall_jii = Module["dynCall_jii"] = Module["asm"]["Pi"]).apply(null, arguments)
};

function invoke_vii(index, a1, a2) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_ii(index, a1) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4, a5)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_viiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3, a4)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_iiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2, a3)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_iii(index, a1, a2) {
    var sp = stackSave();
    try {
        return wasmTable.get(index)(a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_viii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        wasmTable.get(index)(a1, a2, a3)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}

function invoke_jii(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_jii(index, a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
Module["ccall"] = ccall;
Module["UTF8ToString"] = UTF8ToString;
Module["stringToUTF8"] = stringToUTF8;
Module["stackTrace"] = stackTrace;
Module["writeStringToMemory"] = writeStringToMemory;
Module["writeArrayToMemory"] = writeArrayToMemory;
Module["callMain"] = callMain;
Module["stackTrace"] = stackTrace;
var calledRun;

function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller
};

function callMain(args) {
    var entryFunction = Module["_main"];
    args = args || [];
    var argc = args.length + 1;
    var argv = stackAlloc((argc + 1) * 4);
    HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram);
    for (var i = 1; i < argc; i++) {
        HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1])
    }
    HEAP32[(argv >> 2) + argc] = 0;
    try {
        var ret = entryFunction(argc, argv);
        exit(ret, true)
    } catch (e) {
        if (e instanceof ExitStatus) {
            return
        } else if (e == "unwind") {
            noExitRuntime = true;
            return
        } else {
            var toLog = e;
            if (e && typeof e === "object" && e.stack) {
                toLog = [e, e.stack]
            }
            err("exception thrown: " + toLog);
            quit_(1, e)
        }
    } finally {
        calledMain = true
    }
}

function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) return;

    function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (shouldRunNow) callMain(args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
            setTimeout(function() {
                Module["setStatus"]("")
            }, 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
}
Module["run"] = run;

function exit(status, implicit) {
    if (implicit && noExitRuntime && status === 0) {
        return
    }
    if (noExitRuntime) {} else {
        EXITSTATUS = status;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status);
        ABORT = true
    }
    quit_(status, new ExitStatus(status))
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) shouldRunNow = false;
noExitRuntime = true;
run();