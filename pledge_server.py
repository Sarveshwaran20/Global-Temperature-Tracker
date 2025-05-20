from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

DATA_FILE = 'pledge_vote_data.json'

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            return data
    # Default structure
    return {
        'pledge_count': 0,
        'user_pledged': [],
        'votes': {option: 0 for option in vote_options},
        'voted_users': []
    }

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

# Load persistent data
persisted = load_data()
pledge_data = {"count": persisted['pledge_count']}
user_pledged = set(persisted['user_pledged'])
vote_options = ["Renewable Energy", "Reforestation", "Reduce Emissions"]
vote_data = persisted['votes']
voted_users = set(persisted['voted_users'])

@app.route('/get_pledge', methods=['GET'])
def get_pledge():
    return jsonify({"count": pledge_data["count"]})

@app.route('/take_pledge', methods=['POST'])
def take_pledge():
    user_ip = request.remote_addr
    if user_ip not in user_pledged:
        pledge_data["count"] += 1
        user_pledged.add(user_ip)
        # Save
        persisted['pledge_count'] = pledge_data['count']
        persisted['user_pledged'] = list(user_pledged)
        save_data(persisted)
    return jsonify({"count": pledge_data["count"]})

@app.route('/reset_pledge', methods=['POST'])
def reset_pledge():
    pledge_data["count"] = 0
    user_pledged.clear()
    persisted['pledge_count'] = 0
    persisted['user_pledged'] = []
    save_data(persisted)
    return jsonify({"count": pledge_data["count"]})

@app.route('/get_votes', methods=['GET'])
def get_votes():
    return jsonify(vote_data)

@app.route('/vote', methods=['POST'])
def vote():
    user_ip = request.remote_addr
    if user_ip in voted_users:
        return jsonify(vote_data)
    data = request.get_json()
    option = data.get('option')
    if option in vote_data:
        vote_data[option] += 1
        voted_users.add(user_ip)
        # Save
        persisted['votes'] = vote_data
        persisted['voted_users'] = list(voted_users)
        save_data(persisted)
    return jsonify(vote_data)

@app.route('/reset_votes', methods=['POST'])
def reset_votes():
    for option in vote_data:
        vote_data[option] = 0
    voted_users.clear()
    persisted['votes'] = vote_data
    persisted['voted_users'] = []
    save_data(persisted)
    return jsonify(vote_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)