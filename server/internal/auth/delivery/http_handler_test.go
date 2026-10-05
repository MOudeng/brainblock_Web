package delivery_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"brainblock-backend/internal/auth/delivery"
	mock_domain "brainblock-backend/internal/mocks/domain"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestAuthHandler_Login(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockUsecase := mock_domain.NewMockAuthUsecase(ctrl)
	val := validator.New()

	router := chi.NewRouter()
	delivery.NewAuthHandler(router, mockUsecase, val)

	testCases := []struct {
		name         string
		reqBody      interface{}
		mockBehavior func()
		expectedCode int
	}{
		{
			name: "Success Login",
			reqBody: delivery.LoginRequest{
				Username: "testuser",
				Password: "password123",
			},
			mockBehavior: func() {
				mockUsecase.EXPECT().
					Login(gomock.Any(), "testuser", "password123").
					Return("dummy-token", nil).
					Times(1)
			},
			expectedCode: http.StatusOK,
		},
		{
			name: "Invalid Credentials",
			reqBody: delivery.LoginRequest{
				Username: "testuser",
				Password: "wrongpassword",
			},
			mockBehavior: func() {
				mockUsecase.EXPECT().
					Login(gomock.Any(), "testuser", "wrongpassword").
					Return("", errors.New("invalid credentials")).
					Times(1)
			},
			expectedCode: http.StatusUnauthorized,
		},
		{
			name: "Bad Request - Missing Field",
			reqBody: map[string]string{
				"username": "testuser",
			},
			mockBehavior: func() {
				// Should not reach usecase
			},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()

			body, err := json.Marshal(tc.reqBody)
			require.NoError(t, err)

			req, err := http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
			require.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			assert.Equal(t, tc.expectedCode, rr.Code)
		})
	}
}
