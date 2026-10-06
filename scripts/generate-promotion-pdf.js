import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

console.log('Generating Publication-Grade Promotion Document PDF...');

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = 210;
const pageHeight = 297;
const margin = 14;
const contentWidth = pageWidth - (margin * 2); // 182mm

// Color Palette
const COLORS = {
  primaryDark: [15, 23, 42],     // #0F172A - Slate 900
  brandBlue: [30, 58, 138],       // #1E3A8A - Blue 900
  brandAccent: [2, 132, 199],     // #0284C7 - Sky 600
  teal: [13, 148, 136],           // #0D9488 - Teal 600
  emerald: [5, 150, 105],         // #059669 - Emerald 600
  rose: [225, 29, 72],            // #E11D48 - Rose 600
  amber: [217, 119, 6],           // #D97706 - Amber 600
  purple: [124, 58, 237],         // #7C3AED - Violet 600
  slateText: [51, 65, 85],        // #334155 - Slate 700
  slateMuted: [100, 116, 139],    // #64748B - Slate 500
  cardBg: [248, 250, 252],        // #F8FAFC - Slate 50
  cardBorder: [226, 232, 240],    // #E2E8F0 - Slate 200
  white: [255, 255, 255]
};

// Helper: Running Header
function drawRunningHeader(title, pageNum, totalPages) {
  // Top bar
  doc.setFillColor(...COLORS.brandBlue);
  doc.rect(margin, 10, contentWidth, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.brandBlue);
  doc.text('APEX CLINIC HEALTHCARE OS', margin, 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.slateMuted);
  doc.text(title.toUpperCase(), margin + 55, 8);

  doc.text(`OCTOBER 2026 • OFFICIAL PRODUCT BROCHURE`, pageWidth - margin, 8, { align: 'right' });
}

// Helper: Running Footer
function drawRunningFooter(pageNum, totalPages) {
  const y = pageHeight - 10;
  doc.setDrawColor(...COLORS.cardBorder);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 3, pageWidth - margin, y - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.slateMuted);
  doc.text('Apex Medical Systems • Empowering Local Healthcare Facilities & Modern Medical Practices', margin, y + 1);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.brandBlue);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, y + 1, { align: 'right' });
}

// Helper: Card Box
function drawCard(x, y, w, h, bgColor = COLORS.cardBg, borderColor = COLORS.cardBorder, radius = 2) {
  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, radius, radius, 'FD');
}

// Helper: Badge Pill
function drawBadge(x, y, text, bgColor = COLORS.brandBlue, textColor = COLORS.white) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const textWidth = doc.getTextWidth(text);
  const badgeW = textWidth + 5;
  const badgeH = 4.2;
  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y - 3.2, badgeW, badgeH, 1, 1, 'F');
  doc.setTextColor(...textColor);
  doc.text(text, x + 2.5, y);
  return badgeW;
}

// Helper: Bullet Item
function drawBulletItem(x, y, title, desc, w = 82) {
  doc.setFillColor(...COLORS.brandAccent);
  doc.circle(x + 1, y - 1, 0.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(title, x + 3.5, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(desc, w);
  doc.text(splitDesc, x + 3.5, y + 3.8);
  return y + 4 + (splitDesc.length * 3.4);
}

// =========================================================================
// PAGE 1: COVER & EXECUTIVE SOLUTION OVERVIEW
// =========================================================================
console.log('Rendering Page 1: Cover & Executive Solution Overview...');
drawRunningHeader('Platform Overview & Executive Summary', 1, 4);

// Hero Header Banner
doc.setFillColor(...COLORS.primaryDark);
doc.roundedRect(margin, 14, contentWidth, 38, 2.5, 2.5, 'F');

// Decorative accent stripe on left of banner
doc.setFillColor(...COLORS.brandAccent);
doc.rect(margin, 14, 2.5, 38, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.brandAccent);
doc.text('MULTI-STATION HEALTHCARE OPERATING SYSTEM • LOCAL CLINIC EDITION', margin + 7, 21);

doc.setFontSize(17);
doc.setTextColor(...COLORS.white);
doc.text('APEX CLINIC HEALTHCARE OS', margin + 7, 28);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.8);
doc.setTextColor(226, 232, 240);
doc.text('The Complete Digital Operating System for Modern Clinics, Poly-Clinics & Medical OPDs', margin + 7, 34);

doc.setFontSize(7.8);
doc.setTextColor(148, 163, 184);
doc.text('Touchscreen Kiosk  •  TV Queue Display  •  Doctor Cabin Workstation  •  In-House Pharmacy POS  •  Billing & Triage', margin + 7, 40);
doc.text('100% Offline-Ready Progressive Web Architecture  •  Thermal POS & Laser Printing  •  Zero Cloud Lock-in', margin + 7, 45);

// Section 1: The Local Clinic Challenge vs The Apex Solution (2 Columns)
let curY = 56;
const colW = (contentWidth - 6) / 2; // 88mm each

// Left Card: The Challenge
drawCard(margin, curY, colW, 46, [255, 241, 242], [254, 205, 211]); // soft rose
drawBadge(margin + 4, curY + 6, 'CURRENT REALITY', COLORS.rose, COLORS.white);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...COLORS.rose);
doc.text('The Chaos in Traditional Clinics', margin + 35, curY + 5.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateText);
const challenges = [
  '• Waiting Room Clutter: Crowded receptions, disputes over turn, line jumping.',
  '• Handwritten Prescriptions: Unreadable slips, dosage errors, zero past EMR history.',
  '• Revenue & Medicine Leakage: Patients taking prescriptions to external pharmacies.',
  '• Cashier Discrepancies: Missing fee records, manual registers, no shift audits.',
  '• Internet Dependency: Cloud software freezes during internet or electricity cuts.'
];
let chY = curY + 11.5;
challenges.forEach(c => {
  doc.text(c, margin + 4, chY);
  chY += 6.5;
});

// Right Card: The Solution
drawCard(margin + colW + 6, curY, colW, 46, [240, 253, 250], [204, 251, 241]); // soft teal
drawBadge(margin + colW + 10, curY + 6, 'APEX SOLUTION', COLORS.teal, COLORS.white);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...COLORS.teal);
doc.text('The Apex Synchronized Experience', margin + colW + 41, curY + 5.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateText);
const solutions = [
  '• Automated Touch Triage: Patients get queue tokens via 3D visual symptom cards.',
  '• Real-time Lounge TV Sync: Video board + audio chimes announce next token.',
  '• 1-Tap Doctor Rx Pad: Pre-loaded routine medicines, duration and lab chips.',
  '• Dual-Side Pharmacy POS: Touch cash calculator, stock deduction, direct OTC sales.',
  '• Offline Resilience: Runs 100% offline; synchronizes across all cabin devices.'
];
let solY = curY + 11.5;
solutions.forEach(s => {
  doc.text(s, margin + colW + 10, solY);
  solY += 6.5;
});

// Key Metrics Bar (4 KPI cards)
curY = 106;
const kpiW = (contentWidth - 9) / 4; // ~42.75mm
const kpiH = 22;

const KPIS = [
  { val: '75%', label: 'FASTER INTAKE', desc: 'Touchscreen self-token issuance under 30s', color: COLORS.brandAccent },
  { val: '0%', label: 'RX LEAKAGE', desc: 'Direct electronic routing to in-house pharmacy', color: COLORS.emerald },
  { val: '35%+', label: 'PATIENT CAPACITY', desc: 'Faster consults & seamless queue calling', color: COLORS.purple },
  { val: '100%', label: 'OFFLINE READY', desc: 'Zero downtime during local network outages', color: COLORS.amber }
];

KPIS.forEach((kpi, idx) => {
  const kx = margin + (idx * (kpiW + 3));
  drawCard(kx, curY, kpiW, kpiH, COLORS.cardBg, COLORS.cardBorder);
  
  // Left color accent bar
  doc.setFillColor(...kpi.color);
  doc.rect(kx, curY, 1.5, kpiH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...kpi.color);
  doc.text(kpi.val, kx + 5, curY + 7);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(kpi.label, kx + 5, curY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.slateMuted);
  const splitKpi = doc.splitTextToSize(kpi.desc, kpiW - 8);
  doc.text(splitKpi, kx + 5, curY + 16);
});

// Section 2: Core Stations Overview Matrix
curY = 132;
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('Complete 6-Station Clinical Architecture', margin, curY);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Designed specifically for local clinics, healthcare centres, maternity homes, and specialist polyclinics.', margin, curY + 4.5);

curY = 140;
const stationRows = [
  {
    num: '01',
    name: 'Touchscreen Patient Kiosk',
    audience: 'Patients / Front Lobby',
    badge: 'PATIENT SELF-SERVICE',
    color: COLORS.brandAccent,
    features: '3D energetic symptom checklist, department routing, mobile appointment check-in, priority emergency token triage, auto-closing thermal slips.'
  },
  {
    num: '02',
    name: 'TV Lounge Queue Display',
    audience: 'Waiting Room / Patients',
    badge: 'AUDIO-VISUAL CALLING',
    color: COLORS.teal,
    features: 'Big-screen active queue token matrix, audio vocal call announcements with soft hospital chime, highlighted emergency patient alerts, wait estimates.'
  },
  {
    num: '03',
    name: 'Doctor Cabin Workstation',
    audience: 'Physicians & Specialists',
    badge: 'CLINICAL HUB',
    color: COLORS.brandBlue,
    features: 'Real-time KPIs (Seen Today/Weekly/Monthly), interactive queue hub, 1-tap quick Rx pad with frequency/duration chips, labs ordering, past Rx repetition, 2s auto-close print.'
  },
  {
    num: '04',
    name: 'In-House Pharmacy POS Desk',
    audience: 'Pharmacists & Dispensers',
    badge: 'DISPENSING & RETAIL',
    color: COLORS.emerald,
    features: 'Dual-side touch calculator keypad for Doctor Prescriptions & Walk-In OTC sales, cash tendered & exact change calculation, automated formulary stock deductions.'
  },
  {
    num: '05',
    name: 'Reception & Billing Desk POS',
    audience: 'Cashiers & Receptionists',
    badge: 'FINANCIAL SETTLEMENT',
    color: COLORS.purple,
    features: 'Walk-in registration with triage vitals, appointment scheduling, upfront fee collection vs in-cabin collection, 80mm/58mm thermal slips, A4 laser invoices, shift reports.'
  },
  {
    num: '06',
    name: 'Super Admin Multi-Tenant Control',
    audience: 'Clinic Owners & Directors',
    badge: 'MULTI-TENANT GOVERNANCE',
    color: COLORS.rose,
    features: 'Centralized Clinic Feature Management Panel: enable/disable kiosk, pharmacy, queue TV, cabins per facility. Emergency procedure pricing, 30-day TOTP 2FA, full audit log.'
  }
];

stationRows.forEach((st, idx) => {
  const rowY = curY + (idx * 21.5);
  drawCard(margin, rowY, contentWidth, 19.5, COLORS.white, COLORS.cardBorder);

  // Number badge
  doc.setFillColor(...st.color);
  doc.roundedRect(margin + 3, rowY + 3.5, 9, 12.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.white);
  doc.text(st.num, margin + 7.5, rowY + 11.5, { align: 'center' });

  // Station Title & Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(st.name, margin + 15, rowY + 7);

  drawBadge(margin + 80, rowY + 6.8, st.badge, st.color, COLORS.white);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.slateMuted);
  doc.text(`Location: ${st.audience}`, margin + 130, rowY + 7);

  // Features line
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.slateText);
  const splitFeat = doc.splitTextToSize(st.features, contentWidth - 18);
  doc.text(splitFeat, margin + 15, rowY + 12.5);
});

// Bottom Callout Box
curY = 273;
drawCard(margin, curY, contentWidth, 13, [239, 246, 255], [191, 219, 254]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.2);
doc.setTextColor(...COLORS.brandBlue);
doc.text('Built Specifically for Local Realities:', margin + 4, curY + 5.5);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.slateText);
doc.text('Native PKR (Rs.) currency, works with all local thermal slip printers (80mm/58mm), zero monthly cloud fees, offline load-shedding proof.', margin + 55, curY + 5.5);
doc.text('Call now for on-site live demonstration: +92 (300) 123-4567 | info@apexclinic.com | Instant 1-hour plug-and-play setup.', margin + 4, curY + 10);

drawRunningFooter(1, 4);

// =========================================================================
// PAGE 2: PATIENT INTAKE, TRIAGE & DOCTOR WORKSTATION DEEP DIVE
// =========================================================================
doc.addPage();
console.log('Rendering Page 2: Patient Intake, Triage & Doctor Console Deep Dive...');
drawRunningHeader('Station Walkthrough • Kiosk, TV Lounge & Doctor Cabin', 2, 4);

curY = 16;

// SECTION 1: Patient Self-Service Touch Kiosk
drawCard(margin, curY, contentWidth, 76, COLORS.white, COLORS.cardBorder);
doc.setFillColor(...COLORS.brandAccent);
doc.rect(margin, curY, 2.5, 76, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('STATION 1: Touchscreen Patient Kiosk (Intake & Smart Triage)', margin + 7, curY + 7);
drawBadge(margin + 135, curY + 6.5, 'PATIENT LOBBY & ENTRANCE', COLORS.brandAccent, COLORS.white);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Eliminates front-desk crowding and empowers patients to check in effortlessly via interactive touchscreen tablet or kiosk.', margin + 7, curY + 12);

// 4 Feature Pillars for Kiosk
const kioskFeatures = [
  {
    title: '3D Visual Symptom Cards',
    desc: 'High-definition 3D medical illustrations (Cardiology, Dermatology, Orthopedics, Pediatrics, Diabetes, Fever, Respiratory) enable patients of any literacy level to self-triage their chief complaint in seconds.'
  },
  {
    title: 'Automated Doctor & Cabin Routing',
    desc: 'The intelligent clinical rule engine automatically maps the selected symptom to the appropriate specialist cabin (e.g. skin rash -> Cabin 2 Dermatology; chest pain -> Cabin 1 Cardiology) balancing clinical load.'
  },
  {
    title: 'Emergency / STAT Priority Bypass',
    desc: 'Critical complaints (severe crushing chest pain, acute trauma, dyspnea) trigger immediate STAT triage flags, issuing priority EMG-XX tokens and routing directly to the Treatment Room head-of-line.'
  },
  {
    title: 'Mobile Appointment Check-in & Slip',
    desc: 'Patients with existing bookings enter their mobile number for instant verification and priority queue slip printing with zero reception delay. Auto-closes in 2 seconds to keep kiosk ready for the next patient.'
  }
];

const kBoxW = (contentWidth - 12) / 2; // ~85mm
kioskFeatures.forEach((kf, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const kx = margin + 7 + (col * (kBoxW + 5));
  const ky = curY + 16 + (row * 28);

  drawCard(kx, ky, kBoxW, 25, COLORS.cardBg, COLORS.cardBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.brandBlue);
  doc.text(`✓ ${kf.title}`, kx + 3.5, ky + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(kf.desc, kBoxW - 7);
  doc.text(splitDesc, kx + 3.5, ky + 11.5);
});

// SECTION 2: TV Lounge Queue Display
curY = 96;
drawCard(margin, curY, contentWidth, 54, COLORS.white, COLORS.cardBorder);
doc.setFillColor(...COLORS.teal);
doc.rect(margin, curY, 2.5, 54, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('STATION 2: TV Lounge Queue Display (Audio-Visual Calling)', margin + 7, curY + 7);
drawBadge(margin + 135, curY + 6.5, 'WAITING HALL DISPLAY', COLORS.teal, COLORS.white);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Turns any standard Android Smart TV, HDMI screen, or tablet into an automated airport-style patient queue announcement board.', margin + 7, curY + 12);

const tvFeatures = [
  {
    title: 'Automated Hospital Vocal Announcements',
    desc: 'Web Audio API chime followed by realistic text-to-speech announces: "Token C-104 please proceed to Cabin 2 with Dr. Elena" eliminating shouted names and waiting confusion.'
  },
  {
    title: 'Visual Spotlight & Multi-Cabin Board',
    desc: 'High-contrast large-font visual cards highlight newly called patients, active consultations across all 5 cabins, emergency priority banners, and transparent estimated wait times.'
  },
  {
    title: 'Instant Multi-Screen Synchronization',
    desc: 'Uses high-speed browser BroadcastChannel technology. Doctor cabin actions reflect on the waiting TV in under 5 milliseconds with zero internet required.'
  }
];

const tvBoxW = (contentWidth - 14) / 3; // ~56mm
tvFeatures.forEach((tf, idx) => {
  const tx = margin + 7 + (idx * (tvBoxW + 4));
  const ty = curY + 16;
  drawCard(tx, ty, tvBoxW, 33, COLORS.cardBg, COLORS.cardBorder);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLORS.teal);
  const splitTitle = doc.splitTextToSize(`✓ ${tf.title}`, tvBoxW - 6);
  doc.text(splitTitle, tx + 3, ty + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(tf.desc, tvBoxW - 6);
  doc.text(splitDesc, tx + 3, ty + 13.5);
});

// SECTION 3: Doctor Cabin Workstation Console
curY = 154;
drawCard(margin, curY, contentWidth, 114, COLORS.white, COLORS.cardBorder);
doc.setFillColor(...COLORS.brandBlue);
doc.rect(margin, curY, 2.5, 114, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('STATION 3: Doctor Cabin Workstation Console (Clinical Command Hub)', margin + 7, curY + 7);
drawBadge(margin + 135, curY + 6.5, 'SPECIALIST CONSULTATION', COLORS.brandBlue, COLORS.white);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Engineered alongside practicing doctors for lightning-fast consultation workflow without keyboard clutter or administrative fatigue.', margin + 7, curY + 12);

const docFeatures = [
  {
    title: 'Real-Time KPI Dashboard Bar',
    desc: 'Monitors clinical productivity instantly: Patients Seen Today, Weekly (7-day), Monthly (MTD), Active Queue count with STAT emergency alert, Prescriptions issued today, Diagnostic labs ordered, and average consultation time (e.g. 7.2 min).'
  },
  {
    title: 'Queue Command Hub & Next-Patient Hero Card',
    desc: 'Clear visual card shows the next patient in line with token, triage severity, symptoms, vitals (BP, Temp, Pulse, SpO2), and upfront payment status. 1-tap "Call to Cabin", "Direct Consult", or "Return Token" if patient stepped out.'
  },
  {
    title: 'Redesigned 1-Tap Prescription Pad',
    desc: 'Instant Quick-Add bar for routine medications (Panadol 500mg, Augmentin 625mg, Brufen 400mg, Omeprazole 20mg, Cetirizine, Flagyl). Inline interactive dosage frequency pills (OD, BD, TDS, PRN) and duration chips (3d, 5d, 7d, 14d, 30d).'
  },
  {
    title: 'Diagnostic Lab Test Order Chips',
    desc: '1-tap ordering of routine diagnostics (Complete Blood Count - CBC, Random Blood Sugar - RBS, Serum Creatinine, Lipid Profile, 12-Lead ECG). Diagnostic fees are itemized and transmitted automatically to the reception cashier.'
  },
  {
    title: 'Past Visit Regimen Repeat (1 Click)',
    desc: 'For returning chronic patients (Diabetic, Hypertensive, Cardiac), doctors can view past consultation history and repeat previous multi-drug prescriptions with a single click, saving 3+ minutes per returning patient.'
  },
  {
    title: 'Automated 2-Second Auto-Close Print Modal',
    desc: 'Generates beautiful hospital-grade prescriptions in A5 Landscape, A4 Laser, or 80mm Thermal formats. Automatically closes 2 seconds after triggering print or PDF to keep the doctor focused on clinical care.'
  }
];

const docBoxW = (contentWidth - 12) / 2; // ~85mm
docFeatures.forEach((df, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const dx = margin + 7 + (col * (docBoxW + 5));
  const dy = curY + 16 + (row * 31);

  drawCard(dx, dy, docBoxW, 28, COLORS.cardBg, COLORS.cardBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.brandBlue);
  doc.text(`✓ ${df.title}`, dx + 3.5, dy + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.1);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(df.desc, docBoxW - 7);
  doc.text(splitDesc, dx + 3.5, dy + 11);
});

// Bottom highlight
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.emerald);
doc.text('⭐ Clinical Result: Reduces doctor typing time from 4 minutes to under 45 seconds per prescription while maintaining 100% record accuracy.', margin + 7, curY + 110);

drawRunningFooter(2, 4);

// =========================================================================
// PAGE 3: PHARMACY POS, CASHIER BILLING & MULTI-TENANT ADMIN
// =========================================================================
doc.addPage();
console.log('Rendering Page 3: Pharmacy POS, Billing & Multi-Tenant Control...');
drawRunningHeader('Operations, Pharmacy POS & Administrative Control', 3, 4);

curY = 16;

// SECTION 4: In-House Pharmacy & POS Desk
drawCard(margin, curY, contentWidth, 78, COLORS.white, COLORS.cardBorder);
doc.setFillColor(...COLORS.emerald);
doc.rect(margin, curY, 2.5, 78, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('STATION 4: In-House Pharmacy POS Desk (Dual-Side Counter)', margin + 7, curY + 7);
drawBadge(margin + 135, curY + 6.5, 'DISPENSARY & RETAIL POS', COLORS.emerald, COLORS.white);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Eliminates revenue leakage by capturing in-house medicine sales while managing retail walk-in customer purchases seamlessly.', margin + 7, curY + 12);

const rxFeatures = [
  {
    title: 'Dual-Side POS Calculator Keypad',
    desc: 'Features identical touch calculators on BOTH sides of the pharmacy: Side A for Doctor Electronic Prescriptions queue and Side B for Walk-in OTC Retail customer counter sales with discounts.'
  },
  {
    title: 'Cash Tendered & Instant Change Due',
    desc: 'Pharmacists enter cash received with quick denomination buttons (Rs. 100, 500, 1000, 5000); system instantly computes change due, preventing manual cash calculation errors during busy hours.'
  },
  {
    title: 'Automatic Formulary Stock Deduction',
    desc: 'Every dispensed prescription and OTC sale automatically deducts quantities from the inventory formulary in real time. Features low-stock warning chips, batch numbers, and expiry tracking.'
  },
  {
    title: 'Itemized Dispensing Receipts & Thermal Slips',
    desc: 'Prints clear medicine receipts showing patient token, dosage instructions ("Take 1 tab after meals"), price per unit, total amount, pharmacist signature line, and store license details.'
  }
];

const rxBoxW = (contentWidth - 12) / 2;
rxFeatures.forEach((rf, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const rx = margin + 7 + (col * (rxBoxW + 5));
  const ry = curY + 16 + (row * 28.5);

  drawCard(rx, ry, rxBoxW, 25.5, COLORS.cardBg, COLORS.cardBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.emerald);
  doc.text(`✓ ${rf.title}`, rx + 3.5, ry + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(rf.desc, rxBoxW - 7);
  doc.text(splitDesc, rx + 3.5, ry + 11.5);
});

// SECTION 5: Reception Desk & Cashier Billing POS
curY = 98;
drawCard(margin, curY, contentWidth, 74, COLORS.white, COLORS.cardBorder);
doc.setFillColor(...COLORS.purple);
doc.rect(margin, curY, 2.5, 74, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('STATION 5: Reception Desk & Cashier Billing POS', margin + 7, curY + 7);
drawBadge(margin + 135, curY + 6.5, 'FRONT-DESK CASHIER', COLORS.purple, COLORS.white);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('High-speed intake for walk-in patients, appointment bookings, vital signs recording, and flexible fee collection.', margin + 7, curY + 12);

const billFeatures = [
  {
    title: 'Rapid Token Issuance & Triage Vitals',
    desc: 'Front-desk staff can issue walk-in tokens in 10 seconds while recording vital signs (Blood Pressure, Heart Pulse, Body Temp, Oxygen SpO2, Weight) directly onto the patient digital profile.'
  },
  {
    title: 'Flexible Payment Collection Models',
    desc: 'Supports local clinic billing flexibility: Upfront Reception Payment (PAID_UPFRONT), Pay Directly in Doctor\'s Cabin (PAY_IN_CABIN), or Settle at Cashier Counter after consultation.'
  },
  {
    title: 'Dual Printer Support (Thermal & Laser)',
    desc: 'Generates 80mm/58mm thermal queue tokens with ZERO fee amounts for clinical privacy, and full A4/A5 laser medical invoices with insurance co-pay, discounts, and tax itemization.'
  },
  {
    title: 'Shift Closure & Financial Reconciliation',
    desc: '1-click Shift Report calculates total cash collected, card swipes, discounts issued, pending fees, and gross clinic revenue, ensuring transparent shift handover between staff.'
  }
];

billFeatures.forEach((bf, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const bx = margin + 7 + (col * (rxBoxW + 5));
  const by = curY + 16 + (row * 27);

  drawCard(bx, by, rxBoxW, 24, COLORS.cardBg, COLORS.cardBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.purple);
  doc.text(`✓ ${bf.title}`, bx + 3.5, by + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(bf.desc, rxBoxW - 7);
  doc.text(splitDesc, bx + 3.5, by + 11.5);
});

// SECTION 6 & 7: Super Admin & Clinic Admin Dashboards
curY = 176;
drawCard(margin, curY, contentWidth, 92, COLORS.white, COLORS.cardBorder);
doc.setFillColor(...COLORS.rose);
doc.rect(margin, curY, 2.5, 92, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('STATION 6 & 7: Super Admin & Clinic Admin Governance', margin + 7, curY + 7);
drawBadge(margin + 135, curY + 6.5, 'MULTI-TENANT RBAC', COLORS.rose, COLORS.white);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Enterprise-grade multi-clinic management, modular feature toggles, security locks, and emergency procedure catalogs.', margin + 7, curY + 12);

const adminFeatures = [
  {
    title: 'Super Admin: Clinic Feature Control Matrix',
    desc: 'Centralized toggle panel allowing Super Admins to enable or disable specific modules (Patient Kiosk, TV Lounge Display, Doctor Cabin Console, Billing POS, In-House Pharmacy) for each clinic branch independently without altering other branches.'
  },
  {
    title: 'Clinic Admin: Emergency Procedures & Kits',
    desc: 'Clinic Admins manage minor surgical procedures (Wound Dressing, IV Cannulation, Catheterization, Suture Repair), consumable pricing, emergency kit packs, and trauma routing directly from their dashboard.'
  },
  {
    title: 'Multi-Tenant Isolation & 1-Click Clinic Switch',
    desc: 'Seamlessly switch between Main Branch, Satellite Medical Centers, and Specialty Units. Each clinic maintains its own isolated patients, doctors, formulary stock, invoices, and fee configurations.'
  },
  {
    title: 'Enterprise Security & Audit Trail',
    desc: 'Role-Based Access Control (RBAC), Kiosk device PIN screen locks, 30-day Google Authenticator (TOTP) renewal tracking, and comprehensive audit logs recording every financial and clinical change.'
  }
];

adminFeatures.forEach((af, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const ax = margin + 7 + (col * (rxBoxW + 5));
  const ay = curY + 16 + (row * 35);

  drawCard(ax, ay, rxBoxW, 31.5, COLORS.cardBg, COLORS.cardBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.rose);
  doc.text(`✓ ${af.title}`, ax + 3.5, ay + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.1);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(af.desc, rxBoxW - 7);
  doc.text(splitDesc, ax + 3.5, ay + 11.5);
});

drawRunningFooter(3, 4);

// =========================================================================
// PAGE 4: TECHNICAL SUPERIORITY, LOCAL ROI & DEPLOYMENT ROADMAP
// =========================================================================
doc.addPage();
console.log('Rendering Page 4: Technical Superiority, Local ROI & Deployment...');
drawRunningHeader('Local Clinic ROI, Technical Architecture & Implementation', 4, 4);

curY = 16;

// SECTION 1: Built Specifically for Local Realities
drawCard(margin, curY, contentWidth, 55, COLORS.white, COLORS.cardBorder);
doc.setFillColor(...COLORS.brandBlue);
doc.rect(margin, curY, 2.5, 55, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('Engineered for Local Infrastructure Realities', margin + 7, curY + 7);
drawBadge(margin + 130, curY + 6.5, 'ZERO INFRASTRUCTURE HEADACHE', COLORS.brandBlue, COLORS.white);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('Traditional cloud systems fail when the local internet disconnects or during load-shedding. Apex OS is designed differently.', margin + 7, curY + 12);

const techPillars = [
  {
    title: '100% Offline-Resilient (PWA)',
    desc: 'Runs locally inside any modern browser as an installed PWA. Continues generating tokens, writing prescriptions, and dispensing medicine with ZERO internet connection.'
  },
  {
    title: 'Zero Hardware Lock-In',
    desc: 'No need to purchase expensive proprietary terminals. Operates on existing Windows/Mac laptops, Android tablets, touch monitors, and standard Android Smart TVs.'
  },
  {
    title: 'Local Thermal & Laser Printers',
    desc: 'Works seamlessly with standard POS receipt printers (80mm/58mm Xprinter, Rongta, Epson via USB/LAN) and regular A4/A5 desktop laser printers without special drivers.'
  },
  {
    title: 'Native PKR & Dual Cash Workflows',
    desc: 'Full native support for Pakistani Rupee (PKR Rs.) and foreign currencies, accommodating local clinical fee habits (cash at desk, pay doctor inside cabin, or cashier).'
  }
];

const techW = (contentWidth - 12) / 2;
techPillars.forEach((tp, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const tx = margin + 7 + (col * (techW + 5));
  const ty = curY + 16 + (row * 18);

  drawCard(tx, ty, techW, 15.5, COLORS.cardBg, COLORS.cardBorder);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLORS.brandBlue);
  doc.text(`★ ${tp.title}`, tx + 3.5, ty + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.9);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(tp.desc, techW - 7);
  doc.text(splitDesc, tx + 3.5, ty + 9.5);
});

// SECTION 2: Return on Investment (ROI) Comparison Table
curY = 75;
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('Measurable Return on Investment (ROI) for Clinic Owners', margin, curY);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateMuted);
doc.text('How Apex Clinic OS directly increases your clinic\'s revenue, patient retention, and operational speed.', margin, curY + 4.5);

curY = 83;
// Table Header
doc.setFillColor(...COLORS.primaryDark);
doc.rect(margin, curY, contentWidth, 7, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.white);
doc.text('OPERATIONAL METRIC', margin + 4, curY + 4.8);
doc.text('MANUAL / PAPER CLINIC', margin + 65, curY + 4.8);
doc.text('WITH APEX CLINIC HEALTHCARE OS', margin + 120, curY + 4.8);

const roiRows = [
  {
    metric: 'Patient Registration Time',
    before: '3 - 5 minutes per patient at reception desk',
    after: 'Under 25 seconds via Touch Kiosk token check-in',
    highlight: '85% Faster Intake'
  },
  {
    metric: 'Doctor Prescription Generation',
    before: '3 - 4 minutes handwriting on paper slips',
    after: 'Under 45 seconds using 1-tap routine drug chips',
    highlight: '4x Faster Consults'
  },
  {
    metric: 'Pharmacy Medicine Leakage',
    before: '40% - 60% of patients purchase outside',
    after: 'Electronic routing to in-house desk recovers 90%+',
    highlight: 'Major Revenue Boost'
  },
  {
    metric: 'Waiting Hall Noise & Frustration',
    before: 'Frequent crowding, shouting names, complaints',
    after: 'Airport-grade vocal announcements & TV status board',
    highlight: 'Peaceful Lobby'
  },
  {
    metric: 'Daily Financial Reconciliation',
    before: '1 - 2 hours manual register tallying at night',
    after: 'Instant 1-click Shift Report with cash breakdown',
    highlight: '100% Audit Precision'
  },
  {
    metric: 'Software Downtime Risk',
    before: 'Frequent freezes during internet disconnection',
    after: '100% offline continuous operation via PWA',
    highlight: 'Zero Downtime'
  }
];

let tableY = curY + 7;
roiRows.forEach((row, idx) => {
  const rowBg = idx % 2 === 0 ? COLORS.white : COLORS.cardBg;
  doc.setFillColor(...rowBg);
  doc.rect(margin, tableY, contentWidth, 7.5, 'F');
  doc.setDrawColor(...COLORS.cardBorder);
  doc.setLineWidth(0.2);
  doc.line(margin, tableY + 7.5, margin + contentWidth, tableY + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(row.metric, margin + 4, tableY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.rose);
  doc.text(row.before, margin + 65, tableY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.emerald);
  doc.text(`✓ ${row.after}`, margin + 120, tableY + 5);

  tableY += 7.5;
});

// SECTION 3: Deployment Packages & Implementation Plan
curY = 138;
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...COLORS.primaryDark);
doc.text('Deployment Roadmap: Live in Under 60 Minutes', margin, curY);

curY = 145;
const stepW = (contentWidth - 9) / 4; // ~42.75mm
const steps = [
  {
    step: 'STEP 1',
    title: 'Free On-Site Demo',
    desc: 'Our clinical specialist visits your clinic or runs a live remote walkthrough with your doctors and managers.',
    color: COLORS.brandBlue
  },
  {
    step: 'STEP 2',
    title: '60-Min Network Setup',
    desc: 'We configure your existing tablets, TVs, and POS printers on your local Wi-Fi router. Zero rewiring needed.',
    color: COLORS.teal
  },
  {
    step: 'STEP 3',
    title: 'Staff Onboarding',
    desc: 'Comprehensive 30-minute hands-on training for receptionists, doctors, dispensers, and clinic managers.',
    color: COLORS.purple
  },
  {
    step: 'STEP 4',
    title: 'Go-Live & Support',
    desc: 'Clinic begins live patient intake immediately. Dedicated local helpline and 24/7 technical assistance.',
    color: COLORS.emerald
  }
];

steps.forEach((st, idx) => {
  const sx = margin + (idx * (stepW + 3));
  drawCard(sx, curY, stepW, 35, COLORS.cardBg, COLORS.cardBorder);

  doc.setFillColor(...st.color);
  doc.roundedRect(sx + 3, curY + 3.5, 14, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.white);
  doc.text(st.step, sx + 10, curY + 7.2, { align: 'center' });

  doc.setFontSize(8.2);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(st.title, sx + 3.5, curY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.slateText);
  const splitDesc = doc.splitTextToSize(st.desc, stepW - 7);
  doc.text(splitDesc, sx + 3.5, curY + 19);
});

// SECTION 4: Special Promotional Offer & Call to Action
curY = 186;
drawCard(margin, curY, contentWidth, 84, [248, 250, 252], COLORS.brandBlue, 3);

// Header banner for CTA card
doc.setFillColor(...COLORS.brandBlue);
doc.roundedRect(margin, curY, contentWidth, 12, 3, 3, 'F');
// square out bottom corners of top banner
doc.rect(margin, curY + 6, contentWidth, 6, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(...COLORS.white);
doc.text('LIMITED-TIME LOCAL LAUNCH PROMOTION • COMPLETE CLINIC SUITE', margin + contentWidth / 2, curY + 8, { align: 'center' });

// Pricing & Offer columns
const offerColW = (contentWidth - 10) / 2;

// Left offer box
drawCard(margin + 5, curY + 16, offerColW, 40, COLORS.white, COLORS.cardBorder);
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(...COLORS.primaryDark);
doc.text('Standard All-Inclusive License Package:', margin + 8, curY + 22);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...COLORS.slateText);
const licenseIncludes = [
  '✓ Unlimited Patient Tokens & OPD Registrations',
  '✓ Full 5 Doctor Cabins + 1 Treatment Room',
  '✓ In-House Pharmacy POS + Unlimited Drug Formulary',
  '✓ TV Lounge Audio-Visual Announcement System',
  '✓ Touchscreen Patient Kiosk with 3D Symptom Cards',
  '✓ Zero Per-Patient Transaction Fees (Lifetime Local Data)'
];
let licY = curY + 27;
licenseIncludes.forEach(li => {
  doc.text(li, margin + 8, licY);
  licY += 4.5;
});

// Right contact & demo box
drawCard(margin + offerColW + 7, curY + 16, offerColW - 2, 40, [240, 249, 255], [186, 230, 253]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(...COLORS.brandAccent);
doc.text('Schedule Your Free Clinic Demo Today!', margin + offerColW + 10, curY + 22);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.8);
doc.setTextColor(...COLORS.slateText);
doc.text('Experience the software live on your own clinic hardware.', margin + offerColW + 10, curY + 27);

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...COLORS.primaryDark);
doc.text('📞 Direct Helpline: +92 (300) 123-4567 / 0321-8899000', margin + offerColW + 10, curY + 34);
doc.text('💬 WhatsApp Support: +92 (300) 123-4567 (24/7 Available)', margin + offerColW + 10, curY + 39);
doc.text('📧 Email Inquiries: sales@apexclinic.com | info@apexclinic.com', margin + offerColW + 10, curY + 44);
doc.text('🌐 Web Portal: www.apexclinic.com/local-editions', margin + offerColW + 10, curY + 49);

// Bottom guarantee badge
doc.setFillColor(...COLORS.emerald);
doc.roundedRect(margin + 5, curY + 60, contentWidth - 10, 18, 2, 2, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(...COLORS.white);
doc.text('🛡️ 100% SATISFACTION GUARANTEE & LIFETIME DATA OWNERSHIP', margin + contentWidth / 2, curY + 67, { align: 'center' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(240, 253, 244);
doc.text('No monthly cloud hostage fees • Complete local database backup export anytime • Free software updates for 12 months', margin + contentWidth / 2, curY + 73, { align: 'center' });

drawRunningFooter(4, 4);

// SAVE PDF TO MULTIPLE STRATEGIC LOCATIONS
console.log('Writing PDF to disk...');
const buffer = Buffer.from(doc.output('arraybuffer'));

// 1. Root project directory
const rootPath = path.resolve('Apex_Clinic_Healthcare_OS_Promotion_Document.pdf');
fs.writeFileSync(rootPath, buffer);
console.log('Saved to root project directory:', rootPath, `(${buffer.length} bytes)`);

// 2. Public folder for immediate web downloads & browser preview
const publicPath = path.resolve('public/Apex_Clinic_Healthcare_OS_Promotion_Document.pdf');
fs.writeFileSync(publicPath, buffer);
console.log('Saved to public directory for direct download:', publicPath);

// 3. Artifact directory
const artifactDir = 'C:\\Users\\Hp\\.gemini\\antigravity\\brain\\6d3fdb77-5f75-49a4-b730-2256bb74c8c2';
const artifactPath = path.join(artifactDir, 'Apex_Clinic_Healthcare_OS_Promotion_Document.pdf');
try {
  fs.writeFileSync(artifactPath, buffer);
  console.log('Saved to artifact directory:', artifactPath);
} catch (e) {
  console.log('Artifact directory note:', e.message);
}

console.log('🎉 PROMOTION PDF GENERATION COMPLETED SUCCESSFULLY!');
