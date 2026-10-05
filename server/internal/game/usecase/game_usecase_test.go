package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"brainblock-backend/internal/game/repository"
	"brainblock-backend/internal/game/usecase"
	mock_game_repo "brainblock-backend/internal/mocks/game_repo"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestGameUsecase_ListLeaderboardByEvent(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mock_game_repo.NewMockQuerier(ctrl)
	uc := usecase.NewGameUsecase(mockRepo)

	eventID := uuid.New()
	now := time.Now()

	testCases := []struct {
		name                string
		eventID             uuid.UUID
		mockBehavior        func()
		expectedError       error
		expectedLeaderboard []repository.ListLeaderboardByEventRow
	}{
		{
			name:    "Success List Leaderboard",
			eventID: eventID,
			mockBehavior: func() {
				mockRepo.EXPECT().
					ListLeaderboardByEvent(gomock.Any(), eventID).
					Return([]repository.ListLeaderboardByEventRow{
						{
							Uid:          "PES-001",
							Name:         "Player 1",
							Score:        100.5,
							LevelReached: 3,
							StartTime:    now.Add(-10 * time.Minute),
							EndTime:      now,
						},
					}, nil).
					Times(1)
			},
			expectedError: nil,
			expectedLeaderboard: []repository.ListLeaderboardByEventRow{
				{
					Uid:          "PES-001",
					Name:         "Player 1",
					Score:        100.5,
					LevelReached: 3,
					StartTime:    now.Add(-10 * time.Minute),
					EndTime:      now,
				},
			},
		},
		{
			name:    "Database Error",
			eventID: eventID,
			mockBehavior: func() {
				mockRepo.EXPECT().
					ListLeaderboardByEvent(gomock.Any(), eventID).
					Return(nil, errors.New("db error")).
					Times(1)
			},
			expectedError:       errors.New("db error"),
			expectedLeaderboard: nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()
			leaderboard, err := uc.ListLeaderboardByEvent(context.Background(), tc.eventID)

			if tc.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tc.expectedError.Error(), err.Error())
				assert.Nil(t, leaderboard)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.expectedLeaderboard, leaderboard)
			}
		})
	}
}
