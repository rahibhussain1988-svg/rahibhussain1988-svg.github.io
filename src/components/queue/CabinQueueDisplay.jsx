import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Stethoscope,
  Bell,
  Volume2,
  VolumeX,
  Users,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Building2,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';
import { getDoctorTheme } from '../../data/clinicData';
import { WorkstationHeaderControls } from '../common/WorkstationHeaderControls';

export const CabinQueueDisplay = () => {
  const {
    cabins,
    patients,
    latestAnnouncement,
    soundEnabled,
    setSoundEnabled,
    clinicSettings,
    activeClinic,
    isCurrentClinicLocked,
    getEstimatedWaitTime
  } = useClinic();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCallAlert, setActiveCallAlert] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Flash calling banner when doctor calls next patient
  useEffect(() => {
    if (latestAnnouncement && Date.now() - latestAnnouncement.timestamp < 16000) {
      setActiveCallAlert(latestAnnouncement);
      const timeout = setTimeout(() => {
        setActiveCallAlert(null);
      }, 14000);
      return () => clearTimeout(timeout);
    }
  }, [latestAnnouncement]);

  const activeConsultingPatients = useMemo(() => {
    return patients.filter(
      (p) => p.status === 'IN_CONSULTATION' || p.status === 'CALLED'
    );
  }, [patients]);

  const waitingPatients = useMemo(() => {
    return patients
      .filter((p) => p.status === 'WAITING')
      .sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        return 0;
      });
  }, [patients]);

  const activeEmergencyPatient = useMemo(() => {
    return patients.find(
      (p) => p.isEmergency && (p.status === 'WAITING' || p.status === 'CALLED' || p.status === 'IN_CONSULTATION')
    );
  }, [patients]);

  // Determine current spotlight patient: highest priority is active call alert, then first called, then first consulting
  const spotlightPatient = useMemo(() => {
    if (activeCallAlert) {
      const found = patients.find((p) => p.tokenNumber === activeCallAlert.tokenNumber);
      if (found) return found;
      return {
        tokenNumber: activeCallAlert.tokenNumber,
        patientName: activeCallAlert.patientName,
        cabinId: activeCallAlert.cabinId,
        doctorName: activeCallAlert.doctorName,
        department: activeCallAlert.department || 'Clinical Consultation',
        status: 'CALLED'
      };
    }
    const called = patients.find((p) => p.status === 'CALLED');
    if (called) return called;
    const consulting = patients.find((p) => p.status === 'IN_CONSULTATION');
    if (consulting) return consulting;
    return null;
  }, [activeCallAlert, patients]);

  const spotlightCabin = useMemo(() => {
    if (!spotlightPatient) return null;
    return cabins.find((c) => c.cabinId === spotlightPatient.cabinId) || cabins[0];
  }, [spotlightPatient, cabins]);

  const spotlightTheme = useMemo(() => {
    return getDoctorTheme(spotlightCabin?.cabinId || 1);
  }, [spotlightCabin]);

  const formatElapsed = (startTime) => {
    if (!startTime) return '00:00';
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // Clinic Lock Suspension Gate
  if (isCurrentClinicLocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8 select-none relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-radial from-rose-950/20 via-slate-950 to-slate-950"></div>
        <div className="relative z-10 max-w-xl w-full bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-900/30 animate-pulse">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <span className="px-4 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/30">
            System Notice
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-2 tracking-tight">
            Clinic Access Suspended
          </h1>
          <p className="text-slate-300 text-base font-medium mb-6">
            Please contact administrator.
          </p>
          {activeClinic?.lockReason && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-left mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                Reason:
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
    <div className="min-h-screen bg-slate-100 text-slate-900 p-3 sm:p-5 lg:p-6 flex flex-col select-none relative overflow-y-auto font-sans">
      {/* =========================================================================
          1. HEADER BAR: CLINIC LOGO, NAME, TIME, & AUDIO TOGGLE
          ========================================================================= */}
      <header className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {clinicSettings?.displayLogo ? (
            <img
              src={clinicSettings.displayLogo}
              alt="Clinic Logo"
              className="h-12 max-w-[160px] object-contain rounded-xl"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-500 flex items-center justify-center shadow-md shadow-teal-500/20 text-white shrink-0">
              <Stethoscope className="w-8 h-8" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {activeClinic?.name || clinicSettings?.clinicName || 'Fatima Clinic & Diagnostic Center'}
              </h1>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider">
                LIVE TV LOUNGE BOARD
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {activeClinic?.tagline || clinicSettings?.subtitle || 'Real-Time Patient Calling & Lounge Queue'}
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Hospital Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <WorkstationHeaderControls showClock={false} />

          <div className="px-5 py-2 bg-slate-900 text-white rounded-2xl shadow-sm text-right border border-slate-800">
            <span className="text-[10px] text-teal-300 block font-bold uppercase tracking-wider">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* Emergency Active Alert Ticker Banner */}
      {activeEmergencyPatient && (
        <div className="mt-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-3.5 sm:p-4 shadow-lg shadow-rose-600/30 flex items-center justify-between border-2 border-rose-300 animate-pulse">
          <div className="flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl shrink-0">
              🚨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  STAT EMERGENCY TRIAGE ACTIVE • IMMEDIATE CLINICAL PRIORITY
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-rose-800 text-[10px] font-black uppercase shadow-xs">
                  Cabin {activeEmergencyPatient.cabinId || 1}
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium mt-0.5">
                Token <strong>{activeEmergencyPatient.tokenNumber}</strong> ({activeEmergencyPatient.patientName}) — Procedure: <strong>{activeEmergencyPatient.procedureName || activeEmergencyPatient.minorProcedures?.map((p) => p.name).join(', ') || 'Minor Surgical / Nursing Procedure'}</strong>
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <span className="text-[10px] uppercase font-black tracking-widest text-rose-200 block">STATUS</span>
            <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-rose-950/50 text-white border border-rose-300">
              {activeEmergencyPatient.status === 'IN_CONSULTATION' ? 'In Cabin' : 'Priority Waiting'}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. HIGH-VISIBILITY "NOW SERVING" SPOTLIGHT (Oversized, Glowing Border)
          ========================================================================= */}
      <div className="my-4">
        {spotlightPatient ? (
          <div className={`relative rounded-3xl p-5 sm:p-6 text-white shadow-2xl overflow-hidden transition-all ${
            spotlightPatient.isEmergency
              ? 'bg-gradient-to-r from-red-950 via-rose-900 to-red-900 border-4 border-rose-500 ring-8 ring-rose-500/30'
              : 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-4 border-teal-400 ring-8 ring-teal-400/20 animate-pulse-subtle'
          }`}>
            {/* Glowing ambient light */}
            <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
              spotlightPatient.isEmergency ? 'bg-rose-500/30' : 'bg-teal-500/20'
            }`}></div>
            <div className={`absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
              spotlightPatient.isEmergency ? 'bg-red-500/30' : 'bg-blue-500/20'
            }`}></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left: Token Number & Calling Beacon */}
              <div className="flex items-center gap-5 text-center lg:text-left flex-col sm:flex-row">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex flex-col items-center justify-center font-black shadow-xl shrink-0 animate-bounce ${
                  spotlightPatient.isEmergency
                    ? 'bg-rose-500 text-white shadow-rose-500/40 ring-4 ring-rose-300'
                    : 'bg-teal-500 text-slate-950 shadow-teal-500/30'
                }`}>
                  <Bell className="w-8 h-8 sm:w-10 sm:h-10" />
                  <span className="text-[9px] uppercase font-black tracking-widest mt-0.5">
                    {spotlightPatient.isEmergency ? 'EMERGENCY' : 'CALLING'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-1.5 ${
                      spotlightPatient.isEmergency
                        ? 'bg-rose-500/30 border border-rose-400 text-rose-200'
                        : 'bg-teal-400/20 border border-teal-400/40 text-teal-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full animate-ping ${
                        spotlightPatient.isEmergency ? 'bg-rose-400' : 'bg-teal-400'
                      }`}></span>
                      {spotlightPatient.isEmergency ? '🚨 STAT EMERGENCY ADMISSION' : 'NOW SERVING'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {spotlightPatient.isEmergency ? 'Immediate Procedure Admission' : 'Please Proceed Directly'}
                    </span>
                  </div>

                  <div className={`text-5xl sm:text-7xl font-black font-mono tracking-tight drop-shadow-md ${
                    spotlightPatient.isEmergency ? 'text-rose-200' : 'text-white'
                  }`}>
                    Token {spotlightPatient.tokenNumber}
                  </div>

                  <div className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
                    Patient: <strong className={`font-black underline decoration-2 ${
                      spotlightPatient.isEmergency ? 'text-white decoration-rose-400' : 'text-white decoration-teal-400'
                    }`}>{spotlightPatient.patientName}</strong>
                    {spotlightPatient.isEmergency && (
                      <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black uppercase border border-rose-400">
                        {spotlightPatient.procedureName || 'Emergency Procedure'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Room & Doctor Destination Box */}
              <div className={`w-full lg:w-auto rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-6 shadow-inner border-2 ${
                spotlightPatient.isEmergency
                  ? 'bg-rose-950/80 border-rose-400/70'
                  : 'bg-slate-800/90 border-teal-500/50'
              }`}>
                <div>
                  <span className="text-xs uppercase font-extrabold text-teal-300 tracking-wider block">
                    DESTINATION ROOM
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-center gap-2">
                    <span>Cabin {spotlightCabin?.cabinId || spotlightPatient.cabinId}</span>
                    <ArrowRight className="w-6 h-6 text-teal-400 animate-pulse" />
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-0.5">
                    {spotlightCabin?.department || spotlightPatient.department}
                  </div>
                  <div className="text-xs text-teal-200 font-bold mt-1">
                    {spotlightCabin?.doctorName || spotlightPatient.doctorName}
                  </div>
                </div>

                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-teal-400/60 shadow-md shrink-0 bg-slate-700 flex items-center justify-center text-3xl">
                  {spotlightCabin?.image ? (
                    <img
                      src={spotlightCabin.image}
                      alt={spotlightCabin.doctorName}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>👨‍⚕️</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl p-6 bg-slate-900 text-white shadow-xl border-2 border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-black text-teal-400 block">
                  LOUNGE READY
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Welcome to {activeClinic?.name || clinicSettings?.clinicName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Please take a seat in the waiting lounge. Your token will flash here when your physician is ready.
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-xs font-mono text-teal-300 font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                {cabins.length} Active Physician Cabins
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. MAIN BOARD GRID: CABINS 1-5 (COLOR CODED) & WAITING LOUNGE
          ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1">
        {/* LEFT: DOCTOR CABIN CARDS (Cabins 1 to 5) in DISTINCT PASTEL COLORS */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-600 animate-ping" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Special Care Doctor Cabins (Cabins 1–5)
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 font-mono shadow-2xs">
              {activeConsultingPatients.length} of {cabins.length} Cabins Consulting
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1">
            {cabins.map((cabin) => {
              const activePatient = patients.find(
                (p) =>
                  (p.status === 'IN_CONSULTATION' || p.status === 'CALLED') &&
                  p.cabinId === cabin.cabinId
              );
              const isCalled = activePatient?.status === 'CALLED';
              const theme = getDoctorTheme(cabin.cabinId);

              return (
                <div
                  key={cabin.id}
                  className={`relative p-4 sm:p-5 rounded-3xl border-2 flex flex-col justify-between transition-all duration-300 shadow-xs ${theme.bg} ${
                    isCalled
                      ? 'border-slate-800 ring-4 ring-amber-400 shadow-xl scale-[1.02]'
                      : activePatient
                      ? `${theme.border} shadow-md`
                      : `${theme.border} opacity-90`
                  }`}
                >
                  {/* Top: Cabin Name & Doctor Portrait */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-xl">
                        {cabin.image ? (
                          <img
                            src={cabin.image}
                            alt={cabin.doctorName}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>👨‍⚕️</span>
                        )}
                      </div>
                      <div>
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-lg border ${theme.tagBg} inline-block mb-0.5`}>
                          {cabin.cabinName}
                        </span>
                        <h3 className="font-black text-sm text-slate-900 truncate max-w-[140px] leading-tight">
                          {cabin.doctorName}
                        </h3>
                        <span className={`text-[11px] font-bold ${theme.text}`}>
                          {cabin.department}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase flex items-center gap-1 shadow-2xs ${
                        isCalled
                          ? 'bg-amber-500 text-white animate-pulse'
                          : activePatient
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isCalled ? (
                        <>
                          <Bell className="w-3 h-3" /> Calling
                        </>
                      ) : activePatient ? (
                        <>
                          <Activity className="w-3 h-3" /> In Cabin
                        </>
                      ) : (
                        'Ready'
                      )}
                    </span>
                  </div>

                  {/* Center: Token & Patient Name */}
                  <div className="my-4 text-center">
                    {activePatient ? (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">
                          Now Consulting
                        </span>
                        <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 block my-1">
                          {activePatient.tokenNumber}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-slate-800 block truncate">
                          {activePatient.patientName}
                        </span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span className="text-xs text-slate-600 font-medium">
                            {activePatient.age} Yrs • {activePatient.gender}
                          </span>
                          {activePatient.isPaid || activePatient.paymentStatus === 'PAID' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              Billed & Paid
                            </span>
                          ) : activePatient.paymentStatus === 'PAY_IN_CABIN' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                              Fee in Cabin
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              Fee Due at Counter
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-5 text-slate-400 flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 mb-1.5 text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Cabin Sanitized & Open
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Ready for next patient</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Elapsed Duration & Fee */}
                  <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                    {activePatient ? (
                      <>
                        <span className="flex items-center gap-1 font-mono text-slate-900 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          Elapsed: {formatElapsed(activePatient.consultationStartTime || activePatient.calledAt)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Target ~20m
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-800 font-bold text-[11px]">Fee: Rs {cabin.consultationFee}</span>
                        <span className="text-slate-500 font-medium text-[10px]">{cabin.experience}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: WAITING LOUNGE QUEUE (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Waiting Lounge Queue
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-teal-100 text-teal-900 border border-teal-200">
              {waitingPatients.length} In Line
            </span>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col shadow-sm overflow-hidden">
            {waitingPatients.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mb-2 text-teal-600" />
                <h3 className="text-sm font-extrabold text-slate-800 uppercase">Lounge Queue Clear</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  All patients currently inside doctor cabins. Check in at the entrance kiosk or reception desk for immediate admission.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[58vh] pr-1">
                {waitingPatients.map((patient, index) => {
                  const targetCabin = cabins.find((c) => c.cabinId === patient.cabinId);
                  const docTheme = getDoctorTheme(patient.cabinId);

                  return (
                    <div
                      key={patient.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs transition-all ${
                        patient.isEmergency
                          ? 'bg-rose-50/90 border-2 border-rose-400 ring-2 ring-rose-400/30'
                          : `${docTheme.bg} ${docTheme.border}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs font-mono shadow-2xs ${
                          patient.isEmergency
                            ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}>
                          {patient.isEmergency ? '🚨' : `#${index + 1}`}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xl font-black font-mono ${patient.isEmergency ? 'text-rose-700' : 'text-slate-900'}`}>
                              {patient.tokenNumber}
                            </span>
                            {patient.isEmergency && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase animate-pulse">
                                EMG STAT
                              </span>
                            )}
                            {patient.isPaid || patient.paymentStatus === 'PAID' ? (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Paid
                              </span>
                            ) : patient.paymentStatus === 'PAY_IN_CABIN' ? (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Cabin Fee
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Fee Due
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[130px]">
                            {patient.patientName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          patient.isEmergency ? 'bg-rose-100 text-rose-800 border-rose-300' : docTheme.tagBg
                        }`}>
                          Cabin {patient.cabinId || 1}
                        </span>
                        <span className="text-[10px] text-slate-600 truncate max-w-[110px] font-semibold mt-0.5">
                          {patient.isEmergency ? (patient.procedureName || 'Emergency Procedure') : targetCabin?.doctorName.split(',')[0]}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-teal-600" />
                          {patient.isEmergency ? 'Immediate' : `Est. ~${getEstimatedWaitTime(patient.cabinId, patient.id)}m`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Emergency Triage 24/7 Available
              </span>
              <span className="font-semibold text-slate-400">Pharmacy Ground Floor</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. AKUH CLINICAL LABORATORIES HEALTH AWARENESS BANNER (Image 1 Style)
          ========================================================================= */}
      <div className="mt-4 bg-gradient-to-r from-[#FAF6F4] via-white to-[#FDF8F6] border-2 border-rose-200/90 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#8B0029]/30 shadow-md shrink-0 bg-rose-100">
            <img
              src="https://images.unsplash.com/photo-1594824813515-59d43bf7e170?w=600&auto=format&fit=crop&q=80"
              alt="PMOS Lab Screening Campaign"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#8B0029] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                AKUH Clinical Laboratories
              </span>
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                Special Health Screening Package
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#8B0029] tracking-tight leading-tight">
              More Than Just Irregular Periods
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 leading-snug">
              Polyendocrine Metabolic Ovarian Syndrome (PMOS) Lab Screening Package (formerly known as PCOS)
            </p>
            <p className="text-xs text-[#8B0029] font-black mt-1">
              PMOS: Your Hormones, Your Metabolism, Your Health.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0 text-right">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Diagnostic Package Fee</span>
            <span className="text-xl font-black font-mono text-[#8B0029]">Rs 4,500</span>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-[#8B0029] border border-rose-200 text-xs font-extrabold">
            Same-day In-House Blood Sample Collection
          </span>
        </div>
      </div>
    </div>
  );
};
