package delivery

import (
	"encoding/json"
	"net/http"

	"brainblock-backend/internal/domain"
	"brainblock-backend/internal/game/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type GameHandler struct {
	Usecase  domain.GameUsecase
	Validate *validator.Validate
}

func NewGameHandler(r *chi.Mux, us domain.GameUsecase, val *validator.Validate) {
	handler := &GameHandler{
		Usecase:  us,
		Validate: val,
	}
	r.Route("/api/v1/games", func(r chi.Router) {
		r.Post("/", handler.CreateSession)
	})
	r.Get("/api/v1/events/{eventId}/leaderboard", handler.GetLeaderboard)
}

func (h *GameHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req repository.CreateGameSessionParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	session, err := h.Usecase.CreateGameSession(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

func (h *GameHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	eventID, err := uuid.Parse(chi.URLParam(r, "eventId"))
	if err != nil {
		http.Error(w, "invalid eventId", http.StatusBadRequest)
		return
	}

	board, err := h.Usecase.ListLeaderboardByEvent(r.Context(), eventID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(board)
}
