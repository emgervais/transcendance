import requests
import util

def reset_db(log=False):
    res = util.request("/api/reset/database/", requests.delete)
    log and print("reset_db:", res.get("data"))

def register(username, email, password1, password2, log=False):
    data = {
        'username': username, 
        'email': email,
        'password1': password1,
        'password2': password2
    }
    res = util.request("/api/register/", requests.post, data=data)
    log and print("register:", res.get("data"))
    
def login(email, password, log=False):
    data = {
        'email': email,
        'password': password,
    }
    res = util.request("/api/login/", requests.post, data=data)
    log and print("login:", res.get("data"))
    return res.get("cookies")

def update_info(cookies, username=None, image=None, log=False):
    data = {
        'username': username
    }
    if image:
        files = {
            'image': image
        }
    else:
        files = None
    res = util.request("/api/change-info/", requests.put, cookies, data, files=files)
    log and print("update_info:", res.get("data"))

def update_password(cookies, old_password, password1, password2, log=False):
    data = {
        'old_password': old_password,
        'password1': password1,
        'password2': password2
    }
    res = util.request("/api/change-password/", requests.put, cookies, data)
    log and print("update_password:", res.get("data"))
