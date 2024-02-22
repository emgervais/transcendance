function updateNav(connect) {
    var connected = document.querySelectorAll('.connected');
    var notconnected = document.querySelectorAll('.anonymous');
    if(connect) {
    connected.forEach(function(connected) {
		connected.style.display = 'block';
	});
	notconnected.forEach(function(notconnected) {
		notconnected.style.display = 'none';
	});
    }
    else {
        connected.forEach(function(connected) {
            connected.style.display = 'none';
        });
        notconnected.forEach(function(notconnected) {
            notconnected.style.display = 'block';
        });
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export {updateNav, getCookie};