package usecase

import (
	"context"
	"time"

	"brainblock-backend/internal/domain"
	"brainblock-backend/internal/event/repository"
	"github.com/google/uuid"
)

type eventUsecase struct {
	repo repository.Querier
}

func NewEventUsecase(repo repository.Querier) domain.EventUsecase {
	return &eventUsecase{repo: repo}
}

func (u *eventUsecase) CreateEvent(ctx context.Context, req *repository.CreateEventParams) (*repository.Event, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	event, err := u.repo.CreateEvent(ctx, *req)
	if err != nil {
		return nil, err
	}

	return &event, nil
}

func (u *eventUsecase) GetEvent(ctx context.Context, id uuid.UUID) (*repository.Event, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	event, err := u.repo.GetEventByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &event, nil
}

func (u *eventUsecase) ListEvents(ctx context.Context) ([]repository.Event, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	events, err := u.repo.ListEvents(ctx)
	if err != nil {
		return nil, err
	}

	return events, nil
}
