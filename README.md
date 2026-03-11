# Aspom Travels Staff Portal - Frontend

A premium, modern staff management portal built with Next.js 15, providing tools for HR, Inventory, CRM, and Employee Self-Service.

## 🚀 Key Modules

- **HR Dashboard**: Employee management, birthdays, and performance tracking.
- **Inventory System**: Asset tracking with history, automated status logging, and filtering.
- **Onboarding**: Multi-step application processing and document management.
- **My Portal**: Personal payslips, task management, and request tracking.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI (Radix UI)
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast)
- **State/Validation**: Zod + React Hook Form

## 🏗 Build Patterns & Architecture

### 1. Server-First Data Fetching

We prefer fetching data on the server within the `page.tsx` file to minimize client-side waterfalls and improve SEO/Performance.

- **Pattern**: `page.tsx (Server)` -> Fetch Data -> Pass as props to `ClientManager` or individual `Components`.

### 2. Centralized API Client

All requests must go through the centralized `apiClient` in `lib/api/client.ts`.

- **Global Handling**: Automatically intercepts `401 Unauthorized` responses to handle session expiration globally.
- **Session**: Auth tokens are managed via `lib/auth/session.ts` and injected into headers automatically.

### 3. Mutations via Server Actions

Use Next.js Server Actions for all data modifications. Actions should be stored in a local `actions.ts` file within the relevant route segment.

### 4. Layout & UI Guide

- **Responsive**: All components must use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).
- **Premium Aesthetic**: Use glassmorphism, subtle gradients, and standard Shadcn components for consistency.
- **Interactions**: Use `toast.promise` for async actions to provide immediate user feedback.

## 🔐 Security

- **Route Protection**: Managed via `proxy.ts` which acts as a fast gatekeeper, checking for the `auth_token` cookie.
- **Session Management**: Handled by Laravel Sanctum on the backend.

---

© 2026 Aspom Travels
