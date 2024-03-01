start:
	docker-compose up --build

stop:
	cd tests && docker-compose down
	docker-compose down
	yes | docker network prune
	yes | docker image prune

delete_volumes:
	make stop
	docker volume ls -q | xargs docker volume rm
	cd django/users/migrations && find . -type f -not -name '__init__.py' -delete

frontend:
	@python3 frontend/auto_compile.py

prune:
	docker system prune --all --volumes

web:
	docker exec -it web sh

nginx:
	docker exec -it -w /home/app/ nginx sh -c "nginx -s reload && sh"

db:
	source .env && docker exec -it postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

tests:
	cd tests && docker-compose up -d --build --force-recreate

run_tests:
	cd tests && docker-compose up -d --build --force-recreate && docker exec -it tests sh

freeze:
	python -m pip install -r django/requirements.txt
	python -m pip freeze > django/requirements.txt

.PHONY: start stop frontend prune web nginx db tests