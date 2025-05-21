from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sqlite3

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

DB_FILE = 'pledge_vote_data.db'
vote_options = ["Renewable Energy", "Reforestation", "Reduce Emissions"]

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Pledge table
    c.execute('''CREATE TABLE IF NOT EXISTS pledge (
        id INTEGER PRIMARY KEY, count INTEGER DEFAULT 0
    )''')
    c.execute('''INSERT OR IGNORE INTO pledge (id, count) VALUES (1, 0)''')
    # User pledged table
    c.execute('''CREATE TABLE IF NOT EXISTS user_pledged (
        ip TEXT PRIMARY KEY
    )''')
    # Votes table
    c.execute('''CREATE TABLE IF NOT EXISTS votes (
        option TEXT PRIMARY KEY, count INTEGER DEFAULT 0
    )''')
    for option in vote_options:
        c.execute('''INSERT OR IGNORE INTO votes (option, count) VALUES (?, 0)''', (option,))
    # Voted users table
    c.execute('''CREATE TABLE IF NOT EXISTS voted_users (
        ip TEXT PRIMARY KEY
    )''')
    conn.commit()
    conn.close()

init_db()

def get_pledge_count():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT count FROM pledge WHERE id=1')
    count = c.fetchone()[0]
    conn.close()
    return count

def set_pledge_count(count):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('UPDATE pledge SET count=? WHERE id=1', (count,))
    conn.commit()
    conn.close()

def add_user_pledged(ip):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT OR IGNORE INTO user_pledged (ip) VALUES (?)', (ip,))
    conn.commit()
    conn.close()

def clear_user_pledged():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('DELETE FROM user_pledged')
    conn.commit()
    conn.close()

def has_user_pledged(ip):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT 1 FROM user_pledged WHERE ip=?', (ip,))
    result = c.fetchone()
    conn.close()
    return result is not None

def get_votes():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT option, count FROM votes')
    votes = {row[0]: row[1] for row in c.fetchall()}
    conn.close()
    return votes

def add_vote(option):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('UPDATE votes SET count = count + 1 WHERE option=?', (option,))
    conn.commit()
    conn.close()

def reset_votes():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('UPDATE votes SET count=0')
    c.execute('DELETE FROM voted_users')
    conn.commit()
    conn.close()

def add_voted_user(ip):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT OR IGNORE INTO voted_users (ip) VALUES (?)', (ip,))
    conn.commit()
    conn.close()

def has_voted(ip):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT 1 FROM voted_users WHERE ip=?', (ip,))
    result = c.fetchone()
    conn.close()
    return result is not None

def reset_pledge():
    set_pledge_count(0)
    clear_user_pledged()

@app.route('/')
def index():
    return "Global Temperature Tracker API is running. See /get_pledge, /get_votes, etc.", 200

@app.route('/get_pledge', methods=['GET'])
def get_pledge():
    return jsonify({"count": get_pledge_count()})

@app.route('/has_pledged', methods=['GET'])
def has_pledged_route():
    user_ip = request.remote_addr
    return jsonify({"has_pledged": has_user_pledged(user_ip)})

@app.route('/take_pledge', methods=['POST'])
def take_pledge():
    user_ip = request.remote_addr
    if not has_user_pledged(user_ip):
        count = get_pledge_count() + 1
        set_pledge_count(count)
        add_user_pledged(user_ip)
        return jsonify({"success": True, "count": get_pledge_count()})
    else:
        return jsonify({"success": False, "count": get_pledge_count()})

@app.route('/reset_pledge', methods=['POST'])
def reset_pledge_route():
    reset_pledge()
    return jsonify({"count": get_pledge_count()})

@app.route('/get_votes', methods=['GET'])
def get_votes_route():
    return jsonify(get_votes())

@app.route('/vote', methods=['POST'])
def vote():
    user_ip = request.remote_addr
    if has_voted(user_ip):
        return jsonify(get_votes())
    data = request.get_json()
    option = data.get('option')
    if option in vote_options:
        add_vote(option)
        add_voted_user(user_ip)
    return jsonify(get_votes())

@app.route('/reset_votes', methods=['POST'])
def reset_votes_route():
    reset_votes()
    return jsonify(get_votes())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)