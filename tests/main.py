#!/usr/bin/env python
import requests
import urllib3
import util

import warnings
warnings.simplefilter('ignore', urllib3.exceptions.InsecureRequestWarning)


def reset_db():
    res = util.request("/api/reset/database/", requests.delete)
    print("reset_db:", res.get("data"))

def register():
    data = {
        'username': 'francoma', 
        'email': 'ffrancoismmartineau@gmail.com',
        'password1': 'shitpiss1234',
        'password2': 'shitpiss1234'
    }
    res = util.request("/api/register/", requests.post, data=data)
    print("register:", res.get("data"))
    
def login():
    data = {
        'email': 'ffrancoismmartineau@gmail.com',
        'password': 'shitpiss1234',
    }
    res = util.request("/api/login/", requests.post, data=data)
    print("login:", res.get("data"))
    return res.get("cookies")

def update_info(cookies):
    data = {
        'username': 'asshole'
    }
    res = util.request("/api/change-info/", requests.put, cookies, data)
    print("update_info:", res.get("data"))

if __name__ == "__main__":
    reset_db()
    register()
    cookies = login()
    update_info(cookies)