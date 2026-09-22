# Aspom Staff Portal — App Installation Guide (PWA)

This guide explains how the **Aspom Travels Staff Portal** is configured to function as an installable application, and provides step-by-step installation instructions for **Android**, **iOS (iPhone/iPad)**, and **Desktop (Windows & Mac)**.

---

## 1. Technical Overview: How the App is Configured

The staff portal is built as a modern **Progressive Web Application (PWA)** using Next.js App Router and web platform standards. It delivers a native app experience without requiring download from Google Play Store or Apple App Store.

### Key Architectural Setup in the Codebase:
1. **Web App Manifest (`app/manifest.ts`)**:
   - Registered at `/manifest.webmanifest`.
   - Configured with `display: "standalone"` to run without browser address bars, tabs, or navigation buttons.
   - Declares official branding colors: Aspom Green (`#16a34a`) and background (`#ffffff`).
   - Defines **App Shortcuts / Quick Actions** (accessible by long-pressing or right-clicking the app icon):
     - ⏱️ **Clock In / Attendance** (`/my/attendance`)
     - 📋 **Daily Tasks & Reports** (`/my/tasks`)
     - 🏖️ **Request Leave** (`/my/leave`)
     - 🏠 **Staff Dashboard** (`/dashboard`)
   - Includes standard and maskable icons (192x192, 512x512) for smooth rendering across diverse Android launcher shapes.

2. **Apple Web App & Viewport Integration (`app/layout.tsx`)**:
   - `appleWebApp: { capable: true, statusBarStyle: "default", title: "Aspom Staff" }` enables true standalone fullscreen mode on iPhones and iPads.
   - `viewportFit: "cover"` ensures edge-to-edge layout accommodating iPhone notches and Dynamic Island.
   - Apple Touch Icon (`/apple-touch-icon.png`) is linked for sharp iOS home screen representation.

3. **Service Worker & Offline Fallback (`public/sw.js` & `components/pwa/register-sw.tsx`)**:
   - Auto-registers in both development and production.
   - Pre-caches critical assets and routes navigation failures to a branded `public/offline.html` page when staff experience poor network connectivity.
   - Listens for background Web Push notifications and handles clicks that bring existing portal windows into focus.

4. **In-App Install Prompt Banner (`components/pwa/install-prompt.tsx`)**:
   - Listens for the standard `beforeinstallprompt` event on Chromium browsers.
   - Displays a sleek banner at the bottom right (`Install Aspom Portal App — Quick access for clock-in & daily tasks`).
   - Automatically hides itself if the user is already running the portal inside standalone app mode.

---

## 2. Installation Guide

### A. Android (Google Chrome, Samsung Internet, Edge)

> [!NOTE]
> Android supports direct 1-tap installation and creates a native WebAPK in your app drawer with notification badges and long-press shortcuts.

#### Method 1: Using the In-App Prompt (Fastest)
1. Open **Google Chrome** (or your default browser) and navigate to the Staff Portal URL.
2. Sign in or stay on the home screen.
3. A banner will appear at the bottom of the screen: **"Install Aspom Portal App"**.
4. Tap the **Install** button.
5. In the Android confirmation dialog, tap **Install**.
6. The app icon will be added to your home screen and app drawer.

#### Method 2: Using the Browser Menu
1. Tap the **three vertical dots (⋮)** in the top-right corner of Chrome.
2. Select **"Install app"** or **"Add to Home screen"**.
3. Tap **Install** when prompted.

#### 💡 Android Power User Tip:
Long-press the Aspom app icon on your home screen to open the quick shortcuts menu: directly jump to **Clock In / Attendance**, **Daily Tasks**, or **Request Leave** without opening the dashboard first.

---

### B. iOS: iPhone & iPad (Safari)

> [!IMPORTANT]
> Apple does **not** allow browsers to trigger an automatic install pop-up banner. Installation on iPhone/iPad must be done through Safari's **Share** button.
>
> Push notifications on iOS also require the app to be installed to the Home Screen (iOS 16.4+).

1. Open **Safari** on your iPhone or iPad. *(Note: Must be Safari, not Chrome or in-app browsers like Gmail/WhatsApp).*
2. Navigate to the Staff Portal URL and log in.
3. Tap the **Share** button at the bottom navigation bar (a square with an arrow pointing upward: `􀈂`).
4. Scroll down the share options and tap **"Add to Home Screen"** (`+` icon).
5. The name will preview as **"Aspom Staff"** with the official Aspom icon. Tap **Add** in the top-right corner.
6. The Aspom Portal icon will now appear on your iPhone Home Screen.
7. Tap the new icon to launch it — it will open fullscreen as a dedicated native app without Safari's search bar or bottom navigation toolbar.

---

### C. Desktop (Windows, macOS, Linux)

> [!NOTE]
> Works best in modern Chromium-based browsers: **Google Chrome**, **Microsoft Edge**, and **Brave**.

#### Method 1: Address Bar Omnibox Icon (Recommended)
1. Open **Google Chrome** or **Microsoft Edge** and go to the Staff Portal URL.
2. Look at the right side of the browser's address bar (where you type the URL).
3. You will see an **Install icon**:
   - In **Chrome**: A small monitor icon with a down arrow (or "Install Aspom Travels Staff Portal").
   - In **Edge**: An app icon / plus sign labeled "App available. Install Aspom Portal".
4. Click the icon, then click **Install**.
5. The app opens immediately in its own borderless window. A desktop shortcut and Start Menu entry (Windows) or Applications launcher entry (Mac) is created automatically.

#### Method 2: Browser Settings Menu
- **Google Chrome**: Click the **three dots (⋮)** in the top-right corner ➔ **Save and share** (or **Cast, save, and share**) ➔ **Install Aspom Travels Staff Portal...**.
- **Microsoft Edge**: Click the **three dots (...)** in the top-right corner ➔ **Apps** ➔ **Install this site as an app**.

#### 💡 Desktop Features:
- **Pin to Taskbar / Dock**: Right-click the app icon in your Windows Taskbar or macOS Dock and select **"Pin to Taskbar"** or **"Keep in Dock"**.
- **Window Management**: Runs in its own Alt+Tab window separate from your standard browser tabs.
- **Auto Start**: In Windows/Mac, you can configure the app to launch on system startup by right-clicking the app title bar ➔ App Info ➔ Auto-start on device login.

---

## 3. Post-Installation: Enabling Push Reminders

Once installed on any device:
1. Open the Aspom Portal app.
2. Navigate to your **Profile / Settings** or click the push notification prompt when prompted.
3. Tap **"Enable Push Reminders"** and choose **Allow** when the system prompt asks for notification permissions.
4. You will now receive automatic reminders for:
   - **8:50 AM**: Morning Clock-In & Attendance reminder
   - **5:55 PM**: End-of-day Daily Report submission reminder
