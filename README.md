<div align="center">
  <img src="https://img.shields.io/badge/BRAINBLOCK-Robotics-red?style=for-the-badge&logo=probot&logoColor=white" alt="Brainblock Logo">
  <h1>Brainblock System</h1>
  <p><strong>An automated cognitive and dexterity analysis system built on interactive robotic gameplay.</strong></p>
  
  <p>
    <a href="https://github.com/wahanamediadigital/brainblock/actions"><img src="https://img.shields.io/badge/CI%2FCD-Active-success?style=flat-square&logo=github-actions" alt="CI/CD Status"></a>
    <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" alt="Version"></a>
    <a href="docs/GITFLOW_GUIDE.md"><img src="https://img.shields.io/badge/Branching-GitFlow-orange?style=flat-square&logo=git" alt="GitFlow"></a>
  </p>
</div>

---

## 📖 About Brainblock
Brainblock is a cutting-edge robotics and software ecosystem designed to analyze and enhance cognitive and dexterity skills through gamification. The system features an AI-powered physical kiosk game synchronized with a real-time web dashboard for event organizers and participants.

## ✨ Key Features
- **Real-time Leaderboards:** WebSocket-powered spectator and live ranking system.
- **AI Health Reports:** Automated multi-provider LLM analysis for player cognitive feedback.
- **Integrated Payments:** Midtrans QRIS integration for automated ticketing.
- **Smart Notifications:** Real-time Telegram bot alerts for payment settlements.
- **Edge AI Processing:** Advanced YOLO and MediaPipe computer vision running on the robot.

---

## 🛠️ Technology Stack

### ⚙️ Backend (Domain-Driven Design)
![Go](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Chi Router](https://img.shields.io/badge/go--chi-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![SQLC](https://img.shields.io/badge/sqlc-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

### 🎨 Frontend
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

### 🧠 Edge AI & Robotics
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![Ultralytics](https://img.shields.io/badge/YOLO-00FFFF?style=for-the-badge&logo=yolo&logoColor=black)

### 🚀 DevOps & Infrastructure
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

---

## 📚 Documentation & Guidelines

To maintain code quality and organized collaboration, please refer to the following crucial documentation before contributing:

1. **[GitFlow & Branching Guide](docs/GITFLOW_GUIDE.md):** ⚠️ **MUST READ**. Standard Operating Procedure for creating branches, developing features, and fixing bugs using the GitFlow methodology.
2. **[Changelog](CHANGELOG.md):** Detailed history of all architectural changes, feature additions, bug fixes, and security patches.
3. **[Manual Testing & E2E Flow](docs/MANUAL_TESTING_MVP.md):** Guidelines for Quality Assurance (QA) and manual verification of the Kiosk-to-Dashboard flow.

---

## 🚦 Getting Started (Local Development)

### Prerequisites
- Docker & Docker Compose
- Go 1.25+
- Node.js 22+

### 1. Start the Database Environment
```bash
docker compose -f server/docker-compose.yml up -d
```

### 2. Run Backend API
```bash
cd server
make install    # Install goose, sqlc, and air
make migrate-up # Run database migrations
make run        # Run server with hot-reload (Air)
```

### 3. Run Frontend Web
```bash
cd client
npm install
npm run dev
```

---

<div align="center">
  <p><i>Developed with ❤️ by the Wahana Media Digital Team.</i></p>
</div>
