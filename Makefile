start:
	docker-compose up --build

stop:
	docker compose down
	yes | docker network prune
	yes | docker image prune

frontend:
	@python frontend/auto_compile.py

prune:
	docker system prune --all --volumes

web:
	docker exec -it web sh

nginx:
	docker exec -it nginx sh

db:
	source .env && docker exec -it postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

tests:
	cd tests && docker-compose up --build --force-recreate

.PHONY: start stop frontend prune web nginx db tests