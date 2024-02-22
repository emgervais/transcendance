#!/usr/bin/env python
import urllib3
import warnings
warnings.simplefilter('ignore', urllib3.exceptions.InsecureRequestWarning)
import endpoints
import util
from auth import auth_tests
from friend import friend_tests, init_friends
# from user import user_tests

if __name__ == "__main__":
    # print("\n-- Auth tests --")
    # auth_tests()
    # print("\n-- Friend tests --")
    # friend_tests()
    print("\n-- User tests --")
    init_friends()