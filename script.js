document.addEventListener('DOMContentLoaded', function () {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // Добавляем обработчик события для кнопки отправки
    sendButton.addEventListener('click', addMessage);

    // Добавляем обработчик события для нажатия Enter в поле ввода
    messageInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            addMessage();
        }
    });
});

function addMessage() {
    const chat = document.getElementById('chat-container');
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (messageText) {
        // Добавляем сообщение пользователя
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user-message';
        userMessage.textContent = messageText;
        chat.appendChild(userMessage);

        // Очищаем поле ввода и фокусируемся на нем
        messageInput.value = '';
        messageInput.focus();

        // Прокручиваем чат вниз
        chat.scrollTop = chat.scrollHeight;

        // Показываем индикатор загрузки
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'chat-message loading';
        loadingMessage.textContent = 'Загрузка...';
        chat.appendChild(loadingMessage);
        chat.scrollTop = chat.scrollHeight;

        // Вызываем API нейросети
        invokeChute(messageText)
            .then(response => {
                // Удаляем индикатор загрузки
                chat.removeChild(loadingMessage);

                // Добавляем ответ ИИ
                const aiMessage = document.createElement('div');
                aiMessage.className = 'chat-message ai-message';

                // Получаем имя пользователя из Telegram, если доступно
                let userName = "";
                if (window.telegramApp && window.telegramApp.currentUser) {
                    userName = window.telegramApp.currentUser.first_name;

                    // Если в ответе нет обращения, добавляем его
                    if (response && !response.includes(userName)) {
                        response = `${userName}, ${response.charAt(0).toLowerCase() + response.slice(1)}`;
                    }
                }

                aiMessage.textContent = response;
                chat.appendChild(aiMessage);
                chat.scrollTop = chat.scrollHeight;
            })
            .catch(error => {
                // Удаляем индикатор загрузки
                chat.removeChild(loadingMessage);

                // Добавляем сообщение об ошибке
                const errorMessage = document.createElement('div');
                errorMessage.className = 'chat-message error-message';
                errorMessage.textContent = 'Ошибка: Не удалось получить ответ от нейросети';
                chat.appendChild(errorMessage);
                chat.scrollTop = chat.scrollHeight;
                console.error('Ошибка API:', error);
            });
    }
}

async function invokeChute(text) {
    try {
        const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer cpk_c2c422f0f5f54e7d9c76c8e191c39a8b.d0202fb185245d29b0c8e579b1704673.49NMAG7mRkhp3GpIlyJpi7XJ27jtMjnm",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "deepseek-ai/DeepSeek-V3-0324",
                "messages": [
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                "stream": false, // Изменено на false для простоты обработки
                "max_tokens": 1024,
                "temperature": 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Ошибка API:", error);
        throw error;
    }
}