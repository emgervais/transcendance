const login = {
    loginButton: function() {
        const loginForm = document.getElementById('login-form');
        const formData = new FormData(loginForm);
        fetch(loginForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
            },
        })
        .then(response => response.text())
        .then(data => {
            data = JSON.parse(data);
            if (data.success) {
                const floatingBox = document.getElementById("floating-box");
                floatingBox.style.display = "none";              
            }
            if (data.error) {
                const formError = document.getElementById("form-error");
                formError.innerHTML = data.error;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });        
    }
};