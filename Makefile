stop:
	docker compose down
	yes | docker container prune -a
	yes | docker image prune -a

freeze:
	python -m pip install -r django/requirements.txt
	python -m pip freeze > django/requirements.txt