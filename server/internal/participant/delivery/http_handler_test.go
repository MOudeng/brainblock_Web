package delivery_test

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	mock_domain "brainblock-backend/internal/mocks/domain"
	"brainblock-backend/internal/participant/delivery"
	"brainblock-backend/internal/participant/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestParticipantHandler_GetParticipant(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockUsecase := mock_domain.NewMockParticipantUsecase(ctrl)
	val := validator.New()

	router := chi.NewRouter()
	delivery.NewParticipantHandler(router, mockUsecase, val)

	eventID := uuid.New()

	testCases := []struct {
		name         string
		url          string
		mockBehavior func()
		expectedCode int
	}{
		{
			name: "Success Get Participant",
			url:  "/api/v1/events/" + eventID.String() + "/participants/PES-001",
			mockBehavior: func() {
				mockUsecase.EXPECT().
					GetParticipantByUID(gomock.Any(), "PES-001", eventID).
					Return(&repository.Participant{
						ID:        1,
						Uid:       "PES-001",
						EventID:   eventID,
						Name:      "Test Participant",
						CreatedAt: time.Now(),
					}, nil).
					Times(1)
			},
			expectedCode: http.StatusOK,
		},
		{
			name: "Participant Not Found",
			url:  "/api/v1/events/" + eventID.String() + "/participants/PES-002",
			mockBehavior: func() {
				mockUsecase.EXPECT().
					GetParticipantByUID(gomock.Any(), "PES-002", eventID).
					Return(nil, errors.New("not found")).
					Times(1)
			},
			expectedCode: http.StatusNotFound,
		},
		{
			name: "Invalid Event ID",
			url:  "/api/v1/events/invalid-uuid/participants/PES-001",
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
