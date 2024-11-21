// worker.js

// Clamp function defined before it's used
function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

self.onmessage = function (e) {
    const { imageData, adjustments } = e.data;
    const data = new Uint8ClampedArray(imageData.data); // Create a copy to avoid modifying original data

    // Extract adjustment values
    const brightness = adjustments.brightness; // Range: -100 to +100
    const contrast = adjustments.contrast;     // Range: -100 to +100
    const vibrance = adjustments.vibrance;     // Range: 0 to +100
    const saturation = adjustments.saturation; // Range: 0 to +100

    // Calculate contrast factor
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    // Scale vibrance and saturation to 0-1
    const vibranceFactor = vibrance / 100;
    const saturationFactor = saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply Brightness
        r = clamp(r + brightness);
        g = clamp(g + brightness);
        b = clamp(b + brightness);

        // Apply Contrast
        r = clamp(contrastFactor * (r - 128) + 128);
        g = clamp(contrastFactor * (g - 128) + 128);
        b = clamp(contrastFactor * (b - 128) + 128);

        // Apply Vibrance
        const max = Math.max(r, g, b);
        // Avoid division by zero for average
        const avg = (r + g + b) / 3 || 1;
        r += (max - r) * vibranceFactor;
        g += (max - g) * vibranceFactor;
        b += (max - b) * vibranceFactor;

        // Apply Saturation
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = clamp(gray + (r - gray) * (1 + saturationFactor));
        g = clamp(gray + (g - gray) * (1 + saturationFactor));
        b = clamp(gray + (b - gray) * (1 + saturationFactor));

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // Alpha channel remains unchanged (data[i + 3])
    }

    // Post the processed image data back to the main thread
    self.postMessage(new ImageData(data, imageData.width, imageData.height));
};
