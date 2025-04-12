// telegram_script.js

// Объект для хранения информации о пользователях.
// Ключ - ID пользователя, значение - объект с данными пользователя.
let users = {};

// Уникальный идентификатор администратора Telegram.
// Замените на реальный ID вашего администратора.
const ADMIN_ID = 403462026; // Пример ID

// Переменная для хранения данных текущего пользователя.
let currentUser = null;

// Функция, которая выполняется после полной загрузки HTML-страницы.
document.addEventListener('DOMContentLoaded', function () {
    // Инициализируем интеграцию с Telegram Web App.
    initTelegramApp();
});

// Инициализация приложения Telegram Web App.
function initTelegramApp() {
    // Проверяем, доступен ли объект Telegram Web App.
    if (window.Telegram && window.Telegram.WebApp) {
        const webApp = window.Telegram.WebApp;
        // Сообщаем Telegram, что приложение готово к работе.
        webApp.ready();

        try {
            // Пытаемся получить данные пользователя из Telegram.
            // initDataUnsafe содержит информацию о пользователе, открывшем Mini App.
            const user = webApp.initDataUnsafe.user;

            // Если данные пользователя получены успешно.
            if (user) {
                // Формируем объект с данными текущего пользователя.
                currentUser = {
                    id: user.id, // Уникальный ID пользователя
                    first_name: user.first_name, // Имя
                    last_name: user.last_name || '', // Фамилия (может отсутствовать)
                    username: user.username || '', // Имя пользователя (может отсутствовать)
                    language_code: user.language_code || '', // Код языка (напр., 'ru')
                    is_premium: user.is_premium || false, // Является ли пользователь Premium
                    photo_url: user.photo_url || '', // Ссылка на фото профиля (может отсутствовать)
                    registration_date: new Date().toISOString() // Текущая дата как дата "регистрации" в приложении
                };

                // Отображаем основную информацию о пользователе на странице.
                displayUserInfo(currentUser);

                // Загружаем существующих пользователей из "базы данных" (файла users.json).
                loadUsers()
                    .then(() => {
                        // После загрузки регистрируем (или обновляем) текущего пользователя.
                        registerUser(currentUser);

                        // Проверяем, является ли текущий пользователь администратором.
                        if (user.id === ADMIN_ID) {
                            // Если да, показываем панель администратора.
                            showAdminPanel();
                        }
                    })
                    .catch(error => {
                        // Обрабатываем возможные ошибки при загрузке пользователей.
                        console.error('Ошибка при загрузке пользователей:', error);
                        // Даже если загрузка не удалась, пытаемся зарегистрировать текущего
                        // и проверить права администратора.
                        registerUser(currentUser);
                        if (user.id === ADMIN_ID) {
                            showAdminPanel();
                        }
                    });
            } else {
                // Если данные пользователя получить не удалось.
                document.getElementById('user-info').innerHTML = '<p>Данные пользователя недоступны</p>';
                console.warn('Telegram Web App user data is undefined.');
            }
        } catch (error) {
            // Обрабатываем ошибки при инициализации или получении данных.
            console.error('Ошибка при получении данных пользователя Telegram:', error);
            document.getElementById('user-info').innerHTML = '<p>Ошибка при получении данных пользователя</p>';
        }
    } else {
        // Если скрипт запущен не внутри Telegram Mini App.
        console.warn('Telegram WebApp object not found. Is this page opened in Telegram?');
        document.getElementById('user-info').innerHTML = '<p>Эта страница должна быть открыта в Telegram Mini App</p>';
        // Можно добавить заглушку для тестирования вне Telegram
        // displayUserInfo({ id: 123, first_name: "Тест", last_name: "Тестов" });
        // loadUsers().then(() => { registerUser({ id: 123, first_name: "Тест", last_name: "Тестов", registration_date: new Date().toISOString() }); });
    }
}

// Отображение информации о текущем пользователе на странице.
function displayUserInfo(user) {
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        userInfoElement.innerHTML = `
            <p>ID: ${user.id}</p>
            <p>Имя: ${user.first_name}</p>
            <p>Фамилия: ${user.last_name || 'Не указана'}</p>
            <p>Имя пользователя: ${user.username ? '@' + user.username : 'Не указано'}</p>
        `;
    }

    // Добавляем приветственное сообщение в чат (если элемент чата найден).
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'chat-message system-message'; // Системное сообщение
        welcomeMessage.textContent = `Добро пожаловать, ${user.first_name}!`;
        chatContainer.appendChild(welcomeMessage);
    }
}

// Асинхронная функция загрузки пользователей из файла users.json.
async function loadUsers() {
    try {
        // Пытаемся получить файл users.json.
        // ВАЖНО: Файл должен быть доступен по этому пути относительно HTML-файла.
        const response = await fetch('users.json');
        // Если файл найден и доступен (статус 200 OK).
        if (response.ok) {
            // Читаем содержимое файла как JSON и записываем в переменную users.
            users = await response.json();
            console.log('Пользователи успешно загружены:', users);
        } else {
            // Если файл не найден (404) или другая ошибка.
            console.warn(`Не удалось загрузить users.json. Статус: ${response.status}. Используется пустой список пользователей.`);
            // Используем пустой объект, если загрузка не удалась.
            users = {};
        }
    } catch (error) {
        // Обрабатываем ошибки сети или ошибки парсинга JSON.
        console.error('Ошибка при загрузке или обработке users.json:', error);
        // Используем пустой объект в случае ошибки.
        users = {};
    }
}

// Асинхронная функция для СОХРАНЕНИЯ пользователей.
// ВНИМАНИЕ: Эта функция в текущем виде НЕ сохраняет данные в файл users.json
// из-за ограничений безопасности браузера. Нужен серверный компонент (бэкенд).
async function saveUsers() {
    console.log('Попытка сохранения пользователей (имитация):', users);

    // --- НАЧАЛО: Код для реального сохранения на сервер (требует бэкенда) ---
    /*
    try {
        // Отправляем POST-запрос на серверный обработчик '/api/save-users'
        const response = await fetch('/api/save-users', { // URL вашего API для сохранения
            method: 'POST', // Метод HTTP-запроса
            headers: {
                'Content-Type': 'application/json', // Указываем, что отправляем JSON
            },
            body: JSON.stringify(users) // Преобразуем объект users в JSON-строку
        });

        // Проверяем, успешен ли ответ сервера
        if (!response.ok) {
            // Если нет, генерируем ошибку
            throw new Error(`Ошибка сохранения на сервере! Статус: ${response.status}`);
        }

        console.log('Пользователи успешно отправлены на сервер для сохранения.');

    } catch (error) {
        // Обрабатываем ошибки сети или ошибки со стороны сервера
        console.error('Ошибка при отправке данных пользователей на сервер:', error);
        // Здесь можно добавить логику для пользователя, если сохранение критично
    }
    */
    // --- КОНЕЦ: Код для реального сохранения на сервер ---

    // В текущей версии без бэкенда: просто выводим в консоль.
    // Данные будут теряться при закрытии/обновлении страницы,
    // если не были загружены из users.json при старте.
}

// Регистрация нового пользователя или обновление данных существующего.
function registerUser(user) {
    // Проверяем, есть ли пользователь с таким ID уже в нашем объекте users.
    if (!users[user.id]) {
        // Если пользователя нет - это новый пользователь.
        console.log(`Регистрация нового пользователя: ID=${user.id}, Имя=${user.first_name}`);
        // Добавляем его в объект users.
        users[user.id] = { ...user }; // Копируем объект user
        // Устанавливаем дату регистрации (она уже есть в user)
    } else {
        // Если пользователь уже существует - обновляем его данные.
        console.log(`Обновление данных пользователя: ID=${user.id}`);
        // Обновляем данные существующего пользователя, добавляя/перезаписывая поля из user.
        // Также добавляем/обновляем время последнего визита.
        users[user.id] = {
            ...users[user.id], // Сохраняем старые данные (если есть уникальные)
            ...user, // Обновляем данными из Telegram
            last_visit: new Date().toISOString() // Устанавливаем текущее время как время последнего визита
        };
    }

    // Пытаемся "сохранить" обновленный список пользователей.
    // Напоминание: без бэкенда это не запишет данные в файл users.json.
    saveUsers();

    // Если текущий пользователь - администратор, обновляем список в админ-панели.
    if (currentUser && currentUser.id === ADMIN_ID) {
        updateUsersList(); // Обновляем таблицу пользователей в панели администратора
    }
}

// Функция для отображения панели администратора.
function showAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        // Убираем класс 'hidden', чтобы сделать панель видимой.
        adminPanel.classList.remove('hidden');
        console.log('Панель администратора отображена.');
        // Заполняем список пользователей.
        updateUsersList();
    } else {
        console.error('Элемент admin-panel не найден на странице.');
    }
}

// Обновление содержимого списка пользователей в панели администратора.
function updateUsersList() {
    const usersListDiv = document.getElementById('users-list');
    if (!usersListDiv) {
        console.error('Элемент users-list не найден в admin-panel.');
        return;
    }

    // Очищаем предыдущее содержимое.
    usersListDiv.innerHTML = '';

    // Создаем HTML-таблицу для отображения пользователей.
    const usersTable = document.createElement('table');
    usersTable.className = 'users-table'; // Применяем стили из CSS

    // Создаем заголовок таблицы.
    const tableHeader = document.createElement('thead');
    tableHeader.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Username</th>
            <th>Дата регистрации</th>
            <th>Последний визит</th>
            <th>Premium</th>
            <th>Язык</th>
        </tr>
    `;
    usersTable.appendChild(tableHeader);

    // Создаем тело таблицы для строк с данными.
    const tableBody = document.createElement('tbody');

    // Проходим по всем пользователям в объекте 'users'.
    Object.values(users).forEach(user => {
        // Создаем строку для каждого пользователя.
        const row = document.createElement('tr');
        // Заполняем ячейки данными пользователя.
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.first_name || 'N/A'}</td>
            <td>${user.last_name || 'N/A'}</td>
            <td>${user.username ? '@' + user.username : 'N/A'}</td>
            <td>${formatDate(user.registration_date)}</td>
            <td>${user.last_visit ? formatDate(user.last_visit) : 'N/A'}</td>
            <td>${user.is_premium ? 'Да' : 'Нет'}</td>
            <td>${user.language_code || 'N/A'}</td>
        `;
        // Добавляем строку в тело таблицы.
        tableBody.appendChild(row);
    });

    // Добавляем тело таблицы в таблицу.
    usersTable.appendChild(tableBody);
    // Добавляем готовую таблицу в div 'users-list'.
    usersListDiv.appendChild(usersTable);
    console.log('Список пользователей в админ-панели обновлен.');
}

// Вспомогательная функция для форматирования даты и времени.
function formatDate(dateString) {
    // Если дата не передана или некорректна, возвращаем 'N/A'.
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Форматируем дату в локальный формат (например, "12.04.2025, 15:30").
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        // Если произошла ошибка при форматировании.
        console.error("Ошибка форматирования даты:", dateString, e);
        return 'Invalid Date';
    }
}

// Экспортируем переменные и функции, чтобы они были доступны
// из других скриптов (например, script.js), если это необходимо.
// В данном коде это используется для доступа к currentUser в script.js
window.telegramApp = {
    currentUser,
    registerUser // Экспортируем, хотя прямого вызова из script.js нет
};