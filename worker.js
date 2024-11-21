// Clamp function defined before it's used
function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

self.onmessage = function (e) {
    const { imageData, adjustments } = e.data;
    const data = new Uint8ClampedArray(imageData.data);

    // Adjust the scaling factors appropriately
    const brightness = adjustments.brightness; // Assuming range -100 to +100
    const contrast = adjustments.contrast;     // Assuming range -100 to +100
    const vibrance = adjustments.vibrance / 100; // Scale to 0-1
    const saturation = adjustments.saturation / 100; // Scale to 0-1

    // Precompute contrast factor
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness and Contrast
        r = clamp(contrastFactor * (r - 128) + 128 + brightness);
        g = clamp(contrastFactor * (g - 128) + 128 + brightness);
        b = clamp(contrastFactor * (b - 128) + 128 + brightness);

        // Vibrance
        const max = Math.max(r, g, b);
        // Avoid division by zero for average
        const avg = (r + g + b) / 3 || 1;
        r += (max - r) * vibrance;
        g += (max - g) * vibrance;
        b += (max - b) * vibrance;

        // Saturation
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + (r - gray) * (1 + saturation);
        g = gray + (g - gray) * (1 + saturation);
        b = gray + (b - gray) * (1 + saturation);

        data[i] = clamp(r);
        data[i + 1] = clamp(g);
        data[i + 2] = clamp(b);
        // Alpha channel remains unchanged (data[i + 3])
    }

    // Post the processed image data back to the main thread
    self.postMessage(new ImageData(data, imageData.width, imageData.height));
};
