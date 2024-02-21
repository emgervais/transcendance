import endpoints

PASSWORD = "allocopy"

user = {
    "username": "user",
    "password": PASSWORD,
}

def print_user(response):
    if response["status"] == 200 or response["status"] == 201:
        print("User: [ id:", response["data"]["id"],"| username:", response["data"]["username"],"| email:", response["data"]["email"], "| image:", response["data"]["image"], "]")
    else:
        print("| ", response["data"])
        
def auth(quantity=1):
    def decorator(func):
        def wrapper(*args, **kwargs):
            endpoints.reset_db(log=False)
            users = [{} for _ in range(quantity)]
            for i in range(quantity):
                response = register(i)
                users[i] = response['data']
                users[i]["cookies"] = response["cookies"]
                users[i]["status"] = response["status"]
            func(users, *args, **kwargs)
            for user in users:
                logout(user["cookies"])
        return wrapper
    return decorator
        
def register(id=0, user=user):
    response = endpoints.register(
        user["username"] + str(id),
        user["username"] + str(id) + "@gmail.com",
        user["password"],
        user["password"],
        log=False,
    )
    print_user(response)
    return response

def login(id=0, user=user):
    response = endpoints.login(
        user["username"] + str(id) + "@gmail.com",
        user["password"],
        log=False,
    )
    print_user(response)
    return response

def logout(cookies):
    response = endpoints.logout(cookies, log=False)
    return response

def normal_auth():
    print("\n-- Normal auth --")
    endpoints.reset_db(log=False)
    response = register()
    response = login()
    logout(response["cookies"])
    
def no_register():
    print("\n-- No register --")
    endpoints.reset_db(log=False)
    response = login()
    logout(response["cookies"])

def existing_user():
    print("\n-- Existing user --")
    endpoints.reset_db(log=False)
    response = register()
    response = register()
    logout(response["cookies"])
    
def wrong_password():
    print("\n-- Wrong password --")
    endpoints.reset_db(log=False)
    response = register()
    wrong = user.copy()
    wrong["password"] = "wrong"
    response = login(user=wrong)
    logout(response["cookies"])
    
def weak_password():
    print("\n-- Weak password --")
    endpoints.reset_db(log=False)
    weak = user.copy()
    weak["password"] = "weak"
    response = register(user=weak)
    logout(response["cookies"])
    
def logout_twice():
    print("\n-- Logout twice --")
    endpoints.reset_db(log=False)
    response = register()
    logout(response["cookies"])
    logout(response["cookies"])

def auth_tests():
    normal_auth()
    no_register()
    existing_user()
    wrong_password()
    weak_password()
    logout_twice()