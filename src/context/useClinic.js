import { useContext } from 'react';
import { ClinicContext } from './ClinicContextInstance';

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
