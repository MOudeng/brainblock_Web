package usecase_test

import (
	"context"
	"errors"
	"testing"

	"brainblock-backend/internal/auth/repository"
	"brainblock-backend/internal/auth/usecase"
	mock_auth_repo "brainblock-backend/internal/mocks/auth_repo"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"golang.org/x/crypto/bcrypt"
)

func TestAuthUsecase_Login(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mock_auth_repo.NewMockQuerier(ctrl)
	uc := usecase.NewAuthUsecase(mockRepo)

	// Hash password for setup
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	testCases := []struct {
		name          string
		username      string
		password      string
		mockBehavior  func()
		expectedError error
	}{
		{
			name:     "Success Login",
			username: "testuser",
			password: "password123",
			mockBehavior: func() {
				mockRepo.EXPECT().
					GetUserByUsername(gomock.Any(), "testuser").
					Return(repository.User{
						Username:     "testuser",
						PasswordHash: string(hashedPassword),
					}, nil).
					Times(1)
			},
			expectedError: nil,
		},
		{
			name:     "User Not Found",
			username: "unknown",
			password: "password123",
			mockBehavior: func() {
				mockRepo.EXPECT().
					GetUserByUsername(gomock.Any(), "unknown").
					Return(repository.User{}, errors.New("not found")).
					Times(1)
			},
			expectedError: errors.New("invalid credentials"),
		},
		{
			name:     "Wrong Password",
			username: "testuser",
			password: "wrongpassword",
			mockBehavior: func() {
				mockRepo.EXPECT().
					GetUserByUsername(gomock.Any(), "testuser").
					Return(repository.User{
						Username:     "testuser",
						PasswordHash: string(hashedPassword),
					}, nil).
					Times(1)
			},
			expectedError: errors.New("invalid credentials"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockBehavior()
			token, err := uc.Login(context.Background(), tc.username, tc.password)

			if tc.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tc.expectedError.Error(), err.Error())
				assert.Empty(t, token)
			} else {
				require.NoError(t, err)
				assert.NotEmpty(t, token)
			}
		})
	}
}
