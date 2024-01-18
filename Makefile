start:
	docker-compose up --build

stop:
	docker compose down
	yes | docker container prune
	yes | docker image prune

freeze:
	python -m pip install -r django/requirements.txt
	python -m pip freeze > django/requirements.txt

web:
	docker exec -it web sh