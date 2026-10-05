package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	authDelivery "brainblock-backend/internal/auth/delivery"
	authRepo "brainblock-backend/internal/auth/repository"
	authUsecase "brainblock-backend/internal/auth/usecase"

	eventDelivery "brainblock-backend/internal/event/delivery"
	eventRepo "brainblock-backend/internal/event/repository"
	eventUsecase "brainblock-backend/internal/event/usecase"

	deviceDelivery "brainblock-backend/internal/device/delivery"
	deviceRepo "brainblock-backend/internal/device/repository"
	deviceUsecase "brainblock-backend/internal/device/usecase"

	participantDelivery "brainblock-backend/internal/participant/delivery"
	participantRepo "brainblock-backend/internal/participant/repository"
	participantUsecase "brainblock-backend/internal/participant/usecase"

	gameDelivery "brainblock-backend/internal/game/delivery"
	gameRepo "brainblock-backend/internal/game/repository"
	gameUsecase "brainblock-backend/internal/game/usecase"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-playground/validator/v10"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// 1. Init Database
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// Fallback to constructing DSN from individual components
		host := os.Getenv("DB_HOST")
		user := os.Getenv("DB_USER")
		pass := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		port := os.Getenv("DB_PORT")
		
		if host != "" && user != "" && dbName != "" {
			dsn = "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + dbName + "?sslmode=disable"
		} else {
			log.Fatal("DATABASE_URL or individual DB_* variables must be set")
		}
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatalf("Database is unreachable: %v", err)
	}

	// 2. Init Dependencies
	val := validator.New()
	
	// Auth Module
	aRepo := authRepo.New(db)
	aUsecase := authUsecase.NewAuthUsecase(aRepo)
	
	// Event Module
	eRepo := eventRepo.New(db)
	eUsecase := eventUsecase.NewEventUsecase(eRepo)

	// Device Module
	dRepo := deviceRepo.New(db)
	dUsecase := deviceUsecase.NewDeviceUsecase(dRepo)

	// Participant Module
	pRepo := participantRepo.New(db)
	pUsecase := participantUsecase.NewParticipantUsecase(pRepo)

	// Game Module
	gRepo := gameRepo.New(db)
	gUsecase := gameUsecase.NewGameUsecase(gRepo)

	// 3. Setup Router
	r := chi.NewRouter()
	
	// Basic CORS middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
			w.Header().Set("Access-Control-Allow-Credentials", "false")
			w.Header().Set("Cross-Origin-Resource-Policy", "cross-origin")
			if req.Method == "OPTIONS" {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, req)
		})
	})
	
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("BRAINBLOCK Block Design API (DDD) is running"))
	})
	
	r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// 4. Wire Handlers
	authDelivery.NewAuthHandler(r, aUsecase, val)
	eventDelivery.NewEventHandler(r, eUsecase, val)
	deviceDelivery.NewDeviceHandler(r, dUsecase, val)
	participantDelivery.NewParticipantHandler(r, pUsecase, val)
	gameDelivery.NewGameHandler(r, gUsecase, val)

	// 5. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
