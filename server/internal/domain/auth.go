package domain

import (
	"context"

	"brainblock-backend/internal/auth/repository"
)

type AuthUsecase interface {
	Login(ctx context.Context, username, password string) (string, error)
	Register(ctx context.Context, req *repository.CreateUserParams) (*repository.User, error)
	ListUsers(ctx context.Context) ([]repository.User, error)
}
