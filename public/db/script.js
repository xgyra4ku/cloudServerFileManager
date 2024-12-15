document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const setButton = document.getElementById("btn-set");

    setButton.addEventListener("click", (event) => {
        event.preventDefault(); // предотвращаем перезагрузку страницы

        const username = usernameInput.value.trim();
        const accessLevel = passwordInput.value.trim();

        if (!username || !accessLevel) {
            alert("Please fill out both fields.");
            return;
        }

        // Отправка данных на сервер
        fetch("/api/setAccessLevel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, accessLevel })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            alert(`Access level for user "${username}" has been set to "${accessLevel}" on the server.`);
        })
        .catch(error => {
            console.error("Error updating access level:", error);
            alert("Failed to update access level on the server.");
        });

        // Очистка полей ввода
        usernameInput.value = "";
        passwordInput.value = "";
    });
});
