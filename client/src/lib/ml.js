import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class MLService {
  constructor() {
    this.handLandmarker = null;
    this.isReady = false;
    this.isInitializing = false;
    this.yoloWorker = null;
    this.inferenceResolve = null;
    this.isInferencing = false;
  }

  async init() {
    console.log("[MLService] init() called");
    if (this.isReady) {
        console.log("[MLService] Already ready. Returning.");
        return;
    }
    
    if (this.isInitializing) {
        console.log("[MLService] Already initializing. Waiting for previous call to finish...");
        // Wait until initialization finishes before returning
        return new Promise((resolve) => {
            let attempts = 0;
            const check = setInterval(() => {
                if (this.isReady || !this.isInitializing) {
                    clearInterval(check);
                    resolve();
                }
                if (++attempts > 150) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }
    this.isInitializing = true;
    console.log("Initializing ML models...");
    
    
    // 2. Init YOLO Model via WebWorker
    try {
      console.log("[MLService] Starting YOLO Worker initialization...");
      this.yoloWorker = new Worker(new URL('./yoloWorker.js', import.meta.url), { type: 'module' });
      this.yoloWorker.onerror = (err) => {
          console.error("[MLService] YOLO Worker native error:", err.message);
      };
      
      this.yoloWorker.onmessage = (e) => {
        const { type, boxes, error } = e.data;
        if (type === 'INIT_DONE') {
            console.log("YOLO WebWorker loaded (WASM).");
            this.isReady = true;
            this.isInitializing = false;
        } else if (type === 'INFERENCE_DONE') {
            console.log("[MLService] Received INFERENCE_DONE, boxes:", boxes);
            if (this.inferenceResolve) this.inferenceResolve(boxes);
            this.inferenceResolve = null;
            this.isInferencing = false;
        } else if (type === 'ERROR') {
            console.error("YOLO Worker Error:", error);
            if (this.inferenceResolve) this.inferenceResolve(null);
            this.inferenceResolve = null;
            this.isInferencing = false;
        }
      };

      this.yoloWorker.postMessage({ type: 'INIT' });

      console.log("[MLService] YOLO Worker sent INIT. Waiting for INIT_DONE...");
      // Wait for initialization with timeout
      await new Promise((resolve, reject) => {
          let attempts = 0;
          const checkReady = setInterval(() => {
              if (this.isReady) {
                  clearInterval(checkReady);
                  resolve();
              }
              if (++attempts > 100) { // 10 seconds timeout
                  clearInterval(checkReady);
                  reject(new Error("YOLO Worker initialization timeout"));
              }
          }, 100);
      });
    } catch (e) {
      console.warn("YOLO Worker load failed:", e);
      this.isInitializing = false;
    }
  }

  detectHands(video, timestamp) {
    if (!this.handLandmarker) return null;
    return this.handLandmarker.detectForVideo(video, timestamp);
  }

  async detectBlocks(videoElement) {
    if (!this.isReady || this.isInferencing) return null;
    if (!this.yoloWorker) return null;
    
    this.isInferencing = true;
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
        this.isInferencing = false;
        return null;
    }


    // Create a temporary canvas to resize image to 320x320 (WITH LETTERBOXING)
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Fill background with grey (standard YOLO padding)
    ctx.fillStyle = '#747474';
    ctx.fillRect(0, 0, 320, 320);
    
    const imgW = videoElement.videoWidth;
    const imgH = videoElement.videoHeight;
    const scale = Math.min(320 / imgW, 320 / imgH);
    const newW = imgW * scale;
    const newH = imgH * scale;
    const dx = (320 - newW) / 2;
    const dy = (320 - newH) / 2;
    
    ctx.drawImage(videoElement, dx, dy, newW, newH);
    
    const imageData = ctx.getImageData(0, 0, 320, 320);
    const data = imageData.data;
    
    // Convert to planar [C, H, W] and normalize to 0-1
    const tensorData = new Float32Array(3 * 320 * 320);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      tensorData[j] = data[i] / 255.0; // R
      tensorData[j + 320 * 320] = data[i + 1] / 255.0; // G
      tensorData[j + 2 * 320 * 320] = data[i + 2] / 255.0; // B
    }
    
    return new Promise((resolve) => {
      this.inferenceResolve = resolve;
      this.yoloWorker.postMessage({ 
          type: 'INFERENCE', 
          payload: { 
              tensorData, 
              width: videoElement.videoWidth, 
              height: videoElement.videoHeight 
          }
      }, [tensorData.buffer]); // Transfer buffer to avoid heavy copying!
    });
  }
}

export const mlService = new MLService();
