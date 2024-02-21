import endpoints
from auth import auth

@auth(2)
def friend_requests_wrong(users):
    user1 = users[0]
    user2 = users[1]
    
    response = endpoints.make_friend_request(user1["cookies"], user2["id"])
    response = endpoints.make_friend_request(user1["cookies"], user2["id"])
    request_id = 12
    response = endpoints.friend_request(user1["cookies"], request_id, "put")
    response = endpoints.friend_request(user1["cookies"], request_id, "delete")
    response = endpoints.make_friend_request(user1["cookies"], user1["id"])
    response = endpoints.remove_friend(user1["cookies"], user2["id"])
    
    return response

@auth(3)
def friend_request(users):
    user1 = users[0]
    user2 = users[1]
    user3 = users[2]
    
    print('FR sent u1 -> u2 ')
    response = endpoints.make_friend_request(user1["cookies"], user2["id"])
    print('FR received u2 ')
    response = endpoints.friend_requests(user2["cookies"])
    request_id = response["data"][0]["id"]
    print('FR accepted u2 <- u1 ')
    response = endpoints.friend_request(user2["cookies"], request_id, "put")
    print('FR received u2 ')
    response = endpoints.friend_requests(user2["cookies"])
    print('FR sent u2 -> u3 ')
    response = endpoints.make_friend_request(user2["cookies"], user3["id"])
    response = endpoints.friend_requests(user3["cookies"])
    request_id = response["data"][0]["id"]
    print('FR declined u3 <- u2 ')
    response = endpoints.friend_request(user3["cookies"], request_id, "delete")
    print('Friends u2 ')
    response = endpoints.friends(user2["cookies"])
    print('FR received u2 ')
    response = endpoints.friend_requests(user2["cookies"])
    print('FR removed u1 - u2 ')
    response = endpoints.remove_friend(user1["cookies"], user2["id"])
    print('Friends u1 ')
    response = endpoints.friends(user1["cookies"])
    print('Friends u2 ')
    response = endpoints.friends(user2["cookies"])
    
    return response

def friend_tests():
    print("\n-- Friend/Friend request interactions --")
    friend_request()
    print("\n-- Friend/Friend request wrong interactions --")
    friend_requests_wrong()
