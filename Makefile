run:
	python3 transcande/manage.py runserver

get:
	pip3 install -r requirements.txt --disable-pip-version-check

reqs:
	pip3 freeze > requirements.txt --disable-pip-version-check
