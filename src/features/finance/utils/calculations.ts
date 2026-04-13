import { FINANCE_RATES } from '@/config/constants';

export const calculateInvoice = (vessel: any, totalTrucks: number = 0) => {
  const qty = vessel.survey_quantity || vessel.quantity || 0;
  
  const terminalCharges = qty * FINANCE_RATES.TERMINAL_CHARGE;
  const handlingCharges = qty * FINANCE_RATES.HANDLING_CHARGE;
  
  // Simulated billing slots (would normally come from timestamps)
  const berthingSlots = 2; 
  const mooringSlots = 5;
  
  const berthingCharges = berthingSlots * FINANCE_RATES.BERTHING_CHARGE_PER_SLOT;
  const mooringCharges = mooringSlots * FINANCE_RATES.MOORING_CHARGE_PER_SLOT;
  
  const truckEntryCharges = totalTrucks * FINANCE_RATES.TRUCK_ENTRY_CHARGE;
  const truckWeighmentCharges = totalTrucks * FINANCE_RATES.TRUCK_WEIGHMENT_CHARGE;
  
  const total = terminalCharges + handlingCharges + berthingCharges + mooringCharges + truckEntryCharges + truckWeighmentCharges;
  
  return {
    terminalCharges,
    handlingCharges,
    berthingCharges,
    mooringCharges,
    truckEntryCharges,
    truckWeighmentCharges,
    total,
    qty,
    berthingSlots,
    mooringSlots,
    totalTrucks
  };
};
