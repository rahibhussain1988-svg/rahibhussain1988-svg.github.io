// Initial Clinical Dataset: Doctor Cabins, Specialties, Diagnostics, Pharmacy, and Initial Patient Queue

export const DOCTOR_CARD_COLORS = {
  1: {
    id: 1,
    name: 'AKUH Crimson / Maroon',
    bg: 'bg-rose-50/70',
    hoverBg: 'hover:bg-rose-100/70',
    activeBg: 'bg-rose-100',
    border: 'border-rose-200',
    activeBorder: 'border-[#8B0029]',
    ring: 'ring-[#8B0029]',
    accent: 'bg-[#8B0029]',
    text: 'text-rose-950',
    subtext: 'text-rose-900',
    tagBg: 'bg-rose-100 text-rose-900 border-rose-300',
    badge: 'bg-[#8B0029] text-white',
    nowServingGradient: 'from-[#8B0029] via-[#9E1238] to-[#68001F]',
    cardGradient: 'from-rose-50 via-rose-50/60 to-pink-50/40',
    glow: 'rgba(139, 0, 41, 0.35)',
    hex: '#fdf2f4',
    accentHex: '#8B0029'
  },
  2: {
    id: 2,
    name: 'Light Green',
    bg: 'bg-emerald-50',
    hoverBg: 'hover:bg-emerald-100',
    activeBg: 'bg-emerald-100',
    border: 'border-emerald-300',
    activeBorder: 'border-emerald-500',
    ring: 'ring-emerald-400',
    accent: 'bg-emerald-500',
    text: 'text-emerald-950',
    subtext: 'text-emerald-800',
    tagBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badge: 'bg-emerald-600 text-white',
    nowServingGradient: 'from-emerald-500 to-teal-600',
    cardGradient: 'from-emerald-50 via-emerald-50/70 to-teal-50/50',
    glow: 'rgba(52, 211, 153, 0.4)',
    hex: '#ecfdf5',
    accentHex: '#059669'
  },
  3: {
    id: 3,
    name: 'Light Yellow',
    bg: 'bg-amber-50',
    hoverBg: 'hover:bg-amber-100',
    activeBg: 'bg-amber-100',
    border: 'border-amber-300',
    activeBorder: 'border-amber-500',
    ring: 'ring-amber-400',
    accent: 'bg-amber-500',
    text: 'text-amber-950',
    subtext: 'text-amber-800',
    tagBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badge: 'bg-amber-600 text-white',
    nowServingGradient: 'from-amber-500 to-orange-600',
    cardGradient: 'from-amber-50 via-amber-50/70 to-yellow-50/50',
    glow: 'rgba(251, 191, 36, 0.4)',
    hex: '#fef3c7',
    accentHex: '#d97706'
  },
  4: {
    id: 4,
    name: 'Light Purple',
    bg: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-100',
    activeBg: 'bg-purple-100',
    border: 'border-purple-300',
    activeBorder: 'border-purple-500',
    ring: 'ring-purple-400',
    accent: 'bg-purple-500',
    text: 'text-purple-950',
    subtext: 'text-purple-800',
    tagBg: 'bg-purple-100 text-purple-900 border-purple-300',
    badge: 'bg-purple-600 text-white',
    nowServingGradient: 'from-purple-500 to-indigo-600',
    cardGradient: 'from-purple-50 via-purple-50/70 to-indigo-50/50',
    glow: 'rgba(192, 132, 252, 0.4)',
    hex: '#f3e8ff',
    accentHex: '#9333ea'
  },
  5: {
    id: 5,
    name: 'Light Rose',
    bg: 'bg-rose-50',
    hoverBg: 'hover:bg-rose-100',
    activeBg: 'bg-rose-100',
    border: 'border-rose-300',
    activeBorder: 'border-rose-500',
    ring: 'ring-rose-400',
    accent: 'bg-rose-500',
    text: 'text-rose-950',
    subtext: 'text-rose-800',
    tagBg: 'bg-rose-100 text-rose-900 border-rose-300',
    badge: 'bg-rose-600 text-white',
    nowServingGradient: 'from-rose-500 to-pink-600',
    cardGradient: 'from-rose-50 via-rose-50/70 to-pink-50/50',
    glow: 'rgba(251, 113, 133, 0.4)',
    hex: '#ffe4e6',
    accentHex: '#e11d48'
  }
};

export const getDoctorTheme = (cabinId) => {
  const idNum = parseInt(cabinId, 10) || 1;
  return DOCTOR_CARD_COLORS[idNum] || DOCTOR_CARD_COLORS[1];
};

export const CLINIC_CABINS = [
  {
    id: 'doc-1',
    cabinId: 1,
    cabinName: 'Cabin 1',
    department: 'Cardiology',
    doctorName: 'Dr. Julian Harris, MD, FACC',
    title: 'Senior Interventional Cardiologist',
    qualifications: 'MD (Cardiology - Johns Hopkins), FACC',
    experience: '16 yrs exp',
    rating: 4.95,
    consultationFee: 60,
    status: 'IN_CONSULTATION', // AVAILABLE, IN_CONSULTATION, BREAK, OFF_DUTY
    specialty: 'Heart & Vascular Disease, ECG, Hypertension',
    colorTheme: DOCTOR_CARD_COLORS[1],
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    avatar: '👨‍⚕️'
  },
  {
    id: 'doc-2',
    cabinId: 2,
    cabinName: 'Cabin 2',
    department: 'Dermatology',
    doctorName: 'Dr. Elena Rostova, MD, FAAD',
    title: 'Specialist Dermatologist & Aesthetician',
    qualifications: 'MD Dermatology (Columbia), Board Certified',
    experience: '11 yrs exp',
    rating: 4.90,
    consultationFee: 55,
    status: 'AVAILABLE',
    specialty: 'Clinical Dermatology, Acne, Eczema, Laser',
    colorTheme: DOCTOR_CARD_COLORS[2],
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    avatar: '👩‍⚕️'
  },
  {
    id: 'doc-3',
    cabinId: 3,
    cabinName: 'Cabin 3',
    department: 'Orthopedics',
    doctorName: 'Dr. Marcus Vance, MS, MCh',
    title: 'Orthopedic & Joint Reconstruction Surgeon',
    qualifications: 'MS Ortho, Fellowship Adult Reconstruction',
    experience: '14 yrs exp',
    rating: 4.88,
    consultationFee: 65,
    status: 'IN_CONSULTATION',
    specialty: 'Joint Pain, Spine Disorders, Sports Injuries',
    colorTheme: DOCTOR_CARD_COLORS[3],
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    avatar: '👨‍⚕️'
  },
  {
    id: 'doc-4',
    cabinId: 4,
    cabinName: 'Cabin 4',
    department: 'Pediatrics',
    doctorName: 'Dr. Sarah Jenkins, MD, FAAP',
    title: 'Consultant Pediatrician & Neonatologist',
    qualifications: 'MD Pediatrics (Stanford), FAAP',
    experience: '10 yrs exp',
    rating: 4.98,
    consultationFee: 50,
    status: 'AVAILABLE',
    specialty: 'Child Development, Vaccination, Acute Infections',
    colorTheme: DOCTOR_CARD_COLORS[4],
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    avatar: '👩‍⚕️'
  },
  {
    id: 'doc-5',
    cabinId: 5,
    cabinName: 'Cabin 5',
    department: 'Internal Medicine',
    doctorName: 'Dr. Rajesh Patel, MD, FACP',
    title: 'Executive General Physician & Diabetologist',
    qualifications: 'MD Internal Medicine, Fellow ACP',
    experience: '18 yrs exp',
    rating: 4.85,
    consultationFee: 45,
    status: 'AVAILABLE',
    specialty: 'Type 2 Diabetes, Metabolic Disorders, Wellness',
    colorTheme: DOCTOR_CARD_COLORS[5],
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
    avatar: '👨‍⚕️'
  }
];

export const CLINIC_SERVICES = [
  // Specialist Consultations
  {
    id: 'srv-c1',
    code: 'CON-01',
    name: 'Specialist Physician Consultation',
    category: 'Consultation',
    price: 60,
    durationMinutes: 20,
    description: 'Comprehensive physical examination, medical history review, and diagnosis.',
    icon: 'Stethoscope',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-c2',
    code: 'CON-02',
    name: 'Follow-Up Clinical Review',
    category: 'Consultation',
    price: 35,
    durationMinutes: 15,
    description: 'Follow-up assessment within 14 days, report examination, and medication titration.',
    icon: 'FileText',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80'
  },

  // Diagnostic Lab Investigations
  {
    id: 'srv-l1',
    code: 'LAB-ECG',
    name: '12-Lead Electrocardiogram (ECG)',
    category: 'Diagnostics',
    price: 35,
    durationMinutes: 15,
    description: 'High-definition digital 12-lead cardiac rhythm recording with cardiologist analysis.',
    icon: 'Activity',
    badge: 'Cardiac Priority',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-l2',
    code: 'LAB-CBC',
    name: 'Complete Blood Count (CBC) + ESR',
    category: 'Diagnostics',
    price: 25,
    durationMinutes: 10,
    description: 'Automated 5-part hematology analyzer count of white cells, red cells, and platelets.',
    icon: 'Droplet',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-l3',
    code: 'LAB-LIPID',
    name: 'Comprehensive Lipid & Cholesterol Profile',
    category: 'Diagnostics',
    price: 30,
    durationMinutes: 10,
    description: 'Total cholesterol, HDL, LDL, VLDL, and Triglycerides cardiac risk evaluation.',
    icon: 'Heart',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-l4',
    code: 'LAB-HBA1C',
    name: 'HbA1c Glycated Hemoglobin Test',
    category: 'Diagnostics',
    price: 28,
    durationMinutes: 10,
    description: 'Gold-standard 90-day average blood glucose indicator for diabetic management.',
    icon: 'Thermometer',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-l5',
    code: 'RAD-XRAY',
    name: 'Digital Radiography (X-Ray)',
    category: 'Diagnostics',
    price: 50,
    durationMinutes: 15,
    description: 'Low-radiation digital imaging for chest, spine, knee, or extremity skeletal evaluation.',
    icon: 'ShieldAlert',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80'
  },

  // Nursing Procedures
  {
    id: 'srv-p1',
    code: 'PRC-NEB',
    name: 'Ultrasonic Nebulization Therapy',
    category: 'Procedures',
    price: 20,
    durationMinutes: 20,
    description: 'Inhaled bronchodilator aerosol therapy for asthma, acute wheezing, or bronchitis.',
    icon: 'Wind',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-p2',
    code: 'PRC-IV',
    name: 'IV Hydration & Vitamin Booster',
    category: 'Procedures',
    price: 65,
    durationMinutes: 30,
    description: 'Sterile saline hydration infused with B-Complex, Vitamin C, and Electrolytes.',
    icon: 'Sparkles',
    badge: 'Wellness',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&auto=format&fit=crop&q=80'
  },

  // Comprehensive Health Packages
  {
    id: 'srv-pkg1',
    code: 'PKG-CARDIAC',
    name: 'Executive Cardiac Screening Package',
    category: 'Packages',
    price: 120,
    durationMinutes: 50,
    description: 'Senior Cardiologist consult + 12-Lead ECG + Lipid Profile + Blood Pressure Mapping.',
    icon: 'Award',
    badge: 'VIP Best Value',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-pkg2',
    code: 'PKG-PMOS',
    name: 'PMOS / PCOS Lab Screening Package (AKUH Clinical Laboratories)',
    category: 'Packages',
    price: 95,
    durationMinutes: 40,
    description: 'Polyendocrine Metabolic Ovarian Syndrome (formerly PCOS) hormonal, glucose tolerance & pelvic health profile.',
    icon: 'HeartPulse',
    badge: 'AKUH Clinical Lab',
    image: 'https://images.unsplash.com/photo-1594824813515-59d43bf7e170?w=600&auto=format&fit=crop&q=80'
  }
];

export const CLINIC_SPECIALTIES = [
  'All Specialties',
  'Consultation',
  'Diagnostics',
  'Procedures',
  'Packages'
];

export const PHARMACY_FORMULARY = [
  // 1. PHARMACY MEDICATIONS (DRUGS)
  {
    id: 'med-1',
    name: 'Amoxicillin 500mg',
    generic: 'Amoxicillin Trihydrate',
    form: 'Capsule',
    strength: '500mg',
    unit: 'Capsule',
    dosage: '1 capsule three times daily (TDS)',
    duration: '5 Days',
    instructions: 'Take after meals with a full glass of water',
    price: 14.50,
    category: 'Antibiotic',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf B-08',
    stock: 120,
    batchNumber: 'BAT-AMX-2026',
    expiryDate: '2027-11',
    isPrescriptionRequired: true
  },
  {
    id: 'med-2',
    name: 'Atorvastatin 20mg',
    generic: 'Atorvastatin Calcium',
    form: 'Tablet',
    strength: '20mg',
    unit: 'Tablet',
    dosage: '1 tablet once daily at bedtime (QHS)',
    duration: '30 Days',
    instructions: 'Take at night. Avoid grapefruit juice.',
    price: 18.00,
    category: 'Cardiovascular',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf A-04',
    stock: 85,
    batchNumber: 'BAT-ATV-2026',
    expiryDate: '2028-03',
    isPrescriptionRequired: true
  },
  {
    id: 'med-3',
    name: 'Metformin 500mg XR',
    generic: 'Metformin Hydrochloride (Extended Release)',
    form: 'Tablet',
    strength: '500mg',
    unit: 'Tablet',
    dosage: '1 tablet twice daily with meals (BD)',
    duration: '30 Days',
    instructions: 'Take with morning and evening meals.',
    price: 12.00,
    category: 'Diabetic Care',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf B-08',
    stock: 95,
    batchNumber: 'BAT-MET-2026',
    expiryDate: '2027-09',
    isPrescriptionRequired: true
  },
  {
    id: 'med-4',
    name: 'Paracetamol 650mg',
    generic: 'Acetaminophen / Paracetamol',
    form: 'Tablet',
    strength: '650mg',
    unit: 'Tablet',
    dosage: '1 tablet every 6 hours as needed (PRN)',
    duration: '3 Days',
    instructions: 'For fever or mild-to-moderate pain. Do not exceed 4g/day.',
    price: 6.50,
    category: 'Analgesic',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf B-08',
    stock: 220,
    batchNumber: 'BAT-PCM-2026',
    expiryDate: '2028-06',
    isPrescriptionRequired: false
  },
  {
    id: 'med-5',
    name: 'Cetirizine 10mg',
    generic: 'Cetirizine Hydrochloride',
    form: 'Tablet',
    strength: '10mg',
    unit: 'Tablet',
    dosage: '1 tablet once daily in the evening',
    duration: '7 Days',
    instructions: 'May cause mild drowsiness.',
    price: 8.00,
    category: 'Allergy & Antihistamine',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf B-08',
    stock: 140,
    batchNumber: 'BAT-CTZ-2026',
    expiryDate: '2027-10',
    isPrescriptionRequired: false
  },
  {
    id: 'med-6',
    name: 'Clobetasol 0.05% Topical Cream',
    generic: 'Clobetasol Propionate 0.05%',
    form: 'Ointment',
    strength: '0.05% w/w',
    unit: 'Tube (20g)',
    dosage: 'Apply thin layer twice daily',
    duration: '10 Days',
    instructions: 'Apply sparingly to affected skin areas only.',
    price: 16.00,
    category: 'Dermatology',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf D-02',
    stock: 45,
    batchNumber: 'BAT-CLO-2026',
    expiryDate: '2027-08',
    isPrescriptionRequired: true
  },
  {
    id: 'med-7',
    name: 'Augmentin 156.25mg Syrup',
    generic: 'Amoxicillin + Clavulanic Acid Oral Suspension',
    form: 'Syrup (5ml)',
    strength: '156.25mg/5ml',
    unit: 'Bottle (100ml)',
    dosage: '1 teaspoon (5ml) three times daily',
    duration: '5 Days',
    instructions: 'Shake well before use. Keep refrigerated.',
    price: 15.00,
    category: 'Antibiotic',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf B-08',
    stock: 35,
    batchNumber: 'BAT-AUG-2026',
    expiryDate: '2026-12',
    isPrescriptionRequired: true
  },
  {
    id: 'med-8',
    name: 'Ventolin 100mcg Inhaler',
    generic: 'Salbutamol Sulfate Inhalation Aerosol',
    form: 'Inhaler / Puffs',
    strength: '100mcg/puff',
    unit: 'Canister (200 doses)',
    dosage: '2 puffs as needed for wheeze',
    duration: '30 Days',
    instructions: 'Rinse mouth after inhalation.',
    price: 22.00,
    category: 'Respiratory',
    type: 'PHARMACY',
    showToDoctor: true,
    storageLocation: 'Shelf B-08',
    stock: 30,
    batchNumber: 'BAT-VEN-2026',
    expiryDate: '2027-07',
    isPrescriptionRequired: true
  },

  // 2. GENERAL ITEMS & MEDICAL CONSUMABLES
  {
    id: 'gen-1',
    name: 'Sterile Gauze Swabs 10x10cm (Pack of 5)',
    generic: 'Hydrophilic Cotton Gauze Swab',
    form: 'Pack / Swab',
    strength: '10x10cm (12 ply)',
    unit: 'Pack of 5',
    dosage: 'Apply over wound during dressing change',
    duration: 'Single Use',
    instructions: 'Maintain sterile technique. Change when soaked.',
    price: 4.50,
    category: 'Wound Care & Dressing',
    type: 'GENERAL',
    showToDoctor: true,
    storageLocation: 'Shelf G-01',
    stock: 150,
    batchNumber: 'BAT-GZ-2026',
    expiryDate: '2029-05',
    isPrescriptionRequired: false
  },
  {
    id: 'gen-2',
    name: 'Disposable Syringe 5ml with 23G Needle',
    generic: 'Sterile Polypropylene Hypodermic Syringe',
    form: 'Piece / Sterile Pack',
    strength: '5ml (23G x 1")',
    unit: 'Piece',
    dosage: 'As ordered for IM/IV injection',
    duration: 'Single Use',
    instructions: 'Do not reuse. Dispose in sharps container.',
    price: 1.50,
    category: 'Syringes & Injections',
    type: 'GENERAL',
    showToDoctor: true,
    storageLocation: 'Shelf G-02',
    stock: 300,
    batchNumber: 'BAT-SYR-2026',
    expiryDate: '2029-10',
    isPrescriptionRequired: false
  },
  {
    id: 'gen-3',
    name: 'Surgical Latex Examination Gloves (Size M - Box of 100)',
    generic: 'Natural Rubber Latex Examination Gloves',
    form: 'Box (100 pcs)',
    strength: 'Medium',
    unit: 'Box (100 pcs)',
    dosage: 'Wear during clinical examination',
    duration: 'Clinic Consumable',
    instructions: 'Non-sterile. Powder-free hypoallergenic latex.',
    price: 18.00,
    category: 'PPE & Consumables',
    type: 'GENERAL',
    showToDoctor: false,
    storageLocation: 'Shelf G-03',
    stock: 40,
    batchNumber: 'BAT-GLV-2026',
    expiryDate: '2028-11',
    isPrescriptionRequired: false
  },
  {
    id: 'gen-4',
    name: 'IV Cannula 20G (Pink) with Injection Port',
    generic: 'PTFE Radiopaque Peripheral IV Catheter',
    form: 'Piece / Sterile Pack',
    strength: '20G (Pink)',
    unit: 'Piece',
    dosage: 'Peripheral venous access',
    duration: '72 Hours Max',
    instructions: 'Flush with normal saline after insertion.',
    price: 5.00,
    category: 'IV Therapy & Infusion',
    type: 'GENERAL',
    showToDoctor: true,
    storageLocation: 'Shelf G-02',
    stock: 90,
    batchNumber: 'BAT-CAN-2026',
    expiryDate: '2029-01',
    isPrescriptionRequired: false
  },
  {
    id: 'gen-5',
    name: 'Elastic Crepe Bandage 10cm x 4.5m',
    generic: 'Woven Cotton Elastic Support Bandage',
    form: 'Roll',
    strength: '10cm x 4.5m',
    unit: 'Roll',
    dosage: 'Wrap firmly without restricting arterial pulse',
    duration: '7 Days',
    instructions: 'For sprain, joint compression and dressing hold.',
    price: 6.00,
    category: 'Orthopedic & Dressing',
    type: 'GENERAL',
    showToDoctor: true,
    storageLocation: 'Shelf G-04',
    stock: 75,
    batchNumber: 'BAT-CRP-2026',
    expiryDate: '2030-01',
    isPrescriptionRequired: false
  },
  {
    id: 'gen-6',
    name: 'Povidone Iodine 10% Antiseptic Solution 100ml',
    generic: 'Povidone Iodine 10% w/v (1% available iodine)',
    form: 'Bottle (100ml)',
    strength: '10% w/v',
    unit: 'Bottle (100ml)',
    dosage: 'Apply topically on cleaned abrasion/wound',
    duration: 'As needed',
    instructions: 'For skin disinfection and minor wound antisepsis.',
    price: 8.50,
    category: 'Antiseptics & Solutions',
    type: 'GENERAL',
    showToDoctor: true,
    storageLocation: 'Shelf G-01',
    stock: 55,
    batchNumber: 'BAT-PVI-2026',
    expiryDate: '2027-12',
    isPrescriptionRequired: false
  },
  {
    id: 'gen-7',
    name: 'Micropore Surgical Paper Tape 1" x 10yd',
    generic: 'Hypoallergenic Non-Woven Surgical Paper Tape',
    form: 'Roll',
    strength: '1" x 10yd',
    unit: 'Roll',
    dosage: 'Secure gauze or IV line',
    duration: 'Single Use',
    instructions: 'Gentle breathable hypoallergenic adhesive.',
    price: 3.50,
    category: 'Dressings & Tapes',
    type: 'GENERAL',
    showToDoctor: true,
    storageLocation: 'Shelf G-04',
    stock: 120,
    batchNumber: 'BAT-MIC-2026',
    expiryDate: '2029-04',
    isPrescriptionRequired: false
  },
  {
    id: 'gen-8',
    name: 'Medical Cotton Wool Roll 500g (Pure Absorbent)',
    generic: '100% Bleached Pure Absorbent Cotton',
    form: 'Roll (500g)',
    strength: '500g',
    unit: 'Roll (500g)',
    dosage: 'Used for wound cleaning and swabbing',
    duration: 'Clinic Consumable',
    instructions: 'Store in dry medical container.',
    price: 9.00,
    category: 'Cotton & Consumables',
    type: 'GENERAL',
    showToDoctor: false,
    storageLocation: 'Shelf G-01',
    stock: 30,
    batchNumber: 'BAT-COT-2026',
    expiryDate: '2030-06',
    isPrescriptionRequired: false
  }
];

export const SYMPTOM_OPTIONS = [
  {
    id: 'sym-1',
    label: 'Chest Pain / Palpitations',
    icon: '🫀',
    image: '/images/symptoms/heart.jpg',
    dept: 'Cardiology',
    cabinId: 1,
    doctorName: 'Dr. Julian Harris',
    description: 'Heart flutter, heaviness, angina, blood pressure spike'
  },
  {
    id: 'sym-2',
    label: 'Shortness of Breath',
    icon: '🫁',
    image: '/images/symptoms/lungs.jpg',
    dept: 'Cardiology / Medicine',
    cabinId: 1,
    doctorName: 'Dr. Julian Harris',
    description: 'Exertional dyspnea, fatigue, asthma assessment'
  },
  {
    id: 'sym-3',
    label: 'Skin Rash & Severe Itching',
    icon: '🧴',
    image: '/images/symptoms/skin.jpg',
    dept: 'Dermatology',
    cabinId: 2,
    doctorName: 'Dr. Elena Rostova',
    description: 'Eczema, acute psoriasis, allergic dermatitis, hives'
  },
  {
    id: 'sym-4',
    label: 'Acne, Lesions & Skin Care',
    icon: '✨',
    image: '/images/symptoms/skin.jpg',
    dept: 'Dermatology',
    cabinId: 2,
    doctorName: 'Dr. Elena Rostova',
    description: 'Cystic acne, mole review, pigmentation evaluation'
  },
  {
    id: 'sym-5',
    label: 'Knee, Joint & Back Pain',
    icon: '🦴',
    image: '/images/symptoms/ortho.jpg',
    dept: 'Orthopedics',
    cabinId: 3,
    doctorName: 'Dr. Marcus Vance',
    description: 'Arthritis, acute lumbar pain, ligament sprain'
  },
  {
    id: 'sym-6',
    label: 'Sports Injury & Sprains',
    icon: '🏃‍♂️',
    image: '/images/symptoms/ortho.jpg',
    dept: 'Orthopedics',
    cabinId: 3,
    doctorName: 'Dr. Marcus Vance',
    description: 'Ankle sprain, tendon strain, mobility stiffness'
  },
  {
    id: 'sym-7',
    label: 'Childhood Fever & Illness',
    icon: '👶',
    image: '/images/symptoms/pediatrics.jpg',
    dept: 'Pediatrics',
    cabinId: 4,
    doctorName: 'Dr. Sarah Jenkins',
    description: 'Pediatric fever, earache, throat infection, infant care'
  },
  {
    id: 'sym-8',
    label: 'Vaccination & Child Wellness',
    icon: '💉',
    image: '/images/symptoms/pediatrics.jpg',
    dept: 'Pediatrics',
    cabinId: 4,
    doctorName: 'Dr. Sarah Jenkins',
    description: 'Routine immunizations, milestone check, nutrition'
  },
  {
    id: 'sym-9',
    label: 'Diabetes & Blood Sugar',
    icon: '🩸',
    image: '/images/symptoms/diabetes.jpg',
    dept: 'Internal Medicine',
    cabinId: 5,
    doctorName: 'Dr. Rajesh Patel',
    description: 'HbA1c screening, insulin adjustment, metabolic review'
  },
  {
    id: 'sym-10',
    label: 'High BP, Fever & Flu',
    icon: '🩺',
    image: '/images/symptoms/fever.jpg',
    dept: 'Internal Medicine',
    cabinId: 5,
    doctorName: 'Dr. Rajesh Patel',
    description: 'Chronic fatigue, fever chills, general checkup'
  },
  {
    id: 'sym-11',
    label: 'Executive Health Check',
    icon: '📋',
    image: '/images/symptoms/wellness.jpg',
    dept: 'General Wellness',
    cabinId: 5,
    doctorName: 'Dr. Rajesh Patel',
    description: 'Full wellness screening, preventive lab profile'
  },
  {
    id: 'sym-12',
    label: 'Prescription & Diagnostics',
    icon: '💊',
    image: '/images/symptoms/pharmacy.jpg',
    dept: 'Clinical OPD',
    cabinId: 1,
    doctorName: 'Specialist on Duty',
    description: 'Maintenance refills, diagnostic labs'
  }
];

export const APPOINTMENT_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM'
];

export const INITIAL_PATIENTS = [
  // In Consultation right now
  {
    id: 'tkt-c101',
    tokenNumber: 'C-101',
    patientId: 'PT-88210',
    patientName: 'Arthur Pendelton',
    age: 58,
    gender: 'Male',
    phone: '555-0199',
    symptoms: ['Chest Pain / Palpitations'],
    vitals: { bp: '138/88 mmHg', pulse: '76 bpm', spo2: '98%', temp: '98.4°F', isMeasured: true, measuredBy: 'Clinical Triage' },
    cabinId: 1,
    doctorName: 'Dr. Julian Harris, MD, FACC',
    department: 'Cardiology',
    services: [CLINIC_SERVICES[0]], // Consult
    prescriptions: [PHARMACY_FORMULARY[1]], // Atorvastatin
    bookingType: 'WALK_IN',
    status: 'IN_CONSULTATION', // WAITING, CALLED, IN_CONSULTATION, BILLING_PENDING, COMPLETED
    isPaid: true,
    paymentStatus: 'PAID',
    consultationStartTime: Date.now() - 12 * 60 * 1000,
    createdAt: Date.now() - 28 * 60 * 1000,
    consultationFee: 60,
    amountPaid: 60,
    totalFee: 60
  },
  {
    id: 'tkt-c102',
    tokenNumber: 'C-102',
    patientId: 'PT-88214',
    patientName: 'Jonathan Hayes',
    age: 42,
    gender: 'Male',
    phone: '555-0284',
    symptoms: ['Knee / Joint / Back Pain'],
    vitals: { bp: '124/80 mmHg', pulse: '72 bpm', spo2: '99%', temp: '98.6°F', isMeasured: true, measuredBy: 'Clinical Triage' },
    cabinId: 3,
    doctorName: 'Dr. Marcus Vance, MS, MCh',
    department: 'Orthopedics',
    services: [CLINIC_SERVICES[0]], // Consult
    prescriptions: [PHARMACY_FORMULARY[3]], // Paracetamol
    bookingType: 'WALK_IN',
    status: 'IN_CONSULTATION',
    isPaid: true,
    paymentStatus: 'PAID',
    consultationStartTime: Date.now() - 6 * 60 * 1000,
    createdAt: Date.now() - 20 * 60 * 1000,
    consultationFee: 65,
    amountPaid: 65,
    totalFee: 65
  },

  // Ready at Billing & Pharmacy Desk
  {
    id: 'tkt-c103',
    tokenNumber: 'C-103',
    patientId: 'PT-88219',
    patientName: 'Sophia Montgomery',
    age: 29,
    gender: 'Female',
    phone: '555-0371',
    symptoms: ['Skin Rash / Severe Itching'],
    vitals: { bp: '118/75 mmHg', pulse: '70 bpm', spo2: '99%', temp: '98.2°F', isMeasured: true, measuredBy: 'Clinical Triage' },
    cabinId: 2,
    doctorName: 'Dr. Elena Rostova, MD, FAAD',
    department: 'Dermatology',
    services: [CLINIC_SERVICES[0]], // Consult
    prescriptions: [PHARMACY_FORMULARY[4], PHARMACY_FORMULARY[5]], // Cetirizine + Clobetasol
    clinicalNotes: 'Acute contact dermatitis. Avoid harsh detergents. Apply cream twice daily for 10 days.',
    bookingType: 'SLOT',
    timeSlot: '10:30 AM',
    status: 'BILLING_PENDING',
    isPaid: true,
    paymentStatus: 'PAID',
    createdAt: Date.now() - 55 * 60 * 1000,
    completedConsultationAt: Date.now() - 4 * 60 * 1000,
    consultationFee: 55,
    amountPaid: 55,
    totalFee: 55
  },

  // Waiting in Lounge
  {
    id: 'tkt-c104',
    tokenNumber: 'C-104',
    patientId: 'PT-88221',
    patientName: 'Liam Patterson',
    age: 6,
    gender: 'Male',
    phone: '555-0455',
    symptoms: ['Pediatric Cold / Cough'],
    vitals: { bp: '100/65 mmHg', pulse: '92 bpm', spo2: '97%', temp: '100.2°F', isMeasured: true, measuredBy: 'Clinical Triage' },
    cabinId: 4,
    doctorName: 'Dr. Sarah Jenkins, MD, FAAP',
    department: 'Pediatrics',
    services: [CLINIC_SERVICES[0]],
    prescriptions: [],
    bookingType: 'WALK_IN',
    status: 'WAITING',
    isPaid: true,
    paymentStatus: 'PAID',
    createdAt: Date.now() - 14 * 60 * 1000,
    consultationFee: 50,
    amountPaid: 50,
    totalFee: 50
  },
  {
    id: 'tkt-c105',
    tokenNumber: 'C-105',
    patientId: 'PT-88225',
    patientName: 'Derrick Vance',
    age: 51,
    gender: 'Male',
    phone: '555-0529',
    symptoms: ['Diabetes / Blood Sugar Check'],
    vitals: { bp: '132/84 mmHg', pulse: '74 bpm', spo2: '98%', temp: '98.6°F', isMeasured: true, measuredBy: 'Clinical Triage' },
    cabinId: 5,
    doctorName: 'Dr. Rajesh Patel, MD, FACP',
    department: 'Internal Medicine',
    services: [CLINIC_SERVICES[0]], // Consult
    prescriptions: [],
    bookingType: 'SLOT',
    timeSlot: '11:30 AM',
    status: 'WAITING',
    isPaid: true,
    paymentStatus: 'PAID',
    createdAt: Date.now() - 8 * 60 * 1000,
    consultationFee: 45,
    amountPaid: 45,
    totalFee: 45
  }
];

export const INITIAL_INVOICES = [
  {
    id: 'inv-med-801',
    invoiceNumber: 'APEX-2026-0801',
    tokenNumber: 'C-098',
    patientName: 'William Thornton',
    patientId: 'PT-88219',
    age: 63,
    gender: 'Male',
    phone: '555-0811',
    doctorName: 'Dr. Julian Harris, MD, FACC',
    cabinId: 1,
    department: 'Cardiology',
    services: [
      { name: 'Specialist Physician Consultation', price: 60, code: 'CON-01' },
      { name: '12-Lead Electrocardiogram (ECG)', price: 35, code: 'LAB-ECG' }
    ],
    medications: [
      { name: 'Atorvastatin 20mg', dosage: '1 tab QHS', duration: '30 Days', price: 18.00 }
    ],
    clinicalNotes: 'Sinus rhythm confirmed. Continue statin therapy.',
    subtotal: 113.00,
    insuranceCoPay: 20.00,
    tax: 0.00, // Medical care exempt
    total: 93.00,
    status: 'SETTLED',
    isPaid: true,
    paymentMethod: 'INSURANCE_COPAY',
    timestamp: Date.now() - 95 * 60 * 1000
  },
  {
    id: 'inv-med-802',
    invoiceNumber: 'APEX-2026-0802',
    tokenNumber: 'C-099',
    patientName: 'Eleanor Davis',
    patientId: 'PT-88220',
    age: 34,
    gender: 'Female',
    phone: '555-0922',
    doctorName: 'Dr. Elena Rostova, MD, FAAD',
    cabinId: 2,
    department: 'Dermatology',
    services: [
      { name: 'Specialist Physician Consultation', price: 55, code: 'CON-01' }
    ],
    medications: [
      { name: 'Clobetasol 0.05% Topical Cream', dosage: 'Apply BD', duration: '10 Days', price: 16.00 }
    ],
    clinicalNotes: 'Plaque psoriasis localized. Review in 3 weeks.',
    subtotal: 71.00,
    insuranceCoPay: 0.00,
    tax: 0.00,
    total: 71.00,
    status: 'SETTLED',
    isPaid: true,
    paymentMethod: 'CARD',
    timestamp: Date.now() - 45 * 60 * 1000
  }
];

// Patient Historical Archive searchable by Phone Number
export const PATIENT_MEDICAL_HISTORY = [
  {
    patientId: 'PT-88210',
    patientName: 'Arthur Pendelton',
    phone: '555-0199',
    age: 58,
    gender: 'Male',
    bloodGroup: 'A+',
    allergies: ['Penicillin (Mild Rash)'],
    chronicConditions: ['Hypertension', 'Hyperlipidemia'],
    visits: [
      {
        visitId: 'VST-2026-0830',
        visitDate: 'Aug 30, 2026',
        timestamp: Date.now() - 23 * 86400 * 1000,
        doctorName: 'Dr. Julian Harris, MD, FACC',
        department: 'Cardiology',
        cabinId: 1,
        diagnosis: 'Essential Stage 1 Hypertension & Hyperlipidemia',
        vitals: { bp: '142/92 mmHg', pulse: '80 bpm', spo2: '98%', temp: '98.4°F' },
        prescriptions: [
          {
            id: 'rx-hist-1',
            name: 'Atorvastatin 20mg',
            dosage: '1 tablet once daily at bedtime (QHS)',
            duration: '30 Days',
            instructions: 'Take after dinner. Avoid grapefruit juice.',
            price: 18.00
          },
          {
            id: 'rx-hist-2',
            name: 'Amlodipine 5mg',
            dosage: '1 tablet once daily in morning (OD)',
            duration: '30 Days',
            instructions: 'Take with water upon waking.',
            price: 15.00
          }
        ],
        labOrders: [
          { name: 'Lipid Profile', code: 'LAB-LIPID', result: 'Cholesterol 218 mg/dL, Triglycerides 160 mg/dL' },
          { name: '12-Lead ECG', code: 'LAB-ECG', result: 'Normal Sinus Rhythm, No ST elevation' }
        ],
        clinicalNotes: 'Blood pressure slightly elevated. Commenced statin therapy. Advised low-salt Mediterranean diet. Schedule follow-up in 4 weeks.'
      },
      {
        visitId: 'VST-2026-0615',
        visitDate: 'Jun 15, 2026',
        timestamp: Date.now() - 99 * 86400 * 1000,
        doctorName: 'Dr. Rajesh Patel, MD, FACP',
        department: 'Internal Medicine',
        cabinId: 5,
        diagnosis: 'Executive Wellness & Vitamin D Insufficiency',
        vitals: { bp: '136/86 mmHg', pulse: '78 bpm', spo2: '99%', temp: '98.6°F' },
        prescriptions: [
          {
            id: 'rx-hist-3',
            name: 'Vitamin D3 60,000 IU',
            dosage: '1 capsule weekly with milk',
            duration: '8 Weeks',
            instructions: 'Take once every Sunday after breakfast.',
            price: 14.00
          }
        ],
        labOrders: [
          { name: 'Complete Blood Count (CBC)', code: 'LAB-CBC', result: 'Hb 14.8 g/dL, WBC 6.8 x 10^3/uL' }
        ],
        clinicalNotes: 'Routine executive health review. Serum Vitamin D was 18 ng/mL. Ergonomics reviewed.'
      }
    ]
  },
  {
    patientId: 'PT-88214',
    patientName: 'Jonathan Hayes',
    phone: '555-0284',
    age: 42,
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: ['Sulfa Drugs'],
    chronicConditions: ['Patellar Tendinopathy'],
    visits: [
      {
        visitId: 'VST-2026-0818',
        visitDate: 'Aug 18, 2026',
        timestamp: Date.now() - 35 * 86400 * 1000,
        doctorName: 'Dr. Marcus Vance, MS, MCh',
        department: 'Orthopedics',
        cabinId: 3,
        diagnosis: 'Left Patellar Tendinitis & Grade 1 Meniscal Strain',
        vitals: { bp: '122/78 mmHg', pulse: '70 bpm', spo2: '99%', temp: '98.6°F' },
        prescriptions: [
          {
            id: 'rx-hist-4',
            name: 'Paracetamol 650mg',
            dosage: '1 tablet every 8 hours as needed for joint pain',
            duration: '7 Days',
            instructions: 'Take with food. Do not exceed 3 tablets daily.',
            price: 6.50
          }
        ],
        labOrders: [
          { name: 'Digital X-Ray Left Knee AP/Lat', code: 'RAD-XRAY-01', result: 'Mild joint space reduction. No fracture.' }
        ],
        clinicalNotes: 'Runner knee discomfort during uphill jogging. Recommend quadriceps eccentric strengthening and knee sleeve.'
      }
    ]
  },
  {
    patientId: 'PT-88219',
    patientName: 'Sophia Montgomery',
    phone: '555-0371',
    age: 29,
    gender: 'Female',
    bloodGroup: 'B+',
    allergies: ['Nickel Metal'],
    chronicConditions: ['Atopic Eczema'],
    visits: [
      {
        visitId: 'VST-2026-0720',
        visitDate: 'Jul 20, 2026',
        timestamp: Date.now() - 64 * 86400 * 1000,
        doctorName: 'Dr. Elena Rostova, MD, FAAD',
        department: 'Dermatology',
        cabinId: 2,
        diagnosis: 'Acute Contact Allergic Dermatitis',
        vitals: { bp: '116/74 mmHg', pulse: '72 bpm', spo2: '99%', temp: '98.2°F' },
        prescriptions: [
          {
            id: 'rx-hist-5',
            name: 'Cetirizine 10mg',
            dosage: '1 tablet once daily in evening',
            duration: '10 Days',
            instructions: 'Take at night. May cause mild drowsiness.',
            price: 8.00
          },
          {
            id: 'rx-hist-6',
            name: 'Clobetasol 0.05% Topical Cream',
            dosage: 'Apply thin film twice daily to affected skin',
            duration: '10 Days',
            instructions: 'Do not apply near eyes or open cuts.',
            price: 16.00
          }
        ],
        labOrders: [],
        clinicalNotes: 'Flared erythema on bilateral forearms following new fabric detergent. Prescribed antihistamine and short course steroid cream.'
      }
    ]
  },
  {
    patientId: 'PT-88225',
    patientName: 'Derrick Vance',
    phone: '555-0529',
    age: 51,
    gender: 'Male',
    bloodGroup: 'O-',
    allergies: ['None Reported'],
    chronicConditions: ['Type 2 Diabetes Mellitus'],
    visits: [
      {
        visitId: 'VST-2026-0805',
        visitDate: 'Aug 5, 2026',
        timestamp: Date.now() - 48 * 86400 * 1000,
        doctorName: 'Dr. Rajesh Patel, MD, FACP',
        department: 'Internal Medicine',
        cabinId: 5,
        diagnosis: 'Type 2 Diabetes Mellitus (HbA1c 7.2%)',
        vitals: { bp: '128/82 mmHg', pulse: '74 bpm', spo2: '98%', temp: '98.6°F' },
        prescriptions: [
          {
            id: 'rx-hist-7',
            name: 'Metformin 500mg XR',
            dosage: '1 tablet twice daily with morning and evening meals',
            duration: '60 Days',
            instructions: 'Swallow whole with food. Do not crush.',
            price: 12.00
          },
          {
            id: 'rx-hist-8',
            name: 'Atorvastatin 20mg',
            dosage: '1 tablet once daily at night (QHS)',
            duration: '30 Days',
            instructions: 'Take at bedtime.',
            price: 18.00
          }
        ],
        labOrders: [
          { name: 'Glycated Hemoglobin (HbA1c)', code: 'LAB-HBA1C', result: 'HbA1c: 7.2% (Fair control)' },
          { name: 'Fasting Plasma Glucose', code: 'LAB-GLUCOSE', result: '138 mg/dL' }
        ],
        clinicalNotes: 'Glycemic control improving with XR formulation. Retinal screening up to date. Recheck HbA1c in 3 months.'
      }
    ]
  }
];

// Initial Inhouse Pharmacy Prescriptions Queue (Awaiting Dispensation)
export const INITIAL_PHARMACY_QUEUE = [
  {
    id: 'rx-order-501',
    tokenNumber: 'C-103',
    patientName: 'Sophia Montgomery',
    patientId: 'PT-88219',
    age: 29,
    gender: 'Female',
    phone: '555-0371',
    doctorName: 'Dr. Elena Rostova, MD, FAAD',
    cabinId: 2,
    department: 'Dermatology',
    status: 'QUEUED', // QUEUED, PACKAGING, DISPENSED
    timestamp: Date.now() - 8 * 60 * 1000,
    medications: [
      {
        id: 'med-5',
        name: 'Cetirizine 10mg',
        dosage: '1 tablet once daily in the evening',
        duration: '7 Days',
        quantity: '1 Strip (10 Tabs)',
        instructions: 'Take at night. May cause mild drowsiness.',
        storageLocation: 'Shelf B-08',
        price: 8.00,
        isVerified: false
      },
      {
        id: 'med-6',
        name: 'Clobetasol 0.05% Topical Cream',
        dosage: 'Apply thin layer twice daily',
        duration: '10 Days',
        quantity: '1 Tube (30g)',
        instructions: 'Apply sparingly to affected rash areas only.',
        storageLocation: 'Shelf D-02',
        price: 16.00,
        isVerified: false
      }
    ],
    doctorNotes: 'Acute contact dermatitis. Avoid harsh detergents. Apply cream twice daily for 10 days.',
    pharmacistNotes: '',
    totalAmount: 24.00
  }
];

// Multi-Tenant Feature Flag Defaults (FR-03, FR-05)
export const DEFAULT_CLINIC_FEATURES = {
  pharmacy: true,
  doctorCabin: true,
  kiosk: true,
  billingDesk: true,
  queueTv: true
};

export const CLINIC_FEATURE_MODULES = [
  {
    key: 'pharmacy',
    name: 'Pharmacy',
    workstationRole: 'INHOUSE_PHARMACY',
    tagline: 'Dispensary & Medication Inventory',
    description: 'In-house pharmacy desk, prescription queue, drug inventory, OTC dispensing, and formulary control.',
    badge: 'Dispensary',
    iconName: 'Pill'
  },
  {
    key: 'doctorCabin',
    name: 'Dr. Cabin',
    workstationRole: 'DOCTOR_CABIN',
    tagline: 'Physician Consultation Console',
    description: 'Doctor examination console, electronic medical record (EMR), vitals triage, e-prescriptions, and minor procedures.',
    badge: 'Clinical',
    iconName: 'Stethoscope'
  },
  {
    key: 'kiosk',
    name: 'Kiosk',
    workstationRole: 'PATIENT_KIOSK',
    tagline: 'Self-Service Patient Terminal',
    description: 'Touchscreen kiosk for self-check-in, symptom selector, automated cabin routing, and thermal token printing.',
    badge: 'Self-Service',
    iconName: 'Smartphone'
  },
  {
    key: 'billingDesk',
    name: 'Billing Desk',
    workstationRole: 'BILLING_PHARMACY',
    tagline: 'Cashier POS & Invoice Settlement',
    description: 'Front-desk cashier checkout, consultation fee settlement, medication billing, and laser receipt printing.',
    badge: 'POS & Billing',
    iconName: 'Receipt'
  },
  {
    key: 'queueTv',
    name: 'Queue TV',
    workstationRole: 'CABIN_QUEUE_TV',
    tagline: 'Waiting Lounge Digital Signage',
    description: 'Waiting area TV display, live audio/visual patient callout chime, token status, and cabin occupancy monitor.',
    badge: 'Public Display',
    iconName: 'Tv'
  }
];

// Multi-Clinic Directory
export const INITIAL_CLINICS = [
  {
    id: 'CLI-101',
    name: 'Fatima Clinic & Diagnostic Center',
    tagline: 'Comprehensive Outpatient & Ambulatory Care',
    code: 'FATIMA',
    status: 'ACTIVE', // ACTIVE, LOCKED, SUSPENDED
    lockReason: '',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
    address: '42 Health Avenue, Medical District, Suite 100',
    phone: '+1 (555) 019-2831',
    email: 'info@fatimaclinic.com',
    displayLogo: '', // Can be customized with data URL
    printingLogo: '',
    features: {
      pharmacy: true,
      doctorCabin: true,
      kiosk: true,
      billingDesk: true,
      queueTv: true
    },
    kioskDevices: [
      { id: 'KIOSK-01', name: 'Reception Main Kiosk', pin: '1234', location: 'Ground Floor Lobby', status: 'ONLINE' },
      { id: 'KIOSK-02', name: 'Emergency Triage Kiosk', pin: '5678', location: 'Emergency Wing Entrance', status: 'ONLINE' }
    ],
    kioskSettings: {
      autoLockSeconds: 300, // 5 minutes inactivity
      maxFailedAttempts: 5,
      lockoutCooldownSeconds: 60
    },
    pharmacySettings: {
      enabled: true,
      licenseNumber: 'PHARM-PK-2026-01',
      allowCounterPayment: true,
      allowOTCSales: true,
      defaultPrintFormat: 'A5_LANDSCAPE',
      lowStockThreshold: 15,
      taxPercent: 0,
      headPharmacist: 'Pharm. Sanaullah Khan (R.Ph)'
    }
  },
  {
    id: 'CLI-102',
    name: 'Apex Specialist Care Pavilion',
    tagline: 'Multi-Specialty Surgery & Advanced Diagnostics',
    code: 'APEX',
    status: 'ACTIVE',
    lockReason: '',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    address: '770 Innovation Blvd, Healthcare Hub',
    phone: '+1 (555) 882-9901',
    email: 'contact@apexcare.org',
    displayLogo: '',
    printingLogo: '',
    features: {
      pharmacy: true,
      doctorCabin: true,
      kiosk: true,
      billingDesk: true,
      queueTv: true
    },
    kioskDevices: [
      { id: 'KIOSK-03', name: 'Pavilion North Kiosk', pin: '2468', location: 'Pavilion North', status: 'ONLINE' }
    ],
    kioskSettings: {
      autoLockSeconds: 300,
      maxFailedAttempts: 5,
      lockoutCooldownSeconds: 60
    },
    pharmacySettings: {
      enabled: true,
      licenseNumber: 'PHARM-PK-2026-02',
      allowCounterPayment: true,
      allowOTCSales: true,
      defaultPrintFormat: 'A5_LANDSCAPE',
      lowStockThreshold: 15,
      taxPercent: 0,
      headPharmacist: 'Pharm. Aisha Malik (R.Ph)'
    }
  },
  {
    id: 'CLI-103',
    name: 'City Outpatient Health Center',
    tagline: 'Community Family Medicine & Walk-In Clinic',
    code: 'CITY',
    status: 'ACTIVE',
    lockReason: '',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
    address: '150 Central Parkway, Downtown Metro',
    phone: '+1 (555) 345-6789',
    email: 'support@cityhealthcenter.org',
    displayLogo: '',
    printingLogo: '',
    features: {
      pharmacy: true,
      doctorCabin: true,
      kiosk: true,
      billingDesk: true,
      queueTv: true
    },
    kioskDevices: [
      { id: 'KIOSK-04', name: 'Metro Walk-In Kiosk', pin: '9900', location: 'Main Entrance', status: 'ONLINE' }
    ],
    kioskSettings: {
      autoLockSeconds: 300,
      maxFailedAttempts: 5,
      lockoutCooldownSeconds: 60
    },
    pharmacySettings: {
      enabled: true,
      licenseNumber: 'PHARM-PK-2026-03',
      allowCounterPayment: false,
      allowOTCSales: false,
      defaultPrintFormat: 'A5_LANDSCAPE',
      lowStockThreshold: 20,
      taxPercent: 0,
      headPharmacist: 'Pharm. Bilal Ahmed (R.Ph)'
    }
  }
];

// User Roles
export const USER_ROLES = {
  KIOSK_USER: 'KIOSK_USER',
  DOCTOR_USER: 'DOCTOR_USER',
  PHARMACIST_USER: 'PHARMACIST_USER',
  ADMIN_USER: 'ADMIN_USER',
  SUPER_ADMIN_USER: 'SUPER_ADMIN_USER'
};

// Initial User Accounts with Pre-configured Roles & Google Authenticator 2FA
export const INITIAL_USERS = [
  // 1. GLOBAL SUPER ADMIN (Software Administrator - Single Platform Control Account)
  {
    id: 'usr-superadmin',
    username: 'superadmin',
    name: 'System Administrator (Software Admin)',
    role: 'SUPER_ADMIN_USER',
    clinicId: 'ALL',
    email: 'software.admin@healthcloud.org',
    googleAuthSecret: 'JBSWY3DPEHPK3PXP',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },

  // 2. FATIMA CLINIC & DIAGNOSTIC CENTER (CLI-101) - Isolated Staff
  {
    id: 'usr-admin-fatima',
    username: 'admin',
    name: 'Sarah Connor (Clinic Admin)',
    role: 'ADMIN_USER',
    clinicId: 'CLI-101',
    email: 'admin@fatimaclinic.com',
    googleAuthSecret: 'KRSXG5CTMVRXEZLU',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 22 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-pharm-fatima',
    username: 'pharmacist',
    name: 'Pharm. Sanaullah Khan (R.Ph)',
    role: 'PHARMACIST_USER',
    clinicId: 'CLI-101',
    email: 'pharmacy@fatimaclinic.com',
    googleAuthSecret: 'NBSWY3DPEHPK3PXP',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 26 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-doc-1',
    username: 'doctor1',
    name: 'Dr. Julian Harris, MD, FACC',
    role: 'DOCTOR_USER',
    clinicId: 'CLI-101',
    doctorCabinId: 1,
    email: 'dr.harris@fatimaclinic.com',
    googleAuthSecret: 'MZXW633PN5XW6MZX',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-doc-2',
    username: 'doctor2',
    name: 'Dr. Elena Rostova, MD, FAAD',
    role: 'DOCTOR_USER',
    clinicId: 'CLI-101',
    doctorCabinId: 2,
    email: 'dr.rostova@fatimaclinic.com',
    googleAuthSecret: 'OBXXK43VMVRXEZLU',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 27 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-kiosk-user',
    username: 'kiosk',
    name: 'Fatima Reception Kiosk',
    role: 'KIOSK_USER',
    clinicId: 'CLI-101',
    email: 'kiosk1@fatimaclinic.com',
    googleAuthSecret: '',
    googleAuthEnabled: false,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },

  // 3. APEX SPECIALIST PAVILION (CLI-102) - Isolated Staff
  {
    id: 'usr-admin-apex',
    username: 'admin_apex',
    name: 'Michael Chang (Apex Admin)',
    role: 'ADMIN_USER',
    clinicId: 'CLI-102',
    email: 'admin@apexhealth.org',
    googleAuthSecret: 'KRSXG5CTMVRXEZLU',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-doc-apex-1',
    username: 'doctor_apex',
    name: 'Dr. Marcus Vance, MS, MCh',
    role: 'DOCTOR_USER',
    clinicId: 'CLI-102',
    doctorCabinId: 1,
    email: 'dr.vance@apexhealth.org',
    googleAuthSecret: 'MZXW633PN5XW6MZX',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-kiosk-apex',
    username: 'kiosk_apex',
    name: 'Apex Pavilion Touch Kiosk',
    role: 'KIOSK_USER',
    clinicId: 'CLI-102',
    email: 'kiosk@apexhealth.org',
    googleAuthSecret: '',
    googleAuthEnabled: false,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },

  // 4. CITY OUTPATIENT CENTER (CLI-103) - Isolated Staff
  {
    id: 'usr-admin-city',
    username: 'admin_city',
    name: 'Robert Miller (City Admin)',
    role: 'ADMIN_USER',
    clinicId: 'CLI-103',
    email: 'admin@cityhealthcenter.org',
    googleAuthSecret: 'KRSXG5CTMVRXEZLU',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-doc-city-1',
    username: 'doctor_city',
    name: 'Dr. Tariq Mahmood, MD, MRCP',
    role: 'DOCTOR_USER',
    clinicId: 'CLI-103',
    doctorCabinId: 1,
    email: 'dr.mahmood@cityhealthcenter.org',
    googleAuthSecret: 'MZXW633PN5XW6MZX',
    googleAuthEnabled: true,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: 'usr-kiosk-city',
    username: 'kiosk_city',
    name: 'City Outpatient Kiosk',
    role: 'KIOSK_USER',
    clinicId: 'CLI-103',
    email: 'kiosk@cityhealthcenter.org',
    googleAuthSecret: '',
    googleAuthEnabled: false,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'ACTIVE'
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-101',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    user: 'superadmin',
    role: 'SUPER_ADMIN_USER',
    clinicId: 'CLI-101',
    action: 'SYSTEM_BOOT',
    details: 'System initialized with Multi-Clinic & 2FA Security protocols enabled',
    severity: 'INFO'
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: 'admin',
    role: 'ADMIN_USER',
    clinicId: 'CLI-101',
    action: 'LOGIN_SUCCESS',
    details: 'Administrator logged in with verified 6-digit Google Authenticator code',
    severity: 'SUCCESS'
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    user: 'kiosk',
    role: 'KIOSK_USER',
    clinicId: 'CLI-101',
    action: 'KIOSK_ONLINE',
    details: 'Reception Main Kiosk (KIOSK-01) unlocked and active for patient queue',
    severity: 'INFO'
  }
];

// Emergency & Minor Procedures Catalog Across the Clinic
export const EMERGENCY_PROCEDURES = [
  {
    id: 'emg-proc-1',
    code: 'EMG-PRC-DRES',
    name: 'Sterile Wound Dressing & Bandage',
    category: 'Wound Care & Dressing',
    price: 450,
    durationMinutes: 15,
    description: 'Aseptic wound cleansing with povidone iodine/saline, sterile gauze packing, and non-stick hypoallergenic adhesive bandage.',
    severity: 'URGENT',
    icon: 'Bandage',
    consumables: ['Sterile Gauze Swabs 10x10cm (x2)', 'Povidone Iodine 10% Solution', 'Micropore Surgical Tape', 'Normal Saline 100ml'],
    cabinId: 1
  },
  {
    id: 'emg-proc-2',
    code: 'EMG-PRC-CRPB',
    name: 'Elastic Crepe Compression Bandage',
    category: 'Wound Care & Dressing',
    price: 350,
    durationMinutes: 10,
    description: 'Orthopedic elastic support wrapping for acute sprains, soft tissue swelling, or securing splint/dressing firmly.',
    severity: 'PRIORITY',
    icon: 'Activity',
    consumables: ['Elastic Crepe Bandage 10cm x 4.5m', 'Adhesive fixation tape'],
    cabinId: 1
  },
  {
    id: 'emg-proc-3',
    code: 'EMG-PRC-CATH',
    name: 'Foley Urinary Catheterization',
    category: 'Urological / Catheter Care',
    price: 800,
    durationMinutes: 20,
    description: 'Sterile 2-way Foley catheter insertion (14Fr/16Fr) with 2% lignocaine gel anesthesia and closed anti-reflux urine drainage bag.',
    severity: 'URGENT',
    icon: 'Droplet',
    consumables: ['Foley Catheter 16Fr (2-way)', 'Urine Drainage Bag 2000ml', 'Lignocaine 2% Gel Syringe', 'Sterile Water 10ml ampoule', 'Surgical Gloves'],
    cabinId: 1
  },
  {
    id: 'emg-proc-4',
    code: 'EMG-PRC-CANN',
    name: 'Peripheral IV Cannulation (Canola)',
    category: 'IV Therapy & Access',
    price: 400,
    durationMinutes: 10,
    description: 'Venipuncture with radiopaque PTFE peripheral cannula (18G/20G/22G/24G), heparinized saline flush, and transparent securement dressing.',
    severity: 'URGENT',
    icon: 'Syringe',
    consumables: ['IV Cannula 20G (Pink) with Port', 'Alcohol Prep Swab (x2)', 'Normal Saline 5ml Flush', 'Cannula Fixation Tape / Tegaderm'],
    cabinId: 1
  },
  {
    id: 'emg-proc-5',
    code: 'EMG-PRC-DRIP',
    name: 'Emergency IV Infusion & Hydration Drip',
    category: 'IV Therapy & Access',
    price: 650,
    durationMinutes: 35,
    description: 'Sterile IV infusion set connection with 500ml Normal Saline (0.9%) or Ringer’s Lactate for acute hypovolemia, dehydration, or medication carrier.',
    severity: 'URGENT',
    icon: 'Sparkles',
    consumables: ['Normal Saline 0.9% 500ml IV', 'IV Infusion Set with Air Vent', 'Drip Stand & Roller Clamp'],
    cabinId: 1
  },
  {
    id: 'emg-proc-6',
    code: 'EMG-PRC-NEBU',
    name: 'Emergency Bronchodilator Nebulization',
    category: 'Respiratory Therapy',
    price: 350,
    durationMinutes: 15,
    description: 'High-efficiency ultrasonic nebulization with Salbutamol (Ventolin) & Ipratropium (Atrovent) for acute asthma or severe bronchospasm.',
    severity: 'URGENT',
    icon: 'Wind',
    consumables: ['Disposable Nebulizer Chamber & Mask', 'Salbutamol 2.5mg Respule', 'Ipratropium 500mcg Respule', 'Normal Saline Diluent'],
    cabinId: 1
  },
  {
    id: 'emg-proc-7',
    code: 'EMG-PRC-INJ',
    name: 'Stat IM/IV Analgesic & Antispasmodic Injection',
    category: 'Injections & Medications',
    price: 250,
    durationMinutes: 5,
    description: 'Deep intramuscular or slow intravenous administration of analgesic, NSAID, or antiemetic for acute renal colic, trauma, or severe pain.',
    severity: 'PRIORITY',
    icon: 'Syringe',
    consumables: ['Disposable 5ml Syringe with 23G Needle', 'Alcohol Prep Swab', 'Analgesic / Antiemetic Ampoule'],
    cabinId: 1
  },
  {
    id: 'emg-proc-8',
    code: 'EMG-PRC-TETN',
    name: 'Tetanus Toxoid (TT) Prophylaxis Injection',
    category: 'Injections & Medications',
    price: 300,
    durationMinutes: 5,
    description: 'Deep IM injection of Tetanus Toxoid vaccine 0.5ml for contaminated lacerations, rusty nail punctures, and acute trauma exposure.',
    severity: 'PRIORITY',
    icon: 'ShieldAlert',
    consumables: ['Tetanus Toxoid Vaccine Ampoule (0.5ml)', 'Auto-Disable 2ml Syringe', 'Spirit Swab'],
    cabinId: 1
  },
  {
    id: 'emg-proc-9',
    code: 'EMG-PRC-SUTR',
    name: 'Minor Wound Suturing / Suture Removal',
    category: 'Surgical & Lacerations',
    price: 850,
    durationMinutes: 25,
    description: 'Local infiltration anesthesia with 2% Lignocaine, wound debridement, interrupted primary suturing or sterile removal of healed stitches.',
    severity: 'URGENT',
    icon: 'Scissors',
    consumables: ['Disposable Suture Pack (Forceps, Needle Holder, Scissors)', 'Prolene/Silk Suture 3-0/4-0', 'Lignocaine 2% Vial', 'Sterile Dressing'],
    cabinId: 1
  },
  {
    id: 'emg-proc-10',
    code: 'EMG-PRC-NGTB',
    name: 'Nasogastric (NG) Tube Insertion',
    category: 'Gastrointestinal Care',
    price: 750,
    durationMinutes: 20,
    description: 'Sterile passage of 16Fr silicone nasogastric tube to stomach with pH verification and closed drainage / decompression setup.',
    severity: 'URGENT',
    icon: 'AlertCircle',
    consumables: ['Ryle’s NG Tube 16Fr', 'Lignocaine 2% Jelly', '50ml Catheter-Tip Feeding Syringe', 'Hypoallergenic Nose Bridge Tape'],
    cabinId: 1
  },
  {
    id: 'emg-proc-11',
    code: 'EMG-PRC-RBS',
    name: 'Stat Glucometer Blood Sugar & Ketone Check',
    category: 'Diagnostic Stat Check',
    price: 150,
    durationMinutes: 3,
    description: 'Rapid capillary blood glucose & ketone screening with digital calibrated glucometer for acute hypoglycemia or diabetic crisis.',
    severity: 'PRIORITY',
    icon: 'Activity',
    consumables: ['Blood Glucose Test Strip', 'Sterile Safety Lancet', 'Alcohol Wipe'],
    cabinId: 1
  }
];

