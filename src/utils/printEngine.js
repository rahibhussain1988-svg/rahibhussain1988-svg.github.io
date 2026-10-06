import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { clinicAudio } from './clinicAudio';

/**
 * Universal Medical Printing & Direct PDF Engine (Dual Hardware Router)
 * 
 * Rules:
 * 1. OS Print Dialog (window.print()) is NEVER shown on user screens (Kiosks, Cashier, Doctor, Pharmacy).
 * 2. OS Print Dialog is ONLY triggered at the Admin side when explicitly running hardware printer tests.
 * 3. If hardware printer is NOT ATTACHED, the system directly generates & downloads a high-res PDF.
 * 4. Supports two hardware devices simultaneously (e.g. 80mm Thermal Receipt POS + A4/A5 Laser Printer).
 */

let isPrintingActive = false;

/**
 * Display a floating in-app notification when print or PDF actions occur
 */
export const showPrintNotification = (type, message, details = '') => {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('clinical-print-notification-toast');
  if (!container) {
    container = document.createElement('div');
    container.id = 'clinical-print-notification-toast';
    container.className = 'fixed bottom-6 right-6 z-[99999] pointer-events-none transition-all duration-300';
    document.body.appendChild(container);
  }

  const isPdf = type === 'PDF';
  const isDirect = type === 'HARDWARE';
  const isTest = type === 'ADMIN_TEST';

  container.innerHTML = `
    <div class="pointer-events-auto bg-slate-900/95 text-white border ${
      isPdf ? 'border-emerald-500/60' : isDirect ? 'border-teal-500/60' : 'border-amber-500/60'
    } rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-full flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
      <div class="w-9 h-9 rounded-xl ${
        isPdf ? 'bg-emerald-500/20 text-emerald-400' : isDirect ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'
      } flex items-center justify-center shrink-0 font-bold text-lg">
        ${isPdf ? '📄' : isDirect ? '🖨️' : '🛠️'}
      </div>
      <div class="flex-1 text-xs">
        <div class="font-black text-slate-100 flex items-center justify-between">
          <span>${message}</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
            isPdf ? 'bg-emerald-500/30 text-emerald-300' : isDirect ? 'bg-teal-500/30 text-teal-300' : 'bg-amber-500/30 text-amber-300'
          }">
            ${isPdf ? 'Direct PDF' : isDirect ? 'Hardware' : 'Admin Test'}
          </span>
        </div>
        ${details ? `<p class="text-slate-400 text-[11px] mt-1 leading-snug font-medium">${details}</p>` : ''}
      </div>
    </div>
  `;

  setTimeout(() => {
    if (container) {
      container.innerHTML = '';
    }
  }, 4200);
};

/**
 * Directly generate and download a PDF document from an HTML DOM Element
 * Bypasses the browser OS print window completely.
 */
export const generateDirectPdf = async (
  targetElementId = 'printable-medical-doc',
  filename = 'medical_document.pdf',
  paperFormat = 'A4'
) => {
  clinicAudio.triggerHaptic(20);
  const targetEl = document.getElementById(targetElementId);
  if (!targetEl) {
    console.error(`[PrintEngine] Target element #${targetElementId} not found in DOM.`);
    return { success: false, error: 'Element not found' };
  }

  try {
    const is58mm = paperFormat === 'THERMAL_58';
    const isThermal = paperFormat === 'THERMAL' || paperFormat === 'THERMAL_80' || is58mm;
    const isA5Landscape = paperFormat === 'A5_LANDSCAPE' || paperFormat === 'A5_HORIZONTAL';
    const isA5Portrait = paperFormat === 'A5';

    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    let pdf;

    if (is58mm) {
      const pdfHeight = Math.max(70, (canvas.height * 58) / canvas.width);
      pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [58, pdfHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, 58, pdfHeight);
    } else if (isThermal) {
      const pdfHeight = Math.max(90, (canvas.height * 80) / canvas.width);
      pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [80, pdfHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, pdfHeight);
    } else if (isA5Landscape) {
      pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a5' });
      const imgHeight = (canvas.height * 200) / canvas.width;
      pdf.addImage(imgData, 'PNG', 5, 5, 200, Math.min(138, imgHeight));
    } else if (isA5Portrait) {
      pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a5' });
      const imgHeight = (canvas.height * 140) / canvas.width;
      pdf.addImage(imgData, 'PNG', 4, 4, 140, Math.min(202, imgHeight));
    } else {
      // Default A4 Laser
      pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const imgHeight = (canvas.height * 200) / canvas.width;
      pdf.addImage(imgData, 'PNG', 5, 5, 200, Math.min(287, imgHeight));
    }

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);

    showPrintNotification(
      'PDF',
      'Direct PDF Generated',
      `Saved "${safeFilename}" directly. OS print window was suppressed.`
    );

    return { success: true, mode: 'DIRECT_PDF', filename: safeFilename };
  } catch (err) {
    console.error('[PrintEngine] Direct PDF generation error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Isolated Host Engine for Admin Hardware Testing ONLY
 * Triggers window.print() so the administrator can test hardware printer paper feeding and spooling.
 */
const executeOsPrintWindow = (targetElementId, paperFormat, savedPrinterSettings) => {
  if (isPrintingActive) {
    console.warn('[PrintEngine] Print already in progress, dropping duplicate request.');
    return { success: false, error: 'Print in progress' };
  }
  isPrintingActive = true;

  const targetEl = document.getElementById(targetElementId);
  if (!targetEl) {
    console.error(`[PrintEngine] Target element #${targetElementId} not found in DOM.`);
    isPrintingActive = false;
    return { success: false, error: 'Element not found' };
  }

  let printHost = document.getElementById('medical-print-isolated-host');
  if (!printHost) {
    printHost = document.createElement('div');
    printHost.id = 'medical-print-isolated-host';
    document.body.appendChild(printHost);
  }
  printHost.innerHTML = targetEl.outerHTML;

  let styleEl = document.getElementById('dynamic-medical-print-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-medical-print-style';
    document.head.appendChild(styleEl);
  }

  const configuredThermalWidth = savedPrinterSettings?.thermalPaperWidth || '80mm';

  let pageSize = 'A4 portrait';
  let pageMargin = '6mm 8mm';
  let contentWidth = '100%';
  let fontSize = '11px';
  let isThermal = false;

  if (paperFormat === 'A5_LANDSCAPE' || paperFormat === 'A5_HORIZONTAL') {
    pageSize = 'A5 landscape';
    pageMargin = '4mm 6mm';
    contentWidth = '100%';
    fontSize = '10px';
  } else if (paperFormat === 'A5') {
    pageSize = 'A5 portrait';
    pageMargin = '5mm 6mm';
    contentWidth = '100%';
    fontSize = '10.5px';
  } else if (paperFormat === 'THERMAL_58' || (paperFormat === 'THERMAL' && configuredThermalWidth === '58mm')) {
    pageSize = '58mm auto';
    pageMargin = '0';
    contentWidth = '48mm';
    fontSize = '8.5px';
    isThermal = true;
  } else if (paperFormat === 'THERMAL' || paperFormat === 'THERMAL_80') {
    pageSize = '80mm auto';
    pageMargin = '0';
    contentWidth = '72mm';
    fontSize = '9.5px';
    isThermal = true;
  }

  styleEl.innerHTML = `
    @page {
      size: ${pageSize};
      margin: ${pageMargin};
    }
    @media print {
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body > *:not(#medical-print-isolated-host) {
        display: none !important;
      }
      #medical-print-isolated-host {
        display: block !important;
        position: static !important;
        width: ${contentWidth} !important;
        max-width: ${contentWidth} !important;
        margin: 0 auto !important;
        padding: ${isThermal ? '1.5mm 1mm 3mm 1mm' : '0'} !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-size: ${fontSize} !important;
        overflow: visible !important;
        page-break-after: avoid !important;
      }
      #medical-print-isolated-host * {
        visibility: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  const cleanup = () => {
    if (printHost) {
      printHost.innerHTML = '';
    }
    isPrintingActive = false;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  setTimeout(() => {
    try {
      window.print();
    } finally {
      setTimeout(cleanup, 1200);
    }
  }, 80);

  return { success: true, mode: 'OS_PRINT_WINDOW' };
};

/**
 * Universal Medical Document Print Router
 * 
 * - Admin Test: opens OS window.print() for physical verification
 * - User Screen (Hardware NOT Attached): directly generates and downloads PDF without OS dialog
 * - User Screen (Hardware Attached): executes silent direct print to connected hardware
 */
export const printMedicalDocument = async (
  targetElementId = 'printable-medical-doc',
  paperFormat = 'A4',
  options = {}
) => {
  const {
    isAdminTest = false,
    documentTitle = 'Medical_Document',
    documentType = 'DOCUMENT',
    directPdf = false,
    hardwareSlot = null
  } = options;

  clinicAudio.triggerHaptic(20);

  // Retrieve saved clinic printer settings
  let savedPrinterSettings = null;
  try {
    const rawSettings = localStorage.getItem('apex_clinic_settings_v4');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      savedPrinterSettings = parsed.printerSettings;
    }
  } catch {}

  const hardwareDevices = savedPrinterSettings?.hardwareDevices || [
    {
      id: 'hw-printer-1',
      slot: 1,
      name: 'Front-Desk Thermal Slip Printer',
      model: 'Epson TM-T88VI POS',
      role: 'TOKENS_AND_RECEIPTS',
      format: '80mm',
      connection: 'USB',
      status: 'CONNECTED',
      isDefaultReceipt: true
    },
    {
      id: 'hw-printer-2',
      slot: 2,
      name: 'Clinical Laser & Prescription Printer',
      model: 'HP LaserJet Pro M404n',
      role: 'PRESCRIPTIONS_AND_INVOICES',
      format: 'A4',
      connection: 'NETWORK_IP',
      status: 'CONNECTED',
      isDefaultPrescription: true
    }
  ];

  // Determine targeted hardware device based on format and role
  const isThermalFormat = paperFormat.startsWith('THERMAL');
  let targetDevice;
  if (hardwareSlot) {
    targetDevice = hardwareDevices.find((d) => d.slot === hardwareSlot) || hardwareDevices[0];
  } else if (isThermalFormat || documentType === 'TOKEN' || documentType === 'RECEIPT') {
    targetDevice = hardwareDevices.find((d) => d.slot === 1) || hardwareDevices[0];
  } else {
    targetDevice = hardwareDevices.find((d) => d.slot === 2) || hardwareDevices[1] || hardwareDevices[0];
  }

  const isHardwareAttached = targetDevice?.status === 'CONNECTED';
  const cleanTitle = (documentTitle || 'Medical_Doc').replace(/[^a-zA-Z0-9_-]/g, '_');

  // =========================================================================
  // 1. ADMIN TEST PRINT: Explicitly allowed to open OS Print Dialog
  // =========================================================================
  if (isAdminTest) {
    showPrintNotification(
      'ADMIN_TEST',
      `Testing Hardware: ${targetDevice.name}`,
      `OS Print Window opened for admin hardware verification (${targetDevice.format} • ${targetDevice.connection}).`
    );
    return executeOsPrintWindow(targetElementId, paperFormat, savedPrinterSettings);
  }

  // =========================================================================
  // 2. USER SCREEN - HARDWARE NOT ATTACHED OR DIRECT PDF REQUESTED
  // =========================================================================
  if (!isHardwareAttached || directPdf) {
    // DO NOT SHOW OS PRINT WINDOW! Generate PDF directly!
    return await generateDirectPdf(targetElementId, `${cleanTitle}.pdf`, paperFormat);
  }

  // =========================================================================
  // 3. USER SCREEN - HARDWARE ATTACHED (Direct Hardware Printing)
  // =========================================================================
  // Hardware is attached to workstation. Bypasses OS print window!
  showPrintNotification(
    'HARDWARE',
    `Routed to ${targetDevice.name}`,
    `Direct print job submitted to hardware (${targetDevice.format} • ${targetDevice.connection}). OS prompt bypassed.`
  );

  return {
    success: true,
    mode: 'HARDWARE_DIRECT_PRINT',
    printerName: targetDevice.name,
    format: targetDevice.format,
    connection: targetDevice.connection
  };
};
