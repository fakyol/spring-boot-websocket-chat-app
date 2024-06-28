'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var userList = document.querySelector('#userList');
var directMessageWindow = document.querySelector('#directMessageWindow');
var directMessageForm = document.querySelector('#directMessageForm');
var directMessageInput = document.querySelector('#directMessage');
var directMessageArea = document.querySelector('#directMessageArea');
var connectingElement = document.querySelector('.connecting');
var bold = false;
var italic = false;
var underline = false;

var stompClient = null;
var username = null;
var recipientUsername = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}

function onConnected() {
    console.log('Connected to WebSocket server.');
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Subscribe to Private Messages
    stompClient.subscribe('/queue/messages', onDirectMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({ sender: username, type: 'JOIN' })
    )

    connectingElement.classList.add('hidden');
}

function onError(error) {
    console.log('WebSocket error:', error);
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        console.log('Sending message:', chatMessage);
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

function sendDirectMessage(event) {
    var messageContent = directMessageInput.value.trim();
    if (messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            recipient: recipientUsername,
            content: messageContent,
            type: 'CHAT'
        };
        console.log('Sending direct message:', chatMessage);
        stompClient.send("/app/chat.sendDirectMessage", {}, JSON.stringify(chatMessage));
        directMessageInput.value = '';
    }
    event.preventDefault();
}

function onMessageReceived(payload) {
    console.log('Message received:', payload.body);
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
        updateUserList(message.sender);
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);

        var textElement = document.createElement('p');
        if (bold == true) {
            textElement = document.createElement('strong');
        } else if (italic == true && bold == false) {
            textElement = document.createElement('em');
        } else if (italic == false && bold == false && underline == true) {
            textElement = document.createElement('u');
        } else {
            textElement = document.createElement('p');
        }
        var messageText = document.createTextNode(message.content);
        textElement.appendChild(messageText);
        var blankElement = document.createElement('br');
        messageElement.appendChild(blankElement);
        messageElement.appendChild(textElement);

        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;

        bold = false;
        italic = false;
        underline = false;
    }
}

function onDirectMessageReceived(payload) {
    console.log('Direct message received:', payload.body);
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');
    messageElement.classList.add('chat-message');

    var avatarElement = document.createElement('i');
    var avatarText = document.createTextNode(message.sender[0]);
    avatarElement.appendChild(avatarText);
    avatarElement.style['background-color'] = getAvatarColor(message.sender);

    messageElement.appendChild(avatarElement);

    var usernameElement = document.createElement('span');
    var usernameText = document.createTextNode(message.sender);
    usernameElement.appendChild(usernameText);
    messageElement.appendChild(usernameElement);

    var textElement = document.createElement('p');
    if (bold == true) {
        textElement = document.createElement('strong');
    } else if (italic == true && bold == false) {
        textElement = document.createElement('em');
    } else if (italic == false && bold == false && underline == true) {
        textElement = document.createElement('u');
    } else {
        textElement = document.createElement('p');
    }
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);
    var blankElement = document.createElement('br');
    messageElement.appendChild(blankElement);
    messageElement.appendChild(textElement);

    directMessageArea.appendChild(messageElement);
    directMessageArea.scrollTop = directMessageArea.scrollHeight;

    bold = false;
    italic = false;
    underline = false;
}

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

function updateUserList(username) {
    var userElement = document.createElement('div');
    userElement.classList.add('user-item');
    userElement.dataset.username = username;
    userElement.textContent = username;
    userElement.addEventListener('click', () => openDirectMessageWindow(username));
    userList.appendChild(userElement);
}

function openDirectMessageWindow(username) {
    recipientUsername = username;
    directMessageWindow.classList.remove('hidden');
    directMessageArea.innerHTML = ''; // Clear previous messages
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
directMessageForm.addEventListener('submit', sendDirectMessage, true)

document.getElementById('bold-button').addEventListener('click', () => addFormatting('strong'));
document.getElementById('italic-button').addEventListener('click', () => addFormatting('em'));
document.getElementById('underline-button').addEventListener('click', () => addFormatting('u'));
document.getElementById('emoji-button').addEventListener('click', toggleEmojiPicker);
document.querySelectorAll('.emoji').forEach(emoji => emoji.addEventListener('click', addEmoji));

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
}

function addEmoji(event) {
    const emoji = event.target.textContent;
    const messageInput = document.getElementById('message');
    messageInput.value += emoji;
    toggleEmojiPicker();
}

function addFormatting(tag) {
    if (tag == 'strong')
        bold = true;
    else if (tag == 'em')
        italic = true;
    else if (tag == 'u')
        underline = true;
}

function formatText(text) {
    text = text.replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>');
    text.replace(/<em>(.*?)<\/em>/g, '<em>$1</em>');
    text.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
    return text;
}
