package domain

import (
	"context"
	"brainblock-backend/internal/participant/repository"
	"github.com/google/uuid"
)

type ParticipantUsecase interface {
	CreateParticipant(ctx context.Context, req *repository.CreateParticipantParams) (*repository.Participant, error)
	GetParticipantByUID(ctx context.Context, uid string, eventID uuid.UUID) (*repository.Participant, error)
	ListParticipantsByEvent(ctx context.Context, eventID uuid.UUID) ([]repository.Participant, error)
}
