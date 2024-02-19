import requests
import json

IMAGE_PATH = "seb.jpeg"
IMAGE = None

def load_image():
    global IMAGE_PATH, IMAGE
    if IMAGE:
        return IMAGE
    with open(IMAGE_PATH, 'rb') as f:
        IMAGE = f.read()
    return IMAGE

def request(route, func=requests.get, cookies=None, data=None, files=None):
    if cookies is None:
        cookies = {}
    if data is None:
        data = {}    
    url = "https://nginx" + route
    response = func(url, verify=False, data=data, cookies=cookies, files=files)
    res = {}
    if not response.ok:
        print("Request failed with status code:", response.status_code)
    res["cookies"] = {cookie.name: cookie.value for cookie in response.cookies}
    res["data"] = json.loads(response.text)
    return res