package domain

import (
	"context"
	"brainblock-backend/internal/game/repository"
	"github.com/google/uuid"
)

type GameUsecase interface {
	CreateGameSession(ctx context.Context, req *repository.CreateGameSessionParams) (*repository.GameSession, error)
	ListLeaderboardByEvent(ctx context.Context, eventID uuid.UUID) ([]repository.ListLeaderboardByEventRow, error)
}
