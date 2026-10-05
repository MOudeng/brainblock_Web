package delivery

import (
	"encoding/json"
	"net/http"

	"brainblock-backend/internal/device/repository"
	"brainblock-backend/internal/domain"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type DeviceHandler struct {
	Usecase  domain.DeviceUsecase
	Validate *validator.Validate
}

func NewDeviceHandler(r *chi.Mux, us domain.DeviceUsecase, val *validator.Validate) {
	handler := &DeviceHandler{
		Usecase:  us,
		Validate: val,
	}
	r.Route("/api/v1/devices", func(r chi.Router) {
		r.Post("/", handler.CreateDevice)
		r.Get("/{id}", handler.GetDevice)
		r.Patch("/{id}/status", handler.UpdateStatus)
	})
	r.Get("/api/v1/events/{eventId}/devices", handler.ListDevicesByEvent)
}

func (h *DeviceHandler) CreateDevice(w http.ResponseWriter, r *http.Request) {
	var req repository.CreateDeviceParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	device, err := h.Usecase.CreateDevice(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(device)
}

func (h *DeviceHandler) GetDevice(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	device, err := h.Usecase.GetDevice(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(device)
}

func (h *DeviceHandler) ListDevicesByEvent(w http.ResponseWriter, r *http.Request) {
	eventID, err := uuid.Parse(chi.URLParam(r, "eventId"))
	if err != nil {
		http.Error(w, "invalid eventId", http.StatusBadRequest)
		return
	}

	devices, err := h.Usecase.ListDevicesByEvent(r.Context(), eventID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(devices)
}

type updateStatusReq struct {
	Status string `json:"status" validate:"required"`
}

func (h *DeviceHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var req updateStatusReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Usecase.UpdateDeviceStatus(r.Context(), id, req.Status); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
