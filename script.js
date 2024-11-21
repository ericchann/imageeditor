const imageInput = document.getElementById('imageInput');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');
const exampleBtn = document.getElementById('exampleBtn');

let originalImageData = null;

// Load and display the image
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = new Image();
            image.src = e.target.result;

            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                // Save the original image data for adjustments
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            };
        };
        reader.readAsDataURL(file);
    }
});

// Load the example photo
exampleBtn.addEventListener('click', () => {
    const exampleImageSrc = 'Monitor-Calibration.jpg'; // Replace with the path to your photo in the repo
    const image = new Image();
    image.src = exampleImageSrc;

    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Save the original image data for adjustments
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };

    image.onerror = () => {
        alert('Failed to load the example image. Please check the file path.');
    };
});

// Apply brightness and contrast adjustments
function applyAdjustments() {
    if (originalImageData) {
        const brightness = parseInt(brightnessSlider.value, 10);
        const contrast = parseInt(contrastSlider.value, 10);

        const adjustedImageData = adjustBrightnessAndContrast(originalImageData, brightness, contrast);
        ctx.putImageData(adjustedImageData, 0, 0);
    }
}

// Adjust brightness and contrast
function adjustBrightnessAndContrast(imageData, brightness, contrast) {
    const data = new Uint8ClampedArray(imageData.data);
    const brightnessFactor = brightness / 100; // Handles negative and positive values
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(contrastFactor * (data[i] - 128) + 128 + brightnessFactor * 255); // Red
        data[i + 1] = clamp(contrastFactor * (data[i + 1] - 128) + 128 + brightnessFactor * 255); // Green
        data[i + 2] = clamp(contrastFactor * (data[i + 2] - 128) + 128 + brightnessFactor * 255); // Blue
    }

    return new ImageData(data, imageData.width, imageData.height);
}

const toneCurveCanvas = document.getElementById('toneCurveCanvas');
const toneCtx = toneCurveCanvas.getContext('2d');

// Default tone curve points (linear line)
let toneCurvePoints = [
    { x: 0, y: 200 },  // Shadows
    { x: 150, y: 100 }, // Midtones
    { x: 300, y: 0 }    // Highlights
];

// Draw the tone curve
function drawToneCurve() {
    toneCtx.clearRect(0, 0, toneCurveCanvas.width, toneCurveCanvas.height);

    // Draw background grid
    toneCtx.strokeStyle = '#555';
    toneCtx.lineWidth = 1;
    for (let i = 50; i < toneCurveCanvas.width; i += 50) {
        toneCtx.beginPath();
        toneCtx.moveTo(i, 0);
        toneCtx.lineTo(i, toneCurveCanvas.height);
        toneCtx.stroke();
    }
    for (let i = 50; i < toneCurveCanvas.height; i += 50) {
        toneCtx.beginPath();
        toneCtx.moveTo(0, i);
        toneCtx.lineTo(toneCurveCanvas.width, i);
        toneCtx.stroke();
    }

    // Draw tone curve
    toneCtx.strokeStyle = '#007bff';
    toneCtx.lineWidth = 2;
    toneCtx.beginPath();
    toneCtx.moveTo(toneCurvePoints[0].x, toneCurvePoints[0].y);
    for (let i = 1; i < toneCurvePoints.length; i++) {
        toneCtx.lineTo(toneCurvePoints[i].x, toneCurvePoints[i].y);
    }
    toneCtx.stroke();

    // Draw draggable points
    toneCtx.fillStyle = '#fff';
    toneCurvePoints.forEach((point) => {
        toneCtx.beginPath();
        toneCtx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        toneCtx.fill();
    });
}

// Adjust the tone curve based on user input
toneCurveCanvas.addEventListener('mousedown', (event) => {
    const rect = toneCurveCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if the click is near an existing point
    let draggingPoint = null;
    for (const point of toneCurvePoints) {
        if (Math.hypot(point.x - mouseX, point.y - mouseY) < 10) {
            draggingPoint = point;
            break;
        }
    }

    if (draggingPoint) {
        const onMouseMove = (moveEvent) => {
            const moveX = moveEvent.clientX - rect.left;
            const moveY = moveEvent.clientY - rect.top;

            // Update point position (constrain within bounds)
            draggingPoint.x = Math.max(0, Math.min(toneCurveCanvas.width, moveX));
            draggingPoint.y = Math.max(0, Math.min(toneCurveCanvas.height, moveY));

            drawToneCurve();
        };

        const onMouseUp = () => {
            toneCurveCanvas.removeEventListener('mousemove', onMouseMove);
            toneCurveCanvas.removeEventListener('mouseup', onMouseUp);
            applyToneCurve(); // Apply tone curve after dragging
        };

        toneCurveCanvas.addEventListener('mousemove', onMouseMove);
        toneCurveCanvas.addEventListener('mouseup', onMouseUp);
    }
});

// Map tone curve adjustments to image
function applyToneCurve() {
    if (!originalImageData) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Create a tone curve mapping
    const curveMapping = createToneCurveMapping();

    // Apply tone curve
    for (let i = 0; i < data.length; i += 4) {
        data[i] = curveMapping[data[i]];     // Red
        data[i + 1] = curveMapping[data[i + 1]]; // Green
        data[i + 2] = curveMapping[data[i + 2]]; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    currentImageData = imageData; // Update adjusted state
}

// Create a tone curve mapping (256 -> 256 values)
function createToneCurveMapping() {
    const mapping = new Uint8Array(256);

    for (let i = 0; i < 256; i++) {
        const inputX = (i / 255) * toneCurveCanvas.width;
        let outputY = toneCurveCanvas.height;

        // Interpolate output value from the tone curve
        for (let j = 0; j < toneCurvePoints.length - 1; j++) {
            const p1 = toneCurvePoints[j];
            const p2 = toneCurvePoints[j + 1];

            if (inputX >= p1.x && inputX <= p2.x) {
                const t = (inputX - p1.x) / (p2.x - p1.x); // Linear interpolation factor
                outputY = p1.y * (1 - t) + p2.y * t;
                break;
            }
        }

        mapping[i] = 255 - (outputY / toneCurveCanvas.height) * 255;
    }

    return mapping;
}

// Initialize tone curve
drawToneCurve();

const vibranceSlider = document.getElementById('vibrance');
const saturationSlider = document.getElementById('saturation');

// Adjust vibrance
function adjustVibrance(imageData, vibrance) {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = vibrance / 100;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate average and max RGB values
        const avg = (r + g + b) / 3;
        const max = Math.max(r, g, b);

        // Adjust vibrance for muted colors (based on the difference from the max)
        data[i] += (max - r) * factor;     // Red
        data[i + 1] += (max - g) * factor; // Green
        data[i + 2] += (max - b) * factor; // Blue
    }

    return new ImageData(data, imageData.width, imageData.height);
}

// Adjust saturation
function adjustSaturation(imageData, saturation) {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert RGB to grayscale
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;

        // Apply saturation adjustment
        data[i] = gray + (r - gray) * (1 + factor); // Red
        data[i + 1] = gray + (g - gray) * (1 + factor); // Green
        data[i + 2] = gray + (b - gray) * (1 + factor); // Blue
    }

    return new ImageData(data, imageData.width, imageData.height);
}

// Add event listeners for vibrance and saturation sliders
vibranceSlider.addEventListener('input', applyAdjustments);
saturationSlider.addEventListener('input', applyAdjustments);

vibranceSlider.addEventListener('dblclick', resetSliderToMiddle);
saturationSlider.addEventListener('dblclick', resetSliderToMiddle);











// Clamp pixel values to [0, 255]
function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

// Reset sliders on double click
function resetSliderToMiddle(event) {
    event.target.value = 0; // Reset slider value to 0
    applyAdjustments(); // Apply the reset adjustment
}

const toggleBtn = document.getElementById('toggleBtn');
let isShowingOriginal = false; // Start by showing the edited image

// Toggle between original and edited image
toggleBtn.addEventListener('click', () => {
    if (!originalImageData) {
        alert('No image loaded to compare.');
        return;
    }

    if (isShowingOriginal) {
        // Show the edited image
        if (currentImageData) {
            ctx.putImageData(currentImageData, 0, 0);
            toggleBtn.textContent = 'Before';
        }
    } else {
        // Show the original image
        ctx.putImageData(originalImageData, 0, 0);
        toggleBtn.textContent = 'After';
    }

    isShowingOriginal = !isShowingOriginal; // Toggle the state
});

// Store a backup of the current image after adjustments
let currentImageData = null;

// Apply adjustments and save the current state
function applyAdjustments() {
    if (originalImageData) {
        const brightness = parseInt(brightnessSlider.value, 10);
        const contrast = parseInt(contrastSlider.value, 10);
        const vibrance = parseInt(vibranceSlider.value, 10);
        const saturation = parseInt(saturationSlider.value, 10);

        // Start with the original image data
        let adjustedImageData = new ImageData(
            new Uint8ClampedArray(originalImageData.data),
            originalImageData.width,
            originalImageData.height
        );

        // Apply each adjustment in sequence
        adjustedImageData = adjustBrightnessAndContrast(adjustedImageData, brightness, contrast);
        adjustedImageData = adjustVibrance(adjustedImageData, vibrance);
        adjustedImageData = adjustSaturation(adjustedImageData, saturation);

        // Update the canvas with the final result
        ctx.putImageData(adjustedImageData, 0, 0);

        // Save the adjusted state
        currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Reset toggle state
        isShowingOriginal = false;
        toggleBtn.textContent = 'Before';
    }
}




// Event listeners for sliders
brightnessSlider.addEventListener('input', applyAdjustments);
contrastSlider.addEventListener('input', applyAdjustments);

brightnessSlider.addEventListener('dblclick', resetSliderToMiddle);
contrastSlider.addEventListener('dblclick', resetSliderToMiddle);

// Download the edited image
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL();
    link.click();
});
