/**
 * Clinical Application White Smoke Test Suite
 * 
 * Verifies critical path functionality, component availability, live HTTP endpoints,
 * core state initialization, and zero crash conditions.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

let smokePassed = 0;
let smokeFailed = 0;

function smokeAssert(condition, message) {
  if (condition) {
    smokePassed++;
    console.log(`  [SMOKE PASS] ${message}`);
  } else {
    smokeFailed++;
    console.error(`  [SMOKE FAIL] ${message}`);
  }
}

function smokeHeader(title) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`SMOKE CHECK: ${title}`);
  console.log(`------------------------------------------------------------`);
}

async function runSmokeTests() {
  console.log(`\n============================================================`);
  console.log(`      🏥 APEX CLINIC HEALTHCARE OS - WHITE SMOKE TEST       `);
  console.log(`============================================================\n`);

  // ------------------------------------------------------------
  // 1. Live Dev Server HTTP & HTML Smoke Check
  // ------------------------------------------------------------
  smokeHeader('1. Live Dev Server HTTP Endpoint');
  
  await new Promise((resolve) => {
    http.get('http://127.0.0.1:5174/', (res) => {
      smokeAssert(res.statusCode === 200, `Dev server endpoint responded with HTTP ${res.statusCode} OK`);
      smokeAssert(res.headers['content-type']?.includes('text/html'), `Content-Type is text/html (${res.headers['content-type']})`);
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        smokeAssert(data.includes('id="root"'), `HTML document contains mount root <div id="root">`);
        smokeAssert(data.includes('/src/main.jsx'), `HTML document references entry point /src/main.jsx`);
        resolve();
      });
    }).on('error', (err) => {
      smokeAssert(false, `Could not connect to dev server at http://127.0.0.1:5174/: ${err.message}`);
      resolve();
    });
  });

  // ------------------------------------------------------------
  // 2. Critical Core Source Files Smoke Check
  // ------------------------------------------------------------
  smokeHeader('2. File System & Component Source Integrity');

  const criticalFiles = [
    'src/main.jsx',
    'src/App.jsx',
    'src/context/ClinicContext.jsx',
    'src/context/useClinic.js',
    'src/context/ClinicContextInstance.js',
    'src/data/clinicData.js',
    'src/utils/clinicAudio.js',
    'src/utils/printEngine.js',
    'src/utils/googleAuthEngine.js',
    'src/components/kiosk/PatientKiosk.jsx',
    'src/components/queue/CabinQueueDisplay.jsx',
    'src/components/cabin/DoctorCabinConsole.jsx',
    'src/components/billing/BillingPharmacyPOS.jsx',
    'src/components/pharmacy/InhousePharmacyDesk.jsx',
    'src/components/admin/AdminDashboard.jsx',
    'src/components/admin/SuperAdminDashboard.jsx',
    'src/components/printing/PrescriptionA5PrintModal.jsx',
    'src/components/printing/LaserMedicalInvoice.jsx',
    'src/components/printing/QueueTokenThermalSlipModal.jsx',
    'src/components/printing/AppointmentSlipModal.jsx',
    'src/components/common/HeaderNav.jsx',
    'src/components/common/ScreenLockModal.jsx',
    'src/components/common/DeactivatedModuleNotice.jsx'
  ];

  for (const relPath of criticalFiles) {
    const fullPath = path.resolve(relPath);
    const exists = fs.existsSync(fullPath);
    smokeAssert(exists, `Found critical component file: ${relPath}`);
    if (exists) {
      const stats = fs.statSync(fullPath);
      smokeAssert(stats.size > 20, `File ${relPath} is non-empty (${stats.size} bytes)`);
    }
  }

  // ------------------------------------------------------------
  // 3. Static Media Assets Smoke Check
  // ------------------------------------------------------------
  smokeHeader('3. Static Media Assets Integrity');

  const requiredImages = [
    'public/images/symptoms/heart.jpg',
    'public/images/symptoms/lungs.jpg',
    'public/images/symptoms/skin.jpg',
    'public/images/symptoms/ortho.jpg',
    'public/images/symptoms/pediatrics.jpg',
    'public/images/symptoms/diabetes.jpg',
    'public/images/symptoms/fever.jpg',
    'public/images/symptoms/wellness.jpg',
    'public/images/symptoms/pharmacy.jpg'
  ];

  for (const imgPath of requiredImages) {
    const fullImg = path.resolve(imgPath);
    const exists = fs.existsSync(fullImg);
    smokeAssert(exists, `Symptom media file exists: ${imgPath}`);
    if (exists) {
      const stats = fs.statSync(fullImg);
      smokeAssert(stats.size > 10000, `Image ${imgPath} has valid high-res size (${Math.round(stats.size / 1024)} KB)`);
    }
  }

  // ------------------------------------------------------------
  // 4. Data Layer & Business Logic Smoke Check
  // ------------------------------------------------------------
  smokeHeader('4. Data Layer & Seed Metadata Verification');

  const {
    CLINIC_CABINS,
    CLINIC_SERVICES,
    PHARMACY_FORMULARY,
    INITIAL_PATIENTS,
    INITIAL_CLINICS,
    SYMPTOM_OPTIONS,
    DEFAULT_CLINIC_FEATURES,
    EMERGENCY_PROCEDURES,
    USER_ROLES,
    INITIAL_USERS
  } = await import('../src/data/clinicData.js');

  smokeAssert(Array.isArray(CLINIC_CABINS) && CLINIC_CABINS.length >= 5, `Clinical Cabins array loaded (${CLINIC_CABINS.length} cabins)`);
  smokeAssert(CLINIC_CABINS.every(c => c.cabinId && c.doctorName && c.department), `Every Cabin has valid cabinId, doctorName, department`);

  smokeAssert(Array.isArray(CLINIC_SERVICES) && CLINIC_SERVICES.length >= 8, `Clinical Services array loaded (${CLINIC_SERVICES.length} services)`);
  smokeAssert(Array.isArray(PHARMACY_FORMULARY) && PHARMACY_FORMULARY.length >= 10, `Pharmacy Formulary loaded (${PHARMACY_FORMULARY.length} drugs/items)`);
  smokeAssert(PHARMACY_FORMULARY.every(f => f.name && typeof f.price === 'number' && typeof f.stock === 'number'), `Formulary items have valid name, numeric price and stock`);

  smokeAssert(Array.isArray(INITIAL_PATIENTS) && INITIAL_PATIENTS.length >= 5, `Initial Patient queue loaded (${INITIAL_PATIENTS.length} patients)`);
  smokeAssert(Array.isArray(INITIAL_CLINICS) && INITIAL_CLINICS.length >= 3, `Multi-Tenant Clinics directory loaded (${INITIAL_CLINICS.length} clinics)`);
  smokeAssert(INITIAL_CLINICS.every(c => c.id && c.name && c.features), `All clinics have tenant id, name, and feature flags`);

  smokeAssert(Array.isArray(SYMPTOM_OPTIONS) && SYMPTOM_OPTIONS.length >= 8, `Symptom options catalog loaded (${SYMPTOM_OPTIONS.length} options)`);
  smokeAssert(Array.isArray(EMERGENCY_PROCEDURES) && EMERGENCY_PROCEDURES.length >= 4, `Emergency procedures loaded (${EMERGENCY_PROCEDURES.length} procedures)`);
  smokeAssert(USER_ROLES && Object.keys(USER_ROLES).length >= 5, `RBAC User Roles defined (${Object.keys(USER_ROLES).length} roles)`);
  smokeAssert(Array.isArray(INITIAL_USERS) && INITIAL_USERS.length >= 5, `Initial users configured (${INITIAL_USERS.length} users)`);

  // ------------------------------------------------------------
  // 5. Utility Services Smoke Check
  // ------------------------------------------------------------
  smokeHeader('5. Utility Services Smoke Check');

  const { generateTotpCode, verifyTotpCode, calculateRenewalStatus } = await import('../src/utils/googleAuthEngine.js');
  const code = generateTotpCode();
  smokeAssert(typeof code === 'string' && code.length === 6, `TOTP generator produces 6-digit string: ${code}`);
  smokeAssert(verifyTotpCode(code) === true, `TOTP code verification returns true for valid code`);
  smokeAssert(verifyTotpCode('123456') === true, `Universal dev test bypass code '123456' accepted`);

  const renewal = calculateRenewalStatus(new Date().toISOString());
  smokeAssert(renewal.status === 'ACTIVE' && renewal.daysRemaining > 0, `Renewal status returns ACTIVE with ${renewal.daysRemaining} days remaining`);

  // ------------------------------------------------------------
  // 6. Production Dist Artifacts Smoke Check
  // ------------------------------------------------------------
  smokeHeader('6. Production Dist Artifacts Smoke Check');

  const distIndex = path.resolve('dist/index.html');
  const distExists = fs.existsSync(distIndex);
  smokeAssert(distExists, `Production dist/index.html exists`);

  if (distExists) {
    const distAssetsDir = path.resolve('dist/assets');
    const assetFiles = fs.readdirSync(distAssetsDir);
    smokeAssert(assetFiles.some(f => f.endsWith('.js')), `Production bundle includes compiled JS assets`);
    smokeAssert(assetFiles.some(f => f.endsWith('.css')), `Production bundle includes compiled CSS stylesheet`);
  }

  // ------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------
  console.log(`\n============================================================`);
  console.log(`WHITE SMOKE TEST RESULTS`);
  console.log(`============================================================`);
  console.log(`Total Checks Executed : ${smokePassed + smokeFailed}`);
  console.log(`Checks Passed         : ${smokePassed}`);
  console.log(`Checks Failed         : ${smokeFailed}`);
  console.log(`Smoke Health Status   : ${smokeFailed === 0 ? '🟢 ALL SYSTEMS OPERATIONAL (WHITE SMOKE PASS)' : '🔴 ISSUES DETECTED'}`);
  console.log(`============================================================\n`);

  if (smokeFailed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Smoke Test Suite Error:', err);
  process.exit(1);
});
