package usecase_test

import (
	"context"
	"errors"
	"testing"

	"brainblock-backend/internal/device/repository"
	"brainblock-backend/internal/device/usecase"
	mock_device_repo "brainblock-backend/internal/mocks/device_repo"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestDeviceUsecase_UpdateDeviceStatus(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mock_device_repo.NewMockQuerier(ctrl)
	uc := usecase.NewDeviceUsecase(mockRepo)

	deviceID := uuid.New()

	testCases := []struct {
		name          string
		id            uuid.UUID
		status        string
		mockBehavior  func()
		expectedError error
	}{
		{
			name:   "Success Update Status",
			id:     deviceID,
			status: "in_use",
			mockBehavior: func() {
				mockRepo.EXPECT().
					UpdateDeviceStatus(gomock.Any(), repository.UpdateDeviceStatusParams{
						ID:     deviceID,
						Status: "in_use",
					}).
					Return(nil).
					Times(1)
			},
			expectedError: nil,
		},
		{
			name:   "Database Error",
			id:     deviceID,
			status: "offline",
			mockBehavior: func() {
				mockRepo.EXPECT().
					UpdateDeviceStatus(gomock.Any(), repository.UpdateDeviceStatusParams{
						ID:     deviceID,
						Status: "offline",
					}).
					Return(errors.New("db error")).
					Times(1)
			},
			expectedError: errors.New("db error"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()
			err := uc.UpdateDeviceStatus(context.Background(), tc.id, tc.status)

			if tc.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tc.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
			}
		})
	}
}
