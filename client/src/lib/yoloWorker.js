import * as ort from "onnxruntime-web";
import { processYoloOutput } from "./yolo.js";

let session = null;

// Gunakan wasm lokal untuk mencegah hang saat tidak ada internet
// Dapatkan absolute URL dari yoloWorker.js ini berada
const workerScriptUrl = new URL(import.meta.url);
const workerDir = workerScriptUrl.pathname.substring(0, workerScriptUrl.pathname.lastIndexOf('/') + 1);
// Deteksi lingkungan Dev vs Prod (mengakomodasi bug import.meta di WebWorker Vite)
const isDev = import.meta.env.DEV || self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";
ort.env.wasm.wasmPaths = isDev ? workerDir : "/onnx/";
ort.env.wasm.numThreads = navigator.hardwareConcurrency ? Math.min(4, Math.ceil(navigator.hardwareConcurrency / 2)) : 1;
console.log("[YOLOWorker] Setting wasmPaths to:", ort.env.wasm.wasmPaths, "Threads:", ort.env.wasm.numThreads);

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    if (type === "INIT") {
        console.log("[YOLOWorker] Received INIT message");
        try {
            if (!session) {
                console.log("[YOLOWorker] Creating ONNX session with /assets/best_320.onnx ...");
                // Initialize session
                session = await ort.InferenceSession.create(
                    "/assets/best_320.onnx",
                    {
                        executionProviders: ["webgpu", "webgl", "wasm"],
                        graphOptimizationLevel: 'all',
                    },
                );
                console.log("[YOLOWorker] ONNX session created successfully");
            }
            self.postMessage({ type: "INIT_DONE" });
        } catch (err) {
            console.error("[YOLOWorker] Initialization error:", err);
            self.postMessage({ type: "ERROR", error: err.message });
        }
    } else if (type === "INFERENCE") {
        if (!session) return;

        const { tensorData, width, height } = payload;

        try {
            const tensor = new ort.Tensor(
                "float32",
                tensorData,
                [1, 3, 320, 320],
            );
            const results = await session.run({ images: tensor });
            const output = results[session.outputNames[0]].data;

            // Proses output di dalam worker untuk hemat beban main thread
            const boxes = processYoloOutput(output, width, height, 320, 0.65, 0.30);
            console.log(`[YOLOWorker] Inference complete. Found ${boxes.length} boxes.`);

            self.postMessage({ type: "INFERENCE_DONE", boxes });
        } catch (err) {
            self.postMessage({ type: "ERROR", error: err.message });
        }
    }
};
