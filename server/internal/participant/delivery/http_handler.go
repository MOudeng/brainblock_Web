package delivery

import (
	"encoding/json"
	"net/http"

	"brainblock-backend/internal/domain"
	"brainblock-backend/internal/participant/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type ParticipantHandler struct {
	Usecase  domain.ParticipantUsecase
	Validate *validator.Validate
}

func NewParticipantHandler(r *chi.Mux, us domain.ParticipantUsecase, val *validator.Validate) {
	handler := &ParticipantHandler{
		Usecase:  us,
		Validate: val,
	}
	r.Route("/api/v1/events/{eventId}/participants", func(r chi.Router) {
		r.Post("/", handler.CreateParticipant)
		r.Get("/", handler.ListParticipants)
		r.Get("/{uid}", handler.GetParticipant)
	})
}

func (h *ParticipantHandler) CreateParticipant(w http.ResponseWriter, r *http.Request) {
	eventID, err := uuid.Parse(chi.URLParam(r, "eventId"))
	if err != nil {
		http.Error(w, "invalid eventId", http.StatusBadRequest)
		return
	}

	var req repository.CreateParticipantParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.EventID = eventID

	participant, err := h.Usecase.CreateParticipant(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(participant)
}

func (h *ParticipantHandler) ListParticipants(w http.ResponseWriter, r *http.Request) {
	eventID, err := uuid.Parse(chi.URLParam(r, "eventId"))
	if err != nil {
		http.Error(w, "invalid eventId", http.StatusBadRequest)
		return
	}

	participants, err := h.Usecase.ListParticipantsByEvent(r.Context(), eventID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(participants)
}

func (h *ParticipantHandler) GetParticipant(w http.ResponseWriter, r *http.Request) {
	eventID, err := uuid.Parse(chi.URLParam(r, "eventId"))
	if err != nil {
		http.Error(w, "invalid eventId", http.StatusBadRequest)
		return
	}
	uid := chi.URLParam(r, "uid")

	participant, err := h.Usecase.GetParticipantByUID(r.Context(), uid, eventID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(participant)
}
