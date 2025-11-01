from flask import Flask, jsonify
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/api/geojson", methods=["GET"])
def get_pipes():
    with open("data/CSTPOS.json") as f:
        data = json.load(f)
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)
