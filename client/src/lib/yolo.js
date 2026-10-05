export function processYoloOutput(
    output,
    imgWidth,
    imgHeight,
    inputSize = 640,
    confThreshold = 0.5,
    iouThreshold = 0.45,
) {
    // Dynamically calculate numAnchors based on inputSize (640 -> 25200, 320 -> 6300)
    const s1 = (inputSize / 8) * (inputSize / 8);
    const s2 = (inputSize / 16) * (inputSize / 16);
    const s3 = (inputSize / 32) * (inputSize / 32);
    const numAnchors = (s1 + s2 + s3) * 3;
    const numFeatures = Math.floor(output.length / numAnchors);
    const numClasses = numFeatures - 5;

    let boxes = [];

    for (let i = 0; i < numAnchors; i++) {
        const offset = i * numFeatures;
        const objectness = output[offset + 4];

        if (objectness < confThreshold) continue;

        // Find class with max score
        let maxClassScore = 0;
        let classId = -1;
        for (let c = 0; c < numClasses; c++) {
            const score = output[offset + 5 + c];
            if (score > maxClassScore) {
                maxClassScore = score;
                classId = c;
            }
        }

        const confidence = objectness * maxClassScore;
        if (confidence > confThreshold) {
            const xc = output[offset + 0];
            const yc = output[offset + 1];
            const w = output[offset + 2];
            const h = output[offset + 3];

            // Un-Letterbox: converting from padded space back to original image space
            const scale = Math.min(inputSize / imgWidth, inputSize / imgHeight);
            const padX = (inputSize - imgWidth * scale) / 2;
            const padY = (inputSize - imgHeight * scale) / 2;

            const origXc = (xc - padX) / scale;
            const origYc = (yc - padY) / scale;
            const origW = w / scale;
            const origH = h / scale;

            const x1 = origXc - origW / 2;
            const y1 = origYc - origH / 2;
            const x2 = origXc + origW / 2;
            const y2 = origYc + origH / 2;

            boxes.push({
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                w: x2 - x1,
                h: y2 - y1,
                confidence: confidence,
                classId: classId,
            });
        }
    }

    // Non-Maximum Suppression (NMS)
    boxes = boxes.sort((a, b) => b.confidence - a.confidence);
    const result = [];

    while (boxes.length > 0) {
        const current = boxes[0];
        result.push(current);

        boxes = boxes.filter((box, index) => {
            if (index === 0) return false;
            const iou = calculateIoU(current, box);
            return iou < iouThreshold;
        });
    }

    return result;
}

function calculateIoU(box1, box2) {
    const x1 = Math.max(box1.x1, box2.x1);
    const y1 = Math.max(box1.y1, box2.y1);
    const x2 = Math.min(box1.x2, box2.x2);
    const y2 = Math.min(box1.y2, box2.y2);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const box1Area = box1.w * box1.h;
    const box2Area = box2.w * box2.h;

    const unionArea = box1Area + box2Area - intersectionArea;

    if (unionArea === 0) return 0;
    return intersectionArea / unionArea;
}
