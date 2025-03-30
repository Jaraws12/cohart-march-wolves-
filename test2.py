import tensorflow as tf

# Load the saved model
model = tf.keras.models.load_model("best_model69.keras")

# Display model summary
#model.summary()

model_json = model.to_json()

# Save JSON to a file
with open("model.json", "w") as json_file:
    json_file.write(model_json)

print("Model architecture saved as model.json")

