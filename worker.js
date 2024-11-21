self.onmessage = function (e) {
    const { imageData, adjustments } = e.data;
    const data = new Uint8ClampedArray(imageData.data);

    const brightness = adjustments.brightness / 100;
    const contrast = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
    const vibrance = adjustments.vibrance / 100;
    const saturation = adjustments.saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness and Contrast
        r = clamp(contrast * (r - 128) + 128 + brightness * 255);
        g = clamp(contrast * (g - 128) + 128 + brightness * 255);
        b = clamp(contrast * (b - 128) + 128 + brightness * 255);

        // Vibrance
        const max = Math.max(r, g, b);
        const avg = (r + g + b) / 3;
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
    }

    self.postMessage(new ImageData(data, imageData.width, imageData.height));
};

function clamp(value) {
    return Math.max(0, Math.min(255, value));
}
