document.addEventListener('DOMContentLoaded', function () {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // Add event listener for the send button
    sendButton.addEventListener('click', addMessage);

    // Add event listener for pressing Enter in the input field
    messageInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            addMessage();
        }
    });
});

function addMessage() {
    const chat = document.getElementById('chat');
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();

    if (messageText) {
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user-message';
        userMessage.textContent = messageText;
        chat.appendChild(userMessage);

        // Clear input and focus
        messageInput.value = '';
        messageInput.focus();

        // Scroll to bottom
        chat.scrollTop = chat.scrollHeight;

        // Show loading indicator
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'chat-message loading';
        loadingMessage.textContent = 'Loading...';
        chat.appendChild(loadingMessage);
        chat.scrollTop = chat.scrollHeight;

        // Call API
        invokeChute(messageText)
            .then(response => {
                // Remove loading indicator
                chat.removeChild(loadingMessage);

                // Add AI response
                const aiMessage = document.createElement('div');
                aiMessage.className = 'chat-message ai-message';
                aiMessage.textContent = response;
                chat.appendChild(aiMessage);
                chat.scrollTop = chat.scrollHeight;
            })
            .catch(error => {
                // Remove loading indicator
                chat.removeChild(loadingMessage);

                // Add error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'chat-message error-message';
                errorMessage.textContent = 'Error: Could not get response';
                chat.appendChild(errorMessage);
                chat.scrollTop = chat.scrollHeight;
                console.error('Error:', error);
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
                "stream": false, // Changed to false for simplicity
                "max_tokens": 1024,
                "temperature": 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}