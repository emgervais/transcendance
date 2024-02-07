start:
	docker-compose up --build

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

nginx_:
	docker exec -it nginx sh

db:
	docker exec -it postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
