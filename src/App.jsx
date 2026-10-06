import React from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { HeaderNav } from './components/common/HeaderNav';
import { PatientKiosk } from './components/kiosk/PatientKiosk';
import { CabinQueueDisplay } from './components/queue/CabinQueueDisplay';
import { DoctorCabinConsole } from './components/cabin/DoctorCabinConsole';
import { BillingPharmacyPOS } from './components/billing/BillingPharmacyPOS';
import { InhousePharmacyDesk } from './components/pharmacy/InhousePharmacyDesk';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { ScreenLockModal } from './components/common/ScreenLockModal';
import { DeactivatedModuleNotice } from './components/common/DeactivatedModuleNotice';
import { PWAInstallProvider } from './context/PWAInstallContext';
import { PWAInstallModal } from './components/common/PWAInstallModal';

const ROLE_TO_FEATURE_MAP = {
  PATIENT_KIOSK: { key: 'kiosk', name: 'Patient Kiosk', role: 'PATIENT_KIOSK' },
  CABIN_QUEUE_TV: { key: 'queueTv', name: 'Lounge Queue TV', role: 'CABIN_QUEUE_TV' },
  DOCTOR_CABIN: { key: 'doctorCabin', name: 'Doctor Cabin Workstation', role: 'DOCTOR_CABIN' },
  BILLING_PHARMACY: { key: 'billingDesk', name: 'Billing Desk POS', role: 'BILLING_PHARMACY' },
  INHOUSE_PHARMACY: { key: 'pharmacy', name: 'Inhouse Pharmacy Desk', role: 'INHOUSE_PHARMACY' }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Hospital Workstation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 min-h-[400px]">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-md">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Workstation Display Notice
          </h2>
          <p className="text-xs text-slate-500 max-w-md mb-4 font-mono bg-white p-3 rounded-xl border border-slate-200">
            {this.state.error?.message || 'A temporary display error occurred while rendering this station.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-blue-700"
            >
              🔄 Reload Workstation
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300"
            >
              Reset Local Cache
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ClinicAppContent = () => {
  const { activeRole, isNavPinned, isNavLocked, isClinicFeatureEnabled, activeClinic } = useClinic();

  const currentModule = ROLE_TO_FEATURE_MAP[activeRole];
  const isCurrentModuleDeactivated = currentModule
    ? !isClinicFeatureEnabled(currentModule.key, activeClinic?.id)
    : false;

  return (
    <div className={`flex ${isNavPinned && !isNavLocked ? 'flex-row' : 'flex-col'} h-screen max-h-screen bg-slate-50 text-slate-900 antialiased overflow-hidden font-sans transition-all duration-300`}>
      {/* Left-Side Vertical Navigation Panel (Supports Auto-Hide Overlay & Pin Mode) */}
      <HeaderNav />

      {/* Main Active Workstation Screen (Adjusts dynamically when navigation is pinned) */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0 relative overflow-hidden transition-all duration-300">
        <ErrorBoundary>
          {isCurrentModuleDeactivated ? (
            <DeactivatedModuleNotice moduleInfo={currentModule} />
          ) : (
            <>
              {activeRole === 'PATIENT_KIOSK' && <PatientKiosk />}
              {activeRole === 'CABIN_QUEUE_TV' && <CabinQueueDisplay />}
              {activeRole === 'DOCTOR_CABIN' && <DoctorCabinConsole />}
              {activeRole === 'BILLING_PHARMACY' && <BillingPharmacyPOS />}
              {activeRole === 'INHOUSE_PHARMACY' && <InhousePharmacyDesk />}
              {activeRole === 'ADMIN_DASHBOARD' && <AdminDashboard />}
              {activeRole === 'SUPER_ADMIN_DASHBOARD' && <SuperAdminDashboard />}
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Workstation Screen Lock Overlay (Requirement 14) */}
      <ScreenLockModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ClinicProvider>
        <PWAInstallProvider>
          <ClinicAppContent />
          <PWAInstallModal />
        </PWAInstallProvider>
      </ClinicProvider>
    </ErrorBoundary>
  );
}
