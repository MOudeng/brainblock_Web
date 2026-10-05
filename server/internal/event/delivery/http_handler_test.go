package delivery_test

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"brainblock-backend/internal/event/delivery"
	"brainblock-backend/internal/event/repository"
	mock_domain "brainblock-backend/internal/mocks/domain"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestEventHandler_GetEvent(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockUsecase := mock_domain.NewMockEventUsecase(ctrl)
	val := validator.New()

	router := chi.NewRouter()
	delivery.NewEventHandler(router, mockUsecase, val)

	eventID := uuid.New()

	testCases := []struct {
		name         string
		url          string
		mockBehavior func()
		expectedCode int
	}{
		{
			name: "Success Get Event",
			url:  "/api/v1/events/" + eventID.String(),
			mockBehavior: func() {
				mockUsecase.EXPECT().
					GetEvent(gomock.Any(), eventID).
					Return(&repository.Event{
						ID:   eventID,
						Name: "Test Event",
						Date: time.Now(),
					}, nil).
					Times(1)
			},
			expectedCode: http.StatusOK,
		},
		{
			name: "Not Found",
			url:  "/api/v1/events/" + eventID.String(),
			mockBehavior: func() {
				mockUsecase.EXPECT().
					GetEvent(gomock.Any(), eventID).
					Return(nil, errors.New("not found")).
					Times(1)
			},
			expectedCode: http.StatusNotFound,
		},
		{
			name: "Invalid UUID",
			url:  "/api/v1/events/invalid-uuid",
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
