import endpoints
from auth import auth
import auth as auth_module

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


@auth(2)
def block(users):
    user1 = users[0]
    user2 = users[1]
    
    endpoints.block_user(user1["cookies"], user2["id"])
    endpoints.block_user(user1["cookies"], user2["id"])
    endpoints.unblock_user(user2["cookies"], user1["id"])
    endpoints.blocked_users(user1["cookies"])
    endpoints.unblock_user(user1["cookies"], user2["id"])
    endpoints.blocked_users(user1["cookies"])
    endpoints.block_user(user1["cookies"], user1["id"])
    endpoints.blocked_users(user1["cookies"])
    endpoints.unblock_user(user1["cookies"], user1["id"])
    endpoints.blocked_users(user1["cookies"])


@auth(10)
def init_friends(users):
    for user in users[1:]:
        response = endpoints.make_friend_request(users[0]["cookies"], user["id"])
        response = endpoints.friend_requests(user["cookies"])
        request_id = response["data"][0]["id"]
        response = endpoints.friend_request(user["cookies"], request_id, "put")

@auth(10)
def init_friend_requests(users):
    for user in users[1:]:
        response = endpoints.make_friend_request(user["cookies"], users[0]["id"])



@auth(3)
def search_user(users):
    def accept_friend_request(user):
        response = endpoints.friend_requests(user["cookies"])
        request_id = response["data"][0]["id"]
        endpoints.friend_request(user["cookies"], request_id, "put")

    user1, user2, user3 = users

    response = endpoints.search(user1["cookies"], auth_module.user["username"])
    assert len(response["data"]) == 2, "search_user: no params"
    response = endpoints.search(user1["cookies"], auth_module.user["username"], is_friend=True)
    assert len(response["data"]) == 0

    endpoints.make_friend_request(user1["cookies"], user2["id"])
    accept_friend_request(user2)
    response = endpoints.search(user1["cookies"], auth_module.user["username"], is_friend=True)
    assert len(response["data"]) == 1, "search_user: is_friend"

    endpoints.make_friend_request(user1["cookies"], user3["id"])
    response = endpoints.search(user1["cookies"], auth_module.user["username"], friend_request_sent=True)
    assert len(response["data"]) == 1, "search_user: friend_request_sent"
    response = endpoints.search(user1["cookies"], auth_module.user["username"], friend_request_received=True)
    assert len(response["data"]) == 0, "search_user: friend_request_received"

    response = endpoints.search(user3["cookies"], auth_module.user["username"], friend_request_sent=True)
    assert len(response["data"]) == 0, "search_user: friend_request_sent"
    response = endpoints.search(user3["cookies"], auth_module.user["username"], friend_request_received=True)
    assert len(response["data"]) == 1, "search_user: friend_request_received"

    accept_friend_request(user3)
    response = endpoints.search(user3["cookies"], auth_module.user["username"], friend_request_sent=True)
    assert len(response["data"]) == 0, "search_user: friend_request_sent"
    response = endpoints.search(user1["cookies"], auth_module.user["username"], friend_request_received=True)
    assert len(response["data"]) == 0, "search_user: friend_request_received"

    response = endpoints.search(user3["cookies"], auth_module.user["username"], friend_request_sent=True)
    assert len(response["data"]) == 0, "search_user: friend_request_sent"
    response = endpoints.search(user3["cookies"], auth_module.user["username"], friend_request_received=True)
    assert len(response["data"]) == 0, "search_user: friend_request_received"

    response = endpoints.search(user3["cookies"], auth_module.user["username"], is_friend=True)
    assert len(response["data"]) == 1, "search_user: is_friend"

    endpoints.block_user(user3["cookies"], user1["id"])
    response = endpoints.search(user3["cookies"], auth_module.user["username"], got_blocked=True)
    assert len(response["data"]) == 0, "search_user: got_blocked"
    response = endpoints.search(user3["cookies"], auth_module.user["username"], is_blocked=True)
    assert len(response["data"]) == 1, "search_user: is_blocked"
    response = endpoints.search(user1["cookies"], auth_module.user["username"], is_blocked=True)
    assert len(response["data"]) == 0, "search_user: is_blocked"
    response = endpoints.search(user1["cookies"], auth_module.user["username"], got_blocked=True)
    assert len(response["data"]) == 1, "search_user: got_blocked"



def friend_tests():
    print("\n-- Friend/Friend request interactions --")
    friend_request()
    print("\n-- Friend/Friend request wrong interactions --")
    friend_requests_wrong()
    print("\n-- Block interactions --")
    block()