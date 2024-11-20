from flask import Flask, request, send_file
from PIL import Image, ImageEnhance
import io

app = Flask(__name__)

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <body>
        <h2>Upload an image to darken it:</h2>
        <form action="/process" method="post" enctype="multipart/form-data">
            <input type="file" name="image" accept="image/*">
            <button type="submit">Submit</button>
        </form>
    </body>
    </html>
    '''

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
        img_io.seek(0)  # Move cursor to the beginning of the buffer

        # Provide the image as a downloadable file
        return send_file(
            img_io,
            mimetype="image/png",
            as_attachment=True,
            download_name="darkened_image.png"
        )
    except Exception as e:
        return f"An error occurred: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True)
