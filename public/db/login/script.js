document.getElementById('btn-login').addEventListener('click', async function (event) {
    event.preventDefault(); // Остановить отправку формы


    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/logindb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            // Сохранение информации о пользователе в localStorage
            localStorage.setItem('tokendb', data.token);
            window.location.href = '/db/index.html'; // Перенаправление на главную страницу
        } else {
            alert(data.error); // Ошибка входа
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
});
