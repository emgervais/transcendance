#!/usr/bin/env python
import urllib3
import warnings
warnings.simplefilter('ignore', urllib3.exceptions.InsecureRequestWarning)

import auth
import friend
import user

if __name__ == "__main__":
    try:
        print("\n-- Friend tests --")
        friend.search_user()
    except AssertionError as e:
        print("AssertionError:", e)

