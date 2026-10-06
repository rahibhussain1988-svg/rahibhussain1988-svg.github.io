import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Pill,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Building2,
  AlertCircle,
  Volume2,
  FileText,
  DollarSign,
  PackageCheck,
  ChevronRight,
  Sparkles,
  MapPin,
  Check,
  RefreshCw,
  Info,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  QrCode,
  Banknote,
  Package,
  AlertTriangle,
  Calendar,
  X,
  ArrowRight,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';
import { WorkstationHeaderControls } from '../common/WorkstationHeaderControls';
import { LaserMedicalInvoice } from '../printing/LaserMedicalInvoice';
import { PrescriptionA5PrintModal } from '../printing/PrescriptionA5PrintModal';
import { PosPaymentKeypad } from '../common/PosPaymentKeypad';

export const InhousePharmacyDesk = () => {
  const {
    pharmacyQueue,
    pharmacyFormulary,
    dispensePharmacyPrescription,
    adjustFormularyStock,
    addFormularyItem,
    sellPharmacyDirectOTC,
    invoices,
    currencySymbol,
    clinicSettings,
    patients,
    cabins
  } = useClinic();

  // Navigation tabs: OTC (Walk-in Retail POS) | QUEUED (Doctor Rx Queue) | FORMULARY | DISPENSED
  const [activeTab, setActiveTab] = useState('OTC');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [verifiedItems, setVerifiedItems] = useState({});
  const [pharmacistNotes, setPharmacistNotes] = useState('');

  // Hardware Scanner / Physical Keyboard Ref
  const otcSearchInputRef = useRef(null);

  // Dual Print / Dispense Modal State
  const [printModalData, setPrintModalData] = useState(null); // { patient, invoice, billingMode }
  const [activeLaserInvoice, setActiveLaserInvoice] = useState(null);

  // Dispensation Payment Drawer / Form State (For Queue workflow with pricing)
  const [dispensePaymentMode, setDispensePaymentMode] = useState('CASH'); // 'CASH' | 'CARD' | 'TOUCH_PAY'
  const [dispenseCashTendered, setDispenseCashTendered] = useState('');
  const [dispenseDiscount, setDispenseDiscount] = useState(0);

  // Walk-in OTC Retail Counter State
  const [otcSearchQuery, setOtcSearchQuery] = useState('');
  const [otcCategoryFilter, setOtcCategoryFilter] = useState('ALL');
  const [otcCart, setOtcCart] = useState([]); // [{ ...item, quantity }]
  const [otcCustomerName, setOtcCustomerName] = useState('');
  const [otcCustomerPhone, setOtcCustomerPhone] = useState('');
  const [otcPaymentMethod, setOtcPaymentMethod] = useState('CASH');
  const [otcCashTendered, setOtcCashTendered] = useState('');
  const [otcDiscount, setOtcDiscount] = useState(0);

  // Stock / Formulary Tab State
  const [formularyFilter, setFormularyFilter] = useState('ALL'); // 'ALL' | 'PHARMACY' | 'GENERAL' | 'LOW_STOCK'
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    type: 'PHARMACY',
    name: '',
    generic: '',
    strength: '500mg',
    form: 'Tablet',
    category: 'Analgesics',
    price: 150,
    stock: 60,
    batchNumber: 'BT-9001',
    expiryDate: '2026-12',
    storageLocation: 'Shelf B-03',
    instructions: '1 tablet after meals as prescribed',
    isPrescriptionRequired: false,
    showToDoctor: true
  });

  const lowStockThreshold = clinicSettings?.pharmacySettings?.lowStockThreshold ?? 15;
  const isCounterPaymentAllowed = clinicSettings?.pharmacySettings?.counterPaymentEnabled !== false;
  const isDirectOtcAllowed = clinicSettings?.pharmacySettings?.allowDirectOTC !== false;

  // Emergency & Minor Procedure Kits Catalog
  const EMERGENCY_KITS = useMemo(() => [
    {
      id: 'kit-wound-dress',
      name: 'Wound Dressing & Bandage Kit',
      code: 'KIT-WOUND-01',
      category: 'Wound Care & Dressing',
      price: 450,
      icon: '🩹',
      description: 'Sterile dressing pack for trauma, lacerations, burns, and post-op wound management.',
      items: [
        'Sterile Gauze Swabs 10x10cm (5 pcs)',
        'Pyodine / Povidone Iodine Solution 10% (100ml)',
        'Elastic Crepe Bandage 10cm',
        'Micropore Adhesive Surgical Tape',
        'Sterile Latex Gloves (Pair)'
      ],
      recommendedCabin: 'Cabin 1 / Treatment Room'
    },
    {
      id: 'kit-foley-cath',
      name: 'Foley Urinary Catheterization Kit',
      code: 'KIT-CATH-02',
      category: 'Urology & Minor Surgery',
      price: 800,
      icon: '🩺',
      description: 'Complete closed-system catheterization set for urinary retention & bladder drainage.',
      items: [
        'Foley 2-Way Siliconized Latex Catheter 16Fr',
        'Urine Drainage Bag 2000ml with Non-Return Valve',
        'Lignocaine 2% Anaesthetic Jelly (Pre-filled Syringe)',
        'Sterile Distilled Water Ampoule 10ml',
        'Disposable Syringe 10ml with Needle',
        'Sterile Surgical Gloves & Fenestrated Drape'
      ],
      recommendedCabin: 'Cabin 1 / Treatment Room'
    },
    {
      id: 'kit-iv-cannula',
      name: 'Peripheral IV Cannula (Canola) Kit',
      code: 'KIT-CANN-03',
      category: 'IV Access & Infusion',
      price: 400,
      icon: '💉',
      description: 'Standard peripheral intravenous cannulation & quick hydration access set.',
      items: [
        'IV Cannula 20G (Pink) & 22G (Blue)',
        'Cannula Fixator Transparent Adhesive Dressing (2 pcs)',
        'Sterile IV Infusion Giving Set with Roller Clamp',
        'Normal Saline 0.9% IV Infusion 500ml Bottle',
        'Alcohol Swabs 70% Isopropyl (4 pcs)',
        'Quick-Release Tourniquet & Examination Gloves'
      ],
      recommendedCabin: 'Cabin 1 / Emergency Bed'
    },
    {
      id: 'kit-nebulizer',
      name: 'Emergency Bronchodilator Nebulization Kit',
      code: 'KIT-NEBU-04',
      category: 'Respiratory Care',
      price: 350,
      icon: '💨',
      description: 'Stat aerosol inhalation therapy set for acute asthma, wheezing, and COPD distress.',
      items: [
        'Adult / Pediatric Nebulizer Medication Chamber & Tubing',
        'Aerosol Face Mask with Elastic Strap',
        'Salbutamol (Ventolin) Respules 2.5mg (2 respules)',
        'Ipratropium Bromide (Atrovent) Respules 500mcg (1 respule)',
        'Normal Saline 0.9% Ampoule 10ml'
      ],
      recommendedCabin: 'Cabin 1 / Inhalation Station'
    },
    {
      id: 'kit-stat-inj',
      name: 'Stat Analgesic & Antispasmodic Injection Kit',
      code: 'KIT-INJ-05',
      category: 'Stat Emergency Drugs',
      price: 250,
      icon: '💉',
      description: 'Rapid pain and colic relief kit for renal colic, biliary colic, and severe acute pain.',
      items: [
        'Diclofenac Sodium 75mg/3ml Ampoule (1 amp)',
        'Hyoscine Butylbromide (Buscopan) 20mg/ml Ampoule (1 amp)',
        'Disposable Syringes 3ml & 5ml with 24G needles (2 sets)',
        'Sterile Alcohol Prep Swabs (4 pcs)'
      ],
      recommendedCabin: 'Cabin 1 / Treatment Room'
    },
    {
      id: 'kit-suture-care',
      name: 'Minor Wound Suturing & Laceration Kit',
      code: 'KIT-SUTR-06',
      category: 'Minor Surgery',
      price: 850,
      icon: '🧵',
      description: 'Emergency primary wound closure pack for fresh trauma and deep lacerations.',
      items: [
        'Prolene / Monofilament 3-0 Suture with Reverse Cutting Needle',
        'Disposable Scalpel Blade #11',
        'Lignocaine 2% Plain Local Anaesthetic Ampoule 5ml',
        'Disposable Syringe 5ml with 25G needle',
        'Sterile Fenestrated Minor Procedure Drape',
        'Sterile Gauze Packs & Betadine Solution Swabs'
      ],
      recommendedCabin: 'Cabin 1 / Minor OT'
    }
  ], []);

  const handleIssueEmergencyKit = (kit, targetLocation = 'Treatment Room / Cabin 1') => {
    clinicAudio.triggerHaptic(30);

    sellPharmacyDirectOTC({
      customerName: `Requisition: ${targetLocation}`,
      phone: 'Inter-Clinic Supply',
      items: [
        {
          id: `kit-issue-${kit.code}-${Date.now()}`,
          name: `${kit.name} (${targetLocation})`,
          price: kit.price,
          quantity: 1,
          category: kit.category,
          dosage: 'Clinical Requisition Kit'
        }
      ],
      discount: 0,
      paymentMethod: 'CASH',
      cashTendered: kit.price
    });

    try {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    } catch {}

    alert(`✓ ${kit.name} (Rs ${kit.price}) successfully issued & dispatched to ${targetLocation}. Stock adjusted & registered in Pharmacy POS.`);
  };

  const handleAddKitToOtcCart = (kit) => {
    clinicAudio.triggerHaptic(20);
    setOtcCart((prev) => {
      const existing = prev.find((it) => it.id === kit.id || it.code === kit.code);
      if (existing) {
        return prev.map((it) =>
          it.id === kit.id || it.code === kit.code ? { ...it, quantity: (it.quantity || 1) + 1 } : it
        );
      }
      return [
        ...prev,
        {
          id: kit.id,
          name: kit.name,
          code: kit.code,
          price: kit.price,
          quantity: 1,
          category: kit.category,
          form: 'Kit Bundle',
          dosage: 'Procedure Kit'
        }
      ];
    });
    setActiveTab('OTC');
  };

  // Filter queue orders
  const filteredOrders = useMemo(() => {
    return pharmacyQueue.filter((rx) => {
      const matchTab = activeTab === 'ALL' ? true : rx.status === activeTab;
      const matchSearch =
        rx.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rx.phone || '').includes(searchQuery) ||
        rx.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [pharmacyQueue, activeTab, searchQuery]);

  // Active Order from Queue
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      return pharmacyQueue.find((rx) => rx.id === selectedOrderId) || null;
    }
    return filteredOrders[0] || pharmacyQueue[0] || null;
  }, [selectedOrderId, pharmacyQueue, filteredOrders]);

  // Patient matching active order to check clinical status
  const activeOrderPatient = useMemo(() => {
    if (!activeOrder) return null;
    return (patients || []).find(
      (p) => p.tokenNumber === activeOrder.tokenNumber || p.id === activeOrder.patientId
    );
  }, [patients, activeOrder]);

  const isPatientInCabin =
    activeOrderPatient?.status === 'IN_CONSULTATION' || activeOrderPatient?.status === 'CALLED';

  // Toggle item verification checkbox
  const toggleItemVerified = (itemId) => {
    clinicAudio.triggerHaptic(15);
    setVerifiedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Verify all items in active prescription
  const handleVerifyAllItems = () => {
    clinicAudio.triggerHaptic(20);
    const all = {};
    orderMeds.forEach((med, idx) => {
      all[med.id || idx] = true;
    });
    setVerifiedItems(all);
  };

  // Announce patient to collect from pharmacy counter
  const handleAnnouncePickup = () => {
    if (!activeOrder || isPatientInCabin) return;
    clinicAudio.triggerHaptic(20);

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        clinicAudio.playChime();
        setTimeout(() => {
          const spelledToken = activeOrder.tokenNumber.split('').join(' ');
          const text = `Attention please. Patient Token ${spelledToken}, ${activeOrder.patientName}. Your prescription is packaged and ready for collection at the in-house pharmacy counter.`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.90;
          window.speechSynthesis.speak(utterance);
        }, 500);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Calculate pricing for active prescription
  const orderMeds = useMemo(() => {
    if (!activeOrder) return [];
    return activeOrder.medications || activeOrder.items || [];
  }, [activeOrder]);

  const orderSubtotal = useMemo(() => {
    return orderMeds.reduce((acc, m) => {
      const unitPrice = Number(m.price) || 0;
      const qty = Number(m.quantity) || 1;
      return acc + unitPrice * qty;
    }, 0);
  }, [orderMeds]);

  const orderTotalAfterDiscount = Math.max(0, orderSubtotal - Number(dispenseDiscount || 0));
  const changeDueQueue = dispensePaymentMode === 'CASH' && dispenseCashTendered
    ? Math.max(0, Number(dispenseCashTendered) - orderTotalAfterDiscount)
    : 0;

  // WORKFLOW A: Pure Medical Prescription Fulfillment (No Charge / Just Rx)
  const handleDispenseRxOnly = () => {
    if (!activeOrder) return;
    if (isPatientInCabin) {
      alert(
        `Dispense Locked: Patient ${activeOrder.patientName} (${activeOrder.tokenNumber}) is currently in Doctor Cabin ${
          activeOrderPatient?.cabinId || activeOrder.cabinId
        }. Please wait for the physician to finish consultation.`
      );
      return;
    }
    clinicAudio.triggerHaptic(30);

    const result = dispensePharmacyPrescription(activeOrder.id, {
      mode: 'PRESCRIPTION_ONLY',
      pharmacistNotes: pharmacistNotes.trim()
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch {}

    // Open universal print modal in pure prescription mode (No price, A5 & Thermal support)
    setPrintModalData({
      patient: {
        name: activeOrder.patientName,
        age: activeOrder.age,
        gender: activeOrder.gender,
        phone: activeOrder.phone,
        tokenNumber: activeOrder.tokenNumber,
        doctorName: activeOrder.doctorName,
        department: activeOrder.department,
        cabinId: activeOrder.cabinId,
        medications: orderMeds,
        labOrders: activeOrder.labOrders || [],
        vitals: activeOrder.vitals || {},
        clinicalNotes: activeOrder.clinicalNotes || activeOrder.doctorNotes || ''
      },
      invoice: null,
      billingMode: false
    });
  };

  // WORKFLOW B: Dispense with Payment & Laser / Thermal Receipt
  const handleDispenseWithPayment = () => {
    if (!activeOrder) return;
    if (isPatientInCabin) {
      alert(
        `Dispense Locked: Patient ${activeOrder.patientName} is in doctor cabin consultation.`
      );
      return;
    }

    if (dispensePaymentMode === 'CASH' && Number(dispenseCashTendered || 0) < orderTotalAfterDiscount && orderTotalAfterDiscount > 0) {
      alert(`Cash tendered (${currencySymbol} ${dispenseCashTendered || 0}) is less than the total due (${currencySymbol} ${orderTotalAfterDiscount}).`);
      return;
    }

    clinicAudio.triggerHaptic(40);

    const result = dispensePharmacyPrescription(activeOrder.id, {
      mode: 'PURCHASE_RECEIPT',
      paymentMethod: dispensePaymentMode,
      cashTendered: dispensePaymentMode === 'CASH' ? Number(dispenseCashTendered || orderTotalAfterDiscount) : null,
      discount: Number(dispenseDiscount || 0),
      pharmacistNotes: pharmacistNotes.trim()
    });

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {}

    const resolvedInvoice = result?.invoice || {
      id: `inv-rx-${Date.now()}`,
      invoiceNumber: `APEX-RX-${activeOrder.tokenNumber.replace('C-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      tokenNumber: activeOrder.tokenNumber,
      patientId: activeOrder.patientId,
      patientName: activeOrder.patientName,
      age: activeOrder.age,
      gender: activeOrder.gender,
      phone: activeOrder.phone,
      doctorName: activeOrder.doctorName,
      cabinId: activeOrder.cabinId,
      department: activeOrder.department,
      services: [{ name: 'Inhouse Pharmacy Medication Dispensation', price: orderSubtotal, code: 'PHARM-DISP' }],
      medications: orderMeds,
      clinicalNotes: `Pharmacist Counseling: ${pharmacistNotes || 'Take medications as directed.'}`,
      subtotal: orderSubtotal,
      discount: Number(dispenseDiscount || 0),
      total: orderTotalAfterDiscount,
      paymentMethod: dispensePaymentMode,
      cashTendered: dispensePaymentMode === 'CASH' ? Number(dispenseCashTendered || orderTotalAfterDiscount) : null,
      changeDue: changeDueQueue,
      timestamp: Date.now(),
      status: 'SETTLED',
      isPaid: true
    };

    setPrintModalData({
      patient: {
        name: activeOrder.patientName,
        age: activeOrder.age,
        gender: activeOrder.gender,
        phone: activeOrder.phone,
        tokenNumber: activeOrder.tokenNumber,
        doctorName: activeOrder.doctorName,
        department: activeOrder.department,
        cabinId: activeOrder.cabinId,
        medications: orderMeds,
        labOrders: activeOrder.labOrders || [],
        vitals: activeOrder.vitals || {},
        clinicalNotes: activeOrder.clinicalNotes || activeOrder.doctorNotes || ''
      },
      invoice: resolvedInvoice,
      billingMode: true
    });
  };

  // ==================== OTC COUNTER FUNCTIONS ====================
  const addToOtcCart = (item) => {
    clinicAudio.triggerHaptic(15);
    setOtcCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (existing.quantity >= (item.stock || 50)) {
          alert(`Cannot add more than available stock (${item.stock || 50} units) of ${item.name}.`);
          return prev;
        }
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateOtcQuantity = (itemId, delta) => {
    clinicAudio.triggerHaptic(10);
    setOtcCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const formularyItem = pharmacyFormulary.find((f) => f.id === itemId);
            const maxStock = formularyItem?.stock ?? 100;
            const newQty = i.quantity + delta;
            if (newQty > maxStock) {
              alert(`Max stock available: ${maxStock}`);
              return i;
            }
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeOtcItem = (itemId) => {
    clinicAudio.triggerHaptic(15);
    setOtcCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const otcSubtotal = useMemo(() => {
    return otcCart.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  }, [otcCart]);

  const otcFinalTotal = Math.max(0, otcSubtotal - Number(otcDiscount || 0));
  const otcChangeDue = otcPaymentMethod === 'CASH' && otcCashTendered
    ? Math.max(0, Number(otcCashTendered) - otcFinalTotal)
    : 0;

  const handleCheckoutOtc = () => {
    if (otcCart.length === 0) {
      alert('Please add at least one medicine or consumable to the cart.');
      return;
    }
    if (otcPaymentMethod === 'CASH' && Number(otcCashTendered || 0) < otcFinalTotal && otcFinalTotal > 0) {
      alert(`Cash tendered (${currencySymbol} ${otcCashTendered || 0}) is less than the total due (${currencySymbol} ${otcFinalTotal}).`);
      return;
    }

    clinicAudio.triggerHaptic(35);

    const saleResult = sellPharmacyDirectOTC({
      customerName: otcCustomerName.trim() || 'Walk-in OTC Customer',
      phone: otcCustomerPhone.trim(),
      items: otcCart,
      discount: Number(otcDiscount || 0),
      paymentMethod: otcPaymentMethod,
      cashTendered: otcPaymentMethod === 'CASH' ? Number(otcCashTendered || otcFinalTotal) : null
    });

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}

    // Find the newly generated invoice in invoices
    const newInv = (invoices || [])[0] || {
      invoiceNumber: `APEX-OTC-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: otcCustomerName.trim() || 'Walk-in OTC Customer',
      total: otcFinalTotal,
      subtotal: otcSubtotal,
      discount: Number(otcDiscount || 0),
      paymentMethod: otcPaymentMethod,
      cashTendered: otcPaymentMethod === 'CASH' ? Number(otcCashTendered || otcFinalTotal) : null,
      changeDue: otcChangeDue,
      medications: otcCart
    };

    // Open universal print modal for immediate receipt printing
    setPrintModalData({
      patient: {
        name: otcCustomerName.trim() || 'Walk-in OTC Customer',
        phone: otcCustomerPhone.trim(),
        tokenNumber: 'OTC-WALKIN',
        doctorName: 'Direct Pharmacy OTC Counter',
        department: 'Pharmacy Retail',
        cabinId: 'OTC',
        medications: otcCart
      },
      invoice: newInv,
      billingMode: true
    });

    // Reset OTC cart
    setOtcCart([]);
    setOtcCustomerName('');
    setOtcCustomerPhone('');
    setOtcCashTendered('');
    setOtcDiscount(0);
  };

  // ==================== ADD ITEM MODAL SUBMIT ====================
  const handleAddNewItemSubmit = (e) => {
    e.preventDefault();
    if (!newItemData.name.trim()) {
      alert('Please enter an item or medicine name.');
      return;
    }

    clinicAudio.triggerHaptic(25);
    addFormularyItem({
      ...newItemData,
      price: Number(newItemData.price) || 0,
      stock: Number(newItemData.stock) || 0
    });

    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.5 } });
    } catch {}

    setShowAddItemModal(false);
    // Reset form
    setNewItemData({
      type: 'PHARMACY',
      name: '',
      generic: '',
      strength: '500mg',
      form: 'Tablet',
      category: 'Analgesics',
      price: 150,
      stock: 60,
      batchNumber: 'BT-9001',
      expiryDate: '2026-12',
      storageLocation: 'Shelf B-03',
      instructions: '1 tablet after meals as prescribed',
      isPrescriptionRequired: false,
      showToDoctor: true
    });
  };

  // Hardware attached keyboard & barcode scanner shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when modal is open
      if (showAddItemModal || printModalData || activeLaserInvoice) return;

      if (e.key === 'F2' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (activeTab === 'OTC' && otcCart.length > 0) {
          handleCheckoutOtc();
        } else if (activeTab === 'QUEUED' && activeOrder && !isPatientInCabin) {
          handleDispenseWithPayment();
        }
      } else if (e.key === 'Escape') {
        if (otcSearchQuery) {
          setOtcSearchQuery('');
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, otcCart, activeOrder, isPatientInCabin, showAddItemModal, printModalData, activeLaserInvoice, otcSearchQuery, searchQuery]);

  const queuedCount = pharmacyQueue.filter((rx) => rx.status === 'QUEUED').length;
  const dispensedList = pharmacyQueue.filter((rx) => rx.status === 'DISPENSED');

  return (
    <div className="flex-1 min-h-0 bg-[#F8F9FA] text-slate-800 flex flex-col overflow-hidden select-none font-sans h-full">
      {/* Top Pharmacy Status & POS Mode Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B0029] to-[#9E1238] text-white flex items-center justify-center shadow-xs shrink-0">
            <Pill className="w-4 h-4" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                Pharmacy POS Desk
              </h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-rose-100 text-[#8B0029] font-extrabold uppercase">
                Touch & Scanner POS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden xl:block">
              {clinicSettings?.pharmacySettings?.headPharmacist || 'Inhouse Clinical Pharmacy'} • POS Retail & Rx Dispense
            </p>
          </div>

          {/* POS Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs shrink-0 ml-1">
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setActiveTab('OTC');
                setTimeout(() => otcSearchInputRef.current?.focus(), 100);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'OTC'
                  ? 'bg-[#8B0029] text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-[#8B0029]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Walk-in POS</span>
              {otcCart.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-amber-950">
                  {otcCart.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setActiveTab('QUEUED');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'QUEUED'
                  ? 'bg-[#8B0029] text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-[#8B0029]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Doctor Rx Queue</span>
              {queuedCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  activeTab === 'QUEUED' ? 'bg-white text-[#8B0029]' : 'bg-rose-200 text-rose-950'
                }`}>
                  {queuedCount}
                </span>
              )}
            </button>

            {/* Emergency & Minor Procedure Kits Tab */}
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setActiveTab('EMERGENCY_KITS');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'EMERGENCY_KITS'
                  ? 'bg-rose-600 text-white font-black shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="text-xs">🚨</span>
              <span>Emergency Kits</span>
            </button>

            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setActiveTab('FORMULARY');
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer hidden md:flex items-center gap-1 ${
                activeTab === 'FORMULARY'
                  ? 'bg-[#8B0029] text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-[#8B0029]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stock</span>
            </button>

            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setActiveTab('DISPENSED');
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer hidden md:flex items-center gap-1 ${
                activeTab === 'DISPENSED'
                  ? 'bg-[#8B0029] text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-[#8B0029]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          </div>
        </div>

        {/* Right side: + Add Item & Workstation controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(15);
              setShowAddItemModal(true);
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            title="Add new item to formulary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Item</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />
          <WorkstationHeaderControls />
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PRESCRIPTION QUEUE & DISPENSE WORKFLOW
      ========================================================================= */}
      {activeTab === 'QUEUED' && (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2.5 p-2 sm:p-2.5 md:p-3 overflow-hidden h-full">
          {/* Left Column: Incoming Orders List (4 Cols) */}
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col shadow-2xs min-h-0 overflow-hidden h-full">
            {/* Search Bar in Image 2 Style */}
            <div className="pb-2 border-b border-slate-100 mb-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search token, patient, doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-full pl-9 pr-12 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B0029] focus:border-[#8B0029] transition-all shadow-2xs"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-250 rounded shadow-2xs pointer-events-none">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-0">
              {filteredOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <PackageCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No prescriptions waiting</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Orders from doctor cabins appear here in real-time.
                  </p>
                </div>
              ) : (
                filteredOrders.map((rx) => {
                  const isSelected = activeOrder?.id === rx.id;
                  const isDispensed = rx.status === 'DISPENSED';
                  const medsCount = (rx.medications || rx.items || []).length;
                  const patientObj = (patients || []).find(
                    (p) => p.tokenNumber === rx.tokenNumber || p.id === rx.patientId
                  );
                  const isRxPatientInCabin =
                    patientObj?.status === 'IN_CONSULTATION' || patientObj?.status === 'CALLED';

                  return (
                    <div
                      key={rx.id}
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        setSelectedOrderId(rx.id);
                      }}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-600 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-purple-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-mono font-black text-xs shrink-0 whitespace-nowrap">
                            {rx.tokenNumber}
                          </span>
                          <span className="text-xs font-black text-slate-900 truncate flex-1 min-w-0">{rx.patientName}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                            isDispensed
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRxPatientInCabin
                              ? 'bg-amber-100 text-amber-900 font-extrabold'
                              : 'bg-purple-100 text-purple-800 animate-pulse'
                          }`}
                        >
                          {isDispensed
                            ? 'Dispensed'
                            : isRxPatientInCabin
                            ? 'In Cabin'
                            : 'Rx Ready'}
                        </span>
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                        <span className="truncate max-w-[130px]">
                          Cabin {rx.cabinId} • {rx.doctorName.split(',')[0]}
                        </span>
                        <span className="font-bold text-purple-700 shrink-0">
                          {medsCount} Item{medsCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Verification, Packaging & Dual Dispensing (8 Cols) */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs min-h-0 overflow-hidden h-full">
            {activeOrder ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {/* Patient & Doctor Card Header */}
                  <div className="p-2 sm:p-2.5 bg-gradient-to-r from-purple-50 via-slate-50 to-blue-50 rounded-xl border border-purple-200 flex items-center justify-between flex-wrap gap-2 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="min-w-14 h-9 px-2 rounded-xl bg-purple-600 text-white flex items-center justify-center font-mono font-black text-sm whitespace-nowrap shadow-2xs shrink-0">
                        {activeOrder.tokenNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xs sm:text-sm font-black text-slate-900">{activeOrder.patientName}</h2>
                          <span className="px-2 py-0.5 rounded-md bg-white/80 border border-purple-200 text-purple-900 font-bold text-[10px]">
                            {activeOrder.gender}, {activeOrder.age}y
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          MRN: <strong className="font-mono">{activeOrder.patientId}</strong> • Phone: {activeOrder.phone || 'Walk-in'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-purple-900">
                        {activeOrder.doctorName.startsWith('Dr.') ? activeOrder.doctorName.split(',')[0] : `Dr. ${activeOrder.doctorName.split(',')[0]}`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Cabin {activeOrder.cabinId} ({activeOrder.department})
                      </div>
                    </div>
                  </div>

                  {/* In-Cabin Clinical Safety Warning Banner */}
                  {isPatientInCabin && (
                    <div className="my-1.5 p-2 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-amber-900 text-xs shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <strong>In Consultation:</strong> Patient is in Cabin {activeOrderPatient?.cabinId || activeOrder.cabinId}. Dispensing locked until doctor finishes.
                      </div>
                    </div>
                  )}

                  {/* Doctor Notes / Clinical Impression */}
                  {activeOrder.doctorNotes && (
                    <div className="my-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 flex items-start gap-1.5 shrink-0">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">Physician Instructions:</span> {activeOrder.doctorNotes}
                      </div>
                    </div>
                  )}

                  {/* Prescribed Items Checklist Table Header */}
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider my-1.5 flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-purple-600" />
                      Prescribed Medications ({orderMeds.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleVerifyAllItems}
                        className="text-[10px] font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        ✓ Verify All
                      </button>
                      <span className="text-[11px] font-mono font-bold text-slate-600">
                        Subtotal: {currencySymbol}{orderSubtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
                    {orderMeds.map((med, idx) => {
                      const isChecked = verifiedItems[med.id || idx] || activeOrder.status === 'DISPENSED';
                      const formularyItem = (pharmacyFormulary || []).find(
                        (f) => f.id === med.id || f.name?.toLowerCase() === med.name?.toLowerCase()
                      );
                      const resolvedShelf =
                        med.storageLocation ||
                        formularyItem?.storageLocation ||
                        (med.type === 'GENERAL' ? 'Shelf G-01' : 'Shelf B-08');

                      const resolvedStock = formularyItem?.stock ?? 45;
                      const isLow = resolvedStock <= lowStockThreshold;

                      return (
                        <div
                          key={med.id || idx}
                          onClick={() => toggleItemVerified(med.id || idx)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-emerald-50/60 border-emerald-400'
                              : 'bg-slate-50 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <span>{med.name}</span>
                                {formularyItem?.batchNumber && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-slate-200 font-mono text-slate-700">
                                    {formularyItem.batchNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-purple-800 font-semibold">
                                {med.dosage} • {med.duration} • Qty: {med.quantity || 1}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 mb-0.5">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                                {resolvedShelf}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {resolvedStock} in stock
                              </span>
                            </div>
                            <span className="text-xs font-black font-mono text-slate-800">
                              {currencySymbol}{(Number(med.price || 15) * (Number(med.quantity) || 1)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Checkout & Payment Controls (Shrink-0) */}
                <div className="shrink-0 pt-2 border-t border-slate-200 space-y-2 mt-1.5">
                  {/* Counseling Notes */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Pharmacist Counseling Notes:
                    </label>
                    <input
                      type="text"
                      value={pharmacistNotes}
                      onChange={(e) => setPharmacistNotes(e.target.value)}
                      placeholder="e.g. Advised to take with food. Keep cool."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                    />
                  </div>

                  {/* Payment Mode & Cash Tender Calculator (Same as Kiosk / User Requested) */}
                  {dispensePaymentMode === 'CASH' ? (
                    <PosPaymentKeypad
                      value={dispenseCashTendered}
                      onChange={(val) => setDispenseCashTendered(val)}
                      totalDue={orderTotalAfterDiscount}
                      currencySymbol={currencySymbol}
                      allowCabinOption={true}
                      cabinLabel={`Cabin ${activeOrder.cabinId || 1}`}
                      paymentMode={dispensePaymentMode}
                      onPaymentModeChange={setDispensePaymentMode}
                      availableModes={['CASH', 'CARD', 'TOUCH_PAY']}
                    />
                  ) : (
                    <div className="p-2.5 sm:p-3 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                            Payment Mode:
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium ml-1.5 hidden sm:inline">
                            {dispensePaymentMode === 'CARD' ? 'EMV Card Terminal' : 'Touch QR Payment'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[
                            { id: 'CASH', label: 'Cash at Counter', icon: Banknote },
                            { id: 'CARD', label: 'EMV Card', icon: CreditCard },
                            { id: 'TOUCH_PAY', label: 'Touch QR', icon: QrCode }
                          ].map((mode) => {
                            const isActive = dispensePaymentMode === mode.id;
                            const Icon = mode.icon;
                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => {
                                  clinicAudio.triggerHaptic(10);
                                  setDispensePaymentMode(mode.id);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                <span>{mode.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {dispensePaymentMode === 'CARD' ? (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <div>
                              <span className="font-bold text-slate-800">EMV Card Reader Active</span>
                              <span className="text-[10px] text-slate-500 block">Tap contactless card or insert chip into POS terminal</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-blue-900 text-sm">
                            {currencySymbol}{orderTotalAfterDiscount.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-indigo-600" />
                            <div>
                              <span className="font-bold text-slate-800">Touch QR Dynamic Payment</span>
                              <span className="text-[10px] text-slate-500 block">Scan QR on customer terminal display</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-indigo-900 text-sm">
                            {currencySymbol}{orderTotalAfterDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dispense Dual Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAnnouncePickup}
                      disabled={isPatientInCabin}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isPatientInCabin
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call Patient</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDispenseRxOnly}
                        disabled={isPatientInCabin}
                        className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Dispense Rx Slip (Free)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDispenseWithPayment}
                        disabled={isPatientInCabin || !isCounterPaymentAllowed}
                        className={`px-4 py-2 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                          isPatientInCabin
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-70'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/20 active:scale-95'
                        }`}
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Settle & Dispense ({currencySymbol}{orderTotalAfterDiscount.toFixed(2)})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Pill className="w-12 h-12 mb-2 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">Select a Prescription from the Queue</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                  Doctor prescriptions appear on the left. Click any ticket to verify and dispense.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: WALK-IN OTC (OVER-THE-COUNTER) RETAIL POS DESK
      ========================================================================= */}
      {activeTab === 'OTC' && (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2.5 p-2 sm:p-2.5 md:p-3 overflow-hidden h-full">
          {/* Left Column: Product Catalog & Barcode Scanner (7 Cols) */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col shadow-2xs min-h-0 overflow-hidden h-full">
            {/* Search & Category Filter */}
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={otcSearchInputRef}
                  type="text"
                  placeholder="Scan barcode or type name (Press Enter to add)..."
                  value={otcSearchQuery}
                  onChange={(e) => setOtcSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && otcSearchQuery.trim()) {
                      const q = otcSearchQuery.trim().toLowerCase();
                      const matched = pharmacyFormulary.find(
                        (f) =>
                          f.name.toLowerCase() === q ||
                          (f.batchNumber && f.batchNumber.toLowerCase() === q) ||
                          f.name.toLowerCase().includes(q) ||
                          (f.generic && f.generic.toLowerCase().includes(q))
                      );
                      if (matched) {
                        addToOtcCart(matched);
                        setOtcSearchQuery('');
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
                {otcSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtcSearchQuery('');
                      otcSearchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Category Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'PHARMACY', label: '💊 Meds' },
                  { id: 'GENERAL', label: '📦 Supplies' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setOtcCategoryFilter(cat.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      otcCategoryFilter === cat.id
                        ? 'bg-purple-600 text-white font-black shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1 min-h-0">
              {pharmacyFormulary
                .filter((item) => {
                  if (otcCategoryFilter === 'PHARMACY') return item.type !== 'GENERAL';
                  if (otcCategoryFilter === 'GENERAL') return item.type === 'GENERAL';
                  return true;
                })
                .filter((item) => {
                  if (!otcSearchQuery) return true;
                  const q = otcSearchQuery.toLowerCase();
                  return (
                    item.name.toLowerCase().includes(q) ||
                    (item.generic || '').toLowerCase().includes(q) ||
                    (item.category || '').toLowerCase().includes(q) ||
                    (item.batchNumber && item.batchNumber.toLowerCase().includes(q))
                  );
                })
                .map((item) => {
                  const stock = item.stock ?? 50;
                  const inCart = otcCart.find((c) => c.id === item.id);
                  const isOutOfStock = stock <= 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!isOutOfStock) addToOtcCart(item);
                      }}
                      className={`p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer select-none active:scale-[0.98] ${
                        isOutOfStock
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : inCart
                          ? 'bg-purple-50/70 border-purple-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="text-xs font-black text-slate-900 line-clamp-1 leading-snug">
                            {item.name}
                          </div>
                          {inCart && (
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-purple-700 font-semibold line-clamp-1 mt-0.5">
                          {item.generic || item.category}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {item.form || 'Unit'} • {item.strength || 'Std'}
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black font-mono text-purple-900">
                          {currencySymbol}{Number(item.price || 0).toFixed(2)}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800'
                            : stock <= lowStockThreshold
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isOutOfStock ? '0 stock' : `${stock} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Column: POS Shopping Ticket & Cashier Settlement (5 Cols) */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs min-h-0 overflow-hidden h-full">
            {/* Ticket Header & Customer Row */}
            <div className="shrink-0 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-black text-slate-900">Active POS Ticket</span>
                  {otcCart.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
                      {otcCart.reduce((acc, i) => acc + i.quantity, 0)} items
                    </span>
                  )}
                </div>
                {otcCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setOtcCart([]);
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Customer Name & Phone Input (Compact) */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={otcCustomerName}
                  onChange={(e) => setOtcCustomerName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400"
                />
                <input
                  type="text"
                  placeholder="Phone (Optional)"
                  value={otcCustomerPhone}
                  onChange={(e) => setOtcCustomerPhone(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 my-1.5 pr-0.5">
              {otcCart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-6">
                  <ShoppingCart className="w-10 h-10 mb-1.5 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">Ticket is Empty</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tap products on left or scan barcode to add</p>
                </div>
              ) : (
                otcCart.map((item) => (
                  <div
                    key={item.id}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {currencySymbol}{Number(item.price || 0).toFixed(2)} each
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateOtcQuantity(item.id, -1)}
                        className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 font-black text-xs flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateOtcQuantity(item.id, 1)}
                        className="w-5 h-5 rounded bg-purple-100 hover:bg-purple-200 text-purple-900 font-black text-xs flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOtcItem(item.id)}
                        className="w-5 h-5 rounded text-rose-500 hover:bg-rose-50 font-bold text-xs flex items-center justify-center cursor-pointer ml-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-14 text-right font-mono font-black text-xs text-slate-800 shrink-0">
                      {currencySymbol}{(Number(item.price || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Tender Drawer (Shrink-0) */}
            <div className="shrink-0 pt-2 border-t border-slate-200 space-y-1.5">
              {/* Financial Summary */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{currencySymbol}{otcSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Discount ({currencySymbol}):</span>
                  <input
                    type="number"
                    min="0"
                    value={otcDiscount}
                    onChange={(e) => setOtcDiscount(Number(e.target.value) || 0)}
                    className="w-16 bg-white border border-slate-200 rounded px-1 py-0.5 text-xs font-mono text-right"
                  />
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
                  <span className="font-black text-slate-900 text-xs">Total Payable:</span>
                  <span className="text-base font-black font-mono text-purple-700">
                    {currencySymbol}{otcFinalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Mode & Cash Tender Calculator (Same as Kiosk / User Requested) */}
              {otcPaymentMethod === 'CASH' ? (
                <PosPaymentKeypad
                  value={otcCashTendered}
                  onChange={(val) => setOtcCashTendered(val)}
                  totalDue={otcFinalTotal}
                  currencySymbol={currencySymbol}
                  allowCabinOption={false}
                  paymentMode={otcPaymentMethod}
                  onPaymentModeChange={setOtcPaymentMethod}
                  availableModes={['CASH', 'CARD', 'TOUCH_PAY']}
                />
              ) : (
                <div className="p-2.5 sm:p-3 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                        Payment Mode:
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium ml-1.5 hidden sm:inline">
                        {otcPaymentMethod === 'CARD' ? 'EMV Card Terminal' : 'Touch QR Payment'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'CASH', label: 'Cash at Counter', icon: Banknote },
                        { id: 'CARD', label: 'EMV Card', icon: CreditCard },
                        { id: 'TOUCH_PAY', label: 'Touch QR', icon: QrCode }
                      ].map((mode) => {
                        const isActive = otcPaymentMethod === mode.id;
                        const Icon = mode.icon;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(10);
                              setOtcPaymentMethod(mode.id);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {otcPaymentMethod === 'CARD' ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <span className="font-bold text-slate-800">EMV Card Reader Active</span>
                          <span className="text-[10px] text-slate-500 block">Tap contactless card or insert chip into POS reader</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-blue-900 text-sm">
                        {currencySymbol}{otcFinalTotal.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-indigo-600" />
                        <div>
                          <span className="font-bold text-slate-800">Touch QR Dynamic Payment</span>
                          <span className="text-[10px] text-slate-500 block">Scan QR on customer terminal display</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-indigo-900 text-sm">
                        {currencySymbol}{otcFinalTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Primary Checkout Button (Image 2 vibrant CTA) */}
              <button
                type="button"
                disabled={otcCart.length === 0}
                onClick={handleCheckoutOtc}
                className="w-full py-2.5 bg-gradient-to-r from-[#8B0029] via-[#9E1238] to-[#8B0029] hover:from-[#7A0024] hover:to-[#8B0029] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/25 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Sale & Print POS Receipt ({currencySymbol}{otcFinalTotal.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: STOCK & FORMULARY INVENTORY MANAGEMENT
      ========================================================================= */}
      {activeTab === 'FORMULARY' && (
        <div className="flex-1 min-h-0 p-2 sm:p-2.5 md:p-3 overflow-hidden h-full flex flex-col">
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2 shrink-0">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-purple-600" />
                  Clinic Stock & Formulary Management
                </h2>
                <p className="text-[10px] text-slate-500">
                  Live inventory levels, shelf locations, batch numbering, and instant stock adjustments.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFormularyFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    formularyFilter === 'ALL'
                      ? 'bg-purple-600 text-white font-black shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({pharmacyFormulary.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFormularyFilter('PHARMACY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    formularyFilter === 'PHARMACY'
                      ? 'bg-purple-600 text-white font-black shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  💊 Meds ({pharmacyFormulary.filter((m) => m.type !== 'GENERAL').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFormularyFilter('GENERAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    formularyFilter === 'GENERAL'
                      ? 'bg-purple-600 text-white font-black shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📦 Supplies ({pharmacyFormulary.filter((m) => m.type === 'GENERAL').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFormularyFilter('LOW_STOCK')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    formularyFilter === 'LOW_STOCK'
                      ? 'bg-rose-600 text-white font-black shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low Stock (≤{lowStockThreshold})</span>
                </button>
              </div>
            </div>

            {/* Formulary Cards Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pr-1 pt-2">
              {pharmacyFormulary
                .filter((med) => {
                  if (formularyFilter === 'PHARMACY') return med.type !== 'GENERAL';
                  if (formularyFilter === 'GENERAL') return med.type === 'GENERAL';
                  if (formularyFilter === 'LOW_STOCK') return (med.stock ?? 50) <= lowStockThreshold;
                  return true;
                })
                .map((med) => {
                  const stock = med.stock ?? 50;
                  const isLow = stock <= lowStockThreshold;

                  return (
                    <div
                      key={med.id}
                      className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-purple-300 transition-all shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="text-xs font-black text-slate-900 leading-snug">{med.name}</div>
                            <div className="text-[10px] text-purple-700 font-semibold">{med.generic || med.category}</div>
                          </div>
                          <span className="text-xs font-black font-mono text-purple-900 shrink-0">
                            {currencySymbol}{Number(med.price || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-1.5 py-1 px-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[9px] text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                            {med.storageLocation || 'Shelf B-02'}
                          </span>
                          <span className="font-mono text-slate-400">
                            {med.batchNumber || 'BT-101'}
                          </span>
                        </div>
                      </div>

                      {/* Stock Level & Live Adjustment */}
                      <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {stock} in stock
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustFormularyStock(med.id, -1)}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-200 font-black text-xs flex items-center justify-center cursor-pointer"
                            title="Decrement 1 stock"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustFormularyStock(med.id, 1)}
                            className="w-5 h-5 rounded bg-purple-100 hover:bg-purple-200 text-purple-900 font-black text-xs flex items-center justify-center cursor-pointer"
                            title="Add 1 stock"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustFormularyStock(med.id, 10)}
                            className="px-1.5 h-5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-[9px] flex items-center justify-center cursor-pointer"
                            title="Add 10 stock"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DISPENSED ARCHIVE & REPRINT LOGS
      ========================================================================= */}
      {activeTab === 'DISPENSED' && (
        <div className="flex-1 min-h-0 p-2 sm:p-2.5 md:p-3 overflow-hidden h-full flex flex-col">
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2 shrink-0">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Prescription Dispensation & Receipt Archive
                </h2>
                <p className="text-[10px] text-slate-500">
                  Complete audit trail of all dispensed doctor prescriptions and counter retail sales with reprint capabilities.
                </p>
              </div>
              <div className="text-xs text-slate-500 font-bold">
                {dispensedList.length} Archived Records
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 pt-1.5">
              {dispensedList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <PackageCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold">No dispensed prescriptions yet.</p>
                </div>
              ) : (
                dispensedList.map((item) => {
                  const itemsCount = (item.medications || item.items || []).length;
                  const isPaid = item.dispenseMode === 'PURCHASE_RECEIPT';

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-2 flex-wrap hover:bg-white transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          {item.tokenNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">{item.patientName}</span>
                            <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold ${
                              isPaid ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isPaid ? 'Billed & Settled' : 'Rx Slip Only'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Cabin {item.cabinId} • {item.doctorName} • {itemsCount} Medication{itemsCount > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setPrintModalData({
                              patient: {
                                name: item.patientName,
                                age: item.age,
                                gender: item.gender,
                                phone: item.phone,
                                tokenNumber: item.tokenNumber,
                                doctorName: item.doctorName,
                                department: item.department,
                                cabinId: item.cabinId,
                                medications: item.medications || item.items || []
                              },
                              invoice: isPaid ? (invoices.find((i) => i.tokenNumber === item.tokenNumber) || null) : null,
                              billingMode: isPaid
                            });
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Reprint A5</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setPrintModalData({
                              patient: {
                                name: item.patientName,
                                age: item.age,
                                gender: item.gender,
                                phone: item.phone,
                                tokenNumber: item.tokenNumber,
                                doctorName: item.doctorName,
                                department: item.department,
                                cabinId: item.cabinId,
                                medications: item.medications || item.items || []
                              },
                              invoice: isPaid ? (invoices.find((i) => i.tokenNumber === item.tokenNumber) || null) : null,
                              billingMode: isPaid
                            });
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Reprint Thermal</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: EMERGENCY & MINOR PROCEDURE KITS (EXPEDITED REQUISITION & DISPATCH)
      ========================================================================= */}
      {activeTab === 'EMERGENCY_KITS' && (
        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 overflow-y-auto bg-slate-50/50">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-3xl shadow-md shadow-rose-600/20 mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Emergency & Minor Procedure Kits Requisition Desk
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-rose-800 uppercase shadow-xs">
                    Ready-To-Issue
                  </span>
                </div>
                <p className="text-xs text-rose-100 mt-0.5">
                  Pre-assembled sterile consumables kits for immediate dispatch to Doctor Cabins, Treatment Rooms, & Emergency Minor OT.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-100 bg-rose-800/60 px-3 py-1.5 rounded-xl border border-rose-400">
                ⚡ 1-Click Supply Protocol Active
              </span>
            </div>
          </div>

          {/* Grid of Kits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMERGENCY_KITS.map((kit) => (
              <div
                key={kit.id}
                className="bg-white border-2 border-slate-200 hover:border-rose-300 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 bg-rose-50 rounded-2xl border border-rose-100">
                        {kit.icon}
                      </span>
                      <div>
                        <h3 className="font-black text-sm text-slate-900 leading-tight">
                          {kit.name}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {kit.code} • {kit.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black font-mono text-rose-600 shrink-0">
                      {currencySymbol} {kit.price}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5">
                    {kit.description}
                  </p>

                  <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">
                      Kit Contents:
                    </span>
                    <ul className="text-[11px] text-slate-700 space-y-0.5 list-disc list-inside">
                      {kit.items.map((item, iIdx) => (
                        <li key={iIdx} className="truncate">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddKitToOtcCart(kit)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Add to POS Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleIssueEmergencyKit(kit, kit.recommendedCabin)}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>⚡ Issue to Cabin 1</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PHARMACIST ADD MEDICINE OR GENERAL ITEM
      ========================================================================= */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Add Item to Inhouse Formulary</h3>
                  <p className="text-[11px] text-slate-500">Pharmacist stock registration & doctor prescription pad sync</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewItemSubmit} className="space-y-3">
              {/* Type Switcher: Medication vs General Supply */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Item Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemData((prev) => ({ ...prev, type: 'PHARMACY', form: 'Tablet', category: 'Analgesics' }))}
                    className={`py-2 text-xs font-black rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      newItemData.type === 'PHARMACY'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Pill className="w-4 h-4" /> Medication / Drug
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemData((prev) => ({ ...prev, type: 'GENERAL', form: 'Consumable / Piece', category: 'Medical Supply' }))}
                    className={`py-2 text-xs font-black rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      newItemData.type === 'GENERAL'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Package className="w-4 h-4" /> General Consumable
                  </button>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {newItemData.type === 'PHARMACY' ? 'Brand / Medicine Name *' : 'Item / Supply Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newItemData.type === 'PHARMACY' ? 'e.g. Panadol Extra 500mg' : 'e.g. Sterile Gauze Swabs 10x10cm'}
                  value={newItemData.name}
                  onChange={(e) => setNewItemData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Generic Name / Formula */}
              {newItemData.type === 'PHARMACY' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Generic Formula / Composition</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol + Caffeine"
                    value={newItemData.generic}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, generic: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              )}

              {/* Strength & Dosage Form */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Dosage Form</label>
                  <select
                    value={newItemData.form}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, form: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream / Ointment</option>
                    <option value="Eye Drops">Eye / Ear Drops</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Surgical Consumable">Surgical Consumable</option>
                    <option value="Diagnostic Strip">Diagnostic Strip</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Strength / Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 10ml, Standard"
                    value={newItemData.strength}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, strength: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Price & Initial Stock */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Retail Price ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newItemData.price}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemData.stock}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, stock: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Batch & Storage Shelf */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Storage Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A-03"
                    value={newItemData.storageLocation}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, storageLocation: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BT-8840"
                    value={newItemData.batchNumber}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, batchNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemData.showToDoctor}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, showToDoctor: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold text-slate-700">Display in Doctor Prescription Pad</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemData.isPrescriptionRequired}
                    onChange={(e) => setNewItemData((prev) => ({ ...prev, isPrescriptionRequired: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold text-slate-700">Rx Required</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs shadow-md shadow-purple-500/20"
                >
                  Save to Formulary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          UNIVERSAL PRINT MODAL (A5 PAPER & 80MM THERMAL)
      ========================================================================= */}
      {printModalData && (
        <PrescriptionA5PrintModal
          patient={printModalData.patient}
          invoice={printModalData.invoice}
          billingMode={printModalData.billingMode}
          onClose={() => setPrintModalData(null)}
        />
      )}

      {/* Laser Invoice Fallback if needed */}
      {activeLaserInvoice && (
        <LaserMedicalInvoice
          invoice={activeLaserInvoice}
          onClose={() => setActiveLaserInvoice(null)}
        />
      )}
    </div>
  );
};
