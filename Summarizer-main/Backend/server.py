from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import mysql.connector
import bcrypt
from mysql.connector import Error
from flask_cors import CORS
from transformers import pipeline
import traceback
from flask_mail import Mail, Message
from datetime import timedelta

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'ab#123Uty'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=2)
jwt = JWTManager(app)

# Flask-Mail Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'enter ur email '  # Replace with your email
app.config['MAIL_PASSWORD'] = 'app password'  

mail = Mail(app)

# MySQL Database connection function
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="sahil@786",
            database="summary"
        )
        return connection
    except Error as e:
        print("Database Connection Failed:", str(e))
        return None

# Function to send email
def send_email(to_email, summary, meet_id):
    try:
        print(f"Sending email to: {to_email}")  # Debugging
        msg = Message("Your Generated Summary",
                      sender="",
                      recipients=[to_email])
        msg.body = f"Hello,\n\nYour summary (Meeting ID: {meet_id}) has been generated:\n\n{summary}\n\nThank you!"
        mail.send(msg)
        print("Email sent successfully!")  # Debugging
    except Exception as e:
        print("Email sending failed:", str(e))


# **Protect pages: Ensure only registered users can access them**
def is_user_registered(email):
    connection = get_db_connection()
    if not connection:
        return False

    cursor = connection.cursor()
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    connection.close()
    
    return user is not None

# **Protected Route Middleware**
def protected_route():
    current_user = get_jwt_identity()
    if not is_user_registered(current_user):
        return jsonify({"msg": "Unauthorized: Please register first"}), 401

# User Registration
@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"msg": "Missing fields"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    connection = get_db_connection()
    if not connection:
        return jsonify({"msg": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({"msg": "User with this email already exists"}), 400

        cursor.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                       (username, email, hashed_password.decode('utf-8')))
        connection.commit()

        return jsonify({"msg": "User registered successfully!"}), 201
    except Error as e:
        return jsonify({"msg": "Database error", "error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# User Login
@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Missing fields"}), 400

    connection = get_db_connection()
    if not connection:
        return jsonify({"msg": "Database connection failed"}), 500

    cursor = connection.cursor()
    try:
        cursor.execute("SELECT email, password FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"msg": "User does not exist"}), 401

        stored_hashed_password = user[1].encode('utf-8')

        if bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password):
            access_token = create_access_token(identity=user[0])
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({"msg": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"msg": "Internal Server Error", "error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# Load the summarizer model
summarizer = pipeline("summarization", model="t5-small")

# Generate Summary (Only for Registered Users)
@app.route('/get_summary', methods=['POST'])
@jwt_required()
def get_summary():
    protected_response = protected_route()
    if protected_response:
        return protected_response

    data = request.get_json()
    text = data.get('text')
    summary_type = data.get('type')

    if not text:
        return jsonify({"msg": "Text is required"}), 400

    try:
        summary = text[:int(len(text)*0.3)] + '...' if summary_type == 'extractive' else summarizer(text, max_length=130, min_length=30, do_sample=False)[0]['summary_text']

        connection = get_db_connection()
        if not connection:
            return jsonify({"msg": "Failed to connect to database"}), 500

        cursor = connection.cursor()
        cursor.execute("INSERT INTO summaries (ptext, summary) VALUES (%s, %s)", (text, summary))
        connection.commit()
        meet_id = cursor.lastrowid

        user_email = get_jwt_identity()
        send_email(user_email, summary, meet_id)

        return jsonify({"msg": "Summary generated successfully and sent via email!", "meet_id": meet_id, "summary": summary}), 200
    except Exception as e:
        return jsonify({"msg": "Failed to generate summary", "error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# Get Summary by ID (Only for Registered Users)
@app.route('/get_summary_by_id/<int:meet_id>', methods=['GET'])
@jwt_required()
def get_summary_by_id(meet_id):
    protected_response = protected_route()
    if protected_response:
        return protected_response

    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"msg": "Failed to connect to database"}), 500

        cursor = connection.cursor()
        cursor.execute("SELECT summary FROM summaries WHERE meet_id = %s", (meet_id,))
        result = cursor.fetchone()

        if result:
            return jsonify({"summary": result[0]}), 200
        else:
            return jsonify({"msg": "No summary found for this meeting ID"}), 404
    except Error as e:
        return jsonify({"msg": "Failed to fetch summary", "error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True)
