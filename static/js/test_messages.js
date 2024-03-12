import { GLOBAL_ROOM_ID } from "/js/chat/chat.js";

function setMessages() {
    var messages = [];
    var newMessage = {};
    for(let i = 0; i < 10; i++) {
        var type = 'self';
        if(i % 2 === 0)
            type = 'else';
        newMessage = {
            roomId: GLOBAL_ROOM_ID,
            message: 'robert' + i,
            type: type,
            image: 'ok',
        }
        messages.push(newMessage);
    }

    for(let i = 10; i < 20; i++) {
        var type = 'self';
        if(i % 2 === 0)
            type = 'else';
        newMessage = {
            roomId: 'match',
            message: 'match' + i,
            type: type,
            image: 'ok',
        }
        messages.push(newMessage);
    }

    for(let i = 20; i < 30; i++) {
        var type = 'self';
        if(i % 2 === 0)
            type = 'else';
        newMessage = {
            roomId: 'user0_francoma',
            message: 'francoma' + i,
            type: type,
            image: 'ok',
        }
        messages.push(newMessage);
    }

    sessionStorage.setItem('messages', JSON.stringify(messages));
}

export { setMessages };
