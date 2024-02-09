function authenticate() {
	fetch('/get-oauth-uri')
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			console.log(response);
			return response.json();
		})
		.then(data => {
			window.location.href = data;
		})
		.catch(error => {
			console.error('Fetch error:', error);
		});
}
