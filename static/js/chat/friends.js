var connectedFriends = []; // ids

function update(id, connected) {
    if (connected) {
        addConnectedFriend(id);
    } else {
        removeConnectedFriend(id);
    }
}
function addConnectedFriend(id) {
    connectedFriends.push(id);
}

function removeConnectedFriend(id) {
    connectedFriends = connectedFriends.filter(item => item !== id);
}

export { connectedFriends, update };