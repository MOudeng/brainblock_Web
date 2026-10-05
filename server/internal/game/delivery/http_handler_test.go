package delivery_test

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"brainblock-backend/internal/game/delivery"
	"brainblock-backend/internal/game/repository"
	mock_domain "brainblock-backend/internal/mocks/domain"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestGameHandler_GetLeaderboard(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockUsecase := mock_domain.NewMockGameUsecase(ctrl)
	val := validator.New()

	router := chi.NewRouter()
	delivery.NewGameHandler(router, mockUsecase, val)

	eventID := uuid.New()
	now := time.Now()

	testCases := []struct {
		name         string
		url          string
		mockBehavior func()
		expectedCode int
	}{
		{
			name: "Success Get Leaderboard",
			url:  "/api/v1/events/" + eventID.String() + "/leaderboard",
			mockBehavior: func() {
				mockUsecase.EXPECT().
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
			expectedCode: http.StatusOK,
		},
		{
			name: "Internal Server Error",
			url:  "/api/v1/events/" + eventID.String() + "/leaderboard",
			mockBehavior: func() {
				mockUsecase.EXPECT().
					ListLeaderboardByEvent(gomock.Any(), eventID).
					Return(nil, errors.New("db error")).
					Times(1)
			},
			expectedCode: http.StatusInternalServerError,
		},
		{
			name: "Invalid Event ID",
			url:  "/api/v1/events/invalid-uuid/leaderboard",
			mockBehavior: func() {
				// Should not reach usecase
			},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()

			req, err := http.NewRequest(http.MethodGet, tc.url, nil)
			require.NoError(t, err)

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			assert.Equal(t, tc.expectedCode, rr.Code)
		})
	}
}
