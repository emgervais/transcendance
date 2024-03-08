#!/usr/bin/env python
import urllib3
import warnings
warnings.simplefilter('ignore', urllib3.exceptions.InsecureRequestWarning)

import auth
import friend
import user

if __name__ == "__main__":
    print("\n-- Friend tests --")
    try:
        friend.search_user()
    except AssertionError as e:
        print("AssertionError:", e)

