.PHONY: deploy build logs stop clean migrate seed

deploy:
	docker-compose up -d --build
	@echo "Deployed successfully! Application is running on port 3000."

build:
	docker-compose build

logs:
	docker-compose logs -f

stop:
	docker-compose down

clean:
	docker-compose down --rmi all --volumes

migrate:
	docker-compose exec pvabogadas-web npx prisma migrate deploy

seed:
	docker-compose exec pvabogadas-web npm run seed
