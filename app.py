from flask import Flask, request, send_file
from PIL import Image, ImageEnhance
import io
import base64

app = Flask(__name__)

# In-memory storage for images (cleared after each request cycle)
image_storage = {}

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Image Darkener</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin: 0;
                padding: 0;
                background-color: #f4f4f9;
                color: #333;
            }
            h2 {
                margin-top: 20px;
                color: #555;
            }
            form {
                margin: 20px auto;
                padding: 20px;
                border: 1px solid #ddd;
                background-color: #fff;
                border-radius: 10px;
                display: inline-block;
            }
            input[type="file"] {
                margin-bottom: 15px;
            }
            button {
                padding: 10px 20px;
                font-size: 16px;
                color: #fff;
                background-color: #007bff;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            button:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <h2>Upload an Image to Darken It</h2>
        <form action="/process" method="post" enctype="multipart/form-data">
            <input type="file" name="image" accept="image/*" required>
            <br>
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

        # Resize the image for display (maintaining aspect ratio)
        max_width = 500  # Maximum width in pixels
        width_percent = max_width / float(darkened_image.width)
        new_height = int(float(darkened_image.height) * float(width_percent))
        resized_image = darkened_image.resize((max_width, new_height))

        # Save the processed image to an in-memory buffer for download
        img_io = io.BytesIO()
        darkened_image.save(img_io, format="PNG")
        img_io.seek(0)  # Move cursor to the beginning of the buffer

        # Store the image data in global memory with a unique key
        global image_storage
        image_id = "current_image"
        image_storage[image_id] = img_io

        # Convert image to base64 for inline display
        img_base64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
        img_data_url = f"data:image/png;base64,{img_base64}"

        # Render the HTML with the preview and download button
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Image Darkener</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f9;
                    color: #333;
                }}
                h2 {{
                    margin-top: 20px;
                    color: #555;
                }}
                img {{
                    max-width: 500px;
                    height: auto;
                    margin: 20px auto;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }}
                a button {{
                    padding: 10px 20px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #28a745;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                }}
                a button:hover {{
                    background-color: #218838;
                }}
            </style>
        </head>
        <body>
            <h2>Your Darkened Image</h2>
            <img src="{img_data_url}" alt="Darkened Image">
            <br>
            <a href="/download">
                <button>Download Image</button>
            </a>
        </body>
        </html>
        '''
    except Exception as e:
        return f"An error occurred: {str(e)}", 500

@app.route('/download')
def download_image():
    try:
        # Retrieve the image data from in-memory storage
        global image_storage
        image_id = "current_image"

        if image_id not in image_storage:
            return "No image to download.", 400

        img_io = image_storage.pop(image_id)  # Remove it after retrieving
        img_io.seek(0)
        return send_file(
            img_io,
            mimetype="image/jpeg",
            as_attachment=True,
            download_name="darkened_image.jpeg"
        )
    except Exception as e:
        return f"An error occurred: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True)
