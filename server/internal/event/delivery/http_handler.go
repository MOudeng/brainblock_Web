package delivery

import (
	"encoding/json"
	"net/http"

	"brainblock-backend/internal/domain"
	"brainblock-backend/internal/event/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type EventHandler struct {
	Usecase  domain.EventUsecase
	Validate *validator.Validate
}

func NewEventHandler(r *chi.Mux, us domain.EventUsecase, val *validator.Validate) {
	handler := &EventHandler{
		Usecase:  us,
		Validate: val,
	}
	r.Route("/api/v1/events", func(r chi.Router) {
		r.Get("/", handler.ListEvents)
		r.Post("/", handler.CreateEvent)
		r.Get("/{id}", handler.GetEvent)
	})
}

func (h *EventHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var req repository.CreateEventParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := h.Usecase.CreateEvent(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

func (h *EventHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		http.Error(w, "invalid uuid", http.StatusBadRequest)
		return
	}

	event, err := h.Usecase.GetEvent(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

func (h *EventHandler) ListEvents(w http.ResponseWriter, r *http.Request) {
	events, err := h.Usecase.ListEvents(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}
