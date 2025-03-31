# TimeClock – Attendance Management System

TimeClock is a full-stack attendance management system designed to serve employees in Germany. The system displays the current time using an external API and allows regular users to record their check-in and check-out times, while the admin can view, edit, and manage all attendance records.

---

## Overview

TimeClock is built to mimic a standard attendance clock system with additional admin functionalities. It consists of:

- **User Authentication:** Login with username and password.
- **Attendance Recording:** Regular users can record their check-in and check-out times based on the current time in Germany (fetched from [timeapi.io](https://timeapi.io)).
- **Admin Dashboard:** Admin users can view all attendance records, edit individual records (including updating check-in/check-out times), and delete records if necessary.
- **Duration Calculation:** Each record shows the duration of work (calculated from check-in and check-out times).

---

## Features

### 1. **Real-Time German Time Display**
   - The system fetches the current time from an external API ([timeapi.io](https://timeapi.io)) to serve employees in Germany.
   - Berlin's date and time are displayed in real time on the dashboard.

### 2. **User Authentication**
   - Users log in with a predefined username and password.
   - Three user roles: **Admin (Manager)**, **Developer**, and **Sales**.

### 3. **Attendance Recording**
   - **Regular Users:** Can record their check-in and check-out times.
   - **Multiple Records:** Every check-in creates a new record; check-out updates the latest record if not already set, otherwise a new record is created.
   - **Duration Calculation:** Each record shows the exact duration (rounded up) between check-in and check-out.

### 4. **Admin Functionality**
   - **View Records:** Admin can see all attendance records.
   - **Edit Records:** Admin can update check-in and check-out times. When editing, the fields are pre-populated with the exact last recorded values.
   - **Delete Records:** Ability to remove an entire attendance record.

### 5. **Additional Enhancements**
   - **Responsive Design:** Built with React and styled with Tailwind CSS for a modern and responsive UI.
   - **File-Based Data Storage:** Instead of a database, attendance data is managed via a JSON file.
   - **Deployment Ready:** Easily deployable to platforms like GitHub and Netlify.

---

## Technologies & Tools

<div align="center">
  <img src="https://img.icons8.com/color/48/000000/react-native.png" alt="React" width="50px"/>
  <img src="https://img.icons8.com/color/48/000000/nodejs.png" alt="Express" width="50px"/>
  <img src="https://img.icons8.com/color/48/000000/tailwindcss.png" alt="Tailwind CSS" width="50px"/>
</div>

- **ReactJS:** For building the interactive frontend.
- **ExpressJS:** For creating the backend API.
- **Tailwind CSS:** For fast, responsive, utility-first styling.
- **Axios & Fetch API:** For HTTP requests (to the time API and internal endpoints).

---

## Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- Git

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/AlonShaul/TimeClock.git
   cd TimeClock
