# Makefile for BRAINBLOCK Backend

# Variables
DB_URL=postgres://postgres:yourpassword@localhost:5432/brainblock?sslmode=disable
MIGRATION_DIR=db/migrations

# Setup and Dependencies
.PHONY: install
install:
	go mod download
	go install github.com/pressly/goose/v3/cmd/goose@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install github.com/air-verse/air@latest

# Database Migrations
.PHONY: migrate-up
migrate-up:
	goose -dir $(MIGRATION_DIR) postgres "$(DB_URL)" up

.PHONY: migrate-down
migrate-down:
	goose -dir $(MIGRATION_DIR) postgres "$(DB_URL)" down

.PHONY: migrate-status
migrate-status:
	goose -dir $(MIGRATION_DIR) postgres "$(DB_URL)" status

.PHONY: create-migration
create-migration:
	@read -p "Enter migration name (e.g., add_users_table): " name; 	goose -dir $(MIGRATION_DIR) create $$name sql

# SQLC Code Generation
.PHONY: sqlc
sqlc:
	sqlc generate

# Run Development Server
.PHONY: run
run:
	air

# Build and Run with Docker
.PHONY: docker-up
docker-up:
	docker-compose up --build -d

.PHONY: docker-down
docker-down:
	docker-compose down

# Build and Run with Podman
.PHONY: podman-up
podman-up:
	podman-compose up --build -d

.PHONY: podman-down
podman-down:
	podman-compose down
