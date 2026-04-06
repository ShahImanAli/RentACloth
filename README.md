# RTK E-Commerce & Rental Platform

A full-featured e-commerce and rental management platform built with React, Redux Toolkit, Firebase, and Stripe.

## Quick Start

**Install dependencies and run:**

```bash

npm install
.\run-project.bat

```

---

## Features

### **E-Commerce Core**

- Product catalog with advanced filtering and search
- Shopping cart with persistent storage (Redux + Local Storage)
- Wishlist functionality
- Category-based product organization (Men, Women, Kids)
- Detailed product pages with image galleries
- Secure checkout process with Stripe integration

### **Rental Management System**

- **Dual rental modes**: Hourly and daily rentals
- Interactive calendar for booking management
- Real-time availability tracking
- Inventory management with size/color variants
- Booking status tracking (Pending, Confirmed, Active, Completed, Cancelled, Overdue)
- Automated rental extensions
- Penalty calculation for overdue returns
- Duration-based discount tiers

### **Notification System**

- **Email notifications** via EmailJS:
  - Booking confirmations
  - Pickup reminders (24h before)
  - Return warnings (24h before due)
  - Overdue notices
- **In-app notifications**:
  - Real-time notification bell
  - Notification history panel
  - Automatic reminder scheduling

### **Customer Support**

- FAQ-based chatbot for instant assistance
- Quick responses for common questions
- Rental process guidance
- Product information support

### **Admin Dashboard**

- **Analytics & Metrics**:
  - Revenue tracking (today, week, month, year)
  - Top-performing products
  - Booking statistics
  - User activity monitoring
- **Product Management**:
  - CRUD operations for products
  - Bulk product updates
  - Inventory management
  - Image upload and management
- **Order & Rental Management**:
  - Order processing and tracking
  - Rental status updates
  - Return management
  - Penalty payment handling
- **User Management**:
  - User accounts overview
  - Role assignment
  - Activity monitoring
- **Database Management**:
  - Database migration tools
  - Data cleanup utilities
  - Backup and restore capabilities

### **Authentication & Security**

- Firebase Authentication
- Protected routes and admin-only sections
- Secure payment processing
- Role-based access control
- Session management

### **User Experience**

- Fully responsive design (mobile, tablet, desktop)
- Mobile-optimized navigation menu
- Smooth animations and transitions
- Loading states and error handling
- Offline detection and graceful degradation
- SEO-friendly routing

---

## Tech Stack

### **Frontend**

- **Framework**: React 19.1.1
- **State Management**: Redux Toolkit 2.8.2
- **Routing**: React Router DOM 7.8.0
- **Build Tool**: Vite 7.1.0
- **Styling**: Tailwind CSS 4.1.11
- **Icons**: React Icons, Heroicons
- **Charts**: Recharts 3.4.1
- **Date Handling**: date-fns 4.1.0

### **Backend & Database**

- **BaaS**: Firebase 12.1.0
  - Authentication
  - Firestore (NoSQL Database)
  - Cloud Functions (Node.js 20)
  - Cloud Storage
  - Hosting
- **Serverless Functions**: Firebase Cloud Functions 6.6.0

### **Payment Processing**

- **Stripe**: 19.1.0 (Server-side)
- **Stripe.js**: 8.1.0 (Client-side)
- **@stripe/react-stripe-js**: 5.2.0

### **Third-Party Services**

- **Email**: EmailJS (@emailjs/browser 4.4.1)
- **Email Templates**: Nodemailer 7.0.6 (Server-side)

### **Development Tools**

- **Linting**: ESLint 9.32.0
- **Package Manager**: npm
- **Version Control**: Git

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Firebase CLI**:
  ```bash
  npm install -g firebase-tools
  ```

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file in root directory:**
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

## How to Run

### **Option 1: Quick Start (Recommended)**

```bash

npm install
.\run-project.bat

```

### **Option 2: Separate Terminals**

**Terminal 1 :**

```bash
.\start-dev.bat
```

**Terminal 2 :**

```bash
npm run dev
```

**Made with using React, Firebase, and modern web technologies**
