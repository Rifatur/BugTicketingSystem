# 🐛 Bug Ticketing System

project-based bug tracking and ticketing system built with **ASP.NET Core 10 Minimal APIs** backend and a modern **TailwindCSS + jQuery** frontend.

![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=flat-square&logo=microsoftsqlserver&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [User Guide](#-user-guide)
- [Workflow](#-workflow)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

The Bug Ticketing System is a full-featured issue tracking solution designed for QA/SQA teams and development organizations. It provides a streamlined workflow for capturing, tracking, and resolving software defects across multiple projects.

### Key Objectives

- **Centralized Bug Management**: Single platform for all bug tracking needs
- **Project Organization**: Organize bugs by projects and modules
- **Team Collaboration**: Assign bugs, add comments, and track progress
- **Analytics & Reporting**: Daily, weekly, and monthly reports with visual charts
- **Real-time Notifications**: Stay updated on bug assignments and status changes

## ✨ Features

### 🔹 Core Workflow

| Feature | Description |
|---------|-------------|
| **Issue Capture** | Log bugs directly from test execution with comprehensive details |
| **Ticket Generation** | Automatic unique ticket ID generation (BUG-YYMMDD-XXXX) |
| **Status Lifecycle** | Open → In Progress → Fixed → Verified → Closed |
| **Assignment** | Assign/reassign bugs to developers with notifications |
| **Attachments** | Upload screenshots, logs, and test data |

### 🔹 Dashboard

- **Real-time Statistics**: Total bugs, open bugs, critical issues, resolved today
- **Trend Charts**: 7-day bug opening/closing trends
- **Priority Distribution**: Visual breakdown by priority level
- **Recent Bugs**: Quick access to latest reported issues
- **Critical Bugs Panel**: Highlight urgent issues requiring attention

### 🔹 Ticket Management

- **Advanced Filtering**: By project, status, priority, developer
- **Search**: Full-text search by title or ticket ID
- **Inline Actions**: Quick status updates without opening modal
- **Bulk Operations**: Manage multiple tickets efficiently
- **Detailed View**: Complete bug information with activity history

### 🔹 Analytics & Reporting

| Report Type | Metrics Included |
|-------------|------------------|
| **Daily** | Bugs logged, resolved, pending critical, priority breakdown |
| **Weekly** | Trends, resolution time, recurring modules, developer performance |
| **Monthly** | Defect density, release readiness score, team performance |

### 🔹 Notifications

- In-app notification system
- Alerts for assignments, reassignments, status changes, and comments
- Read/unread tracking with mark all as read

## 🛠 Tech Stack

### Backend
┌─────────────────────────────────────────┐
│ ASP.NET Core 10 Minimal APIs │
├─────────────────────────────────────────┤
│ Entity Framework Core 10 │
├─────────────────────────────────────────┤
│ SQLite Database │ Sql Server
├─────────────────────────────────────────┤
│ Swagger/OpenAPI Documentation │
└─────────────────────────────────────────┘

### Frontend
┌─────────────────────────────────────────┐
│ HTML5 / CSS3 │
├─────────────────────────────────────────┤
│ TailwindCSS + Custom CSS │
├─────────────────────────────────────────┤
│ jQuery 3.7.1 │
├─────────────────────────────────────────┤
│ Chart.js (Analytics) │
└─────────────────────────────────────────┘



## 📦 Installation

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- Any modern web browser (Chrome, Firefox, Safari, Edge)




