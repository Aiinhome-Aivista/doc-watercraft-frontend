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
      <div className="section-head">
        <span className="section-title">FINANCIALS & MIS REPORTS</span>
      </div>

      <div className="stat-grid">
         <div className="stat-card" style={{ "--accent-color": "var(--green)" } as any}>
            <div className="stat-val">{fmtRs(vessels.length * 250000)}</div>
            <div className="stat-label">Total Projected Revenue</div>
            <div className="stat-badge"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>payments</span></div>
          </div>
          <div className="stat-card" style={{ "--accent-color": "var(--accent)" } as any}>
            <div className="stat-val">{vessels.filter(v => v.status === 'COMPLETED').length}</div>
            <div className="stat-label">Invoices Generated</div>
            <div className="stat-badge"><span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>receipt_long</span></div>
          </div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
           <span className="table-title">VESSEL BILLING OVERVIEW</span>
        </div>
        <table>
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
                <td className="td-primary">{v.vessel_name}</td>
                <td>{v.survey_quantity || v.quantity}</td>
                <td>{entries.filter(e => e.vessel_id === v.id).length}</td>
                <td><span className={`tag ${v.status === 'COMPLETED' ? 'text-green' : 'text-accent'}`}>{v.status}</span></td>
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
              <div className="billing-content">
                <div className="billing-grid">
                  <div className="billing-item">
                    <div className="billing-label">Terminal Charges</div>
                    <div className="billing-val">{fmtRs(bill.terminalCharges)}</div>
                    <div className="billing-sub">{bill.qty} MT @ ₹45.42</div>
                  </div>
                  <div className="billing-item">
                    <div className="billing-label">Handling Charges</div>
                    <div className="billing-val">{fmtRs(bill.handlingCharges)}</div>
                    <div className="billing-sub">{bill.qty} MT @ ₹167.65</div>
                  </div>
                  <div className="billing-item">
                     <div className="billing-label">Berthing ({bill.berthingSlots} slots)</div>
                     <div className="billing-val">{fmtRs(bill.berthingCharges)}</div>
                  </div>
                  <div className="billing-item">
                     <div className="billing-label">Mooring ({bill.mooringSlots} slots)</div>
                     <div className="billing-val">{fmtRs(bill.mooringCharges)}</div>
                  </div>
                  <div className="billing-item">
                     <div className="billing-label">Truck Entry ({bill.totalTrucks})</div>
                     <div className="billing-val">{fmtRs(bill.truckEntryCharges)}</div>
                  </div>
                  <div className="billing-item">
                     <div className="billing-label">Truck Weighment ({bill.totalTrucks})</div>
                     <div className="billing-val">{fmtRs(bill.truckWeighmentCharges)}</div>
                  </div>
                </div>
                <div className="billing-total">
                  <span className="billing-total-label">TOTAL INVOICE AMOUNT</span>
                  <span className="billing-total-val">{fmtRs(bill.total)}</span>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Button className="w-full" style={{ width: '100%' }}>PRINT INVOICE</Button>
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
