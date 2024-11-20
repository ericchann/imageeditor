import { decode } from 'raw-to-js'; // Use this if using a bundler like Webpack. Omit this line if using a CDN.

// HTML Elements
const imageInput = document.getElementById('imageInput');
const brightnessSlider = document.getElementById('brightness');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

let originalImageData = null;

// Supported RAW formats (extend as needed)
const rawExtensions = ['.cr2', '.nef', '.arw', '.orf', '.raf', '.dng'];

// Event Listener: File Upload
imageInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if the file is a RAW file
    if (isRAWFile(file)) {
        try {
            const buffer = await file.arrayBuffer(); // Read RAW file as array buffer
            const rawImage = decode(new Uint8Array(buffer)); // Decode RAW file
            const { width, height, data } = rawImage.preview || rawImage;

            // Draw the RAW image on the canvas
            canvas.width = width;
            canvas.height = height;

            const imageData = new ImageData(new Uint8ClampedArray(data), width, height);
            ctx.putImageData(imageData, 0, 0);

            // Save the original image data for further processing
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (error) {
            console.error('Error processing RAW file:', error);
            alert('Failed to process the RAW file. Please try another file.');
        }
    } else {
        // Fallback for standard images (JPEG/PNG)
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = new Image();
            image.src = e.target.result;

            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                // Save the original image data for further processing
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            };
        };
        reader.readAsDataURL(file);
    }
});

// Check if file is RAW
function isRAWFile(file) {
    return rawExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

// Adjust Brightness
brightnessSlider.addEventListener('input', () => {
    if (originalImageData) {
        const brightness = brightnessSlider.value;
        const adjustedImageData = adjustBrightness(originalImageData, brightness);
        ctx.putImageData(adjustedImageData, 0, 0);
    }
});

function adjustBrightness(imageData, brightness) {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = brightness / 100;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(data[i] * factor);     // Red
        data[i + 1] = clamp(data[i + 1] * factor); // Green
        data[i + 2] = clamp(data[i + 2] * factor); // Blue
    }

    return new ImageData(data, imageData.width, imageData.height);
}

// Clamp pixel values to [0, 255]
function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

// Download Edited Image
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL();
    link.click();
});
