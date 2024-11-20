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
    const exampleImageSrc = 'IMG_1879.JPG'; // Replace with the path to your photo in the repo
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
    const brightnessFactor = brightness / 100; // Now handles negative values
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(contrastFactor * (data[i] - 128) + 128 + brightnessFactor * 255); // Red
        data[i + 1] = clamp(contrastFactor * (data[i + 1] - 128) + 128 + brightnessFactor * 255); // Green
        data[i + 2] = clamp(contrastFactor * (data[i + 2] - 128) + 128 + brightnessFactor * 255); // Blue
    }

    return new ImageData(data, imageData.width, imageData.height);
}

// Add reset-to-middle functionality for sliders
function resetSliderToMiddle(slider) {
    slider.value = 0; // Reset slider value to 0 (middle)
    applyAdjustments(); // Apply the reset adjustment
}

// Event listeners for brightness slider
brightnessSlider.addEventListener('input', applyAdjustments);

brightnessSlider.addEventListener('dblclick', () => resetSliderToMiddle(brightnessSlider));

// Event listeners for contrast slider
contrastSlider.addEventListener('input', applyAdjustments);

contrastSlider.addEventListener('dblclick', () => resetSliderToMiddle(contrastSlider));


// Clamp pixel values to [0, 255]
function clamp(value) {
    return Math.max(0, Math.min(255, value));
}

// Event listeners for sliders
brightnessSlider.addEventListener('input', applyAdjustments);
contrastSlider.addEventListener('input', applyAdjustments);

// Download the edited image
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL();
    link.click();
});
