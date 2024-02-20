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
        "password": PASSWORD2,
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

# def update_info(user, new_username, new_password):
#     image = util.load_image()
#     endpoints.update_info(
#         user["cookies"],
#         new_username,
#         log=True,
#     )
#     # user["username"] = new_username
#     # user["password"] = new_password

# def friend_request(users):
#     endpoints.make_friend_request(
#         users[0]["cookies"],
#         users[1]["username"],
#         "send",
#     )
#     # endpoints.friend_requests(
#     #     users[1]["cookies"],
#     #     log=True
#     # )
#     endpoints.friend_request(
#         users[1]["cookies"],
#         users[0]["username"],
#         "accept",
#         log=True
#     )
#     for user in users:
#         endpoints.friends(
#             user["cookies"],
#             log=True
#         )

# def get_user_info(user):
#     endpoints.user(
#         user["cookies"],
#         user["username"],
#         log=True    
#     )

if __name__ == "__main__":
    endpoints.reset_db()
    for i, user in enumerate(users):
        response = register_login(user)
        users[i] | {
            "cookies": response["cookies"],
            "id": response["id"]
        }
    print(users)
    # friend_request(users)
    # for user in users:
    #     get_user_info(user)
        # endpoints.logout(user, log=True)
        # update_info(user, user["username"]*2)
