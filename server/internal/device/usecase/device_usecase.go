package usecase

import (
	"context"
	"time"

	"brainblock-backend/internal/domain"
	"brainblock-backend/internal/device/repository"
	"github.com/google/uuid"
)

type deviceUsecase struct {
	repo repository.Querier
}

func NewDeviceUsecase(repo repository.Querier) domain.DeviceUsecase {
	return &deviceUsecase{repo: repo}
}

func (u *deviceUsecase) CreateDevice(ctx context.Context, req *repository.CreateDeviceParams) (*repository.Device, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	device, err := u.repo.CreateDevice(ctx, *req)
	if err != nil {
		return nil, err
	}

	return &device, nil
}

func (u *deviceUsecase) GetDevice(ctx context.Context, id uuid.UUID) (*repository.Device, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	device, err := u.repo.GetDeviceByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &device, nil
}

func (u *deviceUsecase) ListDevicesByEvent(ctx context.Context, eventID uuid.UUID) ([]repository.Device, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	devices, err := u.repo.ListDevicesByEvent(ctx, eventID)
	if err != nil {
		return nil, err
	}

	return devices, nil
}

func (u *deviceUsecase) UpdateDeviceStatus(ctx context.Context, id uuid.UUID, status string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return u.repo.UpdateDeviceStatus(ctx, repository.UpdateDeviceStatusParams{
		ID:     id,
		Status: status,
	})
}
