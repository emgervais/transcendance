import endpoints
from auth import auth
from util import load_image

@auth(3)
def user_info(users):
    user1 = users[0]
    user2 = users[1]
    user3 = users[2]
    
    endpoints.user(user1["cookies"], '999')
    endpoints.user(user1["cookies"])
    endpoints.user(user1["cookies"], user2["id"])
    endpoints.user(user1["cookies"], user3["username"])
    endpoints.users(user1["cookies"])
    
@auth(2)
def update_info(users):
    user1 = users[0]
    user2 = users[1]
    new_infos = {
        "username": "new_username",
        "email": "new_email@gamil.com",
        "oldPassword": "allocopy",
        "password1": "new_password",
        "password2": "new_password",
    }
    endpoints.update_info(user1["cookies"], new_infos, load_image())
    new_infos = {
        "username": user2["username"],
    }
    endpoints.update_info(user1["cookies"], new_infos)
    new_infos = {
        "oldPassword": "oldPassword",
        "password1": "new_password",
        "password2": "new_password",
    }
    endpoints.update_info(user1["cookies"], new_infos)
    new_infos = {
        "password2": "new_password",
    }
    endpoints.update_info(user1["cookies"], new_infos)
    
    
def user_tests():
    print("\n-- User info --")
    user_info()
    print("\n-- Update info --")
    update_info()