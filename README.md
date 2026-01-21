# SACL Consultancy Project

A comprehensive Digital Trial Card and Inspection Management System designed for SACL. This application streamlines the process of tracking trials, conducting inspections across various departments, and generating detailed reports.

## 🚀 Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [Material UI (MUI)](https://mui.com/)
- **State Management**: React Context API (AuthContext)
- **Styling**: Vanilla CSS & MUI System

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: MySQL / MSSQL (via `mysql2` and `mssql` drivers)
- **Logging**: Winston & Morgan
- **Email**: Nodemailer & Resend

## 📁 Project Structure

```text
SACL_CONSULTANCY_Proj/
├── client/                # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components (admin, auth, common, etc.)
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # API communication layer
│   │   ├── theme/         # MUI Custom Theme (appTheme)
│   │   └── context/       # Global State (AuthContext)
├── server/                # Node.js Backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   └── middlewares/   # Auth and log middlewares
└── ecosystem.config.js    # PM2 configuration
```

## ✨ Key Features

- **RBAC (Role-Based Access Control)**: Different dashboards and permissions for Admin, HOD, and User roles.
- **Trial Management**: Create, track, and manage digital trial cards.
- **Multi-Department Inspections**:
  - Visual Inspection
  - Sand Plant Inspection
  - Pouring Inspection
  - Moulding Inspection
  - Metallurgical Inspection
- **Automated Reporting**: Generate and view PDF reports for closed trials.
- **Real-time Monitoring**: Track departmental progress and approval statuses.
- **Secure Authentication**: JWT-based authentication system.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16+)
- MSSQL Server
- npm or yarn

### 1. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (Create a `.env` file based on existing config).
4. Start the server (Dev mode):
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## 🚀 Deployment
The project is configured for deployment using **PM2**.
```bash
pm2 start ecosystem.config.js
```

---
*Created for SACL Consultancy Project*
