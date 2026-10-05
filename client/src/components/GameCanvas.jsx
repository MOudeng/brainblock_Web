import React, { useEffect, useRef, useState } from "react";
import { sortBlocksForComparison } from "@/lib/gameLogic";
import { mlService } from "@/lib/ml";

export function GameCanvas({
    videoElement,
    targetPattern,
    onPatternMatch,
    isDetectionPaused,
}) {
    const canvasRef = useRef(null);
    const [mlReady, setMlReady] = useState(false);
    const [mlError, setMlError] = useState("");

    const targetPatternRef = useRef(targetPattern);
    const onPatternMatchRef = useRef(onPatternMatch);
    const isDetectionPausedRef = useRef(isDetectionPaused);
    const detectionBuffer = useRef([]);
    const BUFFER_SIZE = 7;
    const MIN_AGREEMENT = 4;

    useEffect(() => {
        targetPatternRef.current = targetPattern;
        onPatternMatchRef.current = onPatternMatch;
        isDetectionPausedRef.current = isDetectionPaused;
    }, [targetPattern, onPatternMatch, isDetectionPaused]);

    // Initialize YOLO ML Service (Web Worker)
    useEffect(() => {
        let active = true;
        const init = async () => {
            try {
                await mlService.init();
                if (active) {
                    if (mlService.isReady) {
                        setMlReady(true);
                    } else {
                        setMlError("Gagal inisialisasi AI YOLO. Periksa console.");
                    }
                }
            } catch (err) {
                console.error("Gagal memuat ML Service:", err);
                if (active) setMlError(err.message);
            }
        };
        init();
        return () => { active = false; };
    }, []);

    // Main Detection Loop
    useEffect(() => {
        if (!mlReady || !videoElement) return;

        let isRunning = true;
        let animationFrameId;
        let aiTimeoutId;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        
        // Cache boxes and matching state for the render loop
        let currentBoxes = [];
        let isMatched = false;

        // Hidden canvas to resize and crop bounding boxes to 100x100
        const boxCanvas = document.createElement("canvas");
        boxCanvas.width = 100;
        boxCanvas.height = 100;
        const boxCtx = boxCanvas.getContext("2d", { willReadFrequently: true });

        const getGray = (data, cx, cy) => {
            let sum = 0, count = 0;
            for (let y = cy - 5; y < cy + 5; y++) {
                for (let x = cx - 5; x < cx + 5; x++) {
                    const idx = (y * 100 + x) * 4;
                    if (idx >= 0 && idx < data.length) {
                        sum += (data[idx] * 0.299 + data[idx+1] * 0.587 + data[idx+2] * 0.114);
                        count++;
                    }
                }
            }
            return count > 0 ? sum / count : 0;
        };

        // --- RENDER LOOP (60 FPS) ---
        // Hanya menggambar video dan kotak dari memori, TANPA AWAIT
        const renderLoop = () => {
            if (!isRunning) return;

            if (videoElement.readyState >= 2) {
                const w = videoElement.videoWidth;
                const h = videoElement.videoHeight;
                if (canvas.width !== w) canvas.width = w;
                if (canvas.height !== h) canvas.height = h;

                // Gambar video asli dengan sangat mulus
                ctx.drawImage(videoElement, 0, 0, w, h);

                // Gambar hasil AI terakhir
                currentBoxes.forEach(box => {
                    ctx.strokeStyle = box.face > 0 ? '#00FF00' : '#FF0000';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(box.x, box.y, box.w, box.h);
                    
                    ctx.fillStyle = box.face > 0 ? '#00FF00' : '#FF0000';
                    ctx.font = "bold 24px Arial";
                    ctx.fillText(`F${box.face}`, box.x, box.y - 8);
                });

                // Efek visual jika cocok
                if (isMatched) {
                    ctx.strokeStyle = '#00FFFF';
                    ctx.lineWidth = 10;
                    ctx.strokeRect(0, 0, w, h);
                }
            }
            
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        // --- AI LOOP (Berjalan di background sesuai kecepatan PC) ---
        const aiLoop = async () => {
            if (!isRunning || isDetectionPausedRef.current || videoElement.readyState < 2) {
                if (isRunning) aiTimeoutId = setTimeout(aiLoop, 100);
                return;
            }

            try {
                const boxes = await mlService.detectBlocks(videoElement);
                
                if (boxes && isRunning) {
                    const facesFound = [];
                    const w = videoElement.videoWidth;
                    const h = videoElement.videoHeight;
                    
                    // Supaya boxCtx bisa mengambil gambar, kita ambil dari hidden canvas
                    // Tetapi untuk optimasi, kita gambar frame saat ini ke canvas rahasia
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = w;
                    tempCanvas.height = h;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(videoElement, 0, 0, w, h);

                    boxes.forEach(box => {
                        const bx = Math.max(0, box.x1);
                        const by = Math.max(0, box.y1);
                        const bw = Math.min(w - bx, box.w);
                        const bh = Math.min(h - by, box.h);
                        
                        const minBoxSize = Math.min(w, h) * 0.08;
                        if (bw > minBoxSize && bh > minBoxSize && bw < w * 0.8 && bh < h * 0.8) {
                            boxCtx.drawImage(tempCanvas, bx, by, bw, bh, 0, 0, 100, 100);
                            const boxData = boxCtx.getImageData(0,0,100,100).data;
                            
                            // Geser titik sampling lebih ke tengah (dari 25/75 menjadi 35/65)
                            // Ini membuat deteksi warna kebal terhadap bounding box YOLO yang meleset/terlalu lebar akibat bayangan pinggir
                            const top = getGray(boxData, 50, 35) > 120 ? 255 : 0;
                            const right = getGray(boxData, 65, 50) > 120 ? 255 : 0;
                            const bottom = getGray(boxData, 50, 65) > 120 ? 255 : 0;
                            const left = getGray(boxData, 35, 50) > 120 ? 255 : 0;

                            let face = 0;
                            if (top===0 && right===0 && bottom===0 && left===0) face = 1;
                            else if (top===255 && right===255 && bottom===255 && left===255) face = 2;
                            else if (top===0 && right===0 && bottom===255 && left===255) face = 3;
                            else if (top===255 && right===0 && bottom===0 && left===255) face = 4;
                            else if (top===255 && right===255 && bottom===0 && left===0) face = 5;
                            else if (top===0 && right===255 && bottom===255 && left===0) face = 6;
                            
                            facesFound.push({ x: bx, y: by, w: bw, h: bh, face });
                        }
                    });

                    // Update memori untuk Render Loop
                    currentBoxes = facesFound;

                    const validFaces = facesFound.filter(f => f.face > 0);

                    if (validFaces.length >= 4 && targetPatternRef.current?.length === 4) {
                        // Ambil 4 teratas (karena YOLO sudah mengurutkan berdasarkan confidence dari awal)
                        const top4Faces = validFaces.slice(0, 4);
                        const sortedFaces = sortBlocksForComparison(top4Faces);
                        
                        const buf = detectionBuffer.current;
                        buf.push(sortedFaces.join(","));
                        if (buf.length > BUFFER_SIZE) buf.shift();

                        if (buf.length >= MIN_AGREEMENT) {
                            const counts = {};
                            buf.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
                            const [bestPattern, bestCount] = Object.entries(counts).reduce((best, entry) => entry[1] > best[1] ? entry : best, ["", 0]);

                            if (bestCount >= MIN_AGREEMENT) {
                                const stablePattern = bestPattern.split(",").map(Number);
                                const isMatch = stablePattern.every((f, i) => f === targetPatternRef.current[i]);
                                
                                if (isMatch) {
                                    isMatched = true;
                                    if (onPatternMatchRef.current) onPatternMatchRef.current();
                                } else {
                                    isMatched = false;
                                }
                            } else {
                                isMatched = false;
                            }
                        }
                    } else {
                        // Jangan bersihkan buffer secara drastis jika ada frame yang terlewat
                        // Biarkan buffer bergeser secara natural agar tidak rentan terhadap flickering (jitter)
                        const buf = detectionBuffer.current;
                        buf.push("none");
                        if (buf.length > BUFFER_SIZE) buf.shift();
                        isMatched = false;
                    }
                }
            } catch (err) {
                console.warn("AI Loop error:", err);
            }
            
            // Lanjut ke frame AI berikutnya tanpa ngeblok render loop
            if (isRunning) aiTimeoutId = setTimeout(aiLoop, 0);
        };

        // Start both loops
        renderLoop();
        aiLoop();

        return () => { 
            isRunning = false; 
            cancelAnimationFrame(animationFrameId);
            clearTimeout(aiTimeoutId);
        };
    }, [mlReady, videoElement]);

    return (
        <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
            {!mlReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-50 space-y-4">
                    {mlError ? (
                        <>
                            <div className="h-12 w-12 border-4 border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold">!</div>
                            <p className="text-lg font-semibold text-red-400">Error: {mlError}</p>
                            <p className="text-xs text-slate-400">Silakan muat ulang halaman atau periksa file log</p>
                        </>
                    ) : (
                        <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
                            <p className="text-lg font-semibold animate-pulse">Memuat Visi AI YOLO (Web Worker)...</p>
                            <p className="text-xs text-slate-400">Harap tunggu sebentar</p>
                        </>
                    )}
                </div>
            )}
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>
    );
}
