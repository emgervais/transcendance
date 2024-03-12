import requests
import json

IMAGE_PATH = "seb.jpeg"
IMAGE = None

methods = {
    "get": requests.get,
    "post": requests.post,
    "put": requests.put,
    "delete": requests.delete,
}

def load_image():
    return open(IMAGE_PATH, "rb")

def request(url, method, cookies=None, data=None, files=None):
    if cookies is None:
        cookies = {}
    if data is None:
        data = {}
    if files is None:
        files = {}
    url = "https://nginx" + url
    global methods
    if method not in methods:
        raise ValueError("request: bad method")
    method = methods[method]
    response = method(url, verify=False, data=data, cookies=cookies, files=files)
    res = {}
    res["status"] = response.status_code
    res["cookies"] = {cookie.name: cookie.value for cookie in response.cookies}
    try:
        res["data"] = json.loads(response.content)
    except:
        res["json"] = None
    return res