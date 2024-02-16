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
        OAUTH_APP_URL = os.getenv("OAUTH_APP_URL")
        print(f"Error: Update the oauth42 secret: {OAUTH_APP_URL}")
    return res

if __name__ == "__main__":
    print("-- Performing init checks ----")
    tests = [before_oauth_secret_expiry]
    for test in tests:
        if not test():
            exit(1)
    print("\tSuccess")