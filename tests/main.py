#!/usr/bin/env python
import urllib3
import warnings
warnings.simplefilter('ignore', urllib3.exceptions.InsecureRequestWarning)

from auth import auth_tests
from friend import friend_tests
from user import user_tests

if __name__ == "__main__":
    print("----- Authentification -----")
    auth_tests()
    friend_tests()
    user_tests()