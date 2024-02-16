#!/usr/bin/env python
import os
from datetime import datetime

def before_oauth_secret_expiry():
    OAUTH_SECRET_EXPIRY = os.getenv("OAUTH_SECRET_EXPIRY")
    date_format = '%d/%m/%Y'
    exp_date = datetime.strptime(OAUTH_SECRET_EXPIRY, date_format)
    current_date = datetime.now().date()
    res = current_date < exp_date.date()
    if not res:
        OAUTH_APP_ID = os.getenv("OAUTH_APP_ID")
        print(f"Error: Visit https://profile.intra.42.fr/oauth/applications/{OAUTH_APP_ID}\
              and update: OAUTH_SECRET, OAUTH_SECRET_EXPIRY")
    return res

if __name__ == "__main__":
    print("-- Performing init checks ----")
    tests = [before_oauth_secret_expiry]
    for test in tests:
        if not test():
            exit(1)
    print("\tSuccess")