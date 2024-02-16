import requests
import json

def request(route, func=requests.get, cookies=None, data=None, files=None):
    if cookies is None:
        cookies = {}
    if data is None:
        data = {}    
    url = "https://nginx" + route
    response = func(url, verify=False, json=data, cookies=cookies, files=files)
    res = {}
    if response.status_code != 200:
        print("Request failed with status code:", response.status_code)
    res["cookies"] = {cookie.name: cookie.value for cookie in response.cookies}
    res["data"] = json.loads(response.text)
    return res