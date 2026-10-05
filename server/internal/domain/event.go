package domain

import (
	"context"

	"brainblock-backend/internal/event/repository"
	"github.com/google/uuid"
)

type EventUsecase interface {
	CreateEvent(ctx context.Context, req *repository.CreateEventParams) (*repository.Event, error)
	GetEvent(ctx context.Context, id uuid.UUID) (*repository.Event, error)
	ListEvents(ctx context.Context) ([]repository.Event, error)
}
