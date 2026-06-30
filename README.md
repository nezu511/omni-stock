# 📦 Omni-Stock — Lab Inventory Management System

A full-stack web application for managing laboratory consumables and reagents.
Built for real-world use in a university research lab.

![Home Screen](docs/guide-images/01_home.png)

---

## ✨ Features

- **Real-time stock tracking** — Consume and restock items; history is always recorded
- **Box/unit conversion** — Items like test tubes (1 box = 10 units) handled natively; input in boxes, stored as units
- **Low-stock alerts** — Home dashboard highlights items below threshold with box-aware display (e.g., "26 (2箱+6個)")
- **Order status workflow** — Track items through `None → Ordered → Arrived` states
- **Reagent request system** — Lab members submit purchase requests; manager tracks status
- **Real-time notifications** — Server-Sent Events (SSE) + Web Notifications API for arrival alerts
- **Multilingual UI** — Japanese / English toggle
- **Image support** — Upload product photos for quick visual identification
- **Keyword search** — Search by name, English name, or custom keywords

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | SQLite |
| Styling | Inline styles (zero-dependency) |
| Testing | Playwright (headless Chromium) |
| Docs | Pandoc + XeLaTeX → PDF |

---

## 📸 Screenshots

| Consume (使用) | Restock (入荷) |
|---|---|
| ![Consume](docs/guide-images/02_consume.png) | ![Restock](docs/guide-images/04_restock.png) |

| Reagents (試薬) | Manage (管理) |
|---|---|
| ![Reagents](docs/guide-images/05_reagents.png) | ![Manage](docs/guide-images/06_manage.png) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/omni-stock.git
cd omni-stock
```

### 2. Backend setup

```bash
cd backend
npm install
npx prisma db push     # create SQLite database
npx tsx index.ts       # start backend on :3001
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev            # start frontend on :5173
```

### 4. Open in browser

```
http://localhost:5173
```

> **Lab network usage**: Start both servers on one shared PC, then have lab members open `http://<PC's IP address>:5173` in their browser.

---

## 📁 Project Structure

```
omni-stock/
├── backend/
│   ├── index.ts          # Express API server
│   ├── prisma/
│   │   └── schema.prisma # Data models
│   └── uploads/          # Uploaded product images
├── frontend/
│   └── src/
│       ├── pages/        # Page components (Home, Consume, Restock, ...)
│       ├── contexts/     # Language context
│       ├── locales/      # i18n strings (ja / en)
│       └── utils/        # formatQuantity, searchItems, ...
└── docs/
    ├── user_guide.md     # User guide (Japanese, with screenshots)
    ├── user_guide.pdf    # PDF version for lab distribution
    └── product.md        # Product specification
```

---

## 📄 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List all items with history |
| POST | `/api/items` | Create item |
| PATCH | `/api/items/:id` | Update item metadata |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/quantity_change` | Consume or restock (with stock guard) |
| PATCH | `/api/change_status` | Update order status |
| GET | `/api/reagents` | List reagents with requests |
| POST | `/api/reagents` | Create reagent |
| POST | `/api/reagent_requests` | Submit purchase request |
| GET | `/api/notifications/stream` | SSE stream for real-time alerts |
| POST | `/api/upload` | Upload product image |

---

## 📖 User Guide

A full user guide with screenshots is available in Japanese:

- [`docs/user_guide.md`](docs/user_guide.md)
- [`docs/user_guide.pdf`](docs/user_guide.pdf)

---

## License

MIT
