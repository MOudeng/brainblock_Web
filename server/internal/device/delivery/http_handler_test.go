package delivery_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"brainblock-backend/internal/device/delivery"
	mock_domain "brainblock-backend/internal/mocks/domain"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestDeviceHandler_UpdateStatus(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockUsecase := mock_domain.NewMockDeviceUsecase(ctrl)
	val := validator.New()

	router := chi.NewRouter()
	delivery.NewDeviceHandler(router, mockUsecase, val)

	deviceID := uuid.New()

	testCases := []struct {
		name         string
		url          string
		reqBody      interface{}
		mockBehavior func()
		expectedCode int
	}{
		{
			name: "Success Update Status",
			url:  "/api/v1/devices/" + deviceID.String() + "/status",
			reqBody: map[string]string{
				"status": "in_use",
			},
			mockBehavior: func() {
				mockUsecase.EXPECT().
					UpdateDeviceStatus(gomock.Any(), deviceID, "in_use").
					Return(nil).
					Times(1)
			},
			expectedCode: http.StatusOK,
		},
		{
			name: "Invalid ID",
			url:  "/api/v1/devices/invalid-uuid/status",
			reqBody: map[string]string{
				"status": "in_use",
			},
			mockBehavior: func() {
				// Should not reach usecase
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Usecase Error",
			url:  "/api/v1/devices/" + deviceID.String() + "/status",
			reqBody: map[string]string{
				"status": "in_use",
			},
			mockBehavior: func() {
				mockUsecase.EXPECT().
					UpdateDeviceStatus(gomock.Any(), deviceID, "in_use").
					Return(errors.New("db error")).
					Times(1)
			},
			expectedCode: http.StatusInternalServerError,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()

			body, err := json.Marshal(tc.reqBody)
			require.NoError(t, err)

			req, err := http.NewRequest(http.MethodPatch, tc.url, bytes.NewReader(body))
			require.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			assert.Equal(t, tc.expectedCode, rr.Code)
		})
	}
}
