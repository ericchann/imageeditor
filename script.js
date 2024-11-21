// script.js

const imageInput = document.getElementById('imageInput');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const vibranceSlider = document.getElementById('vibrance');
const saturationSlider = document.getElementById('saturation');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');
const exampleBtn = document.getElementById('exampleBtn');
const toggleBtn = document.getElementById('toggleBtn');

let originalImageData = null;
let currentImageData = null;
let isShowingOriginal = false;

// Initialize Web Worker
let worker;
try {
    worker = new Worker('worker.js');
} catch (error) {
    console.error('Failed to initialize Web Worker:', error);
}

if (worker) {
    worker.onmessage = function (e) {
        // Update canvas with the processed image data
        try {
            ctx.putImageData(e.data, 0, 0);
            currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (error) {
            console.error('Error updating canvas with processed image data:', error);
        }
    };

    worker.onerror = function (e) {
        console.error(`Worker error: ${e.message} on line ${e.lineno}`);
    };
}

// Clamp values between 0 and 255
function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

// Resize canvas for large images
function resizeCanvas(image) {
    const maxWidth = 1000;
    const scale = Math.min(1, maxWidth / image.width);
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    currentImageData = originalImageData; // Initialize currentImageData
}

// Load and display an image
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = new Image();
            image.src = e.target.result;

            image.onload = () => {
                resizeCanvas(image);
                resetSliders();
            };
            image.onerror = () => {
                alert('Failed to load the selected image. Please try another file.');
            };
        };
        reader.readAsDataURL(file);
    }
});

// Load an example image
exampleBtn.addEventListener('click', () => {
    const exampleImageSrc = 'Monitor-Calibration.jpg'; // Ensure this path is correct
    const image = new Image();
    image.src = exampleImageSrc;

    image.onload = () => {
        resizeCanvas(image);
        resetSliders();
    };
    image.onerror = () => {
        alert('Failed to load the example image. Please check the file path.');
    };
});

// Apply adjustments using Web Worker
function applyAdjustments() {
    if (originalImageData && worker) {
        const adjustments = {
            brightness: parseInt(brightnessSlider.value, 10),
            contrast: parseInt(contrastSlider.value, 10),
            vibrance: parseInt(vibranceSlider.value, 10),
            saturation: parseInt(saturationSlider.value, 10),
        };

        // Debugging: Log adjustments
        console.log('Applying adjustments:', adjustments);

        worker.postMessage({ imageData: originalImageData, adjustments });
    }
}

// Reset slider to its default value on double click
function resetSliderToMiddle(event) {
    event.target.value = 0;
    applyAdjustments();
}

// Reset all sliders to default (0)
function resetSliders() {
    [brightnessSlider, contrastSlider, vibranceSlider, saturationSlider].forEach(slider => {
        slider.value = 0;
    });
    applyAdjustments();
}

// Debounce function to limit the rate of adjustments
function debounce(func, delay) {
    let debounceTimer;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Event listeners for sliders with debounce to optimize performance
const debouncedApplyAdjustments = debounce(applyAdjustments, 100);

[brightnessSlider, contrastSlider, vibranceSlider, saturationSlider].forEach((slider) => {
    slider.addEventListener('input', debouncedApplyAdjustments);
    slider.addEventListener('dblclick', resetSliderToMiddle);
});

// Toggle between original and adjusted image
toggleBtn.addEventListener('click', () => {
    if (!originalImageData) return;

    if (isShowingOriginal) {
        ctx.putImageData(currentImageData, 0, 0);
        toggleBtn.textContent = 'Before';
    } else {
        ctx.putImageData(originalImageData, 0, 0);
        toggleBtn.textContent = 'After';
    }

    isShowingOriginal = !isShowingOriginal;
});

// Download the edited image
downloadBtn.addEventListener('click', () => {
    if (!currentImageData) {
        alert('No image to download.');
        return;
    }

    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL();
    link.click();
});
