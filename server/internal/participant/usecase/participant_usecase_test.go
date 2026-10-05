package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	mock_participant_repo "brainblock-backend/internal/mocks/participant_repo"
	"brainblock-backend/internal/participant/repository"
	"brainblock-backend/internal/participant/usecase"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestParticipantUsecase_GetParticipantByUID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mock_participant_repo.NewMockQuerier(ctrl)
	uc := usecase.NewParticipantUsecase(mockRepo)

	eventID := uuid.New()
	now := time.Now()

	testCases := []struct {
		name                string
		uid                 string
		eventID             uuid.UUID
		mockBehavior        func()
		expectedError       error
		expectedParticipant *repository.Participant
	}{
		{
			name:    "Success Get Participant",
			uid:     "PES-001",
			eventID: eventID,
			mockBehavior: func() {
				mockRepo.EXPECT().
					GetParticipantByUID(gomock.Any(), repository.GetParticipantByUIDParams{
						Uid:     "PES-001",
						EventID: eventID,
					}).
					Return(repository.Participant{
						ID:        1,
						Uid:       "PES-001",
						EventID:   eventID,
						Name:      "Test Participant",
						CreatedAt: now,
					}, nil).
					Times(1)
			},
			expectedError: nil,
			expectedParticipant: &repository.Participant{
				ID:        1,
				Uid:       "PES-001",
				EventID:   eventID,
				Name:      "Test Participant",
				CreatedAt: now,
			},
		},
		{
			name:    "Not Found",
			uid:     "PES-002",
			eventID: eventID,
			mockBehavior: func() {
				mockRepo.EXPECT().
					GetParticipantByUID(gomock.Any(), repository.GetParticipantByUIDParams{
						Uid:     "PES-002",
						EventID: eventID,
					}).
					Return(repository.Participant{}, errors.New("not found")).
					Times(1)
			},
			expectedError:       errors.New("not found"),
			expectedParticipant: nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()
			participant, err := uc.GetParticipantByUID(context.Background(), tc.uid, tc.eventID)

			if tc.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tc.expectedError.Error(), err.Error())
				assert.Nil(t, participant)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.expectedParticipant, participant)
			}
		})
	}
}
