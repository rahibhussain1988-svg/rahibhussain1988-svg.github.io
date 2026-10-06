# 🏥 Apex Clinic Healthcare OS

> **A Synchronized Multi-Station Healthcare Management Operating System for Modern Clinics, Poly-Clinics & Medical OPDs.**  
> *Engineered for local clinical realities: 100% Offline-Resilient • Zero Hardware Lock-in • Universal Thermal & Laser Printing • Multi-Tenant Governance.*

---

## 🌟 Executive Overview

**Apex Clinic Healthcare OS** is a unified digital clinical operating system designed to replace chaotic paper registers, crowded waiting halls, unreadable prescriptions, and dispensary revenue leakage with a synchronized 6-station clinical workflow.

Operating seamlessly offline as an installed Progressive Web App (PWA), Apex Clinic OS runs on standard hardware (laptops, tablets, Android Smart TVs, POS receipt printers, and laser printers) without expensive monthly cloud subscriptions.

---

## 🖥️ The 6 Interconnected Clinical Workstations

### 1. 📱 Touchscreen Patient Self-Service Kiosk (`PATIENT_KIOSK`)
* **3D Visual Symptom Cards**: High-definition 3D medical illustrations (Cardiology, Dermatology, Orthopedics, Pediatrics, Diabetes, Fever, Respiratory) enable patients of any literacy level to self-triage in seconds.
* **Automated Doctor & Cabin Routing**: Intelligent clinical rules map symptoms directly to the corresponding specialist cabin.
* **Mobile Appointment Check-in**: Pre-booked patients enter their mobile number for instant priority queue token generation.
* **STAT Emergency Fast-Track**: Critical symptoms (severe chest pain, acute trauma, dyspnea) trigger priority `EMG-XX` tokens and immediately route to the Treatment Room head-of-line.
* **Auto-Closing Thermal Slips**: Issues 80mm/58mm thermal queue slips with a 2-second auto-close timer.

### 2. 📺 TV Lounge Queue Display (`CABIN_QUEUE_TV`)
* **Automated Vocal Audio Announcements**: Gentle hospital chime followed by realistic text-to-speech announcement:  
  *"Token C-104 please proceed to Cabin 2 with Dr. Elena"*, eliminating shouted names and waiting hall confusion.
* **Large Visual Spotlight Matrix**: Displays current called patient, active consultations across all 5 cabins, emergency priority banners, and transparent estimated wait times.
* **Sub-5ms Synchronization**: Instant multi-screen synchronization via browser `BroadcastChannel` with zero cloud lag.

### 3. 👨‍⚕️ Doctor Cabin Workstation Console (`DOCTOR_CABIN`)
* **Top Real-Time KPI Bar**: Live metrics tracking Patients Seen Today, Weekly (7d), Monthly (MTD), Active Queue count with STAT emergency alert, Prescriptions issued today, and average consult duration (e.g. 7.2 min).
* **Queue Command Hub**: Hero card displays the next patient in line with token, triage severity, symptoms, vitals (BP, Temp, Pulse, SpO2), and payment status. 1-tap `Call to Cabin`, `Direct Consult`, or `Return Token`.
* **1-Tap Quick-Add Routine Medications**: Quick-add chips for routine drugs (*Panadol 500mg, Augmentin 625mg, Brufen 400mg, Omeprazole 20mg, Cetirizine, Flagyl*).
* **Inline Interactive Regimen Chips**: 1-click frequency pills (`OD`, `BD`, `TDS`, `PRN`) and duration chips (`3d`, `5d`, `7d`, `14d`, `30d`).
* **Quick Diagnostic Labs & Past History Repeat**: Rapid 1-tap ordering of CBC, RBS, Serum Creatinine, ECG, or repeating past chronic visit prescriptions in 1 click.
* **Prescription Printing with 2-Second Auto-Close**: Generates A5 Landscape, A4 Laser, or 80mm Thermal prescriptions, automatically closing after print.

### 4. 💊 In-House Pharmacy & POS Desk (`INHOUSE_PHARMACY`)
* **Dual-Side Touch POS Calculator (`PosPaymentKeypad`)**:
  * **Side A (Doctor Prescriptions Queue)**: Loads electronic prescriptions from cabins, calculates totals, cash tendered, and exact change due.
  * **Side B (Walk-in OTC Retail Counter)**: Rapid search of formulary inventory, custom discounts, cash change calculation, and retail customer receipts.
* **Automatic Stock Deduction**: Dispensation immediately deducts quantities from the inventory formulary with real-time low-stock and expiry warnings.

### 5. 🧾 Reception Desk & Cashier Billing POS (`BILLING_PHARMACY`)
* **10-Second Walk-In Intake**: Quick token creation with clinical triage vitals (BP, Temp, Pulse, SpO2, Weight).
* **Flexible Payment Models**: Supports local clinical collection habits:
  1. *Upfront Payment at Reception Desk* (`PAID_UPFRONT`)
  2. *Payment Directly Inside Doctor's Cabin* (`PAY_IN_CABIN`)
  3. *Payment at Cashier Counter After Consult* (`CASHIER`)
* **Dual Print Engines**: 80mm/58mm thermal queue tokens (zero fee amount for patient privacy) and comprehensive A4/A5 laser invoices with insurance co-pay itemization.
* **1-Click Shift Reports**: Cash collected, card swipes, discounts, and net clinic revenue reconciliation.

### 6. 🛡️ Super Admin & Clinic Admin Governance (`SUPER_ADMIN_DASHBOARD` / `ADMIN_DASHBOARD`)
* **Super Admin Clinic-Level Feature Management**: Granular feature toggle matrix enabling or disabling Kiosk, TV, Cabin, Pharmacy, or Billing per clinic independently.
* **Clinic Admin Emergency Operations**: Emergency minor procedures catalog, pricing, kits, and trauma routing.
* **Enterprise Security & Auditing**: Role-based access control (RBAC), Kiosk device PIN screen locks, 30-day Google Authenticator (TOTP) renewal tracking, and comprehensive audit logs.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* Any modern web browser (Google Chrome, Microsoft Edge, Brave, Safari)

### Installation
```bash
# Clone the repository
git clone https://github.com/backupsiftp-max/Apex-Clinic.git

# Navigate into the project directory
cd Apex-Clinic

# Install dependencies
npm install
```

### Running Development Server
```bash
npm run dev
# Server will start at http://127.0.0.1:5174/
```

### Production Build
```bash
npm run build
```

---

## 🧪 Testing Suites

```bash
# Run End-to-End User Acceptance Test (UAT) Suite (53 Scenarios)
npm test

# Run 87-Point White Smoke Test Suite
npm run smoke

# Check Code Quality & Linter
npm run lint

# Generate Publication-Grade Promotion Brochure PDF
npm run generate-pdf
```

---

## 📄 Promotional Brochure

A complete 4-page promotional brochure in PDF format is available in the repository:
* Local file: `Apex_Clinic_Healthcare_OS_Promotion_Document.pdf`
* Web download: `http://127.0.0.1:5174/Apex_Clinic_Healthcare_OS_Promotion_Document.pdf`

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Tailwind CSS v4, Lucide React Icons
* **Build Tool**: Vite v8
* **Document & Print Generation**: jsPDF, html2canvas, Native Web Print API
* **Audio Engine**: Web Audio API (Synthesized hospital chimes) & Web Speech Synthesis API
* **Linter**: Oxlint

---

## 📝 License

Proprietary clinical management software. All rights reserved © 2026 Apex Medical Systems.
