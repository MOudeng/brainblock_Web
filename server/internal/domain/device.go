package domain

import (
	"context"
	"brainblock-backend/internal/device/repository"
	"github.com/google/uuid"
)

type DeviceUsecase interface {
	CreateDevice(ctx context.Context, req *repository.CreateDeviceParams) (*repository.Device, error)
	GetDevice(ctx context.Context, id uuid.UUID) (*repository.Device, error)
	ListDevicesByEvent(ctx context.Context, eventID uuid.UUID) ([]repository.Device, error)
	UpdateDeviceStatus(ctx context.Context, id uuid.UUID, status string) error
}
