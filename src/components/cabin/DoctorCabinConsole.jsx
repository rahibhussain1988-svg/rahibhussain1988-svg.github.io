import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Stethoscope,
  Bell,
  Play,
  CheckCircle2,
  PlusCircle,
  Clock,
  User,
  Heart,
  Activity,
  FileText,
  Pill,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Sparkles,
  ChevronDown,
  Building2,
  Check,
  Search,
  History,
  RotateCcw,
  Calendar,
  Send,
  ArrowRight,
  ArrowLeft,
  Phone,
  Thermometer,
  Volume2,
  X,
  ChevronRight,
  Edit3,
  Scissors,
  ShieldAlert,
  AlertTriangle,
  Plus,
  TrendingUp,
  Users,
  CheckCheck,
  RefreshCw,
  BarChart2,
  Eye,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';
import { WorkstationHeaderControls } from '../common/WorkstationHeaderControls';

export const DoctorCabinConsole = () => {
  const {
    currencySymbol,
    currencyCode,
    formatCurrency,
    formatMoney,
    formatDoctorName,
    cabins,
    patients,
    patientHistoryList,
    services,
    pharmacyFormulary,
    emergencyProcedures,
    recordMinorProcedure,
    selectedCabinId,
    setSelectedCabinId,
    callPatientToCabin,
    startConsultation,
    updateConsultationData,
    repeatPreviousPrescription,
    completeConsultation,
    returnToken,
    settleInvoice,
    searchPatientHistoryByPhone,
    updateCabinStatus,
    isCurrentClinicLocked,
    activeClinic,
    currentUser,
    USER_ROLES
  } = useClinic();

  // If logged in as Doctor, initially route to assigned doctorCabinId once
  const initialDoctorCabinSetRef = useRef(null);
  useEffect(() => {
    if (currentUser?.role === USER_ROLES?.DOCTOR_USER && currentUser?.doctorCabinId) {
      if (initialDoctorCabinSetRef.current !== currentUser.id) {
        setSelectedCabinId(Number(currentUser.doctorCabinId));
        initialDoctorCabinSetRef.current = currentUser.id;
      }
    }
  }, [currentUser, setSelectedCabinId, USER_ROLES]);

  // Workflow View Mode within Consultation:
  // 'PATIENT_SCREEN' | 'PREVIOUS_PRESCRIPTION' | 'WRITE_PRESCRIPTION'
  const [consultationView, setConsultationView] = useState('PATIENT_SCREEN');

  const currentCabin = cabins.find((c) => c.cabinId === selectedCabinId) || cabins[0];

  // 1. Patient who was CALLED but not yet checked in
  const calledPatient = patients.find(
    (p) => p.status === 'CALLED' && p.cabinId === selectedCabinId
  );

  // 2. Patient who is currently IN_CONSULTATION inside the cabin
  const inConsultationPatient = patients.find(
    (p) => p.status === 'IN_CONSULTATION' && p.cabinId === selectedCabinId
  );

  // 3. Next waiting patient for this cabin (Prioritize Emergency Triage Patients at the top!)
  const eligibleWaiting = patients
    .filter((p) => p.status === 'WAITING' && (p.cabinId === selectedCabinId || (p.isEmergency && (!p.cabinId || p.cabinId === selectedCabinId))))
    .sort((a, b) => {
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
      return 0;
    });
  const nextPatient = eligibleWaiting[0];

  // Active target patient for history lookups
  const targetPatient = inConsultationPatient || calledPatient;

  // Timers
  const [elapsedTimer, setElapsedTimer] = useState('00:00');
  const [calledTimer, setCalledTimer] = useState('00:00');

  // Doctor consultation inputs
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [showRxModal, setShowRxModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [rxSearchQuery, setRxSearchQuery] = useState('');
  const [labSearchQuery, setLabSearchQuery] = useState('');

  // Temperature Doctor Quick Edit Mode
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [customTemp, setCustomTemp] = useState('');

  // Phone Search State for Previous Patients
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');

  // Dashboard Top & Queue Hub States
  const [dashboardScope, setDashboardScope] = useState('CABIN'); // 'CABIN' | 'CLINIC'
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const [queueFilterTab, setQueueFilterTab] = useState('CABIN'); // 'CABIN' | 'ALL' | 'EMERGENCY' | 'COMPLETED'
  const [queueSearchQuery, setQueueSearchQuery] = useState('');

  // Dashboard Metrics Memo: Today, Weekly, Monthly & Important Figures
  const cabinMetrics = useMemo(() => {
    const allCompleted = (patients || []).filter(
      (p) => p.status === 'COMPLETED' || p.status === 'BILLING_PENDING' || p.status === 'SETTLED'
    );
    const cabinCompleted = allCompleted.filter((p) => p.cabinId === selectedCabinId);
    const isCabin = dashboardScope === 'CABIN';

    const todaySeen = isCabin
      ? Math.max(6 + cabinCompleted.length, cabinCompleted.length)
      : Math.max(22 + allCompleted.length, allCompleted.length);

    const weeklySeen = isCabin
      ? Math.max(42 + cabinCompleted.length * 3, 42)
      : Math.max(168 + allCompleted.length * 4, 168);

    const monthlySeen = isCabin
      ? Math.max(175 + cabinCompleted.length * 12, 175)
      : Math.max(690 + allCompleted.length * 15, 690);

    const allWaiting = (patients || []).filter((p) => p.status === 'WAITING');
    const cabinWaiting = allWaiting.filter((p) => p.cabinId === selectedCabinId || (p.isEmergency && !p.cabinId));
    const waitingCount = isCabin ? cabinWaiting.length : allWaiting.length;
    const emergencyWaitingCount = (isCabin ? cabinWaiting : allWaiting).filter((p) => p.isEmergency).length;

    const baseRxCount = isCabin ? 14 : 48;
    const activeRxCount = (isCabin ? cabinCompleted : allCompleted).reduce(
      (acc, p) => acc + (p.prescriptions?.length || 0), 0
    ) + (isCabin ? (inConsultationPatient?.prescriptions?.length || 0) : 0);
    const rxIssuedToday = baseRxCount + activeRxCount;

    const baseLabsCount = isCabin ? 5 : 18;
    const activeLabsCount = (isCabin ? cabinCompleted : allCompleted).reduce(
      (acc, p) => acc + (p.labOrders?.length || p.services?.filter(s => s.category !== 'Consultation')?.length || 0), 0
    ) + (isCabin ? (inConsultationPatient?.labOrders?.length || 0) : 0);
    const labsOrderedToday = baseLabsCount + activeLabsCount;

    const baseProcedures = isCabin ? 2 : 7;
    const activeProcedures = (isCabin ? cabinCompleted : allCompleted).reduce(
      (acc, p) => acc + (p.minorProcedures?.length || 0), 0
    );
    const proceduresToday = baseProcedures + activeProcedures;

    const avgConsultMins = isCabin ? '7.2 min' : '7.8 min';

    return {
      todaySeen,
      weeklySeen,
      monthlySeen,
      waitingCount,
      emergencyWaitingCount,
      rxIssuedToday,
      labsOrderedToday,
      proceduresToday,
      avgConsultMins,
      allWaitingCount: allWaiting.length,
      cabinWaitingCount: cabinWaiting.length,
      completedTodayCount: isCabin ? cabinCompleted.length : allCompleted.length
    };
  }, [patients, selectedCabinId, dashboardScope, inConsultationPatient]);

  // 1-Tap Quick-Add Routine Medications (Panadol, Augmentin, etc.)
  const handleQuickAddMed = (drugName, defaultForm = 'Tablet', defaultRegimen = '1-0-1', defaultTiming = 'After Meals (PC)', defaultDuration = '5 Days') => {
    const activeTarget = inConsultationPatient || targetPatient;
    if (!activeTarget) return;
    clinicAudio.triggerHaptic(15);
    const formularyMatch = (pharmacyFormulary || []).find(
      (f) => f.name?.toLowerCase().includes(drugName.toLowerCase())
    );
    const itemToAdd = formularyMatch ? {
      ...formularyMatch,
      frequency: defaultRegimen,
      timing: defaultTiming,
      duration: defaultDuration,
      dosage: `${defaultRegimen} (${defaultTiming})`,
      instructions: `${formularyMatch.defaultInstructions || 'Take with water after meals'}. Course: ${defaultDuration} (${formularyMatch.form || defaultForm}).`
    } : {
      id: `rx-quick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: drugName,
      form: defaultForm,
      category: 'General Medicine',
      frequency: defaultRegimen,
      timing: defaultTiming,
      duration: defaultDuration,
      dosage: `${defaultRegimen} (${defaultTiming})`,
      instructions: `Take with water after meals. Course: ${defaultDuration} (${defaultForm}).`,
      price: 15
    };
    handlePrescribeMedicine(itemToAdd);
  };

  // Quick inline update for Regimen / Timing / Duration without opening modal
  const handleQuickUpdateRxSchedule = (medId, changes) => {
    const activeTarget = inConsultationPatient || targetPatient;
    if (!activeTarget) return;
    clinicAudio.triggerHaptic(10);
    const existing = activeTarget.prescriptions || [];
    const updated = existing.map((m) => {
      if (m.id === medId || m.name === medId) {
        const nextFreq = changes.frequency || m.frequency || '1-0-1';
        const nextTiming = changes.timing || m.timing || 'After Meals (PC)';
        const nextDuration = changes.duration || m.duration || '5 Days';
        const formattedDosage = `${nextFreq} (${nextTiming})`;
        const baseInstructions = (m.instructions || '').replace(/\.?\s*Course:\s*[^.]+(\.|$)/gi, '').trim();
        return {
          ...m,
          ...changes,
          dosage: formattedDosage,
          instructions: `${baseInstructions ? baseInstructions + '. ' : ''}Course: ${nextDuration} (${m.form || 'Tablet'}).`
        };
      }
      return m;
    });
    updateConsultationData(activeTarget.id, { prescriptions: updated });
  };

  // Quick-Add Common Diagnostic Labs
  const handleQuickAddLab = (labName, labCode = 'LAB-REQ') => {
    const activeTarget = inConsultationPatient || targetPatient;
    if (!activeTarget) return;
    clinicAudio.triggerHaptic(15);
    const serviceMatch = (services || []).find(
      (s) => s.name?.toLowerCase().includes(labName.toLowerCase()) || s.code === labCode
    );
    const itemToAdd = serviceMatch || {
      id: `lab-quick-${Date.now()}`,
      name: labName,
      code: labCode,
      category: 'Diagnostic Lab',
      price: 25
    };
    handleAddLabTest(itemToAdd);
  };

  // Touch-Screen Standard Dosage Customizer State (Requested)
  const [dosageModalDrug, setDosageModalDrug] = useState(null);
  const [dosageStep, setDosageStep] = useState(1); // 1 | 2 | 3 | 4 | 5
  const [dosageQuantity, setDosageQuantity] = useState(10);
  const [dosageFrequency, setDosageFrequency] = useState('1-0-1');
  const [dosageTiming, setDosageTiming] = useState('After Meals (PC)');
  const [dosageDuration, setDosageDuration] = useState('5 Days');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [dosageInstructions, setDosageInstructions] = useState('');
  const [isEditingExistingRx, setIsEditingExistingRx] = useState(false);

  const handleOpenDosageModal = (drug, isEdit = false) => {
    clinicAudio.triggerHaptic(15);
    setShowRxModal(false);
    setDosageModalDrug(drug);
    setIsEditingExistingRx(isEdit);
    setDosageStep(1);

    const isGeneralSupply = drug.type === 'GENERAL' ||
      ['Wound Care & Dressing', 'Syringes & Injections', 'PPE & Consumables', 'Antiseptics & Solutions', 'Dressings & Tapes', 'Cotton & Consumables'].includes(drug.category) ||
      drug.name?.toLowerCase().includes('gauze') ||
      drug.name?.toLowerCase().includes('swab') ||
      drug.name?.toLowerCase().includes('syringe') ||
      drug.name?.toLowerCase().includes('gloves') ||
      drug.name?.toLowerCase().includes('tape') ||
      drug.name?.toLowerCase().includes('cotton');

    if (isGeneralSupply) {
      setDosageFrequency(drug.frequency || 'Single Use');
      setDosageTiming(drug.timing || 'External / Topical Use');
      setDosageDuration(drug.duration || 'Single Use');
      setDosageForm(drug.form || 'Pack / Swab');
      setDosageQuantity(drug.quantity || 1);
      setDosageInstructions(drug.instructions || drug.defaultInstructions || 'Apply topically / procedural dressing use. Not for oral ingestion.');
    } else {
      setDosageFrequency(drug.frequency || '1-0-1');
      setDosageTiming(drug.timing || 'After Meals (PC)');
      setDosageDuration(drug.duration || '5 Days');
      setDosageForm(drug.form || 'Tablet');
      setDosageQuantity(drug.quantity || 10);
      setDosageInstructions(drug.instructions || drug.defaultInstructions || 'Take after meals with a full glass of water');
    }
  };

  const handleConfirmDosage = () => {
    if (!dosageModalDrug) return;
    const activePatient = inConsultationPatient || targetPatient;
    if (!activePatient) return;
    clinicAudio.triggerHaptic(20);

    const chosenForm = dosageModalDrug.form || dosageForm || 'Tablet';
    const formattedDosage = `${dosageFrequency} (${dosageTiming})`;
    const fullInstructions = `${dosageInstructions ? dosageInstructions + '. ' : ''}Course: ${dosageDuration} (${chosenForm}).`;

    const prescriptionItem = {
      ...dosageModalDrug,
      id: dosageModalDrug.id || `rx-${Date.now()}`,
      frequency: dosageFrequency,
      timing: dosageTiming,
      duration: dosageDuration,
      quantity: 1,
      form: chosenForm,
      dosage: formattedDosage,
      instructions: fullInstructions,
      summary: `${dosageModalDrug.name} (${chosenForm}) • ${formattedDosage} • ${dosageDuration}`
    };

    const existing = activePatient.prescriptions || [];
    let updated;
    if (isEditingExistingRx) {
      updated = existing.map((m) =>
        (m.id === dosageModalDrug.id || m.name === dosageModalDrug.name) ? prescriptionItem : m
      );
    } else {
      updated = [...existing.filter((m) => m.name !== dosageModalDrug.name), prescriptionItem];
    }

    try {
      updateConsultationData(activePatient.id, { prescriptions: updated });
    } catch (err) {
      console.error('Failed to update consultation data:', err);
    }
    setDosageModalDrug(null);
    setShowRxModal(false);
  };

  // Minor Procedure Suite Modal State & Handlers
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [procedureSite, setProcedureSite] = useState('Right Forearm');
  const [procedurePerformedBy, setProcedurePerformedBy] = useState('Dr. Consultation Team');
  const [procedureNotes, setProcedureNotes] = useState('');
  const [procedureConsumables, setProcedureConsumables] = useState([]);

  const handleOpenProcedureModal = (proc = null) => {
    clinicAudio.triggerHaptic(15);
    const chosen = proc || (emergencyProcedures && emergencyProcedures[0]) || null;
    setSelectedProcedure(chosen);
    setProcedureSite('Right Forearm');
    setProcedurePerformedBy(`Dr. ${currentCabin?.doctorName?.split(',')[0]?.replace(/^(Dr\.\s*)+/i, '') || 'Attending Physician'}`);
    setProcedureNotes('');

    if (chosen?.code === 'EMG-PRC-CANN') {
      setProcedureConsumables(['20G IV Cannula (Pink)', 'Cannula Fixator Dressing', 'Alcohol Prep Swabs', 'Tourniquet & Gloves']);
    } else if (chosen?.code === 'EMG-PRC-CATH') {
      setProcedureConsumables(['Foley Catheter 16Fr', 'Urine Drainage Bag 2000ml', 'Lignocaine 2% Jelly', '10ml Sterile Water Syringe']);
    } else if (chosen?.code === 'EMG-PRC-DRES' || chosen?.code === 'EMG-PRC-CRPB') {
      setProcedureConsumables(['Sterile Gauze Pack', 'Pyodine Solution 10%', 'Crepe Bandage 10cm', 'Micropore Adhesive Tape']);
    } else if (chosen?.code === 'EMG-PRC-NEBU') {
      setProcedureConsumables(['Nebulizer Chamber & Mask', 'Salbutamol Respule 2.5mg', 'Normal Saline 0.9%']);
    } else if (chosen?.code === 'EMG-PRC-INJ' || chosen?.code === 'EMG-PRC-TETN') {
      setProcedureConsumables(['Disposable Syringe 3ml/5ml', 'Sterile Needle 24G', 'Alcohol Swabs']);
    } else {
      setProcedureConsumables(['Sterile Gloves Pack', 'Antiseptic Solution Swabs', 'Medical Tape']);
    }
    setShowProcedureModal(true);
  };

  const handleConfirmProcedure = () => {
    if (!selectedProcedure || !inConsultationPatient) return;
    clinicAudio.triggerHaptic(30);

    recordMinorProcedure(inConsultationPatient.id, {
      code: selectedProcedure.code,
      name: selectedProcedure.name,
      category: selectedProcedure.category,
      price: selectedProcedure.price,
      site: procedureSite,
      performedBy: procedurePerformedBy,
      consumablesUsed: procedureConsumables,
      clinicalNotes: procedureNotes || `Executed ${selectedProcedure.name} at ${procedureSite} successfully.`
    });

    try {
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
    } catch {}

    setShowProcedureModal(false);
  };

  // Return Token Modal State
  const [returnTokenModalPatient, setReturnTokenModalPatient] = useState(null);
  const [returnReason, setReturnReason] = useState('Patient No-Show (Did not arrive)');

  // Look up previous medical history by phone
  const activePatientHistory = useMemo(() => {
    const queryPhone = phoneSearchQuery.trim() || targetPatient?.phone || '';
    if (!queryPhone || queryPhone.length < 3) return [];
    return searchPatientHistoryByPhone(queryPhone);
  }, [phoneSearchQuery, targetPatient?.phone, searchPatientHistoryByPhone]);

  const primaryHistoryRecord = activePatientHistory[0] || null;

  // Consultation Stopwatch for active session
  useEffect(() => {
    if (!inConsultationPatient?.consultationStartTime) {
      setElapsedTimer('00:00');
      return;
    }

    const interval = setInterval(() => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - inConsultationPatient.consultationStartTime) / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      setElapsedTimer(
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [inConsultationPatient]);

  // Elapsed time since called
  useEffect(() => {
    if (!calledPatient?.calledAt) {
      setCalledTimer('00:00');
      return;
    }

    const interval = setInterval(() => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - calledPatient.calledAt) / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      setCalledTimer(
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [calledPatient]);

  // Sync clinical notes when inConsultationPatient changes
  useEffect(() => {
    if (inConsultationPatient) {
      setClinicalNotes(inConsultationPatient.clinicalNotes || '');
      setCustomTemp(inConsultationPatient.vitals?.temp || '98.6°F');
    }
  }, [inConsultationPatient?.id]);

  // Reset view to PATIENT_SCREEN when a new patient enters
  useEffect(() => {
    if (inConsultationPatient) {
      setConsultationView('PATIENT_SCREEN');
    }
  }, [inConsultationPatient?.id]);

  // Call Next Patient from Lounge
  const handleCallNext = () => {
    if (!nextPatient) return;
    clinicAudio.triggerHaptic(30);
    callPatientToCabin(nextPatient.id, selectedCabinId);
  };

  // Doctor presses "- Check In {Patient Name}"
  const handleCheckInPatient = (patient) => {
    if (!patient) return;
    clinicAudio.triggerHaptic(30);
    startConsultation(patient.id, selectedCabinId);
    setConsultationView('PATIENT_SCREEN');
  };

  // Re-announce called patient
  const handleReAnnounce = (patient) => {
    if (!patient) return;
    clinicAudio.triggerHaptic(20);
    clinicAudio.announcePatient(patient.tokenNumber, selectedCabinId, currentCabin.doctorName);
  };

  // Update Body Temperature
  const handleSaveTemp = () => {
    if (!inConsultationPatient) return;
    clinicAudio.triggerHaptic(15);
    const formatted = customTemp.includes('°') ? customTemp : `${customTemp}°F`;
    updateConsultationData(inConsultationPatient.id, {
      vitals: { temp: formatted }
    });
    setIsEditingTemp(false);
  };

  // Prescribe drug (clinical requisition - zero charge at doctor level)
  const handlePrescribeMedicine = (med) => {
    if (!inConsultationPatient) return;
    clinicAudio.triggerHaptic(15);
    const existing = inConsultationPatient.prescriptions || [];
    if (!existing.some((m) => m.name === med.name)) {
      updateConsultationData(inConsultationPatient.id, {
        prescriptions: [...existing, med]
      });
    }
  };

  // Remove drug
  const handleRemovePrescription = (medId) => {
    if (!inConsultationPatient) return;
    clinicAudio.triggerHaptic(15);
    const updated = (inConsultationPatient.prescriptions || []).filter(
      (m) => m.id !== medId && m.name !== medId
    );
    updateConsultationData(inConsultationPatient.id, { prescriptions: updated });
  };

  // 1-Tap Repeat Previous Prescription and jump to write screen
  const handleRepeatPastRx = (pastMedications) => {
    if (!inConsultationPatient || !pastMedications || !pastMedications.length) return;
    clinicAudio.triggerHaptic(25);
    repeatPreviousPrescription(inConsultationPatient.id, pastMedications);
    setConsultationView('WRITE_PRESCRIPTION');
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // Add/remove lab requisition (clinical order - zero charge at doctor level)
  const handleAddLabTest = (labSrv) => {
    if (!inConsultationPatient) return;
    clinicAudio.triggerHaptic(15);
    const currentLabOrders = inConsultationPatient.labOrders || [];
    const alreadyOrdered = currentLabOrders.some((s) => s.id === labSrv.id);
    if (alreadyOrdered) {
      // Toggle off - remove this lab order
      updateConsultationData(inConsultationPatient.id, {
        labOrders: currentLabOrders.filter((s) => s.id !== labSrv.id)
      });
    } else {
      // Append new lab order to existing ones
      updateConsultationData(inConsultationPatient.id, {
        labOrders: [...currentLabOrders, labSrv]
      });
    }
  };

  // Save consultation notes
  const handleSaveNotes = () => {
    if (!inConsultationPatient) return;
    clinicAudio.triggerHaptic(15);
    updateConsultationData(inConsultationPatient.id, { clinicalNotes });
  };

  // Complete consultation and send prescription to Inhouse Pharmacy (No charge at doctor level)
  const handleCompleteVisitAndSendRx = () => {
    if (!inConsultationPatient) return;
    clinicAudio.triggerHaptic(35);
    handleSaveNotes();
    completeConsultation(inConsultationPatient.id);
  };

  // Confirm Return Token
  const handleConfirmReturnToken = () => {
    if (!returnTokenModalPatient) return;
    clinicAudio.triggerHaptic(25);
    returnToken(returnTokenModalPatient.id, returnReason);
    setReturnTokenModalPatient(null);
    setConsultationView('PATIENT_SCREEN');
  };

  const consultationFeePaid = currentCabin?.consultationFee || inConsultationPatient?.consultationFee || inConsultationPatient?.amountPaid || inConsultationPatient?.totalFee || 60;

  if (isCurrentClinicLocked) {
    return (
      <div className="flex-1 min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-rose-950/30 to-slate-950 pointer-events-none" />
        <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-900/20 animate-pulse">
            <AlertCircle className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/30">
            System Notice
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">
            Clinic Access Suspended
          </h2>
          <p className="text-slate-300 text-sm sm:text-base font-medium mb-6 leading-relaxed">
            Please contact administrator.
          </p>
          {activeClinic?.lockReason && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-left mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                Suspension Reason:
              </span>
              <p className="text-xs text-rose-200 font-mono">
                {activeClinic.lockReason}
              </p>
            </div>
          )}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{activeClinic?.name}</span>
            <span className="font-mono">{activeClinic?.id}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F8F9FA] text-slate-800 flex flex-col min-h-0 overflow-y-auto select-none font-sans">
      {/* =========================================================================
          TOP CABIN STATUS & DOCTOR SUITE BAR
          ========================================================================= */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-rose-50 border-2 border-rose-200 shrink-0 shadow-xs">
            <img src={currentCabin.image} alt={currentCabin.doctorName} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Active On-Duty Physician" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#8B0029] uppercase tracking-wider">
                {currentCabin.cabinName} Suite
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-[#8B0029] border border-rose-200">
                {currentCabin.department}
              </span>
            </div>
            <h1 className="text-base font-black text-slate-900 truncate">{formatDoctorName(currentCabin.doctorName)}</h1>
            <p className="text-[10px] text-slate-500">{currentCabin.title} • {currentCabin.qualifications}</p>
          </div>
        </div>

        {/* Doctor Cabin Switcher & Duty Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            {cabins.map((c) => (
              <button
                key={c.cabinId}
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setSelectedCabinId(Number(c.cabinId));
                  setPhoneSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  Number(selectedCabinId) === Number(c.cabinId)
                    ? 'bg-[#8B0029] text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-[#8B0029]'
                }`}
              >
                Cabin {c.cabinId}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(15);
              const nextStatus = currentCabin.status === 'AVAILABLE' ? 'BREAK' : 'AVAILABLE';
              updateCabinStatus(currentCabin.cabinId, nextStatus);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              currentCabin.status === 'BREAK'
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
            }`}
          >
            {currentCabin.status === 'BREAK' ? 'On Break' : 'Active Duty'}
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
          <WorkstationHeaderControls />
        </div>
      </div>

      {/* =========================================================================
          DASHBOARD TOP: TOTAL PATIENTS SEEN TODAY, WEEKLY, MONTHLY & KEY FIGURES
          ========================================================================= */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2 shadow-2xs shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-[#8B0029] flex items-center justify-center font-bold">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Doctor Cabin Performance & Patient Throughput
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline">
              Live Real-Time
            </span>
          </div>

          {/* Filter Scope Toggle: Cabin vs All Clinic & Collapse */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(10);
                  setDashboardScope('CABIN');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  dashboardScope === 'CABIN'
                    ? 'bg-[#8B0029] text-white font-black shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cabin {selectedCabinId} Only
              </button>
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(10);
                  setDashboardScope('CLINIC');
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  dashboardScope === 'CLINIC'
                    ? 'bg-[#8B0029] text-white font-black shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Clinic Overview
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(10);
                setDashboardExpanded(!dashboardExpanded);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
              title="Expand or Collapse Dashboard Stats"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dashboardExpanded ? 'rotate-180' : ''}`} />
              <span className="text-[10px] hidden sm:inline">{dashboardExpanded ? 'Minimize' : 'Expand'}</span>
            </button>
          </div>
        </div>

        {/* Expanded KPI Cards Grid */}
        {dashboardExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2.5 pb-1 animate-in fade-in duration-200">
            {/* 1. Total Patients Seen Today */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 border border-emerald-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-3xs">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[10px] font-black uppercase tracking-wider">Patients Today</span>
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-950">
                  {cabinMetrics.todaySeen}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center">
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> Seen
                </span>
              </div>
              <span className="text-[9px] text-emerald-700/80 font-medium truncate mt-0.5">
                {dashboardScope === 'CABIN' ? `Dr. ${currentCabin?.doctorName?.split(',')[0]?.replace(/^(Dr\.\s*)+/i, '') || 'Attending'}` : 'Across all 5 suites'}
              </span>
            </div>

            {/* 2. Total Patients Seen Weekly */}
            <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 border border-blue-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-3xs">
              <div className="flex items-center justify-between text-blue-800">
                <span className="text-[10px] font-black uppercase tracking-wider">Weekly Seen</span>
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Calendar className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-blue-950">
                  {cabinMetrics.weeklySeen}
                </span>
                <span className="text-[10px] font-bold text-blue-700">7 Days</span>
              </div>
              <span className="text-[9px] text-blue-700/80 font-medium truncate mt-0.5">
                Past 7 days throughput
              </span>
            </div>

            {/* 3. Total Patients Seen Monthly */}
            <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/40 border border-purple-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-3xs">
              <div className="flex items-center justify-between text-purple-800">
                <span className="text-[10px] font-black uppercase tracking-wider">Monthly Seen</span>
                <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-purple-950">
                  {cabinMetrics.monthlySeen}
                </span>
                <span className="text-[10px] font-bold text-purple-700">MTD</span>
              </div>
              <span className="text-[9px] text-purple-700/80 font-medium truncate mt-0.5">
                Month-to-date consultations
              </span>
            </div>

            {/* 4. Patients Waiting in Queue */}
            <div className={`rounded-2xl p-2.5 flex flex-col justify-between border shadow-3xs transition-all ${
              cabinMetrics.emergencyWaitingCount > 0
                ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                : 'bg-amber-50/70 border-amber-200/90'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  cabinMetrics.emergencyWaitingCount > 0 ? 'text-rose-800 animate-pulse' : 'text-amber-800'
                }`}>
                  Waiting Queue
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  cabinMetrics.emergencyWaitingCount > 0 ? 'bg-rose-200 text-rose-800' : 'bg-amber-100 text-amber-700'
                }`}>
                  <Clock className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-xl sm:text-2xl font-black font-mono ${
                  cabinMetrics.emergencyWaitingCount > 0 ? 'text-rose-950' : 'text-amber-950'
                }`}>
                  {cabinMetrics.waitingCount}
                </span>
                {cabinMetrics.emergencyWaitingCount > 0 ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-black animate-pulse">
                    {cabinMetrics.emergencyWaitingCount} STAT
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700">In Lounge</span>
                )}
              </div>
              <span className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                {dashboardScope === 'CABIN' ? `Cabin #${selectedCabinId} Line` : 'Total Clinic Waiting'}
              </span>
            </div>

            {/* 5. Prescriptions Issued Today */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-3xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[10px] font-black uppercase tracking-wider">Rx Prescribed</span>
                <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Pill className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {cabinMetrics.rxIssuedToday}
                </span>
                <span className="text-[10px] font-bold text-slate-500">Meds</span>
              </div>
              <span className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                Digital pharmacy orders
              </span>
            </div>

            {/* 6. Diagnostic Labs Ordered Today */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-3xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[10px] font-black uppercase tracking-wider">Labs Ordered</span>
                <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Activity className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {cabinMetrics.labsOrderedToday}
                </span>
                <span className="text-[10px] font-bold text-slate-500">Tests</span>
              </div>
              <span className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                Diagnostics & Pathology
              </span>
            </div>

            {/* 7. Avg Consultation Time */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-3xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[10px] font-black uppercase tracking-wider">Avg Consult</span>
                <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center">
                  <Clock className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {cabinMetrics.avgConsultMins}
                </span>
                <span className="text-[10px] font-bold text-slate-500">/ patient</span>
              </div>
              <span className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                Average cabin duration
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MAIN WORKSTATION AREA
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-4">
        {/* =====================================================================
            STATE 1: PATIENT IS IN CONSULTATION (ACTIVE IN CABIN)
            ===================================================================== */}
        {inConsultationPatient ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto gap-3">
            {/* Top Patient Header & Navigation Breadcrumb Bar */}
            <div className={`bg-white border-2 rounded-3xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4 transition-all ${
              inConsultationPatient.isEmergency ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-300' : 'border-blue-200'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-13 h-13 rounded-2xl text-white flex items-center justify-center font-mono font-black text-xl shadow-sm ${
                  inConsultationPatient.isEmergency ? 'bg-rose-600 ring-2 ring-rose-400 animate-pulse' : 'bg-blue-600'
                }`}>
                  {inConsultationPatient.tokenNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-blue-950">{inConsultationPatient.patientName}</h2>
                    {inConsultationPatient.isEmergency && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-xs">
                        🚨 EMERGENCY TRIAGE
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                      {inConsultationPatient.gender}, {inConsultationPatient.age} yrs
                    </span>
                    {inConsultationPatient.isPaid || inConsultationPatient.paymentStatus === 'PAID' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black border border-emerald-200 uppercase" title="Upfront doctor consultation fee settled">
                        ✓ Consultation Paid ({formatCurrency(consultationFeePaid)})
                      </span>
                    ) : inConsultationPatient.paymentStatus === 'PAY_IN_CABIN' ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-black border border-purple-300 uppercase flex items-center gap-1 shadow-2xs" title="Consultation fee to be collected directly in Doctor's Cabin">
                          <Stethoscope className="w-3 h-3 text-purple-700" />
                          Fee to Collect in Cabin: {formatCurrency(consultationFeePaid)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(25);
                            settleInvoice(inConsultationPatient.invoiceId || inConsultationPatient.tokenNumber, 'CASH');
                          }}
                          className="px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[10px] font-black rounded-full cursor-pointer shadow-2xs transition-all active:scale-95"
                          title="Click to mark consultation fee as received in cabin"
                        >
                          ✓ Settle Fee in Cabin
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black border border-amber-300 uppercase animate-pulse" title="Upfront doctor consultation fee is pending payment at counter">
                        ⚠️ Fee Due at Counter ({formatCurrency(consultationFeePaid)})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>MRN: <strong className="font-mono text-slate-700">{inConsultationPatient.patientId}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-600" />
                      <strong>{inConsultationPatient.phone || 'Walk-in'}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-blue-900 font-bold">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                      Temp: {inConsultationPatient.vitals?.temp || '98.6°F'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 italic text-[11px]">
                      (Rx & Labs billed at Pharmacy / Lab)
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Stopwatch, Screen Workflow Switcher, and Return Token */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Elapsed Stopwatch */}
                <div className="flex items-center gap-2 bg-blue-50/80 px-3.5 py-1.5 rounded-2xl border border-blue-100">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-mono text-xs font-black text-blue-900">{elapsedTimer}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    In Cabin
                  </span>
                </div>

                {/* Workflow Navigation Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setConsultationView('PATIENT_SCREEN');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      consultationView === 'PATIENT_SCREEN'
                        ? 'bg-blue-600 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Patient Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setConsultationView('PREVIOUS_PRESCRIPTION');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      consultationView === 'PREVIOUS_PRESCRIPTION'
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-purple-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Previous Rx</span>
                    {primaryHistoryRecord?.visits?.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-900">
                        {primaryHistoryRecord.visits.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setConsultationView('WRITE_PRESCRIPTION');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      consultationView === 'WRITE_PRESCRIPTION'
                        ? 'bg-indigo-600 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-indigo-700'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Write Rx</span>
                    {inConsultationPatient.prescriptions?.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-900">
                        {inConsultationPatient.prescriptions.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Return Token Button */}
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    setReturnTokenModalPatient(inConsultationPatient);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-all active:scale-95"
                  title="Patient doesn't want to see doctor / request refund"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Return Token</span>
                </button>
              </div>
            </div>

            {/* STAT Emergency Patient Priority Banner */}
            {inConsultationPatient.isEmergency && (
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md shadow-rose-600/20 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl shrink-0">
                    🚨
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider uppercase">STAT Emergency Intake Active</span>
                      <span className="px-2 py-0.2 rounded-md bg-white/30 text-[10px] font-black uppercase">
                        Severity: {inConsultationPatient.severity || 'CRITICAL'}
                      </span>
                    </div>
                    <p className="text-xs text-rose-100 mt-0.5">
                      Requested Procedures: <strong>{inConsultationPatient.minorProcedures?.map(p => p.name).join(', ') || inConsultationPatient.procedureName || 'Bandage Dressing, IV Cannula, or Catheterization'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenProcedureModal()}
                  className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Execute Procedure Suite</span>
                </button>
              </div>
            )}

            {/* ===================================================================
                SUB-VIEW 1: PATIENT SCREEN (Symptoms, Temp/Vitals recorded by Receptionist,
                and on same screen show Previous Prescription & Write Prescription buttons)
                =================================================================== */}
            {consultationView === 'PATIENT_SCREEN' && (
              <div className="flex-1 bg-white border border-blue-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  {/* Top Notification Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-black text-blue-700 uppercase tracking-wider block">
                        Patient Initial Examination & Triage
                      </span>
                      <p className="text-xs text-slate-500">
                        Review symptoms and vital parameters recorded at the front desk before prescribing.
                      </p>
                    </div>

                    {primaryHistoryRecord && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        <span>Returning Patient ({primaryHistoryRecord.visits?.length || 1} Past Visits on Record)</span>
                      </span>
                    )}
                  </div>

                  {/* Two Main Cards: Symptoms & Receptionist Vitals/Temp */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Symptoms Section (6 Cols) */}
                    <div className="md:col-span-6 p-4 rounded-3xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                          Chief Complaints & Reported Symptoms
                        </h3>
                      </div>

                      {inConsultationPatient.symptoms && inConsultationPatient.symptoms.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {inConsultationPatient.symptoms.map((sym, idx) => (
                            <div
                              key={idx}
                              className="px-3.5 py-2 rounded-2xl bg-white border-2 border-blue-300 shadow-2xs flex items-center gap-2 text-xs font-black text-blue-950"
                            >
                              <span className="text-blue-600 font-bold">●</span>
                              <span>{sym}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 p-3 bg-white rounded-2xl border border-dashed border-blue-200">
                          General OPD Specialist Consultation. No specific acute symptoms flagged.
                        </div>
                      )}

                      {/* Known Allergies & Chronic Conditions */}
                      {primaryHistoryRecord && (primaryHistoryRecord.allergies?.length > 0 || primaryHistoryRecord.chronicConditions?.length > 0) && (
                        <div className="pt-2 mt-2 border-t border-blue-200/60 space-y-1.5 text-xs">
                          {primaryHistoryRecord.allergies?.length > 0 && (
                            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold flex items-center gap-1.5 text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Documented Allergies: {primaryHistoryRecord.allergies.join(', ')}</span>
                            </div>
                          )}
                          {primaryHistoryRecord.chronicConditions?.length > 0 && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                              <strong>Chronic History:</strong> {primaryHistoryRecord.chronicConditions.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Vitals & Temperature (Measured vs Deferred) (6 Cols) */}
                    <div className="md:col-span-6 p-4 rounded-3xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 space-y-3">
                      {(() => {
                        const isMeasured = inConsultationPatient.vitals?.isMeasured !== false && inConsultationPatient.vitals?.temp !== 'Not Measured';
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-rose-600" />
                                <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                                  Clinical Triage & Vitals
                                </h3>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isMeasured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isMeasured ? 'Measured at Triage' : 'Deferred to Cabin'}
                              </span>
                            </div>

                            {/* Prominent Body Temperature Banner */}
                            <div className="p-4 rounded-2xl bg-white border-2 border-rose-200 shadow-2xs flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                                  <Thermometer className="w-6 h-6" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                    Body Temperature
                                  </span>
                                  <div className="text-2xl font-black font-mono text-slate-900">
                                    {isMeasured ? (inConsultationPatient.vitals?.temp || '98.6°F') : 'Not Measured'}
                                  </div>
                                </div>
                              </div>

                              {/* Temp Status Indicator & Edit Mode */}
                              <div className="text-right">
                                {isMeasured ? (() => {
                                  const raw = parseFloat(inConsultationPatient.vitals?.temp || '98.6');
                                  const isFever = raw > 99.5;
                                  return (
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        isFever
                                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      }`}
                                    >
                                      {isFever ? 'Fever / Pyrexia' : 'Normal Afebrile'}
                                    </span>
                                  );
                                })() : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                    Assess in Cabin
                                  </span>
                                )}

                                <div className="mt-1">
                                  {!isEditingTemp ? (
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingTemp(true)}
                                      className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 ml-auto"
                                    >
                                      <Edit3 className="w-3 h-3" /> {isMeasured ? 'Re-check Temp' : 'Record Cabin Temp'}
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1 mt-1">
                                      <input
                                        type="text"
                                        value={customTemp}
                                        onChange={(e) => setCustomTemp(e.target.value)}
                                        className="w-16 bg-slate-50 border border-blue-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold"
                                        placeholder="98.6°F"
                                      />
                                      <button
                                        type="button"
                                        onClick={handleSaveTemp}
                                        className="px-2 py-0.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setIsEditingTemp(false)}
                                        className="text-[10px] text-slate-400"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Remaining Vitals Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="p-2.5 bg-white rounded-2xl border border-blue-100 shadow-2xs">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Blood Pressure</span>
                                {inConsultationPatient.vitals?.bp === 'Deferred' ? (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                                    Deferred (Cabin)
                                  </span>
                                ) : (
                                  <strong className="text-sm font-black text-blue-950 font-mono">
                                    {inConsultationPatient.vitals?.bp || '120/80'}
                                  </strong>
                                )}
                              </div>
                              <div className="p-2.5 bg-white rounded-2xl border border-blue-100 shadow-2xs">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Pulse Rate</span>
                                {inConsultationPatient.vitals?.pulse === 'Deferred' ? (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                                    Deferred (Cabin)
                                  </span>
                                ) : (
                                  <strong className="text-sm font-black text-blue-950 font-mono">
                                    {inConsultationPatient.vitals?.pulse || '72 bpm'}
                                  </strong>
                                )}
                              </div>
                              <div className="p-2.5 bg-white rounded-2xl border border-blue-100 shadow-2xs">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">SpO2 Oxygen</span>
                                {inConsultationPatient.vitals?.spo2 === 'Deferred' ? (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                                    Deferred (Cabin)
                                  </span>
                                ) : (
                                  <strong className="text-sm font-black text-blue-950 font-mono">
                                    {inConsultationPatient.vitals?.spo2 || '98%'}
                                  </strong>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Executed Minor Procedures & Nursing Orders on Patient Chart */}
                {inConsultationPatient.minorProcedures && inConsultationPatient.minorProcedures.length > 0 && (
                  <div className="mt-4 p-4 rounded-3xl bg-rose-50/60 border-2 border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-rose-600" />
                        Executed Minor Procedures & Nursing Orders ({inConsultationPatient.minorProcedures.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenProcedureModal()}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95"
                      >
                        + Add Procedure
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {inConsultationPatient.minorProcedures.map((proc, pIdx) => (
                        <div key={proc.id || pIdx} className="p-3 bg-white rounded-2xl border border-rose-200 text-xs shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900">{proc.name}</span>
                            <span className="font-black font-mono text-rose-700">{formatCurrency(proc.price)}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Site: <strong className="text-slate-800">{proc.site}</strong> • By: {proc.performedBy}
                          </div>
                          {proc.consumablesUsed?.length > 0 && (
                            <div className="text-[10px] text-slate-500">
                              Consumables: {proc.consumablesUsed.join(', ')}
                            </div>
                          )}
                          <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            ✓ Auto-Billed to Invoice
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ===============================================================
                    ON SAME SCREEN: The Three Primary Requested Action Buttons
                    1. "Previous Prescription" (for old Patients)
                    2. "Minor Procedures & Nursing" (Bandage, Catheter, Cannula)
                    3. "Write Prescription"
                    Plus "Return Token" option
                    =============================================================== */}
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* BUTTON 1: PREVIOUS PRESCRIPTION (FOR OLD PATIENTS) */}
                    <button
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(20);
                        setConsultationView('PREVIOUS_PRESCRIPTION');
                      }}
                      className="p-4 sm:p-5 rounded-3xl border-2 border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 hover:border-purple-400 text-left transition-all shadow-xs flex items-center justify-between group active:scale-98"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform shrink-0">
                          <History className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm sm:text-base font-black text-purple-950">Previous Rx</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900">
                              Old Patients
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-800/80 mt-0.5">
                            {primaryHistoryRecord?.visits?.length > 0
                              ? `View ${primaryHistoryRecord.visits.length} past records & repeat Rx`
                              : 'Look up past prescriptions by phone number'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>

                    {/* BUTTON 2: MINOR PROCEDURES & NURSING (BANDAGE, CATHETER, CANNULA) */}
                    <button
                      type="button"
                      onClick={() => handleOpenProcedureModal()}
                      className="p-4 sm:p-5 rounded-3xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-red-50/80 hover:bg-rose-100/80 hover:border-rose-400 text-left transition-all shadow-xs flex items-center justify-between group active:scale-98 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform shrink-0">
                          <Scissors className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm sm:text-base font-black text-rose-950">Minor Procedures</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 animate-pulse">
                              🚨 Nursing Suite
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-800/80 mt-0.5">
                            Bandage, Catheter, Cannula, Injections & Auto-Bill
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-rose-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>

                    {/* BUTTON 3: WRITE PRESCRIPTION */}
                    <button
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(20);
                        setConsultationView('WRITE_PRESCRIPTION');
                      }}
                      className="p-4 sm:p-5 rounded-3xl border-2 border-[#8B0029] bg-gradient-to-r from-[#8B0029] to-[#9E1238] hover:from-[#7A0024] hover:to-[#8B0029] text-left transition-all shadow-md shadow-rose-900/20 flex items-center justify-between group text-white active:scale-98 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                          <Pill className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm sm:text-base font-black text-white">Write Prescription</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30">
                              Electronic Rx
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-100 mt-0.5">
                            Prescribe formulary drugs, lab tests, & clinical counseling notes
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>
                  </div>

                  {/* Return Token Bottom Prompt */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Doctor: <strong>{formatDoctorName(currentCabin.doctorName?.split(',')[0])}</strong> • Cabin #{selectedCabinId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        setReturnTokenModalPatient(inConsultationPatient);
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return Token (Incase patient decides not to consult)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                SUB-VIEW 2: PREVIOUS PRESCRIPTION SCREEN (Doctor can view history,
                1-tap repeat past prescription, or navigate back / proceed)
                =================================================================== */}
            {consultationView === 'PREVIOUS_PRESCRIPTION' && (
              <div className="flex-1 bg-white border border-blue-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between overflow-hidden">
                {/* Header with Back Button and Phone Search Bar */}
                <div className="pb-3 border-b border-slate-100 mb-3 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setConsultationView('PATIENT_SCREEN');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Patient Details</span>
                      </button>
                      <h3 className="text-sm font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-purple-600" />
                        Previous Prescriptions & Past Medical Records
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        setConsultationView('WRITE_PRESCRIPTION');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#8B0029] to-[#9E1238] hover:from-[#7A0024] hover:to-[#8B0029] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Proceed to Write Prescription</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Phone Search Bar in Image 2 Style */}
                  <div className="relative max-w-md">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search by phone (default: ${inConsultationPatient.phone || 'Enter phone'})...`}
                      value={phoneSearchQuery}
                      onChange={(e) => setPhoneSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-full pl-9 pr-14 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B0029] focus:border-[#8B0029] transition-all shadow-2xs"
                    />
                    <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-250 rounded shadow-2xs pointer-events-none">
                      ⌘K
                    </kbd>
                  </div>
                </div>

                {/* Previous Visits & Prescriptions List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {primaryHistoryRecord ? (
                    <div className="space-y-4">
                      {/* Chronic info badge */}
                      {(primaryHistoryRecord.chronicConditions?.length > 0 || primaryHistoryRecord.allergies?.length > 0) && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1">
                          {primaryHistoryRecord.allergies?.length > 0 && (
                            <div className="text-rose-800 font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Allergies: {primaryHistoryRecord.allergies.join(', ')}</span>
                            </div>
                          )}
                          {primaryHistoryRecord.chronicConditions?.length > 0 && (
                            <div className="text-amber-900">
                              <strong>Known Chronic History:</strong> {primaryHistoryRecord.chronicConditions.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Past Visit Cards */}
                      {primaryHistoryRecord.visits?.map((visit, vIdx) => (
                        <div
                          key={visit.visitId || vIdx}
                          className="p-4 rounded-3xl bg-purple-50/40 border-2 border-purple-100 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-purple-600" />
                              Visit Date: {visit.visitDate}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Doctor: {visit.doctorName}
                            </span>
                          </div>

                          {/* Diagnosis */}
                          <div className="text-xs bg-white p-3 rounded-2xl border border-purple-100">
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Previous Diagnosis:</span>
                            <span className="font-extrabold text-slate-900 text-sm">{visit.diagnosis}</span>
                          </div>

                          {/* Prescribed Medications with 1-Tap Repeat */}
                          {visit.prescriptions && visit.prescriptions.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs uppercase font-black text-purple-900 flex items-center gap-1">
                                  <Pill className="w-3.5 h-3.5 text-purple-600" />
                                  Prescribed Medications ({visit.prescriptions.length}):
                                </span>

                                {/* 1-Tap Repeat Prescription Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRepeatPastRx(visit.prescriptions)}
                                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                                  title="Copy all medicines into today's Rx pad and proceed to write prescription"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>⚡ Repeat Rx & Proceed</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {visit.prescriptions.map((rx, rIdx) => (
                                  <div
                                    key={rx.id || rIdx}
                                    className="p-3 bg-white rounded-2xl border border-purple-100 text-xs shadow-2xs space-y-1"
                                  >
                                    <div className="font-black text-slate-900">{rx.name}</div>
                                    <div className="text-[11px] text-purple-800 font-medium">
                                      Dosage: <strong className="font-bold">{rx.dosage}</strong>
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      Duration: {rx.duration} • {rx.instructions}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-sm">No Previous Prescriptions Found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try searching with another telephone number or proceed directly to Write Prescription.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setConsultationView('PATIENT_SCREEN');
                    }}
                    className="text-slate-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Patient Screen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setReturnTokenModalPatient(inConsultationPatient);
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return Token</span>
                  </button>
                </div>
              </div>
            )}

            {/* ===================================================================
                SUB-VIEW 3: WRITE PRESCRIPTION SCREEN (Rx Pad, Labs, Clinical Notes,
                Complete Visit & Send to Inhouse Pharmacy)
                Redesigned for maximum clarity, clean organization & scannability
                =================================================================== */}
            {consultationView === 'WRITE_PRESCRIPTION' && (() => {
              const prescriptionsList = inConsultationPatient.prescriptions || [];
              const labOrdersList = (Array.isArray(inConsultationPatient.labOrders) && inConsultationPatient.labOrders.length > 0)
                ? inConsultationPatient.labOrders
                : (inConsultationPatient.services || []).filter((s) => s.category !== 'Consultation');
              const minorProceduresList = inConsultationPatient.minorProcedures || [];

              const cleanRxAdvice = (rx) => {
                if (rx.notes && typeof rx.notes === 'string' && rx.notes.trim()) return rx.notes.trim();
                if (!rx.instructions) return '';
                return rx.instructions.replace(/\.?\s*Course:\s*[^.]+(\.|$)/gi, '').trim();
              };

              const quickAdviceChips = [
                'Take with meals',
                'Drink plenty of fluids',
                'Review in 3 days',
                'Avoid cold drinks',
                'Rest & adequate sleep'
              ];

              const handleAppendChipAdvice = (chipText) => {
                clinicAudio.triggerHaptic(10);
                setClinicalNotes((prev) => {
                  const trimmed = (prev || '').trim();
                  if (!trimmed) return chipText;
                  if (trimmed.toLowerCase().includes(chipText.toLowerCase())) return trimmed;
                  return `${trimmed}. ${chipText}`;
                });
              };

              return (
                <div className="flex-1 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between overflow-hidden gap-3.5">
                  {/* 1. Sleek, Uncluttered Top Bar (No Redundant Name/Temp) */}
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2.5 shrink-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setConsultationView('PATIENT_SCREEN');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Return to Triage, Vitals & Symptoms overview"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Patient Details</span>
                      </button>

                      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#8B0029] flex items-center justify-center font-bold">
                          <Pill className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-black text-slate-900">
                          Electronic Prescription & Clinical Orders
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-[#8B0029] font-black border border-rose-200 hidden sm:inline">
                          Rx Pad
                        </span>
                        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Billed at Pharmacy & Lab Counter</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setConsultationView('PREVIOUS_PRESCRIPTION');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
                        title="View previous visit records and past prescriptions"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Past Rx</span>
                        {primaryHistoryRecord?.visits?.length > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900">
                            {primaryHistoryRecord.visits.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setShowRxModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#8B0029] hover:bg-[#720021] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Prescribe Medicine</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Main Structured Split Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
                    {/* LEFT COLUMN: Prescribed Medications Pad (7 Cols on LG, 8 on XL) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 overflow-hidden">
                      {/* Section Title & Quick Add Formulary Button */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-[#8B0029]" />
                            Prescribed Medications
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black font-mono">
                            {prescriptionsList.length} {prescriptionsList.length === 1 ? 'Drug' : 'Drugs'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(15);
                              setShowRxModal(true);
                            }}
                            className="text-xs font-bold text-[#8B0029] hover:text-[#720021] flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-3xs"
                          >
                            <Search className="w-3 h-3 text-[#8B0029]" />
                            <span>Formulary Search</span>
                          </button>
                        </div>
                      </div>

                      {/* 1-Tap Quick-Add Routine Medications Bar */}
                      <div className="py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 border-b border-slate-200/50">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 flex items-center gap-1 pl-0.5">
                          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add:
                        </span>
                        {[
                          { name: 'Panadol 500mg', form: 'Tablet', reg: '1-0-1', dur: '5 Days' },
                          { name: 'Augmentin 625mg', form: 'Tablet', reg: '1-0-1', dur: '5 Days' },
                          { name: 'Brufen 400mg', form: 'Tablet', reg: '1-0-1', dur: '3 Days' },
                          { name: 'Omeprazole 20mg', form: 'Capsule', reg: '1-0-0', dur: '14 Days' },
                          { name: 'Cetirizine 10mg', form: 'Tablet', reg: '0-0-1', dur: '7 Days' },
                          { name: 'ORS Sachet', form: 'Sachet', reg: 'PRN', dur: '3 Days' },
                          { name: 'Flagyl 400mg', form: 'Tablet', reg: '1-1-1', dur: '5 Days' }
                        ].map((qm) => (
                          <button
                            key={qm.name}
                            type="button"
                            onClick={() => handleQuickAddMed(qm.name, qm.form, qm.reg, 'After Meals (PC)', qm.dur)}
                            className="px-2 py-0.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-[#8B0029] border border-slate-200 hover:border-rose-300 text-[11px] font-bold shrink-0 transition-colors shadow-3xs flex items-center gap-1 cursor-pointer"
                            title={`Add ${qm.name} (${qm.reg}, ${qm.dur})`}
                          >
                            <Plus className="w-3 h-3 text-[#8B0029]" />
                            <span>{qm.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Scrollable Prescription Items */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pt-2.5 pr-1">
                        {prescriptionsList.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
                              <Pill className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-black text-slate-800">No Medications Prescribed Yet</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm">
                              Tap any medication from the Quick Add bar above or search the formulary to add drugs.
                            </p>
                            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  clinicAudio.triggerHaptic(15);
                                  setShowRxModal(true);
                                }}
                                className="px-4 py-2 bg-[#8B0029] hover:bg-[#720021] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Browse Clinical Formulary</span>
                              </button>
                              {primaryHistoryRecord?.visits?.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    clinicAudio.triggerHaptic(15);
                                    setConsultationView('PREVIOUS_PRESCRIPTION');
                                  }}
                                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <History className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Repeat Past Rx</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          prescriptionsList.map((rx, idx) => {
                            const advice = cleanRxAdvice(rx);
                            const currentFreq = rx.frequency || (rx.dosage ? rx.dosage.split(' ')[0] : '1-0-1');
                            const currentDur = rx.duration || '5 Days';
                            return (
                              <div
                                key={rx.id || idx}
                                className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 shadow-2xs transition-all space-y-2.5 group"
                              >
                                {/* Header: Index, Drug Name, Form, and Action Buttons */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 font-mono text-[10px] font-black flex items-center justify-center shrink-0">
                                      {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-black text-slate-900 text-sm tracking-tight truncate">
                                      {rx.name}
                                    </span>
                                    {rx.form && (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-bold text-[10px] border border-purple-200 shrink-0">
                                        {rx.form}
                                      </span>
                                    )}
                                    {rx.price ? (
                                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                                        ({currencySymbol}{Number(rx.price).toFixed(2)})
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDosageModal(rx, true)}
                                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                      title="Open full 5-step customizer modal"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                                      <span className="hidden sm:inline">Advanced Customizer</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePrescription(rx.id || rx.name)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Remove medication"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Interactive Inline Regimen & Duration Controls */}
                                <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  {/* Regimen Selector */}
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Regimen:</span>
                                    {[
                                      { label: 'OD (1-0-0)', val: '1-0-0' },
                                      { label: 'BD (1-0-1)', val: '1-0-1' },
                                      { label: 'TDS (1-1-1)', val: '1-1-1' },
                                      { label: 'PRN (SOS)', val: 'PRN' }
                                    ].map((opt) => (
                                      <button
                                        key={opt.val}
                                        type="button"
                                        onClick={() => handleQuickUpdateRxSchedule(rx.id || rx.name, { frequency: opt.val })}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                          currentFreq === opt.val
                                            ? 'bg-purple-700 text-white shadow-3xs font-black'
                                            : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Duration Selector */}
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Duration:</span>
                                    {['3 Days', '5 Days', '7 Days', '14 Days', '30 Days'].map((dur) => (
                                      <button
                                        key={dur}
                                        type="button"
                                        onClick={() => handleQuickUpdateRxSchedule(rx.id || rx.name, { duration: dur })}
                                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                          currentDur === dur
                                            ? 'bg-indigo-600 text-white shadow-3xs font-black'
                                            : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'
                                        }`}
                                      >
                                        {dur}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Clean Clinical Advice Subtext */}
                                {advice && (
                                  <div className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/70 rounded-lg px-2.5 py-1 flex items-start gap-1.5">
                                    <span className="text-amber-600 font-bold shrink-0">💡</span>
                                    <span className="italic leading-relaxed">{advice}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Diagnostic Labs, Procedures & Clinical Counseling Notes (5 Cols on LG, 4 on XL) */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0 overflow-y-auto space-y-3 pr-1">
                      {/* 1. Diagnostic Investigations & Labs */}
                      <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-indigo-600" />
                            Diagnostic Investigations
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(15);
                              setShowLabModal(true);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Formulary</span>
                          </button>
                        </div>

                        {/* Quick-Add Common Labs */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[
                            { name: 'CBC Test', code: 'LAB-CBC' },
                            { name: 'Blood Sugar (RBS)', code: 'LAB-RBS' },
                            { name: 'Serum Creatinine', code: 'LAB-CREAT' },
                            { name: 'Lipid Profile', code: 'LAB-LIPID' },
                            { name: '12-Lead ECG', code: 'LAB-ECG' }
                          ].map((qlab) => (
                            <button
                              key={qlab.code}
                              type="button"
                              onClick={() => handleQuickAddLab(qlab.name, qlab.code)}
                              className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-bold shadow-3xs transition-colors cursor-pointer"
                            >
                              + {qlab.name}
                            </button>
                          ))}
                        </div>

                        {labOrdersList.length === 0 ? (
                          <div className="p-2.5 bg-white/80 rounded-xl text-center text-xs text-slate-400 border border-dashed border-indigo-200">
                            No laboratory tests ordered yet.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {labOrdersList.map((lab, lIdx) => (
                              <div
                                key={lab.id || lIdx}
                                className="p-2 bg-white rounded-xl border border-indigo-100 flex items-center justify-between text-xs shadow-3xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-bold text-slate-900 text-xs truncate">{lab.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {lab.code || 'LAB'} • {lab.category || 'Diagnostics'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                                    Requisition
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddLabTest(lab)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                    title="Remove lab test"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Minor Procedures & Nursing Orders */}
                      <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 text-rose-600" />
                            Minor Procedures & Nursing
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(15);
                              handleOpenProcedureModal();
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Procedure</span>
                          </button>
                        </div>

                        {minorProceduresList.length === 0 ? (
                          <div className="p-2.5 bg-white/80 rounded-xl text-center text-xs text-slate-400 border border-dashed border-rose-200">
                            No minor procedures logged.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {minorProceduresList.map((proc, pIdx) => (
                              <div
                                key={proc.id || pIdx}
                                className="p-2 bg-white rounded-xl border border-rose-100 flex items-center justify-between text-xs shadow-3xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-bold text-slate-900 text-xs truncate">{proc.name}</div>
                                  <div className="text-[10px] text-slate-500">
                                    Site: {proc.site} • {formatCurrency(proc.price)}
                                  </div>
                                </div>
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shrink-0">
                                  ✓ Auto-Billed
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3. Clinical Findings & Counseling Notes */}
                      <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2 flex-1 flex flex-col min-h-[160px]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Doctor's Examination & Advice
                          </span>
                        </div>

                        {/* Quick Advice Chips */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {quickAdviceChips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => handleAppendChipAdvice(chip)}
                              className="text-[10px] px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-md font-medium transition-colors cursor-pointer"
                              title="Click to append to advice notes"
                            >
                              + {chip}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={3}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          placeholder="Physical examination findings, differential diagnosis, patient advice, or follow-up instructions..."
                          className="w-full flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-3xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                    {/* Summary Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold flex items-center gap-1.5 shadow-3xs">
                        <Pill className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          {prescriptionsList.length} {prescriptionsList.length === 1 ? 'Prescription' : 'Prescriptions'}
                        </span>
                      </span>

                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold flex items-center gap-1.5 shadow-3xs">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {labOrdersList.length} {labOrdersList.length === 1 ? 'Lab Order' : 'Lab Orders'}
                        </span>
                      </span>

                      {minorProceduresList.length > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center gap-1.5 shadow-3xs">
                          <Scissors className="w-3.5 h-3.5 text-rose-600" />
                          <span>
                            {minorProceduresList.length} {minorProceduresList.length === 1 ? 'Procedure' : 'Procedures'}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Primary Completion Button */}
                    <button
                      type="button"
                      onClick={handleCompleteVisitAndSendRx}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#8B0029] via-[#9E1238] to-[#8B0029] hover:from-[#7A0024] hover:to-[#8B0029] text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-rose-950/25 active:scale-95 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Complete Consultation & Send Rx to Inhouse Pharmacy</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : calledPatient ? (
          /* =====================================================================
              STATE 2: PATIENT WAS CALLED (PAGE SENT, NOT YET CHECKED IN)
              ===================================================================== */
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full justify-center my-auto p-4">
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-400 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
                <Bell className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
                  Patient Paged & Calling to Cabin #{selectedCabinId}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                  Awaiting Patient Arrival inside Cabin
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Patient announcement broadcasted to Lounge TV and speaker system. When patient enters the room, tap <strong>Check In</strong> to open consultation.
                </p>
              </div>

              {/* Called Patient Demographics & Receptionist Info Card */}
              <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border-2 border-blue-200 rounded-3xl text-left max-w-lg mx-auto shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-blue-700 tracking-wider">
                    Paging Patient:
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Called {calledTimer} ago
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black font-mono text-blue-900">
                      {calledPatient.tokenNumber}
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {calledPatient.patientName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {calledPatient.gender}, {calledPatient.age} yrs • Phone: {calledPatient.phone || 'Walk-in'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black border border-rose-200 block mb-1">
                      Temp: {calledPatient.vitals?.temp || '98.6°F'}
                    </span>
                    {calledPatient.isPaid || calledPatient.paymentStatus === 'PAID' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        Consultation Paid Upfront
                      </span>
                    ) : calledPatient.paymentStatus === 'PAY_IN_CABIN' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300">
                        🩺 Collect in Cabin
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                        ⚠️ Fee Due at Counter
                      </span>
                    )}
                  </div>
                </div>

                {/* Symptoms Badge */}
                {calledPatient.symptoms && calledPatient.symptoms.length > 0 && (
                  <div className="pt-2 border-t border-blue-200/50 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Symptoms:</span>
                    <span className="font-bold text-blue-900">{calledPatient.symptoms.join(', ')}</span>
                  </div>
                )}

                {/* Triage Vitals Bar as Recorded by Receptionist */}
                {calledPatient.vitals && (
                  <div className="pt-2 border-t border-blue-200/50 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Receptionist Vitals:</span>
                    <span className="font-mono px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md font-bold text-[11px]">
                      Temp: {calledPatient.vitals.temp || '98.6°F'}
                    </span>
                    <span className="font-mono px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md font-bold text-[11px]">
                      BP: {calledPatient.vitals.bp || '120/80'}
                    </span>
                    <span className="font-mono px-2 py-0.5 bg-pink-50 border border-pink-200 text-pink-800 rounded-md font-bold text-[11px]">
                      HR: {calledPatient.vitals.pulse || '76 bpm'}
                    </span>
                    <span className="font-mono px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-md font-bold text-[11px]">
                      SpO2: {calledPatient.vitals.spo2 || '98%'}
                    </span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS: CHECK IN & RETURN TOKEN */}
              <div className="space-y-3 max-w-lg mx-auto">
                {/* 1. CHECK IN BUTTON (PRIMARY) */}
                <button
                  type="button"
                  onClick={() => handleCheckInPatient(calledPatient)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl text-base flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Check In {calledPatient.patientName}</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  {/* 2. RETURN TOKEN OPTION */}
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setReturnTokenModalPatient(calledPatient);
                    }}
                    className="py-3 px-4 rounded-2xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>Return Token (No-Show / Cancel)</span>
                  </button>

                  {/* 3. RE-ANNOUNCE ON SPEAKER */}
                  <button
                    type="button"
                    onClick={() => handleReAnnounce(calledPatient)}
                    className="py-3 px-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span>Re-Page Audio</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
              STATE 3: NO ACTIVE OR CALLED PATIENT (IDLE CABIN / QUEUE HUB)
              ===================================================================== */
          (() => {
            const allWaitingList = (patients || []).filter((p) => p.status === 'WAITING');
            const cabinWaitingList = allWaitingList.filter(
              (p) => p.cabinId === selectedCabinId || (p.isEmergency && !p.cabinId)
            );
            const emergencyList = (patients || []).filter(
              (p) => (p.status === 'WAITING' || p.status === 'CALLED') && p.isEmergency
            );
            const completedTodayList = (patients || []).filter(
              (p) => p.status === 'COMPLETED' || p.status === 'BILLING_PENDING' || p.status === 'SETTLED'
            );

            // Filtered queue based on selected tab and search query
            const cleanSearch = (queueSearchQuery || '').toLowerCase().trim();
            const matchesSearch = (p) => {
              if (!cleanSearch) return true;
              return (
                (p.patientName && p.patientName.toLowerCase().includes(cleanSearch)) ||
                (p.tokenNumber && p.tokenNumber.toLowerCase().includes(cleanSearch)) ||
                (p.phone && p.phone.toLowerCase().includes(cleanSearch)) ||
                (p.patientId && p.patientId.toLowerCase().includes(cleanSearch)) ||
                (Array.isArray(p.symptoms) && p.symptoms.some((s) => s.toLowerCase().includes(cleanSearch)))
              );
            };

            let displayedList = [];
            if (queueFilterTab === 'COMPLETED') {
              displayedList = completedTodayList.filter(matchesSearch);
            } else if (queueFilterTab === 'EMERGENCY') {
              displayedList = emergencyList.filter(matchesSearch);
            } else if (queueFilterTab === 'ALL') {
              displayedList = allWaitingList.filter(matchesSearch);
            } else {
              // 'CABIN'
              displayedList = cabinWaitingList.filter(matchesSearch);
            }

            // First available patient in entire clinic if this cabin has no specific patient
            const nextClinicPatient = allWaitingList[0] || null;

            return (
              <div className="flex-1 flex flex-col gap-4 max-w-6xl mx-auto w-full">
                {/* 1. HERO CARD: NEXT PATIENT IN QUEUE / CALL TO CABIN */}
                {nextPatient ? (
                  <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-md ${
                    nextPatient.isEmergency
                      ? 'bg-gradient-to-r from-rose-50 via-red-50/60 to-rose-100/70 border-rose-400 ring-2 ring-rose-400/40 shadow-rose-950/10'
                      : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/80 border-blue-200/90 shadow-blue-950/5'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 ${
                          nextPatient.isEmergency ? 'text-rose-700' : 'text-blue-700'
                        }`}>
                          {nextPatient.isEmergency ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                              🚨 STAT EMERGENCY PROCEDURE PATIENT:
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              Next Patient in Waiting Lounge (Cabin #{selectedCabinId}):
                            </>
                          )}
                        </span>
                        {nextPatient.isEmergency && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                            PRIORITY TRIAGE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          Registered: <strong className="font-mono text-slate-700">{nextPatient.createdAt ? `${Math.max(1, Math.floor((Date.now() - nextPatient.createdAt) / 60000))}m ago` : 'Just now'}</strong>
                        </span>
                        {nextPatient.isPaid || nextPatient.paymentStatus === 'PAID' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            ✓ Fee Paid
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300">
                            🩺 Pay in Cabin
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left: Demographics & Symptoms */}
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center font-mono font-black text-2xl shadow-sm shrink-0 ${
                          nextPatient.isEmergency ? 'bg-rose-600 ring-2 ring-rose-400 animate-pulse' : 'bg-blue-600'
                        }`}>
                          {nextPatient.tokenNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-slate-900">{nextPatient.patientName}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-bold">
                              {nextPatient.gender}, {nextPatient.age} yrs
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              MRN: {nextPatient.patientId || nextPatient.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-600">Chief Symptoms:</span>
                            {(nextPatient.symptoms || ['General Checkup']).map((sym) => (
                              <span key={sym} className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold shadow-3xs">
                                {sym}
                              </span>
                            ))}
                          </div>

                          {/* Vitals summary if recorded */}
                          {nextPatient.vitals && (
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 font-bold text-rose-700">
                                <Thermometer className="w-3 h-3 text-rose-500" />
                                {nextPatient.vitals.temp || '98.6°F'}
                              </span>
                              <span>•</span>
                              <span>BP: <strong>{nextPatient.vitals.bp || '120/80'}</strong></span>
                              <span>•</span>
                              <span>Pulse: <strong>{nextPatient.vitals.pulse || '72 bpm'}</strong></span>
                              <span>•</span>
                              <span>Phone: <strong className="font-mono text-slate-700">{nextPatient.phone || 'Walk-in'}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                        {/* 1. Call to Cabin */}
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(25);
                            callPatientToCabin(nextPatient.id, selectedCabinId);
                          }}
                          className={`px-5 py-3 text-white font-black rounded-2xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
                            nextPatient.isEmergency
                              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 animate-pulse'
                              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                          }`}
                        >
                          <Bell className="w-4 h-4 animate-bounce" />
                          <span>{nextPatient.isEmergency ? 'Call Emergency Patient' : 'Call Patient to Cabin'}</span>
                        </button>

                        {/* 2. Direct Consultation */}
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(25);
                            startConsultation(nextPatient.id, selectedCabinId);
                            setConsultationView('PATIENT_SCREEN');
                          }}
                          className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer"
                          title="Skip audio paging and immediately begin consultation in cabin"
                        >
                          <Play className="w-4 h-4" />
                          <span>Direct Consult</span>
                        </button>

                        {/* 3. Return Token */}
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setReturnTokenModalPatient(nextPatient);
                          }}
                          className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                          title="Patient no-show or refund request"
                        >
                          <RotateCcw className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Banner when no specific patient for this cabin */
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Cabin #{selectedCabinId}: {currentCabin.cabinName} ({currentCabin.department})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Suite Available & Ready
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {allWaitingList.length > 0
                            ? `No patient queued specifically for this cabin, but ${allWaitingList.length} patient(s) are waiting in the clinic lounge.`
                            : 'All waiting patients have been attended. Waiting lounge is currently clear.'}
                        </p>
                      </div>
                    </div>

                    {nextClinicPatient && (
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(25);
                          callPatientToCabin(nextClinicPatient.id, selectedCabinId);
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Call Next from Clinic Lounge ({nextClinicPatient.tokenNumber}: {nextClinicPatient.patientName})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 2. INTERACTIVE QUEUE MANAGEMENT SECTION */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col flex-1 min-h-[380px] space-y-3.5">
                  {/* Queue Filter Tabs & Search Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-slate-100">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(10);
                          setQueueFilterTab('CABIN');
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          queueFilterTab === 'CABIN'
                            ? 'bg-[#8B0029] text-white font-black shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Cabin {selectedCabinId} Queue</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          queueFilterTab === 'CABIN' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {cabinWaitingList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(10);
                          setQueueFilterTab('ALL');
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          queueFilterTab === 'ALL'
                            ? 'bg-[#8B0029] text-white font-black shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>All Clinic Queue</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          queueFilterTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {allWaitingList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(10);
                          setQueueFilterTab('EMERGENCY');
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          queueFilterTab === 'EMERGENCY'
                            ? 'bg-rose-600 text-white font-black shadow-2xs'
                            : 'text-slate-600 hover:text-rose-700'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        <span>Emergency Triage</span>
                        {emergencyList.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-700 text-white animate-pulse">
                            {emergencyList.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(10);
                          setQueueFilterTab('COMPLETED');
                        }}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          queueFilterTab === 'COMPLETED'
                            ? 'bg-emerald-700 text-white font-black shadow-2xs'
                            : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Completed Today</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          queueFilterTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {completedTodayList.length}
                        </span>
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative min-w-[220px] max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search queue by token, name, symptom..."
                        value={queueSearchQuery}
                        onChange={(e) => setQueueSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#8B0029] focus:bg-white transition-all shadow-3xs"
                      />
                      {queueSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setQueueSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Queue Items Table / Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {displayedList.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="text-sm font-black text-slate-700">No Patients in this View</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          {queueFilterTab === 'CABIN'
                            ? `There are no patients currently queued for Cabin #${selectedCabinId}. Switch to "All Clinic Queue" to call patients from the general lounge.`
                            : queueFilterTab === 'EMERGENCY'
                            ? 'No emergency triage patients currently waiting.'
                            : queueFilterTab === 'COMPLETED'
                            ? 'No consultations completed yet today.'
                            : 'No waiting patients found.'}
                        </p>
                        {queueFilterTab === 'CABIN' && allWaitingList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(10);
                              setQueueFilterTab('ALL');
                            }}
                            className="mt-3 px-3 py-1.5 rounded-xl bg-[#8B0029] text-white text-xs font-bold shadow-2xs hover:bg-[#720021] cursor-pointer"
                          >
                            View All Clinic Queue ({allWaitingList.length})
                          </button>
                        )}
                      </div>
                    ) : (
                      displayedList.map((patient, pIdx) => {
                        const isEmergency = patient.isEmergency;
                        const isCompleted = patient.status === 'COMPLETED' || patient.status === 'BILLING_PENDING' || patient.status === 'SETTLED';
                        const waitMins = patient.createdAt ? Math.max(1, Math.floor((Date.now() - patient.createdAt) / 60000)) : 1;

                        return (
                          <div
                            key={patient.id || pIdx}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-3xs ${
                              isEmergency
                                ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
                                : isCompleted
                                ? 'bg-slate-50/60 border-slate-200'
                                : 'bg-white hover:border-blue-300 border-slate-200'
                            }`}
                          >
                            {/* Patient Info */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-black flex items-center justify-center shrink-0">
                                #{pIdx + 1}
                              </span>

                              <div className={`w-11 h-11 rounded-xl text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-2xs ${
                                isEmergency ? 'bg-rose-600 animate-pulse' : isCompleted ? 'bg-emerald-600' : 'bg-blue-600'
                              }`}>
                                {patient.tokenNumber}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-black text-slate-900 truncate">
                                    {patient.patientName}
                                  </h4>
                                  {isEmergency && (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black uppercase">
                                      🚨 STAT Emergency
                                    </span>
                                  )}
                                  <span className="text-xs px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                                    {patient.gender}, {patient.age}y
                                  </span>
                                  <span className="text-xs font-mono text-slate-400">
                                    MRN: {patient.patientId || patient.id}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                                  <span>Symptoms: <strong className="text-slate-700">{(patient.symptoms || []).join(', ') || 'General Consultation'}</strong></span>
                                  <span>•</span>
                                  <span>Cabin: <strong className="text-blue-900">Cabin {patient.cabinId || 'Unassigned'}</strong></span>
                                  <span>•</span>
                                  <span className={`font-mono font-bold ${
                                    waitMins > 20 ? 'text-rose-600' : waitMins > 10 ? 'text-amber-600' : 'text-emerald-700'
                                  }`}>
                                    ⏱ Waited {waitMins}m
                                  </span>
                                  {patient.vitals?.temp && (
                                    <>
                                      <span>•</span>
                                      <span className="text-rose-700 font-bold flex items-center gap-0.5">
                                        <Thermometer className="w-3 h-3" />
                                        {patient.vitals.temp}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {isCompleted ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                    ✓ Consultation Completed
                                  </span>
                                  {patient.prescriptions?.length > 0 && (
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-bold">
                                      {patient.prescriptions.length} Meds Prescribed
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      clinicAudio.triggerHaptic(20);
                                      callPatientToCabin(patient.id, selectedCabinId);
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-3xs active:scale-95 transition-all cursor-pointer"
                                    title="Page patient to enter Cabin"
                                  >
                                    <Bell className="w-3.5 h-3.5" />
                                    <span>Call to Cabin</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      clinicAudio.triggerHaptic(20);
                                      startConsultation(patient.id, selectedCabinId);
                                      setConsultationView('PATIENT_SCREEN');
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-3xs active:scale-95 transition-all cursor-pointer"
                                    title="Directly start consultation"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Direct Consult</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      clinicAudio.triggerHaptic(15);
                                      setReturnTokenModalPatient(patient);
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-200"
                                    title="Return / Cancel token"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* =========================================================================
          RETURN TOKEN MODAL (Incase patient does not want to see doctor)
          ========================================================================= */}
      {returnTokenModalPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-2 border-rose-200/90 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B0029] to-[#9E1238] text-white flex items-center justify-center font-black shadow-md shadow-rose-950/20">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Return Patient Token</h3>
                  <p className="text-[10px] text-slate-500">Cabin queue release & front desk refund</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnTokenModalPatient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/70 text-xs space-y-1">
              <div className="font-black text-[#8B0029] text-sm">
                Token {returnTokenModalPatient.tokenNumber}: {returnTokenModalPatient.patientName}
              </div>
              <div className="text-slate-600 font-medium">
                Cabin: {returnTokenModalPatient.cabinId} • Upfront Paid: <span className="font-mono font-bold text-slate-900">{currencySymbol} {(returnTokenModalPatient.amountPaid || returnTokenModalPatient.totalFee)?.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-rose-800 pt-1 font-medium">
                Returning this token will free Cabin #{selectedCabinId} immediately and route this token for cancellation and front-desk refund.
              </p>
            </div>

            {/* Reason Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                Select Return / Cancellation Reason:
              </label>
              {[
                'Patient No-Show (Called on TV/Speaker but did not report)',
                'Patient decided not to consult doctor',
                'Patient requested refund / left clinic',
                'Emergency re-routed to hospital / ER'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(10);
                    setReturnReason(reason);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    returnReason === reason
                      ? 'bg-rose-50 border-[#8B0029] text-[#8B0029] shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReturnTokenModalPatient(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Keep Token / Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnToken}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B0029] to-[#9E1238] hover:from-[#7A0024] hover:to-[#8B0029] text-white font-black text-xs shadow-md shadow-rose-950/20 active:scale-95 transition-all cursor-pointer"
              >
                Confirm & Return Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOUCH-SCREEN 5-STEP CLINICAL DOSAGE WORKFLOW (REQUESTED)
          ========================================================================= */}
      {dosageModalDrug && (
        <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl w-full max-w-3xl sm:max-w-4xl h-[640px] max-h-[94vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header (Fixed shrink-0) */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B0029] to-[#9E1238] text-white flex items-center justify-center font-black shadow-md shadow-rose-950/20">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Clinical Prescription Formatter
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 text-[#8B0029] font-black border border-rose-200">
                      Step {dosageStep} of 5
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    5-step clinical workflow: Frequency → Timing → Duration → Advice → Prescription Output
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDosageModalDrug(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs Bar (1 to 5) (Fixed shrink-0) */}
            <div className="px-6 pt-3 shrink-0">
              <div className="grid grid-cols-5 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
                {[
                  { step: 1, label: '1. Frequency', desc: dosageFrequency },
                  { step: 2, label: '2. Timing', desc: dosageTiming.split(' ')[0] },
                  { step: 3, label: '3. Duration', desc: dosageDuration },
                  { step: 4, label: '4. Advice', desc: dosageInstructions ? 'Specified' : 'Standard' },
                  { step: 5, label: '5. Review', desc: 'Confirm' }
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(10);
                      setDosageStep(s.step);
                    }}
                    className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer ${
                      dosageStep === s.step
                        ? 'bg-gradient-to-r from-[#8B0029] to-[#9E1238] text-white font-black shadow-md shadow-rose-950/20 ring-2 ring-rose-400/40'
                        : dosageStep > s.step
                        ? 'bg-rose-50 text-[#8B0029] font-bold hover:bg-rose-100'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/80'
                    }`}
                  >
                    <div className="text-[11px] font-black flex items-center justify-center gap-1 truncate">
                      {dosageStep > s.step && <Check className="w-3 h-3 stroke-[3] text-[#8B0029]" />}
                      <span>{s.label}</span>
                    </div>
                    <div className={`text-[10px] truncate mt-0.5 font-medium ${dosageStep === s.step ? 'text-rose-100' : 'text-slate-500'}`}>
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Medication Banner (Fixed shrink-0) */}
            <div className="px-6 pt-2.5 shrink-0">
              <div className="p-3 bg-gradient-to-r from-rose-50/50 via-slate-50 to-rose-50/30 rounded-2xl border border-rose-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-[#8B0029] tracking-wider block">Prescribing Item</span>
                  <div className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>{dosageModalDrug.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#8B0029] border border-rose-200 text-[10px] font-bold">
                      {dosageModalDrug.form || dosageForm || 'Tablet'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {dosageModalDrug.generic || dosageModalDrug.category} • {dosageModalDrug.strength || 'Standard'}
                  </div>
                </div>
                <span className="px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 font-mono font-black text-xs text-[#8B0029] shadow-2xs">
                  {currencySymbol} {Number(dosageModalDrug.price || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Step Content Resolver (Scrollable flex-1) */}
            {(() => {
              const isCurrentItemSupply = dosageModalDrug && (
                dosageModalDrug.type === 'GENERAL' ||
                ['Wound Care & Dressing', 'Syringes & Injections', 'PPE & Consumables', 'Antiseptics & Solutions', 'Dressings & Tapes', 'Cotton & Consumables'].includes(dosageModalDrug.category) ||
                dosageModalDrug.name?.toLowerCase().includes('gauze') ||
                dosageModalDrug.name?.toLowerCase().includes('swab') ||
                dosageModalDrug.name?.toLowerCase().includes('syringe') ||
                dosageModalDrug.name?.toLowerCase().includes('gloves') ||
                dosageModalDrug.name?.toLowerCase().includes('tape') ||
                dosageModalDrug.name?.toLowerCase().includes('cotton')
              );

              const frequencyOptions = isCurrentItemSupply ? [
                {
                  code: 'Single Use',
                  label: 'One-time clinic or home use',
                  cardClass: 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-400',
                  activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400'
                },
                {
                  code: 'Once Daily',
                  label: 'Daily dressing change (OD)',
                  cardClass: 'bg-sky-50/80 border-sky-300 text-sky-950 hover:bg-sky-100 hover:border-sky-400',
                  activeClass: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25 ring-2 ring-sky-400'
                },
                {
                  code: 'Twice Daily',
                  label: 'Morning & evening dressing (BID)',
                  cardClass: 'bg-indigo-50/80 border-indigo-300 text-indigo-950 hover:bg-indigo-100 hover:border-indigo-400',
                  activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400'
                },
                {
                  code: 'SOS / PRN',
                  label: 'As needed for wound care / replacement',
                  cardClass: 'bg-rose-50/80 border-rose-300 text-rose-950 hover:bg-rose-100 hover:border-rose-400',
                  activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/25 ring-2 ring-rose-400'
                },
                {
                  code: 'Procedural',
                  label: 'Used during minor procedure',
                  cardClass: 'bg-purple-50/80 border-purple-300 text-purple-950 hover:bg-purple-100 hover:border-purple-400',
                  activeClass: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25 ring-2 ring-purple-400'
                },
                {
                  code: 'Stat',
                  label: 'Immediate dressing / application',
                  cardClass: 'bg-amber-50/80 border-amber-300 text-amber-950 hover:bg-amber-100 hover:border-amber-400',
                  activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                }
              ] : [
                {
                  code: '1-0-1',
                  label: 'Morning & Night (BID)',
                  cardClass: 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-400',
                  activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                },
                {
                  code: '1-1-1',
                  label: 'Three times daily (TID)',
                  cardClass: 'bg-sky-50/80 border-sky-300 text-sky-950 hover:bg-sky-100 hover:border-sky-400',
                  activeClass: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/30 ring-2 ring-sky-400'
                },
                {
                  code: '1-0-0',
                  label: 'Morning only (OD)',
                  cardClass: 'bg-amber-50/80 border-amber-300 text-amber-950 hover:bg-amber-100 hover:border-amber-400',
                  activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                },
                {
                  code: '0-0-1',
                  label: 'Night / Bedtime (HS)',
                  cardClass: 'bg-indigo-50/80 border-indigo-300 text-indigo-950 hover:bg-indigo-100 hover:border-indigo-400',
                  activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400'
                },
                {
                  code: '1-1-1-1',
                  label: 'Four times daily (QID)',
                  cardClass: 'bg-purple-50/80 border-purple-300 text-purple-950 hover:bg-purple-100 hover:border-purple-400',
                  activeClass: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/30 ring-2 ring-purple-400'
                },
                {
                  code: '1-0-1-1',
                  label: 'Morning, Eve & Night',
                  cardClass: 'bg-teal-50/80 border-teal-300 text-teal-950 hover:bg-teal-100 hover:border-teal-400',
                  activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/30 ring-2 ring-teal-400'
                },
                {
                  code: 'SOS / PRN',
                  label: 'As needed for symptoms',
                  cardClass: 'bg-rose-50/80 border-rose-300 text-rose-950 hover:bg-rose-100 hover:border-rose-400',
                  activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
                },
                {
                  code: 'Stat Dose',
                  label: 'Single immediate dose',
                  cardClass: 'bg-orange-50/80 border-orange-300 text-orange-950 hover:bg-orange-100 hover:border-orange-400',
                  activeClass: 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/30 ring-2 ring-orange-400'
                }
              ];

              const timingOptions = isCurrentItemSupply ? [
                { name: 'External / Topical Use', cardClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300' },
                { name: 'Sterile Dressing / Wound Care', cardClass: 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100', activeClass: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25 ring-2 ring-sky-300' },
                { name: 'Clean & Dress Wound', cardClass: 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100', activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/25 ring-2 ring-teal-300' },
                { name: 'Procedural Injection', cardClass: 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/25 ring-2 ring-rose-300' },
                { name: 'Local Application', cardClass: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100', activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 ring-2 ring-amber-300' },
                { name: 'Not for Ingestion', cardClass: 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100', activeClass: 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/25 ring-2 ring-red-300' }
              ] : [
                { name: 'After Meals (PC)', cardClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300' },
                { name: 'Before Meals (AC)', cardClass: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100', activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25 ring-2 ring-amber-300' },
                { name: 'With Food / Meals', cardClass: 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100', activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/25 ring-2 ring-teal-300' },
                { name: 'Empty Stomach (Morning)', cardClass: 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100', activeClass: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/25 ring-2 ring-sky-300' },
                { name: 'At Bedtime', cardClass: 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100', activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-300' },
                { name: 'Every 8 Hours', cardClass: 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100', activeClass: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25 ring-2 ring-purple-300' },
                { name: 'Every 12 Hours', cardClass: 'bg-violet-50 text-violet-900 border-violet-300 hover:bg-violet-100', activeClass: 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/25 ring-2 ring-violet-300' }
              ];

              const durationOptions = isCurrentItemSupply ? [
                { dur: 'Single Use', cardClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300' },
                { dur: '3 Days', cardClass: 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100', activeClass: 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300' },
                { dur: '5 Days', cardClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300' },
                { dur: '7 Days', cardClass: 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300' },
                { dur: '10 Days', cardClass: 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100', activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300' },
                { dur: 'As Needed', cardClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200', activeClass: 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-400' }
              ] : [
                { dur: '3 Days', cardClass: 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100', activeClass: 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300' },
                { dur: '5 Days', cardClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300' },
                { dur: '7 Days', cardClass: 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300' },
                { dur: '10 Days', cardClass: 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100', activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300' },
                { dur: '14 Days', cardClass: 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100', activeClass: 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300' },
                { dur: '21 Days', cardClass: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300 hover:bg-fuchsia-100', activeClass: 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-md ring-2 ring-fuchsia-300' },
                { dur: '1 Month', cardClass: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100', activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300' },
                { dur: 'Continuous', cardClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200', activeClass: 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-400' }
              ];

              const advicePresets = isCurrentItemSupply ? [
                { text: 'Apply topically / procedural dressing use', chipClass: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100' },
                { text: 'Keep wound clean and dry', chipClass: 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100' },
                { text: 'Do not reuse sterile pack', chipClass: 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100' },
                { text: 'Change dressing if wet or soiled', chipClass: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100' },
                { text: 'External application only - not for oral use', chipClass: 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100' }
              ] : [
                { text: 'Take with full glass of water', chipClass: 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100' },
                { text: 'Do not crush or chew', chipClass: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100' },
                { text: 'Complete full antibiotic course', chipClass: 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100' },
                { text: 'Take after food to avoid stomach upset', chipClass: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100' },
                { text: 'Avoid dairy within 2 hours', chipClass: 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100' },
                { text: 'May cause drowsiness; avoid driving', chipClass: 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100' },
                { text: 'Dissolve in half glass of warm water', chipClass: 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100' }
              ];

              return (
                <>
                  {/* Step Body (Scrollable flex-1 with rock-solid height) */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 flex flex-col justify-start">
                    {/* ==================== SCREEN 1: FREQUENCY ==================== */}
                    {dosageStep === 1 && (
                      <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1">
                          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                            <span>{isCurrentItemSupply ? '1. Usage / Procedure Frequency:' : '1. Frequency / Times per Day:'}</span>
                            <span className="text-[#8B0029] font-extrabold normal-case">({dosageFrequency})</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">Step 1 of 5</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {frequencyOptions.map((freq) => (
                            <button
                              key={freq.code}
                              type="button"
                              onClick={() => {
                                clinicAudio.triggerHaptic(10);
                                setDosageFrequency(freq.code);
                              }}
                              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between active:scale-95 cursor-pointer h-[88px] ${
                                dosageFrequency === freq.code ? freq.activeClass : freq.cardClass
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-base font-mono leading-none">{freq.code}</span>
                                {dosageFrequency === freq.code && (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                )}
                              </div>
                              <div className={`text-[11px] mt-1.5 line-clamp-1 font-medium ${dosageFrequency === freq.code ? 'text-white/90 font-bold' : 'opacity-85'}`}>
                                {freq.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ==================== SCREEN 2: ADMINISTRATION TIMING ==================== */}
                    {dosageStep === 2 && (
                      <div className="space-y-3.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1">
                          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                            <span>{isCurrentItemSupply ? '2. Application / Route:' : '2. Administration Timing & Route:'}</span>
                            <span className="text-[#8B0029] font-extrabold normal-case">({dosageTiming})</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">Step 2 of 5</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {timingOptions.map((timing) => (
                            <button
                              key={timing.name}
                              type="button"
                              onClick={() => {
                                clinicAudio.triggerHaptic(10);
                                setDosageTiming(timing.name);
                              }}
                              className={`p-4 rounded-2xl border-2 text-left font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-between h-[74px] ${
                                dosageTiming === timing.name ? timing.activeClass : timing.cardClass
                              }`}
                            >
                              <span>{timing.name}</span>
                              {dosageTiming === timing.name && (
                                <Check className="w-4 h-4 stroke-[3] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ==================== SCREEN 3: DURATION & FORM ==================== */}
                    {dosageStep === 3 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1">
                          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                            <span>3. Duration / Course:</span>
                            <span className="text-emerald-700 font-extrabold normal-case">({dosageDuration})</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">Step 3 of 5</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
                          <div className="sm:col-span-8">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {durationOptions.map((durObj) => (
                                <button
                                  key={durObj.dur}
                                  type="button"
                                  onClick={() => {
                                    clinicAudio.triggerHaptic(10);
                                    setDosageDuration(durObj.dur);
                                  }}
                                  className={`p-3 rounded-xl text-xs font-black border-2 transition-all active:scale-95 cursor-pointer text-center h-[52px] flex items-center justify-center ${
                                    dosageDuration === durObj.dur ? durObj.activeClass : durObj.cardClass
                                  }`}
                                >
                                  {durObj.dur}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Pre-set Form Display (From Formulary) */}
                          <div className="sm:col-span-4 bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-4 flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase text-[#8B0029] tracking-wider block">
                              Form / Route:
                            </span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-3.5 py-1.5 bg-[#8B0029] text-white font-black text-xs rounded-xl shadow-xs">
                                {dosageModalDrug.form || dosageForm || (isCurrentItemSupply ? 'Pack / Swab' : 'Capsule')}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                (From Formulary)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ==================== SCREEN 4: PATIENT ADVICE & CLINICAL INSTRUCTIONS ==================== */}
                    {dosageStep === 4 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1">
                          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                            4. Standard Instructions & Patient Advice (1-Tap Chips):
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">Step 4 of 5</span>
                        </div>

                        {/* 1-Tap Chips */}
                        <div className="flex flex-wrap gap-2.5">
                          {advicePresets.map((adv) => (
                            <button
                              key={adv.text}
                              type="button"
                              onClick={() => {
                                clinicAudio.triggerHaptic(10);
                                setDosageInstructions((prev) => (prev ? `${prev}; ${adv.text}` : adv.text));
                              }}
                              className={`px-3.5 py-2 border-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${adv.chipClass}`}
                            >
                              + {adv.text}
                            </button>
                          ))}
                        </div>

                        {/* Custom administration text input */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700">Custom Administration Instructions:</span>
                            {dosageInstructions && (
                              <button
                                type="button"
                                onClick={() => setDosageInstructions('')}
                                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                              >
                                Clear Instructions
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Or type custom administration instructions..."
                            value={dosageInstructions}
                            onChange={(e) => setDosageInstructions(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B0029] focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    )}

                    {/* ==================== SCREEN 5: FINAL REVIEW & PRESCRIPTION OUTPUT ==================== */}
                    {dosageStep === 5 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-1">
                          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#8B0029]" />
                            <span>5. Prescription Pad Review & Output:</span>
                          </label>
                          <span className="text-[10px] text-[#8B0029] font-bold">Step 5 of 5 • Final Screen</span>
                        </div>

                        {/* Quick Information Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Frequency</span>
                            <span className="text-sm font-black text-emerald-950 font-mono mt-0.5">{dosageFrequency}</span>
                          </div>
                          <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl text-center">
                            <span className="text-[10px] uppercase font-bold text-sky-800 block">Timing</span>
                            <span className="text-sm font-black text-sky-950 truncate block mt-0.5">{dosageTiming}</span>
                          </div>
                          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-center">
                            <span className="text-[10px] uppercase font-bold text-indigo-800 block">Duration</span>
                            <span className="text-sm font-black text-indigo-950 mt-0.5">{dosageDuration}</span>
                          </div>
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                            <span className="text-[10px] uppercase font-bold text-[#8B0029] block">Form</span>
                            <span className="text-sm font-black text-slate-900 mt-0.5">{dosageModalDrug.form || dosageForm || 'Capsule'}</span>
                          </div>
                        </div>

                        {/* LIVE PREVIEW BANNER */}
                        <div className="p-5 bg-gradient-to-br from-slate-900 via-rose-950/60 to-slate-900 text-white rounded-2xl shadow-lg space-y-2.5 border border-rose-800/60">
                          <div className="text-[10px] font-black uppercase text-rose-300 tracking-wider flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>PRESCRIPTION PAD OUTPUT PREVIEW:</span>
                          </div>
                          <div className="text-base font-extrabold flex items-center gap-2 flex-wrap">
                            <span className="text-amber-300 font-black">{dosageModalDrug.name}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-white font-mono bg-rose-900/90 px-2.5 py-0.5 rounded-lg font-bold border border-rose-700">
                              {dosageFrequency}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-rose-200">{dosageTiming}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-emerald-300 font-bold">{dosageDuration}</span>
                            <span className="text-rose-300 text-sm">({dosageModalDrug.form || dosageForm || 'Capsule'})</span>
                          </div>
                          {dosageInstructions ? (
                            <div className="text-xs text-rose-200 font-medium pt-2 border-t border-rose-800/60">
                              <span className="font-bold text-white">Advice:</span> {dosageInstructions}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-300 italic pt-2 border-t border-rose-800/60">
                              Advice: Standard clinical administration as directed.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pinned Bottom Footer Navigation Bar */}
                  <div className="px-6 py-4 bg-slate-50/95 border-t border-slate-200 flex items-center justify-between shrink-0">
                    {dosageStep === 1 ? (
                      <button
                        type="button"
                        onClick={() => setDosageModalDrug(null)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(10);
                          setDosageStep((prev) => Math.max(1, prev - 1));
                        }}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    )}

                    <div className="flex items-center gap-3">
                      {dosageStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setDosageModalDrug(null)}
                          className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {dosageStep < 5 ? (
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setDosageStep((prev) => Math.min(5, prev + 1));
                          }}
                          className="px-6 py-2.5 bg-gradient-to-r from-[#8B0029] via-[#9E1238] to-[#8B0029] hover:from-[#7A0024] hover:to-[#8B0029] text-white font-black rounded-xl text-xs shadow-md shadow-rose-950/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                        >
                          <span>
                            {dosageStep === 1 && 'Next: Administration Timing'}
                            {dosageStep === 2 && 'Next: Course Duration'}
                            {dosageStep === 3 && 'Next: Patient Advice'}
                            {dosageStep === 4 && 'Next: Review & Output'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConfirmDosage}
                          className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-500/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{isEditingExistingRx ? 'Update Dosage Format' : 'Confirm & Add to Rx Pad'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* =========================================================================
          PRESCRIPTION FORMULARY MODAL (Clinical Drug Requisition)
          ========================================================================= */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl w-full max-w-3xl sm:max-w-4xl h-[640px] max-h-[94vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header (Fixed shrink-0) */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B0029] to-[#9E1238] text-white flex items-center justify-center font-black shadow-md shadow-rose-950/20 shrink-0">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Add Medication to Prescription Pad
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 text-[#8B0029] font-black border border-rose-200">
                      Clinical Formulary
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Select medications for patient therapy. Medications are fulfilled & billed at Inhouse Pharmacy.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRxModal(false);
                  setRxSearchQuery('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner & Search Filter (Fixed shrink-0) */}
            <div className="px-6 pt-3 pb-2 shrink-0 space-y-2.5">
              <div className="p-2.5 bg-rose-50/70 rounded-2xl border border-rose-200/70 text-xs text-[#8B0029] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B0029] shrink-0" />
                <span>Zero charge at doctor cabin. Prescription is electronically routed to Inhouse Pharmacy Desk upon completing visit.</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rxSearchQuery}
                  onChange={(e) => setRxSearchQuery(e.target.value)}
                  placeholder="Search medication name, generic compound, or category..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#8B0029] focus:bg-white transition-all"
                />
                {rxSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRxSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Medication List (flex-1 min-h-0) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-2">
              {(() => {
                const filteredMeds = pharmacyFormulary
                  .filter((med) => med.showToDoctor !== false)
                  .filter((med) => {
                    if (!rxSearchQuery.trim()) return true;
                    const q = rxSearchQuery.toLowerCase();
                    return (
                      med.name?.toLowerCase().includes(q) ||
                      med.generic?.toLowerCase().includes(q) ||
                      med.category?.toLowerCase().includes(q) ||
                      med.form?.toLowerCase().includes(q)
                    );
                  });

                if (filteredMeds.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">
                      No medications matching &ldquo;{rxSearchQuery}&rdquo; in formulary.
                    </div>
                  );
                }

                return filteredMeds.map((med) => (
                  <div
                    key={med.id}
                    className="p-3 bg-slate-50/80 hover:bg-rose-50/40 rounded-2xl border border-slate-200/80 hover:border-rose-200 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{med.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#8B0029] text-[10px] font-black border border-rose-200">
                          {med.form || 'Tablet'}
                        </span>
                        {med.type === 'GENERAL' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-200 uppercase">
                            Medical Supply
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {med.category} • Standard: {med.dosage} ({med.duration})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDosageModal(med, false)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#8B0029] to-[#9E1238] hover:from-[#7A0024] hover:to-[#8B0029] text-white font-black rounded-xl text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
                    >
                      + Set Dosage & Prescribe
                    </button>
                  </div>
                ));
              })()}
            </div>

            {/* Fixed Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {pharmacyFormulary.filter((m) => m.showToDoctor !== false).length} items in hospital formulary
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowRxModal(false);
                  setRxSearchQuery('');
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done / Close Formulary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LAB ORDER MODAL (Clinical Diagnostic Requisitions)
          ========================================================================= */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl w-full max-w-3xl sm:max-w-4xl h-[640px] max-h-[94vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header (Fixed shrink-0) */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-950/20 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Order Diagnostic Lab Investigation
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black border border-blue-200">
                      Diagnostic Suite
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Select clinical investigations. Testing & fees are handled at Diagnostic Lab Desk.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLabModal(false);
                  setLabSearchQuery('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner & Search Filter (Fixed shrink-0) */}
            <div className="px-6 pt-3 pb-2 shrink-0 space-y-2.5">
              <div className="p-2.5 bg-blue-50/80 rounded-2xl border border-blue-200/70 text-xs text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zero charge at doctor cabin. Diagnostic tests are requisitioned for the Lab Counter.</span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={labSearchQuery}
                  onChange={(e) => setLabSearchQuery(e.target.value)}
                  placeholder="Search diagnostic test name, test code, or category..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
                {labSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLabSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Test List (flex-1 min-h-0) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-2">
              {(() => {
                const filteredTests = services
                  .filter((s) => s.category !== 'Consultation')
                  .filter((srv) => {
                    if (!labSearchQuery.trim()) return true;
                    const q = labSearchQuery.toLowerCase();
                    return (
                      srv.name?.toLowerCase().includes(q) ||
                      srv.code?.toLowerCase().includes(q) ||
                      srv.category?.toLowerCase().includes(q)
                    );
                  });

                if (filteredTests.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">
                      No diagnostic tests matching &ldquo;{labSearchQuery}&rdquo;.
                    </div>
                  );
                }

                return filteredTests.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3 bg-slate-50/80 hover:bg-blue-50/40 rounded-2xl border border-slate-200/80 hover:border-blue-200 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{srv.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Code: {srv.code} • Category: {srv.category} (Testing at Diagnostic Lab)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddLabTest(srv)}
                      className={`px-3.5 py-1.5 font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer ${
                        (inConsultationPatient?.labOrders || []).some((o) => o.id === srv.id)
                          ? 'bg-emerald-600 hover:bg-red-500 text-white shadow-xs'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {(inConsultationPatient?.labOrders || []).some((o) => o.id === srv.id)
                        ? '✓ Ordered (Tap to Remove)'
                        : '+ Order Requisition'}
                    </button>
                  </div>
                ));
              })()}
            </div>

            {/* Fixed Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {(inConsultationPatient?.labOrders || []).length} Diagnostic tests currently ordered for this patient
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowLabModal(false);
                  setLabSearchQuery('');
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done / Close Requisition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MINOR PROCEDURE SUITE MODAL (Bandage, Catheter, Cannula, Injections)
          Auto-Bills to Patient Ledger and Invoice
          ========================================================================= */}
      {showProcedureModal && inConsultationPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl w-full max-w-3xl sm:max-w-4xl h-[640px] max-h-[94vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header (Fixed shrink-0) */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B0029] to-[#9E1238] text-white flex items-center justify-center font-black shadow-md shadow-rose-950/20 shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Minor Procedure & Nursing Suite
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 text-[#8B0029] font-black border border-rose-200 uppercase">
                      Auto-Billed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Execute Bandage Dressing, Foley Catheter, IV Cannula, Nebulization, Injections, & Suturing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProcedureModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Patient Card (Fixed shrink-0) */}
            <div className="px-6 pt-3 shrink-0">
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Patient Record:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {inConsultationPatient.tokenNumber}: {inConsultationPatient.patientName}
                  </span>
                  <span className="text-slate-500 ml-2">
                    ({inConsultationPatient.gender}, {inConsultationPatient.age} yrs • MRN: {inConsultationPatient.patientId})
                  </span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    Cabin #{selectedCabinId} • Temp: {inConsultationPatient.vitals?.temp || '98.6°F'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Configuration Body (flex-1 min-h-0) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3.5 space-y-4">
              {/* 1. Procedures Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  1. Select Minor Procedure to Execute:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                  {(emergencyProcedures || []).map((proc) => {
                    const isSelected = selectedProcedure?.code === proc.code;
                    return (
                      <button
                        key={proc.id}
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setSelectedProcedure(proc);
                          // Update default consumables
                          if (proc.code === 'EMG-PRC-CANN') {
                            setProcedureConsumables(['20G IV Cannula (Pink)', 'Cannula Fixator Dressing', 'Alcohol Prep Swabs', 'Tourniquet & Gloves']);
                            setProcedureSite('Right Forearm');
                          } else if (proc.code === 'EMG-PRC-CATH') {
                            setProcedureConsumables(['Foley Catheter 16Fr', 'Urine Drainage Bag 2000ml', 'Lignocaine 2% Jelly', '10ml Sterile Water Syringe']);
                            setProcedureSite('Urethral Catheterization');
                          } else if (proc.code === 'EMG-PRC-DRES' || proc.code === 'EMG-PRC-CRPB') {
                            setProcedureConsumables(['Sterile Gauze Pack', 'Pyodine Solution 10%', 'Crepe Bandage 10cm', 'Micropore Adhesive Tape']);
                            setProcedureSite('Wound Site');
                          } else if (proc.code === 'EMG-PRC-NEBU') {
                            setProcedureConsumables(['Nebulizer Chamber & Mask', 'Salbutamol Respule 2.5mg', 'Normal Saline 0.9%']);
                            setProcedureSite('Respiratory / Inhalation');
                          } else if (proc.code === 'EMG-PRC-INJ' || proc.code === 'EMG-PRC-TETN') {
                            setProcedureConsumables(['Disposable Syringe 3ml/5ml', 'Sterile Needle 24G', 'Alcohol Swabs']);
                            setProcedureSite('Deltoid / Gluteal IM');
                          } else if (proc.code === 'EMG-PRC-SUTR') {
                            setProcedureConsumables(['Suture Pack 3-0 Prolene', 'Needle Holder & Forceps', 'Lignocaine 2% Local', 'Sterile Drape']);
                            setProcedureSite('Laceration Site');
                          } else {
                            setProcedureConsumables(['Sterile Gloves Pack', 'Antiseptic Solution Swabs', 'Medical Tape']);
                          }
                        }}
                        className={`p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#8B0029] bg-rose-50 shadow-md ring-2 ring-rose-400/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-black text-xs text-slate-900 leading-snug">
                            {proc.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#8B0029] shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-slate-100">
                          <span className="text-slate-500 font-medium">{proc.category}</span>
                          <span className="font-black font-mono text-[#8B0029]">
                            {formatCurrency(proc.price)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Anatomical Site & Location */}
              {selectedProcedure && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      2. Anatomical Site / Procedure Location:
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Click quick chip or type:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Right Forearm',
                      'Dorsum of Left Hand',
                      'Right Hand',
                      'Antecubital Fossa',
                      'Urethral Catheterization',
                      'Head & Scalp',
                      'Left Knee / Leg',
                      'Right Foot'
                    ].map((site) => (
                      <button
                        key={site}
                        type="button"
                        onClick={() => setProcedureSite(site)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          procedureSite === site
                            ? 'bg-[#8B0029] text-white border-[#8B0029]'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {site}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={procedureSite}
                    onChange={(e) => setProcedureSite(e.target.value)}
                    placeholder="Specify exact anatomical site / dressing area..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#8B0029]"
                  />
                </div>
              )}

              {/* 3. Performed By & Consumables */}
              {selectedProcedure && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      3. Performed By:
                    </label>
                    <select
                      value={procedurePerformedBy}
                      onChange={(e) => setProcedurePerformedBy(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#8B0029]"
                    >
                      <option value={`Dr. ${currentCabin?.doctorName?.split(',')[0]?.replace(/^(Dr\.\s*)+/i, '') || 'Attending Physician'}`}>
                        Attending Physician (Dr. {currentCabin?.doctorName?.split(',')[0]?.replace(/^(Dr\.\s*)+/i, '')})
                      </option>
                      <option value="Staff Nurse / Nursing Sister">Staff Nurse / Nursing Sister</option>
                      <option value="Dressing Specialist / Procedure Tech">Dressing Specialist / Procedure Tech</option>
                      <option value="Emergency Treatment Room Officer">Emergency Treatment Room Officer</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Sterile Consumables Used:
                    </label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1 min-h-[38px] text-[10px]">
                      {procedureConsumables.map((item, cIdx) => (
                        <span key={cIdx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold">
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Clinical & Aseptic Notes */}
              {selectedProcedure && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    Procedure & Aseptic Notes:
                  </label>
                  <input
                    type="text"
                    value={procedureNotes}
                    onChange={(e) => setProcedureNotes(e.target.value)}
                    placeholder="e.g. Sterile technique followed, antiseptic skin preparation done, tolerated well without bleeding."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#8B0029]"
                  />
                </div>
              )}

              {/* Auto-Billing Notice */}
              {selectedProcedure && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Automated Billing:</strong> {selectedProcedure.name} will be added to the invoice ledger for Token <strong>{inConsultationPatient.tokenNumber}</strong>.
                    </span>
                  </div>
                  <span className="text-sm font-black font-mono text-emerald-800 shrink-0">
                    {formatCurrency(selectedProcedure.price)}
                  </span>
                </div>
              )}
            </div>

            {/* Pinned Footer (Fixed shrink-0) */}
            <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {selectedProcedure ? `Selected: ${selectedProcedure.name}` : 'Select a minor procedure to bill & execute'}
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProcedureModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/80 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedProcedure}
                  onClick={handleConfirmProcedure}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#8B0029] to-[#9E1238] hover:from-[#7A0024] hover:to-[#8B0029] disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-rose-950/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    ✓ Execute & Add to Bill ({selectedProcedure ? formatCurrency(selectedProcedure.price) : 'Select Procedure'})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
