# Procurement & Asset Management System

A full-stack web application developed to streamline procurement, contract management, inventory tracking, plant operations, and project budget management through a centralized platform.

---

## Features

### Authentication & User Management
- Secure Login System
- Role-Based Access Control
- Dynamic Permission Management
- Profile Management
- Change Password
- Email Notifications

### Procurement Management
- Network & Bandwidth Management
- Annual Maintenance Contract (AMC)
- Contract Resource & Support PRs
- Purchase Order Management
- Invoice Management
- Balance Amount Tracking
- Document Upload (PDF)
- Excel Import & Export

### IT Inventory Management
- Network Inventory
- Hardware Inventory
- Department Inventory

### Plant Management
- Plant Material Records
- Plant Service Records

### WBS Project Management
- Project Budget Tracking
- Expense Monitoring
- Remaining Budget Calculation

### Additional Features
- Dashboard Analytics
- Search & Filter
- CRUD Operations
- Toast Notifications
- Confirmation Dialogs
- File Upload Management

---

# Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (ES6)

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Libraries

- Multer
- XLSX
- Nodemailer
- bcryptjs
- dotenv
- CORS
- Chart.js

---

# Project Structure

```
JSL-PROJECT
│
├── BACKEND
│   ├── config
│   ├── models
│   ├── routes
│   ├── services
│   ├── templates
│   ├── server.js
│   └── package.json
│
├── FRONTEND
│   ├── HTML Pages
│   ├── CSS Files
│   ├── JavaScript Files
│   ├── Images
│   └── Assets
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yashkumar1907/Procurement-Asset-Management-System.git
```

## Backend Setup

```bash
cd BACKEND
npm install
```

Create a `.env` file inside the BACKEND folder.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

Run the backend:

```bash
npm start
```

Open the frontend by launching `login.html`.

---

# Main Modules

- User Authentication
- Dashboard
- Network & Bandwidth Management
- Annual Maintenance Contract
- Contract Resource & Support PRs
- IT Inventory
- Plant Material
- Plant Service
- WBS Project Management

---

# Future Enhancements

- Forgot Password
- Email Verification
- Mobile Responsive Design
- Advanced Reports
- ERP Integration
- Audit Logs
- Multi-Organization Support

---

# License

This project is intended for educational and portfolio purposes.