from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import threading

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# PostgreSQL connection setup
PG_CONN_STR = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5432/pledgedb')

def get_db_conn():
    return psycopg2.connect(PG_CONN_STR, cursor_factory=RealDictCursor)

vote_options = ["Renewable Energy", "Reforestation", "Reduce Emissions"]
lock = threading.Lock()

# Initialize DB tables (PostgreSQL)
def init_db():
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS pledge (
        id SERIAL PRIMARY KEY, count INTEGER DEFAULT 0
    )''')
    c.execute('''INSERT INTO pledge (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING''')
    c.execute('''CREATE TABLE IF NOT EXISTS user_pledged (
        user_id TEXT PRIMARY KEY
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS votes (
        option TEXT PRIMARY KEY, count INTEGER DEFAULT 0
    )''')
    for option in vote_options:
        c.execute('''INSERT INTO votes (option, count) VALUES (%s, 0) ON CONFLICT (option) DO NOTHING''', (option,))
    c.execute('''CREATE TABLE IF NOT EXISTS voted_users (
        user_id TEXT PRIMARY KEY
    )''')
    conn.commit()
    conn.close()

init_db()

# --- DB Utility Functions ---
def get_pledge_count():
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('SELECT count FROM pledge WHERE id=1')
    count = c.fetchone()['count']
    conn.close()
    return count

def set_pledge_count(count):
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('UPDATE pledge SET count=%s WHERE id=1', (count,))
    conn.commit()
    conn.close()

def add_user_pledged(user_id):
    if not user_id:
        return
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('INSERT INTO user_pledged (user_id) VALUES (%s) ON CONFLICT (user_id) DO NOTHING', (user_id,))
    conn.commit()
    conn.close()

def clear_user_pledged():
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('DELETE FROM user_pledged')
    conn.commit()
    conn.close()

def has_user_pledged(user_id):
    if not user_id:
        return False
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('SELECT 1 FROM user_pledged WHERE user_id=%s', (user_id,))
    result = c.fetchone()
    conn.close()
    return result is not None

def get_votes():
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('SELECT option, count FROM votes')
    votes = {row['option']: row['count'] for row in c.fetchall()}
    conn.close()
    return votes

def add_vote(option):
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('UPDATE votes SET count = count + 1 WHERE option=%s', (option,))
    conn.commit()
    conn.close()

def reset_votes():
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('UPDATE votes SET count=0')
    c.execute('DELETE FROM voted_users')
    conn.commit()
    conn.close()

def add_voted_user(user_id):
    if not user_id:
        return
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('INSERT INTO voted_users (user_id) VALUES (%s) ON CONFLICT (user_id) DO NOTHING', (user_id,))
    conn.commit()
    conn.close()

def has_voted(user_id):
    if not user_id:
        return False
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('SELECT 1 FROM voted_users WHERE user_id=%s', (user_id,))
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
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    return jsonify({"has_pledged": has_user_pledged(user_id)})

@app.route('/take_pledge', methods=['POST'])
def take_pledge():
    data = request.get_json()
    user_id = data.get('user_id') if data else None
    if not user_id:
        return jsonify({"success": False, "error": "Missing user_id"}), 400
    if not has_user_pledged(user_id):
        count = get_pledge_count() + 1
        set_pledge_count(count)
        add_user_pledged(user_id)
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
    data = request.get_json()
    user_id = data.get('user_id') if data else None
    option = data.get('option') if data else None
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    if has_voted(user_id):
        return jsonify(get_votes())
    if option in vote_options:
        add_vote(option)
        add_voted_user(user_id)
    return jsonify(get_votes())

@app.route('/reset_votes', methods=['POST'])
def reset_votes_route():
    reset_votes()
    return jsonify(get_votes())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)