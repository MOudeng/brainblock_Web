package usecase

import (
	"context"
	"time"

	"brainblock-backend/internal/domain"
	"brainblock-backend/internal/participant/repository"
	"github.com/google/uuid"
)

type participantUsecase struct {
	repo repository.Querier
}

func NewParticipantUsecase(repo repository.Querier) domain.ParticipantUsecase {
	return &participantUsecase{repo: repo}
}

func (u *participantUsecase) CreateParticipant(ctx context.Context, req *repository.CreateParticipantParams) (*repository.Participant, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	participant, err := u.repo.CreateParticipant(ctx, *req)
	if err != nil {
		return nil, err
	}

	return &participant, nil
}

func (u *participantUsecase) GetParticipantByUID(ctx context.Context, uid string, eventID uuid.UUID) (*repository.Participant, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	participant, err := u.repo.GetParticipantByUID(ctx, repository.GetParticipantByUIDParams{
		Uid:     uid,
		EventID: eventID,
	})
	if err != nil {
		return nil, err
	}

	return &participant, nil
}

func (u *participantUsecase) ListParticipantsByEvent(ctx context.Context, eventID uuid.UUID) ([]repository.Participant, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	participants, err := u.repo.ListParticipantsByEvent(ctx, eventID)
	if err != nil {
		return nil, err
	}

	return participants, nil
}
