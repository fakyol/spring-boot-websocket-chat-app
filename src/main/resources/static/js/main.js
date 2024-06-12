'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var bold = false ;
var italic = false ;
var underline = false;

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
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
    }
    var textElement = document.createElement('p');
    if (bold == true){
        textElement = document.createElement('strong');
    }else if (italic == true && bold == false){
        textElement = document.createElement('em');}
    else if (italic == false && bold == false && underline == true){
        textElement = document.createElement('u');
        }

    else
        textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);
    var blankElement = document.createElement('br');
    messageElement.appendChild(blankElement);
    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;

    bold = false;
    italic= false;
    underline=false;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

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
    /*const messageInput = document.getElementById('message');
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const selectedText = messageInput.value.substring(start, end);
    const newText = `<${tag}>${selectedText}</${tag}>`;
    messageInput.value = messageInput.value.substring(0, start) + newText + messageInput.value.substring(end);
    messageInput.focus();
    messageInput.setSelectionRange(start + tag.length + 2, end + tag.length + 2);*/
    if (tag == 'strong')
        bold = true;
    else if (tag == 'em')
        italic = true;
    else if (tag == 'u')
        underline = true ;
}

function formatText(text) {
    // Convert HTML tags to their respective formats
    text = text.replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>');
    text = text.replace(/<em>(.*?)<\/em>/g, '<em>$1</em>');
    text = text.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
    return text;
}



usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
document.getElementById('emoji-button').addEventListener('click', toggleEmojiPicker);
document.querySelectorAll('.emoji').forEach(emoji => emoji.addEventListener('click', addEmoji));
document.getElementById('bold-button').addEventListener('click', () => addFormatting('strong'));
document.getElementById('italic-button').addEventListener('click', () => addFormatting('em'));
document.getElementById('underline-button').addEventListener('click', () => addFormatting('u'));
