-- +goose Up
INSERT INTO users (username, password_hash, role, name) 
VALUES ('admin', '$2a$10$T8brVS3nO0CpKSzS/UOmOOhHE6ubRJ23oZoqsbofL8DrZ8vCIJr7C', 'super_admin', 'Administrator Utama');

-- +goose Down
DELETE FROM users WHERE username = 'admin';
