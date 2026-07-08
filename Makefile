.PHONY: deploy build logs stop clean

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
