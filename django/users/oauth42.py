import os
import sys
import requests
from oauthlib.oauth2 import BackendApplicationClient
from requests_oauthlib import OAuth2Session
from urllib.parse import urljoin, urlencode

class AuthError(Exception):
	pass

def get_token():
	uid = os.getenv("OAUTH_UID", "")
	secret = os.getenv("OAUTH_SECRET", "")
	client = BackendApplicationClient(client_id=uid)
	oauth = OAuth2Session(client=client)
	token_url = os.getenv("OAUTH_API_URL", "") + "/oauth/token" 
	token = oauth.fetch_token(
		token_url=token_url,
		client_id=uid,
		client_secret=secret,
		include_client_id=True
	)
	return token

def get_user_token(code, redirect_uri):
	if code is None:
		raise AuthError("No code provided.")
	params = {
		'grant_type': 'authorization_code',
		'client_id': os.getenv("OAUTH_UID", ""),
		'client_secret': os.getenv("OAUTH_SECRET", ""),
		'code': code,
		'redirect_uri': redirect_uri,
	}
	encoded_params = urlencode(params)
	token_url = os.getenv("OAUTH_API_URL", "") + "/oauth/token"
	headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
	}
	response = requests.post(token_url, data=encoded_params, headers=headers)
	if response.status_code != 200:
		raise AuthError(f"Error: {response.status_code} - {response.text}")
	token_data = response.json()
	return token_data.get('access_token')

def get_user_data(access_token):
	api_url = os.getenv("OAUTH_API_URL", "") + "/v2/me"
	headers = {
		'Authorization': f'Bearer {access_token}',
	}
	response = requests.get(api_url, headers=headers)
	if response.status_code != 200:
		raise AuthError(f"Error: {response.status_code} - {response.text}")
	user_data = response.json()
	return {
		'login': user_data.get('login'),
		'email': user_data.get('email'),
		'image': user_data.get('image', {}).get('link'),
	}

def create_oauth_uri(redirect_uri):
    base_url = os.getenv("OAUTH_API_URL", "") + "/oauth/"
    authorization_endpoint = urljoin(base_url, "authorize")
    params = {
        'client_id': os.getenv("OAUTH_UID", ""),
        'redirect_uri': redirect_uri,
        'response_type': 'code',
    }
    authorization_uri = authorization_endpoint + '?' + urlencode(params)
    return authorization_uri

