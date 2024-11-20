const imageInput = document.getElementById('imageInput');
const brightnessSlider = document.getElementById('brightness');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

let image = new Image();
let originalImageData = null;

// Load image to canvas
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

// Adjust brightness
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
        data[i] = data[i] * factor;     // Red
        data[i + 1] = data[i + 1] * factor; // Green
        data[i + 2] = data[i + 2] * factor; // Blue
    }

    return new ImageData(data, imageData.width, imageData.height);
}

// Download Edited Image
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = canvas.toDataURL();
    link.click();
});
