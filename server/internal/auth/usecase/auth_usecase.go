package usecase

import (
	"context"
	"errors"
	"time"

	"brainblock-backend/internal/auth/repository"
	"brainblock-backend/internal/domain"

	"golang.org/x/crypto/bcrypt"
)

type authUsecase struct {
	repo repository.Querier
}

func NewAuthUsecase(repo repository.Querier) domain.AuthUsecase {
	return &authUsecase{repo: repo}
}

func (u *authUsecase) Login(ctx context.Context, username, password string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	user, err := u.repo.GetUserByUsername(ctx, username)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	// For now, return a dummy token. In real app, generate JWT.
	token := "dummy-token-for-" + user.Username
	return token, nil
}

func (u *authUsecase) Register(ctx context.Context, req *repository.CreateUserParams) (*repository.User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	hash, err := bcrypt.GenerateFromPassword([]byte(req.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	req.PasswordHash = string(hash)

	user, err := u.repo.CreateUser(ctx, *req)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (u *authUsecase) ListUsers(ctx context.Context) ([]repository.User, error) {
	return u.repo.ListUsers(ctx)
}
