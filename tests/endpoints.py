import requests
import util

def endpoint(func):
    def wrapper(*args, **kwargs):
        log = kwargs.get("log", False)
        if "log" in kwargs:
            del kwargs["log"]
        response = func(*args, **kwargs)
        log and print(func.__name__ + ":", response.get("data"))
        return response
    return wrapper

@endpoint
def reset_db():
    url = "/api/reset/database/"
    method = "delete"
    response = util.request(url, method)
    return response

@endpoint
def register(username, email, password1, password2):
    data = {
        'username': username, 
        'email': email,
        'password1': password1,
        'password2': password2
    }
    url = "/api/register/"
    method = "post"
    response = util.request(url, method, data=data)
    return response
    
@endpoint
def login(email, password):
    data = {
        'email': email,
        'password': password,
    }
    url = "/api/login/"
    method = "post"
    response = util.request(url, method, data=data)
    return response

@endpoint
def logout(user):
    url = "/api/logout/"
    method = "post"
    response = util.request(url, method, cookies=user["cookies"])
    return response

@endpoint
def update_info(cookies, username=None, image=None):
    data = {
        'username': username
    }
    if image:
        files = {
            'image': image
        }
    else:
        files = None
    url = "/api/change-info/"
    method = "put"
    response = util.request(url, method, cookies, data, files=files)
    return response

@endpoint
def update_password(cookies, old_password, password1, password2):
    data = {
        'old_password': old_password,
        'password1': password1,
        'password2': password2
    }
    url = "/api/change-password/"
    method = "put"
    response = util.request(url, method, cookies, data)
    return response

@endpoint
def make_friend_request(cookies, to_user):
    data = {
        "to_user": to_user,
    }
    url = "/api/friend-requests/"
    method = "post"
    response = util.request(url, method, cookies, data)
    return response

@endpoint
def friend_requests(cookies):
    url = "/api/friend-requests/"
    method = "get"
    response = util.request(url, method, cookies)
    return response

@endpoint
def friends(cookies):
    url = "/api/friends/"
    method = "get"
    response = util.request(url, method, cookies)
    return response

@endpoint
def user(cookies, username):
    url = f"/api/user/{username}/"
    method = "get"
    response = util.request(url, method, cookies)
    return response
