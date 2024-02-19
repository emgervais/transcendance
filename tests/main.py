#!/usr/bin/env python
import urllib3
import warnings
warnings.simplefilter('ignore', urllib3.exceptions.InsecureRequestWarning)
import endpoints
import util


PASSWORD1 = "jambon1234"
PASSWORD2 = "salami1234"

users = [
    {
        "username": "jambon",
        "email": "jambon@gmail.com",
        "password": PASSWORD1,
    },
    {
        "username": "salami",
        "email": "salami@gmail.com",
        "password": PASSWORD1,
    }
]

def register_login(user):
    endpoints.register(
        user["username"],
        user["email"],
        user["password"],
        user["password"],
    )
    cookies = endpoints.login(
        user["email"],
        user["password"],
    )
    return cookies

def update_info(user, new_username):
    image = util.load_image()
    endpoints.update_info(
        user["cookies"],
        new_username,
        # image,
        log=True,
    )
    # user["username"] = new_username



def update_password(user, new_password):
    endpoints.update_password(
        user["cookies"],
        user["password"],
        new_password,
        new_password,
        log=True
    )
    # user["password"] = new_password

# def logout(user):


if __name__ == "__main__":
    endpoints.reset_db()
    users = [ user | {"cookies": register_login(user)} for user in users]
    for user in users:
        update_info(user, user["username"]*2)
        # update_password(user, PASSWORD2) 
