document.addEventListener("DOMContentLoaded", () => {
    const fileList = document.getElementById("file-list");
    const uploadForm = document.getElementById("upload-form");
    const currentPathDisplay = document.getElementById("current-path");
    const createFolderForm = document.getElementById("create-folder-form");

    let currentPath = '~'; // Храним текущий путь

    // Функция для загрузки списка файлов и папок
    const fetchFiles = async (path = '') => {
        try {
            currentPath = path; // Обновляем текущий путь
            const response = await fetch(`/list-files?path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (response.ok) {
                currentPathDisplay.innerHTML = `<span class ="current-path" id="current-path">Current Path: ${path || "~"}</span>`;

                // Рендерим кнопку Back (возвращаемся на один уровень вверх)
                const backButtonHTML = path !== '~' ? `<button id="back-button">Back</button>` : '';

                // Разделяем файлы и папки
                const folders = data.filter(file => file.is_dir).sort((a, b) => a.name.localeCompare(b.name));
                const files = data.filter(file => !file.is_dir).sort((a, b) => a.name.localeCompare(b.name));

                // Рендерим список файлов и папок
                fileList.innerHTML = `
                    ${backButtonHTML}
                    <div>
                        ${folders.map(file => {
                            const newPath = path ? `${path}/${file.name}` : file.name;
                            //return `<li>📂 <a href="#" class="folder-link" data-path="${newPath}">${file.name}</a></li>`;
                           return `<div class="folder-item">
                               <span class="folder-name">📂 <a href="#" class="folder-link" data-path="${newPath}">${file.name}</a></span>
                               <button class="delete-path-button" data-path="${newPath}">Delete</button>
                           </div>`;
                        }).join('')}
                        ${files.map(file => {
                            // Формируем путь
                            const filePath = path ? `${path}/${file.name}` : file.name;
                            return `
                            <div class="file-item">
                                <span class="file-name">📄 ${file.name}</span>
                                <div class="buttons-file">
                                    <button class="download-button" data-path="${filePath}">Download</button>
                                    <button class="delete-button" data-path="${filePath}">Delete</button>
                                </div>
                            </div>`;
                        }).join('')}

                    </div>`;

                // Обработчик для кнопки "Back"
                const backButton = document.getElementById("back-button");
                if (backButton) {
                    backButton.addEventListener("click", () => {
                        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
                        const newPath = parentPath || ''; // Чтобы вернуться к корню, если находимся в корне
                        fetchFiles(newPath); // Загружаем файлы для новой папки
                    });
                }

                // Обработчик для перехода по папкам
                const folderLinks = document.querySelectorAll(".folder-link");
                folderLinks.forEach(link => {
                    link.addEventListener("click", (e) => {
                        e.preventDefault(); // Отменяем стандартное поведение ссылки
                        const newPath = link.getAttribute("data-path");
                        fetchFiles(newPath); // Загружаем файлы для новой папки
                    });
                });

                // Обработчики для кнопок скачивания и удаления
                const downloadButtons = document.querySelectorAll(".download-button");
                downloadButtons.forEach(button => {
                    button.addEventListener("click", (e) => {
                        const filePath = button.getAttribute("data-path");
                        downloadFile(filePath);
                    });
                });

                const deleteButtons = document.querySelectorAll(".delete-button");
                deleteButtons.forEach(button => {
                    button.addEventListener("click", (e) => {
                        const filePath = button.getAttribute("data-path");
                        deleteFile(filePath);
                    });
                });

                const deletePathButtons = document.querySelectorAll(".delete-path-button");
                deletePathButtons.forEach(button => {
                    button.addEventListener("click", (e) => {
                        const filePath = button.getAttribute("data-path");
                        deletePath(filePath);
                    });
                });

            } else {
                fileList.innerHTML = `<p>Error: ${data.error}</p>`;
            }
        } catch (error) {
            fileList.innerHTML = `<p>Error: Failed to fetch files. ${error.message}</p>`;
        }
    };

    // Функция для скачивания файла
    const downloadFile = async (filePath) => {
        try {
            const response = await fetch(`/download/${encodeURIComponent(filePath)}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filePath.split('/').pop(); // Извлекаем имя файла
                a.click();
            } else {
                alert("Error downloading the file.");
            }
        } catch (error) {
            alert("Error: " + error.message);
        }
    };

    // Функция для удаления файла
    const deleteFile = async (filePath) => {
        const confirmDelete = confirm("Are you sure you want to delete this file?");
        if (confirmDelete) {
            try {
                const response = await fetch(`/delete/${encodeURIComponent(filePath)}`, { method: 'GET' });
                if (response.ok) {
                    alert("File deleted successfully!");
                    fetchFiles(currentPath); // Обновляем файлы после удаления
                } else {
                    alert("Error deleting the file.");
                }
            } catch (error) {
                alert("Error: " + error.message);
            }
        }
    };
    // Функция для удаления директории
    const deletePath = async (filePath) => {
        const confirmDelete = confirm("Are you sure you want to delete this directory?");
        if (confirmDelete) {
            try {
                const response = await fetch(`/deletePath/${encodeURIComponent(filePath)}`, { method: 'GET' });
                if (response.ok) {
                    alert("File deleted successfully!");
                    fetchFiles(currentPath); // Обновляем файлы после удаления
                } else {
                    alert("Error deleting the directory.");
                }
            } catch (error) {
                alert("Error: " + error.message);
            }
        }
    };

    // Обработка формы загрузки файлов
uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById("file-input");
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("path", currentPath);

    // Проверка на выбор файла
    if (!fileInput.files[0]) {
        alert("Please select a file to upload.");
        return;
    }

    // Обновляем статус загрузки на "Загружается..."
    const inputFileContainer = fileInput.closest('.input-file');
    const statusText = inputFileContainer.querySelector('.input-file-text');
    statusText.textContent = "Uploading...";

    try {
        // Отправка файла на сервер
        const response = await fetch("/upload", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            // После успешной загрузки обновляем текст
            statusText.textContent = "File uploaded successfully!";
            fetchFiles(currentPath);  // Обновляем список файлов на странице
        } else {
            statusText.textContent = "Error uploading file.";
        }
    } catch (error) {
        // Обработка ошибок
        console.error("Upload failed:", error);
        statusText.textContent = "Error uploading file.";
    }
});

    // Обработка формы создания папки
    createFolderForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById("name-input");
        const formData = new FormData();
        formData.append("folder-name", fileInput.value); // Получаем значение из инпута
        formData.append("path", currentPath); // Передаем текущий путь

        if (!fileInput.value) {
            alert("Please enter a folder name.");
            return;
        }

        const response = await fetch("/createPath", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            alert("Folder created successfully!");
            document.getElementById("name-input").value = "";
            fetchFiles(currentPath);  // Обновляем файлы после создания папки
        } else {
            alert("Error creating folder");
        }
    });

    // Начальная загрузка файлов в корневой каталог
    fetchFiles();
});


$('.input-file input[type=file]').on('change', function(){
	let file = this.files[0];
	$(this).closest('.input-file').find('.input-file-text').html(file.name);
});