#!/usr/bin/env python
import urllib3
import warnings
warnings.simplefilter('ignore', urllib3.exceptions.InsecureRequestWarning)

from friend import init_friends, init_friend_requests

if __name__ == "__main__":
    init_friends()
