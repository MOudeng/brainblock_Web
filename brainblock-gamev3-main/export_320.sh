#!/bin/bash
set -e  # Hentikan script jika ada error

# Install onnxscript yang dibutuhkan oleh PyTorch terbaru
pip3 install onnxscript --break-system-packages

# Pindah ke direktori yolov5
cd brainblock-gamev3-main/MODEL/yolov5

# Jalankan export.py
python3 export.py \
    --weights ../exp7/weights/best.pt \
    --imgsz 320 320 \
    --include onnx \
    --opset 12

echo ""
echo "=========================================================="
echo "Menyalin ke folder public..."
cp ../exp7/weights/best.onnx ../../../client/public/assets/best_320.onnx
echo "Selesai! best_320.onnx sudah siap di client/public/assets/"
echo "=========================================================="
