.PHONY: deploy build logs stop clean migrate seed dev

dev:
	docker compose up -d db
	npm run dev

deploy:
	@echo "🛑 Deteniendo contenedores antiguos..."
	docker compose down
	@echo "🚀 Construyendo y levantando servicios..."
	docker compose up -d --build
	@echo "🔄 Esperando a que la DB esté lista y aplicando migraciones..."
	sleep 5
	docker compose exec -T pvabogadas-web npx prisma migrate deploy
	@echo "✅ Deployed successfully! Application is running on port 3000."

build:
	docker compose build

logs:
	docker compose logs -f

stop:
	docker compose down

clean:
	docker compose down --rmi all --volumes

migrate:
	docker compose exec pvabogadas-web npx prisma migrate deploy

seed:
	docker compose exec pvabogadas-web npm run seed
