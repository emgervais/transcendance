start:
# frontend/auto_compile.py --once
	docker-compose up --build

stop:
	docker compose down
	yes | docker image prune

frontend:
	@frontend/auto_compile.py

prune:
	docker system prune --all --volumes

web:
	docker exec -it web sh

nginx_:
	docker exec -it nginx sh

db:
	source .env && docker exec -it postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

.PHONY: start stop frontend prune web nginx db