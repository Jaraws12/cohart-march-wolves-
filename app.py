# from flask import Flask, request, jsonify
# import tensorflow as tf
# import numpy as np

# app = Flask(__name__)

# # Load your trained Keras model
# model = tf.keras.models.load_model("best_model69.keras")

# @app.route("/adminsubmit", methods=["POST"])
# def predict():
#     try:
#         data = request.json["input"]  # Expecting JSON with key "input"
#         data = np.array(data).reshape(1, -1)  # Reshape if necessary
#         prediction = model.predict(data).tolist()  # Convert NumPy output to list
        
#         return jsonify({"prediction": prediction})  # Send result as JSON
#     except Exception as e:
#         return jsonify({"error": str(e)})

# if __name__ == "__main__":
#     app.run(port=5001)  # Runs on port 5001
from flask import Flask, request, jsonify, render_template
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
import os
from flask_cors import CORS
from python_files.data_transformation import DataTransformation
from test import MongoReader
mongoreader = MongoReader('mongodb://localhost:27017/Usersf')
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes if your frontend runs on a different port

# Load the ML model
MODEL_PATH = 'best_model49.keras'

def load_model():
    try:
        with open(MODEL_PATH, 'rb') as model_file:
            model = tf.keras.load(model_file)
        print("Model loaded successfully")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

model = load_model()

# Frontend routes (assuming you already have these)
@app.route('/')
def home():
    return render_template('index.html')

# API endpoint to get predictions from the model
@app.route('/adminsubmit', methods=['POST'])
def predict():
    try:
        data = mongoreader.df_creator_from_mongo()
        # data = request.json
        # data = pd.read_json(data)
        
        # Preprocess input data - adjust this based on your model requirements
        input_features = preprocess_input(data)
        
        # Make prediction
        prediction = model.predict(input_features)
        
        # Format the response
        result = {
            'prediction': prediction.tolist(),
            'status': 'success'
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

def preprocess_input(data):
    """
    Preprocess the input data for the model.
    Modify according to your model's requirements.
    """
    # Example: Convert dict to numpy array for model input
    # Assuming data is a dict with feature names as keys
    try:
        data_transform = DataTransformation(data)
        df = data_transform.encode_features()
        
        # For more complex preprocessing:
        # df = pd.DataFrame([data])
        # processed_data = your_preprocessing_function(df)
        # return processed_data
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        raise

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
