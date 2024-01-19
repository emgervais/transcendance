start:
	docker-compose up --build -d

stop:
	docker compose down
	yes | docker image prune

freeze:
	python -m pip install -r django/requirements.txt
	python -m pip freeze > django/requirements.txt

prune:
	docker system prune --all --volumes

web:
	docker exec -it web sh