document.getElementById('btn-login').addEventListener('click', async function (event) {
    event.preventDefault(); // Остановить отправку формы


    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
    
        const data = await response.json();
        console.log(data);  // Выводим данные, полученные от сервера
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userLevel', data.userLevel);
            window.location.href = '/cloud/index.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
    
});
