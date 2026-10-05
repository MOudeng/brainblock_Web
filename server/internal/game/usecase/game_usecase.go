package usecase

import (
	"context"
	"time"

	"brainblock-backend/internal/domain"
	"brainblock-backend/internal/game/repository"
	"github.com/google/uuid"
)

type gameUsecase struct {
	repo repository.Querier
}

func NewGameUsecase(repo repository.Querier) domain.GameUsecase {
	return &gameUsecase{repo: repo}
}

func (u *gameUsecase) CreateGameSession(ctx context.Context, req *repository.CreateGameSessionParams) (*repository.GameSession, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	session, err := u.repo.CreateGameSession(ctx, *req)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

func (u *gameUsecase) ListLeaderboardByEvent(ctx context.Context, eventID uuid.UUID) ([]repository.ListLeaderboardByEventRow, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	leaderboard, err := u.repo.ListLeaderboardByEvent(ctx, eventID)
	if err != nil {
		return nil, err
	}

	return leaderboard, nil
}
