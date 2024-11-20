from flask import Flask, request, send_file
from PIL import Image, ImageEnhance
import io

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_image():
    try:
        if 'image' not in request.files:
            return "No file uploaded.", 400

        image_file = request.files['image']
        image = Image.open(image_file)

        # Darken the image
        enhancer = ImageEnhance.Brightness(image)
        darkened_image = enhancer.enhance(0.8)

        # Save the processed image to an in-memory buffer
        img_io = io.BytesIO()
        darkened_image.save(img_io, format="PNG")
        img_io.seek(0)

        return send_file(
            img_io,
            mimetype="image/png",
            as_attachment=False
        )
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True)
