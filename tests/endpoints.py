import requests
import util

def endpoint(func):
    def wrapper(*args, **kwargs):
        log = kwargs.get("log", True)
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
def logout(cookies):
    url = "/api/logout/"
    method = "post"
    response = util.request(url, method, cookies)
    return response

# new_infos is a dictionary with the new information
# Possible keys are:
# new_infos = {
#     "username": "new_username",
#     "email": "new_email",
#     "image": new_image,           # new_image is a file
#     "oldPassword": "old_password",
#     "password1": "new_password",
#     "password2": "new_password",
# }
@endpoint
def update_info(cookies, new_infos):
    url = "/api/update-info/"
    method = "post"
    response = util.request(url, method, cookies, data = new_infos)
    return response

# Send a friend request
@endpoint
def make_friend_request(cookies, user_id):
    data = {
        "to_user": user_id
    }
    url = "/api/friend-requests/"
    method = "post"
    response = util.request(url, method, cookies, data)
    return response

# Get all friend requests
@endpoint
def friend_requests(cookies):
    url = "/api/friend-requests/"
    method = "get"
    response = util.request(url, method, cookies)
    return response

# Interact with a friend request
# PUT : accept
# DELETE : decline
@endpoint
def friend_request(cookies, request_id, method):
    url = f"/api/friend-requests/{request_id}/"
    response = util.request(url, method, cookies)
    return response

# Get all friends
@endpoint
def friends(cookies):
    url = "/api/friends/"
    method = "get"
    response = util.request(url, method, cookies)
    return response

@endpoint
def remove_friend(cookies, friend_id):
    url = f"/api/friends/{friend_id}/"
    method = "delete"
    response = util.request(url, method, cookies)
    return response

@endpoint
def user(cookies, user_id):
    url = f"/api/user/{user_id}/"
    method = "get"
    response = util.request(url, method, cookies)
    return response

@endpoint
def users(cookies):
    url = "/api/users/"
    method = "get"
    response = util.request(url, method, cookies)
    return response