from PIL import Image, ImageEnhance
import os
from flask import Flask, request, send_file


app = Flask(__name__)

# Directory to save processed images
OUTPUT_DIR = os.path.join(os.getcwd(), "static")
os.makedirs(OUTPUT_DIR, exist_ok=True)

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
    if 'image' not in request.files:
        return "No file uploaded.", 400
    
    image_file = request.files['image']
    image = Image.open(image_file)

    # Darken the image
    enhancer = ImageEnhance.Brightness(image)
    darkened_image = enhancer.enhance(0.3)  # Adjust this factor to control darkness

    # Save the processed image
    output_path = os.path.join(OUTPUT_DIR, "darkened_image.png")
    print(f"Saving image to: {output_path}")
    darkened_image.save(output_path)

    # Provide the processed image as a download
    return f'''
    <!DOCTYPE html>
    <html>
    <body>
        <h2>Image successfully darkened!</h2>
        <img src="/{output_path}" alt="Darkened Image">
        <br><br>
        <a href="/{output_path}" download>Download the image</a>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(debug=True)
