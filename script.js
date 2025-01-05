// Função para alternar entre tema claro e escuro
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
    const themeToggleButton = document.querySelector('.theme-toggle-btn i');

    if (currentTheme === 'light') {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggleButton.classList.remove('fa-moon');
        themeToggleButton.classList.add('fa-sun'); // Altera para ícone de sol
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggleButton.classList.remove('fa-sun');
        themeToggleButton.classList.add('fa-moon'); // Altera para ícone de lua
    }

    // Salva o tema selecionado no Local Storage
    localStorage.setItem('theme', currentTheme === 'light' ? 'dark' : 'light');
}

// Ao carregar a página, verifica se o tema foi previamente salvo
window.onload = () => {
    const savedTheme = localStorage.getItem('theme');
    const themeToggleButton = document.querySelector('.theme-toggle-btn i');
    const body = document.body;

    // Define o tema com base no localStorage ou define o padrão
    if (savedTheme) {
        body.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
        if (savedTheme === 'dark') {
            themeToggleButton.classList.remove('fa-moon');
            themeToggleButton.classList.add('fa-sun');
        } else {
            themeToggleButton.classList.remove('fa-sun');
            themeToggleButton.classList.add('fa-moon');
        }
    } else {
        body.classList.add('light-theme'); // Tema claro como padrão
        themeToggleButton.classList.remove('fa-sun');
        themeToggleButton.classList.add('fa-moon');
    }

    // Inicializa o campo de entrada de mensagem
    currentMessageInput = document.getElementById('currentMessage');
};

// Variáveis de reconhecimento de voz
let recognition;
let isRecording = false;
let messages = [];  // Armazena as mensagens enviadas/recebidas

// Função para enviar a mensagem ao backend e processar a resposta
async function sendMessage() {
    const message = currentMessageInput.value.trim();
    if (message) {
        // Adiciona a mensagem do usuário ao chat
        messages.push({ text: message, sender: 'user' });
        updateChatWindow();

        // Mensagem temporária enquanto processa a resposta
        messages.push({ text: 'Bot: Aguardando resposta...', sender: 'bot', temporary: true });
        updateChatWindow();

        // Envia a mensagem ao backend e recebe a resposta
        const response = await sendToBackend(message);

        // Remove a mensagem temporária
        messages = messages.filter(msg => !msg.temporary);

        // Processa a resposta da IA
        if (response.error) {
            messages.push({ text: response.error, sender: 'bot' });
        } else {
            const botResponse = `Bot: ${response.response}`;
            messages.push({ text: botResponse, sender: 'bot' });

            // Exibe sugestões, correções de gramática e sentimentos
            if (response.suggestions) {
                const suggestions = `Sugestões: ${response.suggestions}`;
                messages.push({ text: suggestions, sender: 'bot' });
            }

            if (response.grammar_corrections) {
                const corrections = `Correções gramaticais: ${response.grammar_corrections}`;
                messages.push({ text: corrections, sender: 'bot' });
            }

            if (response.sentiment) {
                const sentiment = `Sentimento: ${response.sentiment}`;
                messages.push({ text: sentiment, sender: 'bot' });
            }
        }

        // Atualiza a janela de chat com a resposta da IA
        updateChatWindow();
    }
    currentMessageInput.value = '';  // Limpa o campo de entrada
}

// Função para atualizar a janela de chat
function updateChatWindow() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.innerHTML = '';  // Limpa a janela de chat

    // Exibe as mensagens na janela
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add(msg.sender);
        messageElement.innerText = msg.text;
        chatWindow.appendChild(messageElement);
    });

    // Rola para o fim da janela de chat
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Funções de controle de gravação de voz
function startRecording() {
    if (recognition) {
        recognition.start();
        isRecording = true;
        document.getElementById('recordButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
    }
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        isRecording = false;
        document.getElementById('recordButton').disabled = false;
        document.getElementById('stopButton').disabled = true;
    }
}

// Inicialização do reconhecimento de voz
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        currentMessageInput.value = transcript;
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz: ', event.error);
    };
} else {
    console.error('SpeechRecognition não é suportado neste navegador.');
}
