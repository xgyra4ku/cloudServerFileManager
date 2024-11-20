from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from functools import wraps
import os
import sqlite3
import bcrypt
import jwt
import shutil

from datetime import datetime, timedelta

JWT_SECRET = os.getenv('JWT_SECRET', 'B869hFJ4sUSsuXk1mwxnRAW1C7c7FaCgxDxvnkhr89YVnorGh92vBOK1osBStqqn')  # Определяем секрет для токенов

app = Flask(__name__, static_folder='public')

CORS(app)  # Разрешает все домены

BASE_DIR = "E:/"

# Инициализация базы данных SQLite
def init_db():
    conn = sqlite3.connect('mainKp.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            level INTEGER DEFAULT 1
        )
    ''')
    conn.commit()
    print("Database initialized successfully.")  # Добавить вывод для отладки
    conn.close()

def get_user_level(user_id):
    """Получить уровень пользователя из базы данных."""
    conn = sqlite3.connect('mainKp.db')
    cursor = conn.cursor()
    cursor.execute("SELECT level FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None



def require_level(min_level):
    """Проверка уровня пользователя."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            token = request.headers.get('Authorization')
            
            # Проверка наличия токена
            if not token:
                return jsonify({'error': 'Токен отсутствует'}), 401
            
            # Убираем 'Bearer ' из заголовка, чтобы оставить только сам токен
            token = token.split(' ')[1] if token.startswith('Bearer ') else token
            
            try:
                # Декодирование JWT токена
                user = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                user_id = user.get('id')
                
                if not user_id:
                    return jsonify({'error': 'Некорректный токен'}), 400
                
                # Получаем уровень пользователя
                level = get_user_level(user_id)
                print(get_user_level(user_id))
                # Если уровень пользователя меньше минимально требуемого
                if level is None or level < min_level:
                    return jsonify({'error': 'Недостаточный уровень доступа'}), 403
                
                # Сохраняем данные пользователя в запрос
                request.user = user
                
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Токен истёк'}), 403
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Неверный токен'}), 403
            except Exception as e:
                # Логируем ошибку, если возникла какая-либо другая
                return jsonify({'error': f'Ошибка: {str(e)}'}), 500
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


@app.route('/')
def serve_filesystem():
    # Отправляем HTML
    return send_from_directory('public/', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    # Отправляем статические файлы (например, CSS или JS)
    return send_from_directory(app.static_folder, filename)


# Вход пользователя
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Проверка на пустые поля
    if not username or not password:
        return jsonify({'error': 'Имя пользователя и пароль обязательны'}), 400

    conn = sqlite3.connect('mainKp.db')
    cursor = conn.cursor()

    # Проверяем, существует ли пользователь
    cursor.execute('SELECT id, password FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        # Возвращаем общую ошибку без уточнения
        return jsonify({'error': 'Неверное имя пользователя или пароль'}), 400

    user_id, hashed_password = user

    # Проверяем пароль
    if not bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8')):
        return jsonify({'error': 'Неверное имя пользователя или пароль'}), 400

    # Создаём JWT-токен
    token = jwt.encode(
        {
            'id': user_id,
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=1)
        },
        JWT_SECRET,
        algorithm='HS256'
    )

    return jsonify({'message': 'Вход успешно выполнен', 'token': token, 'userLevel': get_user_level(user_id)}), 200

# Middleware для проверки токена
def authenticate_token(f):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').split(' ')[1]
        if not token:
            return jsonify({'error': 'Токен отсутствует'}), 401

        try:
            user = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user = user
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Токен истёк'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Неверный токен'}), 403
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__

@app.route('/list-files', methods=['GET'])
def list_files():
    # Получаем путь из запроса
    path = request.args.get('path', '')
    full_path = os.path.join(BASE_DIR, path)

    if not os.path.exists(full_path):
        return jsonify({"error": "Path not found"}), 404

    entries = []
    for entry in os.scandir(full_path):
        entries.append({
            "name": entry.name,
            "is_dir": entry.is_dir()
        })
    return jsonify(entries)


@app.route('/navigate/<path:new_path>')
def navigate_directory(new_path):
    # Handle directory navigation requests with proper validation
    full_path = os.path.join(BASE_DIR, new_path)
    if not os.path.isdir(full_path):
        return jsonify({"error": "Invalid directory path"}), 400
    return jsonify({"current_path": new_path})

@app.route('/upload', methods=['POST'])
@require_level(1)  # Проверка уровня
def upload_file():
    token = request.headers.get('Authorization', '').split(' ')[1]
    if not token:
        return jsonify({'error': 'Токен отсутствует'}), 401
    file = request.files.get('file')
    path = request.form.get('path', '')
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(full_path, exist_ok=True)

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        file.save(os.path.join(full_path, secure_filename(file.filename)))
        return jsonify({"message": "File uploaded successfully!"}), 200
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500



@app.route('/delete/<path:file_path>', methods=['GET'])
@require_level(2)  # Проверка уровня
def delete_file(file_path):
    token = request.headers.get('Authorization', '').split(' ')[1]
    if not token:
        return jsonify({'error': 'Токен отсутствует'}), 401
    full_path = os.path.join(BASE_DIR, file_path)

    # Проверка на безопасность пути
    if not full_path.startswith(BASE_DIR):  # Предотвращение обхода директорий
        return jsonify({"error": "Invalid file path"}), 400

    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404

    try:
        os.remove(full_path)
        return jsonify({"message": "File deleted successfully!"})
    except Exception as e:
        return jsonify({"error": f"Deletion failed: {str(e)}"}), 500
    
@app.route('/download/<path:file_path>', methods=['GET'])
def download_file(file_path):
    # Декодируем путь и обрабатываем его для корректности
    decoded_path = file_path.replace('%2F', '/')
    full_path = os.path.join(BASE_DIR, decoded_path)
    if not os.path.exists(full_path):
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(BASE_DIR, decoded_path, as_attachment=True)

@app.route('/deletePath/<path:file_path>', methods=['DELETE'])
@require_level(2)  # Проверка уровня
def delete_path(file_path):
    token = request.headers.get('Authorization', '').split(' ')[1]
    if not token:
        return jsonify({'error': 'Токен отсутствует'}), 401
    full_path = os.path.join(BASE_DIR, file_path)

    if not full_path.startswith(BASE_DIR):
        return jsonify({"error": "Invalid file path"}), 400

    if not os.path.exists(full_path):
        return jsonify({"error": "File or directory not found"}), 404

    try:
        if os.path.isdir(full_path):
            shutil.rmtree(full_path)
        else:
            os.remove(full_path)
        return jsonify({"message": "File or directory deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": f"Deletion failed: {str(e)}"}), 500


@app.route('/createPath', methods=['POST'])
@require_level(1)  # Проверка уровня
def create_path():
    token = request.headers.get('Authorization', '').split(' ')[1]
    if not token:
        return jsonify({'error': 'Токен отсутствует'}), 401
    folder_name = request.form.get('folder-name')
    parent_path = request.form.get('path')
    full_path = os.path.join(BASE_DIR, parent_path, folder_name)

    if not full_path.startswith(BASE_DIR):
        return jsonify({"error": "Invalid file path"}), 400

    if os.path.exists(full_path):
        return jsonify({"error": "Folder already exists"}), 400

    try:
        os.makedirs(full_path)
        return jsonify({"message": "Folder created successfully!"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to create folder: {str(e)}"}), 500




if __name__ == '__main__':
    init_db()
    os.makedirs(BASE_DIR, exist_ok=True)
    app.run(host="192.168.0.106", port=8088, debug=True)
