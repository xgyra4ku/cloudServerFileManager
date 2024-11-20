document.addEventListener("DOMContentLoaded", () => {
    const fileList = document.getElementById("file-list");
    const uploadForm = document.getElementById("upload-form");
    const currentPathDisplay = document.getElementById("current-path");
    const createFolderForm = document.getElementById("create-folder-form");

    let currentPath = '~'; // Храним текущий путь
    // Ваш код, который нужно выполнить при загрузке страницы
    if (localStorage.getItem('authToken')) {
        // Скрываем кнопки, если пользователь вошел в систему
        document.getElementById('btn-login').style.display = 'none';
        document.getElementById('btn-logout').style.display = 'inline-block';
    } else {
        // Если пользователь не вошел, отображаем кнопки
        document.getElementById('btn-login').style.display = 'inline-block';
        document.getElementById('btn-logout').style.display = 'none';
    }

    // Функция для получения заголовков авторизации
    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken'); // Получаем токен из хранилища
        return {
            'Authorization': `Bearer ${token}`
        };
    };

    // Функция для загрузки списка файлов и папок
    const fetchFiles = async (path = '') => {
        try {
            currentPath = path; // Обновляем текущий путь
            const response = await fetch(`/list-files?path=${encodeURIComponent(path)}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();

            if (response.ok) {
                currentPathDisplay.innerHTML = `<span class ="current-path" id="current-path">Current Path: ${path || "~"}</span>`;

                // Рендерим кнопку Back
                const backButtonHTML = path !== '~' ? `<button id="back-button">Back</button>` : '';

                // Разделяем файлы и папки
                const folders = data.filter(file => file.is_dir).sort((a, b) => a.name.localeCompare(b.name));
                const files = data.filter(file => !file.is_dir).sort((a, b) => a.name.localeCompare(b.name));

                // Рендерим список файлов и папок <button class="delete-path-button" data-path="${newPath}">Delete</button>
                fileList.innerHTML = `
                    ${backButtonHTML}
                    <div>
                        ${folders.map(file => {
                            const newPath = path ? `${path}/${file.name}` : file.name;
                            return `<div class="folder-item">
                                <span class="folder-name">
                                <label class="folder-file-icon">📂</label>
                                <a href="#" class="folder-link" data-path="${newPath}">${file.name}</a></span>
                                    <button class="button_delete" type="button" id="delete-path-button" data-path="${newPath}">
                                    <span class="button__text">Delete</span>
                                    <span class="button__icon"
                                        ><svg
                                        class="svg"
                                        height="512"
                                        viewBox="0 0 512 512"
                                        width="512"
                                        xmlns="http://www.w3.org/2000/svg"
                                        >
                                        <title></title>
                                        <path
                                            d="M112,112l20,320c.95,18.49,14.4,32,32,32H348c17.67,0,30.87-13.51,32-32l20-320"
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                        ></path>
                                        <line
                                            style="stroke:#fff;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"
                                            x1="80"
                                            x2="432"
                                            y1="112"
                                            y2="112"
                                        ></line>
                                        <path
                                            d="M192,112V72h0a23.93,23.93,0,0,1,24-24h80a23.93,23.93,0,0,1,24,24h0v40"
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                        ></path>
                                        <line
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                            x1="256"
                                            x2="256"
                                            y1="176"
                                            y2="400"
                                        ></line>
                                        <line
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                            x1="184"
                                            x2="192"
                                            y1="176"
                                            y2="400"
                                        ></line>
                                        <line
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                            x1="328"
                                            x2="320"
                                            y1="176"
                                            y2="400"
                                        ></line></svg
                                    ></span>
                                    </button>
                                </div>`;
                        }).join('')}
                        ${files.map(file => {//<button class="download-button" data-path="${filePath}">Download</button>
                            const filePath = path ? `${path}/${file.name}` : file.name;
                            return `
                            <div class="file-item">
                                <span class="file-name">
                                    <label class="folder-file-icon">📄</label>
                                    <label class="file-link">${file.name}</label>
                                </span>
                                <div class="buttons-file">
                                    <button class="button_download" type="button" id="download-button" data-path="${filePath}">
                                        <span class="button__text">Download</span>
                                    <span class="button__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" id="bdd05811-e15d-428c-bb53-8661459f9307" data-name="Layer 2" class="svg"><path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path><path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path><path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path></svg></span>
                                    </button>
                                    <button class="button_delete" type="button" id="delete-file-button" data-path="${filePath}">
                                    <span class="button__text">Delete</span>
                                    <span class="button__icon"
                                        ><svg
                                        class="svg"
                                        height="512"
                                        viewBox="0 0 512 512"
                                        width="512"
                                        xmlns="http://www.w3.org/2000/svg"
                                        >
                                        <title></title>
                                        <path
                                            d="M112,112l20,320c.95,18.49,14.4,32,32,32H348c17.67,0,30.87-13.51,32-32l20-320"
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                        ></path>
                                        <line
                                            style="stroke:#fff;stroke-linecap:round;stroke-miterlimit:10;stroke-width:32px"
                                            x1="80"
                                            x2="432"
                                            y1="112"
                                            y2="112"
                                        ></line>
                                        <path
                                            d="M192,112V72h0a23.93,23.93,0,0,1,24-24h80a23.93,23.93,0,0,1,24,24h0v40"
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                        ></path>
                                        <line
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                            x1="256"
                                            x2="256"
                                            y1="176"
                                            y2="400"
                                        ></line>
                                        <line
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                            x1="184"
                                            x2="192"
                                            y1="176"
                                            y2="400"
                                        ></line>
                                        <line
                                            style="fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:32px"
                                            x1="328"
                                            x2="320"
                                            y1="176"
                                            y2="400"
                                        ></line></svg
                                    ></span>
                                    </button>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>`;

                // Обработчики для кнопок
                const deleteButton = document.querySelectorAll("#delete-file-button");
                const deletePathButton = document.querySelectorAll("#delete-path-button");
                const createFolderButton = document.getElementById("create-folder-form");
                const formloadfile = document.getElementById("upload-form");

                /// Получаем уровень пользователя из localStorage
                const userLevel = localStorage.getItem('userLevel');
                if (userLevel === '3') {
                    createFolderButton.style.display = "block";
                    formloadfile.style.display = "block";
                    deleteButton.forEach(button => button.style.display = "block");
                    deletePathButton.forEach(button => button.style.display = "block");
                } else if (userLevel === '2') {
                    formloadfile.style.display = "block";
                    createFolderButton.style.display = "block";
                    deleteButton.forEach(button => button.style.display = "none");
                    deletePathButton.forEach(button => button.style.display = "none");
                } else {
                    formloadfile.style.display = "none";
                    createFolderButton.style.display = "none";
                    deleteButton.forEach(button => button.style.display = "none");
                    deletePathButton.forEach(button => button.style.display = "none");
                }


                // Обработчик для кнопки "Back"
                const backButton = document.getElementById("back-button");
                if (backButton) {
                    backButton.addEventListener("click", () => {
                        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
                        const newPath = parentPath || ''; // Возвращение к корню
                        fetchFiles(newPath);
                    });
                }

                // Обработчик для перехода по папкам
                const folderLinks = document.querySelectorAll(".folder-link");
                folderLinks.forEach(link => {
                    link.addEventListener("click", (e) => {
                        e.preventDefault();
                        const newPath = link.getAttribute("data-path");
                        fetchFiles(newPath);
                    });
                });

                // Обработчики для кнопок скачивания и удаления
                const downloadButtons = document.querySelectorAll("#download-button");
                downloadButtons.forEach(button => {
                    button.addEventListener("click", () => {
                        const filePath = button.getAttribute("data-path");
                        downloadFile(filePath);
                    });
                });

                // Работа с кнопками удаления файлов
                const deleteFileButtons = document.querySelectorAll("#delete-file-button");
                deleteFileButtons.forEach(button => {
                    button.addEventListener("click", () => {
                        const filePath = button.getAttribute("data-path");
                        deleteFile(filePath); // Вызов функции удаления файла
                    });
                });

                // Работа с кнопками удаления папок
                const deletePathButtons = document.querySelectorAll("#delete-path-button");
                deletePathButtons.forEach(button => {
                    button.addEventListener("click", (e) => {
                        e.preventDefault(); // Предотвращение стандартного поведения
                        const folderPath = button.getAttribute("data-path");
                        deletePath(folderPath); // Вызов функции удаления папки
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
            const response = await fetch(`/download/${encodeURIComponent(filePath)}`, {
                headers: getAuthHeaders()
            });
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
                const response = await fetch(`/delete/${encodeURIComponent(filePath)}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
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
                const response = await fetch(`/deletePath/${encodeURIComponent(filePath)}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    alert("Directory deleted successfully!");
                    fetchFiles(currentPath);
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

        if (!fileInput.files[0]) {
            alert("Please select a file to upload.");
            return;
        }

        try {
            const response = await fetch("/upload", {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData,
            });

            if (response.ok) {
                alert("File uploaded successfully!");
                fetchFiles(currentPath); // Обновляем список файлов после загрузки
            } else {
                alert("Error uploading the file.");
            }
        } catch (error) {
            alert("Error: " + error.message);
        }
    });

    // Обработка формы создания папки
    createFolderForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const folderName = document.getElementById("folder-name").value;

        if (!folderName) {
            alert("Please enter a folder name.");
            return;
        }

        try {
            const response = await fetch("/create-folder", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ path: currentPath, folderName }),
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
            });

            if (response.ok) {
                alert("Folder created successfully!");
                fetchFiles(currentPath); // Обновляем список файлов после создания папки
            } else {
                alert("Error creating the folder.");
            }
        } catch (error) {
            alert("Error: " + error.message);
        }
    });

    // Начальная загрузка файлов
    fetchFiles();
});
document.getElementById('btn-logout').addEventListener('click', async function () {
    if (localStorage.getItem('authToken')) {
        event.preventDefault(); 
        localStorage.removeItem('authToken');
        localStorage.removeItem('userLevel');
        window.location.href = '/cloud/index.html'; 
    }
});

document.getElementById('btn-login').addEventListener('click', async function () {
    window.location.href = '/login/index.html';
});