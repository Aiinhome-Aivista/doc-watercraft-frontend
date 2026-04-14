import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { calculateInvoice } from './utils/calculations';
import { Button, Modal } from '@/components/ui';

const FinancePage: React.FC = () => {
  const vessels = useAppSelector((state) => state.vessels.items);
  const entries = useAppSelector((state) => state.vehicles.entries);
  
  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  const completedVessels = vessels.filter(v => v.status === 'COMPLETED' || v.status === 'MOORED');

  const fmtRs = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">FINANCIALS & MIS REPORTS</span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
         <div className="relative overflow-hidden border border-slate-800 bg-slate-950 p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-emerald-400">
            <div className="text-[32px] font-bold leading-none text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(vessels.length * 250000)}</div>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Total Projected Revenue</div>
            <div className="absolute right-3 top-3 text-xl opacity-20"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>payments</span></div>
          </div>
          <div className="relative overflow-hidden border border-slate-800 bg-slate-950 p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-cyan-400">
            <div className="text-[32px] font-bold leading-none text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{vessels.filter(v => v.status === 'COMPLETED').length}</div>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Invoices Generated</div>
            <div className="absolute right-3 top-3 text-xl opacity-20"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>receipt_long</span></div>
          </div>
      </div>

      <div className="overflow-x-auto border border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
           <span className="text-base font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">VESSEL BILLING OVERVIEW</span>
        </div>
        <table className="w-full min-w-[720px] border-collapse [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-normal [&_th]:uppercase [&_th]:tracking-[0.15em] [&_th]:text-slate-500 [&_th]:[font-family:'IBM_Plex_Mono',monospace] [&_thead_tr]:border-b [&_thead_tr]:border-slate-800 [&_td]:border-b [&_td]:border-slate-800 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-[13px] [&_td]:text-slate-300 [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover_td]:bg-white/[0.02]">
          <thead>
            <tr>
              <th>Vessel</th>
              <th>Qty (MT)</th>
              <th>Trucks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {completedVessels.map(v => (
              <tr key={v.id}>
                <td className="font-medium text-slate-100">{v.vessel_name}</td>
                <td>{v.survey_quantity || v.quantity}</td>
                <td>{entries.filter(e => e.vessel_id === v.id).length}</td>
                <td>
                  <span className={`inline-block border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-[0.05em] [font-family:'IBM_Plex_Mono',monospace] ${v.status === 'COMPLETED' ? 'text-emerald-300' : 'text-cyan-300'}`}>
                    {v.status}
                  </span>
                </td>
                <td>
                  <Button variant="light" size="sm" onClick={() => setSelectedVessel(v)}>GENERATE INVOICE</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVessel && (
        <Modal title={`INVOICE — ${selectedVessel.vessel_name}`} onClose={() => setSelectedVessel(null)}>
          {(() => {
            const bill = calculateInvoice(selectedVessel, entries.filter(e => e.vessel_id === selectedVessel.id).length);
            return (
              <div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="border border-slate-800 bg-slate-900 p-3.5">
                    <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Terminal Charges</div>
                    <div className="text-2xl font-bold text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(bill.terminalCharges)}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">{bill.qty} MT @ ₹45.42</div>
                  </div>
                  <div className="border border-slate-800 bg-slate-900 p-3.5">
                    <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Handling Charges</div>
                    <div className="text-2xl font-bold text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(bill.handlingCharges)}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">{bill.qty} MT @ ₹167.65</div>
                  </div>
                  <div className="border border-slate-800 bg-slate-900 p-3.5">
                     <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Berthing ({bill.berthingSlots} slots)</div>
                     <div className="text-2xl font-bold text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(bill.berthingCharges)}</div>
                  </div>
                  <div className="border border-slate-800 bg-slate-900 p-3.5">
                     <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Mooring ({bill.mooringSlots} slots)</div>
                     <div className="text-2xl font-bold text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(bill.mooringCharges)}</div>
                  </div>
                  <div className="border border-slate-800 bg-slate-900 p-3.5">
                     <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Truck Entry ({bill.totalTrucks})</div>
                     <div className="text-2xl font-bold text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(bill.truckEntryCharges)}</div>
                  </div>
                  <div className="border border-slate-800 bg-slate-900 p-3.5">
                     <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Truck Weighment ({bill.totalTrucks})</div>
                     <div className="text-2xl font-bold text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(bill.truckWeighmentCharges)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border border-cyan-600 bg-slate-950 p-4">
                  <span className="text-lg font-bold text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">TOTAL INVOICE AMOUNT</span>
                  <span className="text-[28px] font-extrabold text-cyan-300 [font-family:'Barlow_Condensed',sans-serif]">{fmtRs(bill.total)}</span>
                </div>
                <div className="mt-5">
                  <Button className="w-full">PRINT INVOICE</Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </>
  );
};

export default FinancePage;
