import endpoints
from auth import auth

@auth(2)
def friend_requests_wrong(users):
    user1 = users[0]
    user2 = users[1]
    
    endpoints.make_friend_request(user1["cookies"], user2["id"])
    endpoints.make_friend_request(user1["cookies"], user2["id"])
    request_id = 12
    endpoints.friend_request(user1["cookies"], request_id, "put")
    endpoints.friend_request(user1["cookies"], request_id, "delete")
    endpoints.make_friend_request(user1["cookies"], user1["id"])
    endpoints.remove_friend(user1["cookies"], user2["id"])

@auth(3)
def friend_request(users):
    user1 = users[0]
    user2 = users[1]
    user3 = users[2]
    
    print('FQ sent u1 -> u2 ', end='')
    endpoints.make_friend_request(user1["cookies"], user2["id"])
    print('FQ received u2 ', end='')
    response = endpoints.friend_requests(user2["cookies"])
    request_id = response["data"][0]["id"]
    print('FQ accepted u2 <- u1 ', end='')
    endpoints.friend_request(user2["cookies"], request_id, "put")
    print('FQ received u2 ', end='')
    endpoints.friend_requests(user2["cookies"])
    print('FQ sent u2 -> u3 ', end='')
    endpoints.make_friend_request(user2["cookies"], user3["id"])
    response = endpoints.friend_requests(user3["cookies"])
    request_id = response["data"][0]["id"]
    print('FQ declined u3 <- u2 ', end='')
    endpoints.friend_request(user3["cookies"], request_id, "delete")
    print('Friends u2 ', end='')
    endpoints.friends(user2["cookies"])
    print('FQ received u2 ', end='')
    endpoints.friend_requests(user2["cookies"])
    print('FQ removed u1 - u2 ', end='')
    endpoints.remove_friend(user1["cookies"], user2["id"])
    print('Friends u1 ', end='')
    endpoints.friends(user1["cookies"])
    print('Friends u2 ', end='')
    endpoints.friends(user2["cookies"])


def friend_tests():
    print("\n-- Friend/Friend request interactions --")
    friend_request()
    print("\n-- Friend/Friend request wrong interactions --")
    friend_requests_wrong()
