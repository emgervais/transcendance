start:
	docker-compose up --build
	

stop:
	docker compose down
	yes | docker image prune

prune:
	docker system prune --all --volumes

web:
	docker exec -it web sh

nginx:
	docker exec -it nginx sh

db:
	source .env && docker exec -it postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

.PHONY: start stop prune web nginx db