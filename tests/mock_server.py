import json
from http.server import BaseHTTPRequestHandler, HTTPServer

HTTP_STATUS_CODE = 403
"""
    This mock server's purpose is to test handling of different http status codes.
    Here's a javascript template to use it:

    fetch("http://localhost:8000")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("data:", data);
    })
    .catch(error => {
        console.log("error:", error);
        return Promise.resolve();
    });
    
"""

class MockServerRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(HTTP_STATUS_CODE)
        self.send_header('Content-type', 'text/plain')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        data = {'message': 'Mock POST response'}
        json_data = json.dumps(data)
        self.wfile.write(json_data.encode('utf-8'))

def run_mock_server(server_class=HTTPServer, handler_class=MockServerRequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting mock server on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_mock_server()