from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# In-memory storage (use a database for production)
pledge_data = {
    "count": 0
}
user_pledged = set()  # Track users by IP (for demo purposes)

@app.route('/get_pledge', methods=['GET'])
def get_pledge():
    return jsonify({"count": pledge_data["count"]})

@app.route('/take_pledge', methods=['POST'])
def take_pledge():
    user_ip = request.remote_addr
    if user_ip not in user_pledged:
        pledge_data["count"] += 1
        user_pledged.add(user_ip)
    return jsonify({"count": pledge_data["count"]})

@app.route('/reset_pledge', methods=['POST'])
def reset_pledge():
    pledge_data["count"] = 0
    user_pledged.clear()
    return jsonify({"count": pledge_data["count"]})

# --- Voting System (in-memory, demo only) ---
vote_options = ["Renewable Energy", "Reforestation", "Reduce Emissions"]
vote_data = {option: 0 for option in vote_options}
voted_users = set()  # Track users by IP (for demo purposes)

@app.route('/get_votes', methods=['GET'])
def get_votes():
    return jsonify(vote_data)

@app.route('/vote', methods=['POST'])
def vote():
    user_ip = request.remote_addr
    if user_ip in voted_users:
        # User already voted, return current state
        return jsonify(vote_data)
    data = request.get_json()
    option = data.get('option')
    if option in vote_data:
        vote_data[option] += 1
        voted_users.add(user_ip)
    return jsonify(vote_data)

@app.route('/reset_votes', methods=['POST'])
def reset_votes():
    for option in vote_data:
        vote_data[option] = 0
    voted_users.clear()
    return jsonify(vote_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)