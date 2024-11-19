from flask import Flask, send_from_directory, jsonify, request
import shutil
import os

app = Flask(__name__, static_folder='public')

BASE_DIR = os.path.join(os.getcwd(), 'uploads')  # Папка для файлов

@app.route('/')
def serve_filesystem():
    # Отправляем HTML
    return send_from_directory('public/cloud', 'filesysteam.html')

@app.route('/<path:filename>')
def serve_static(filename):
    # Отправляем статические файлы (например, CSS или JS)
    return send_from_directory(app.static_folder, filename)

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
def upload_file():
    # Upload files to specified directory with error handling
    file = request.files['file']
    path = request.form.get('path', '')
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(full_path, exist_ok=True)

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        file.save(os.path.join(full_path, file.filename))
        return jsonify({"message": "File uploaded successfully!"})
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@app.route('/delete/<path:file_path>', methods=['GET'])
def delete_file(file_path):
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

@app.route('/deletePath/<path:file_path>', methods=['GET'])
def delete_path(file_path):
    full_path = os.path.join(BASE_DIR, file_path)

    # Проверка на безопасность пути
    if not full_path.startswith(BASE_DIR):  # Предотвращение обхода директорий
        return jsonify({"error": "Invalid file path"}), 400

    # Проверка, существует ли путь
    if not os.path.exists(full_path):
        return jsonify({"error": "File or directory not found"}), 404

    try:
        # Удаление файлов и директорий
        if os.path.isdir(full_path):
            shutil.rmtree(full_path)  # Удаление директории и её содержимого
        else:
            os.remove(full_path)  # Удаление файла

        return jsonify({"message": "File or directory deleted successfully!"})

    except Exception as e:
        return jsonify({"error": f"Deletion failed: {str(e)}"}), 500

@app.route('/createPath', methods=['POST'])
def create_path():
    folder_name = request.form.get('folder-name')
    parent_path = request.form.get('path')

    # Полный путь к новой папке
    full_path = os.path.join(BASE_DIR, parent_path, folder_name)

    # Проверка на безопасность пути
    if not full_path.startswith(BASE_DIR):  # Предотвращение обхода директорий
        return jsonify({"error": "Invalid file path"}), 400

    # Проверка на существование папки
    if os.path.exists(full_path):
        return jsonify({"error": "Folder already exists"}), 400

    try:
        # Создание новой папки
        os.makedirs(full_path)
        return jsonify({"message": "Folder created successfully!"})
    except Exception as e:
        return jsonify({"error": f"Failed to create folder: {str(e)}"}), 500
if __name__ == '__main__':
    os.makedirs(BASE_DIR, exist_ok=True)
    app.run(debug=True)
