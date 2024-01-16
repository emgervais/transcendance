stop:
	docker compose down
	yes | docker container prune

freeze:
	python -m pip install -r django/requirements.txt
	python -m pip freeze > django/requirements.txt