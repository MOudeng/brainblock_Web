package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"brainblock-backend/internal/event/repository"
	"brainblock-backend/internal/event/usecase"
	mock_event_repo "brainblock-backend/internal/mocks/event_repo"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestEventUsecase_GetEvent(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mock_event_repo.NewMockQuerier(ctrl)
	uc := usecase.NewEventUsecase(mockRepo)

	eventID := uuid.New()
	now := time.Now()

	testCases := []struct {
		name          string
		id            uuid.UUID
		mockBehavior  func()
		expectedError error
		expectedEvent *repository.Event
	}{
		{
			name: "Success Get Event",
			id:   eventID,
			mockBehavior: func() {
				mockRepo.EXPECT().
					GetEventByID(gomock.Any(), eventID).
					Return(repository.Event{
						ID:   eventID,
						Name: "Test Event",
						Date: now,
					}, nil).
					Times(1)
			},
			expectedError: nil,
			expectedEvent: &repository.Event{
				ID:   eventID,
				Name: "Test Event",
				Date: now,
			},
		},
		{
			name: "Event Not Found",
			id:   eventID,
			mockBehavior: func() {
				mockRepo.EXPECT().
					GetEventByID(gomock.Any(), eventID).
					Return(repository.Event{}, errors.New("not found")).
					Times(1)
			},
			expectedError: errors.New("not found"),
			expectedEvent: nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()
			event, err := uc.GetEvent(context.Background(), tc.id)

			if tc.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tc.expectedError.Error(), err.Error())
				assert.Nil(t, event)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.expectedEvent, event)
			}
		})
	}
}
