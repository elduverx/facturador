.PHONY: help db-up db-down db-logs migrate studio dev setup clean

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

db-up: ## Start the PostgreSQL database in the background
	docker compose up -d

db-down: ## Stop and remove the database container
	docker compose down

db-logs: ## View database logs
	docker compose logs -f

migrate: ## Run Prisma migrations
	npx prisma db push

generate: ## Generate Prisma client
	npx prisma generate

studio: ## Open Prisma Studio
	npx prisma studio

dev: ## Start Next.js development server
	npm run dev

setup: db-up generate migrate ## Initial setup: start db, generate client, push schema
	@echo "Setup complete! You can now run 'make dev'"

clean: db-down ## Stop DB and remove node_modules and .next
	rm -rf node_modules
	rm -rf .next
	npm install
