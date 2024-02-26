import endpoints
from auth import auth

@auth(2)
def friend_requests_wrong(users):
    user1 = users[0]
    user2 = users[1]
    
    response = endpoints.make_friend_request(user1["cookies"], user2["id"])
    print(response["data"])
    response = endpoints.make_friend_request(user1["cookies"], user2["id"])
    print(response["data"])
    request_id = 12
    response = endpoints.friend_request(user1["cookies"], request_id, "put")
    print(response["data"])
    response = endpoints.friend_request(user1["cookies"], request_id, "delete")
    print(response["data"])
    response = endpoints.make_friend_request(user1["cookies"], user1["id"])
    print(response["data"])
    response = endpoints.remove_friend(user1["cookies"], user2["id"])
    print(response["data"])
    
    return response

@auth(3)
def friend_request(users):
    user1 = users[0]
    user2 = users[1]
    user3 = users[2]
    
    response = endpoints.make_friend_request(user1["cookies"], user2["id"])
    print('FQ sent u1 -> u2 ', response["data"])
    response = endpoints.friend_requests(user2["cookies"])
    print('FQ received u2 ', response["data"])
    request_id = response["data"][0]["id"]
    response = endpoints.friend_request(user2["cookies"], request_id, "put")
    print('FQ accepted u2 <- u1 ', response["data"])
    response = endpoints.friend_requests(user2["cookies"])
    print('FQ received u2 ', response["data"])
    response = endpoints.make_friend_request(user2["cookies"], user3["id"])
    print('FQ sent u2 -> u3 ', response["data"])
    response = endpoints.friend_requests(user3["cookies"])
    request_id = response["data"][0]["id"]
    response = endpoints.friend_request(user3["cookies"], request_id, "delete")
    print('FQ declined u3 <- u2 ', response["data"])
    response = endpoints.friends(user2["cookies"])
    print('Friends u2 ', response["data"])
    response = endpoints.friend_requests(user2["cookies"])
    print('FQ received u2 ', response["data"])
    response = endpoints.remove_friend(user1["cookies"], user2["id"])
    print('FQ removed u1 - u2 ', response["data"])
    response = endpoints.friends(user1["cookies"])
    print('Friends u1 ', response["data"])
    response = endpoints.friends(user2["cookies"])
    print('Friends u2 ', response["data"])
    
    return response


@auth(10)
def init_friends(users):
    for i, user in enumerate(users[1:]):
        if (i % 2):
            response = endpoints.make_friend_request(user["cookies"], users[0]["id"])
            continue
        response = endpoints.make_friend_request(users[0]["cookies"], user["id"])
        response = endpoints.friend_requests(user["cookies"])
        request_id = response["data"][0]["id"]
        response = endpoints.friend_request(user["cookies"], request_id, "put")

@auth(10)
def init_friend_requests(users):
    for user in users[1:]:
        response = endpoints.make_friend_request(user["cookies"], users[0]["id"])



def friend_tests():
    print("\n-- Friend/Friend request interactions --")
    friend_request()
    print("\n-- Friend/Friend request wrong interactions --")
    friend_requests_wrong()
