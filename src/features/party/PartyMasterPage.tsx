import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';

const PartyMasterPage: React.FC = () => {
  const [form, setForm] = useState({
    partyName: '',
    partyCode: '',
    address: '',
    state: '',
    country: '',
    pincode: '',
  });

  const [mobiles, setMobiles] = useState<string[]>(['']);
  const [emails, setEmails] = useState<string[]>(['']);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleMobileChange = (index: number, value: string) => {
    const newMobiles = [...mobiles];
    newMobiles[index] = value;
    setMobiles(newMobiles);
    if (errors[`mobile_${index}`] || errors.mobiles) {
      const newErrors = { ...errors };
      delete newErrors[`mobile_${index}`];
      delete newErrors.mobiles;
      setErrors(newErrors);
    }
  };

  const addMobile = () => setMobiles([...mobiles, '']);
  const removeMobile = (index: number) => {
    const newMobiles = mobiles.filter((_, i) => i !== index);
    setMobiles(newMobiles.length ? newMobiles : ['']);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    if (errors[`email_${index}`] || errors.emails) {
      const newErrors = { ...errors };
      delete newErrors[`email_${index}`];
      delete newErrors.emails;
      setErrors(newErrors);
    }
  };

  const addEmail = () => setEmails([...emails, '']);
  const removeEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.length ? newEmails : ['']);
  };

  const handleSave = () => {
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!form.partyName.trim()) newErrors.partyName = 'Party Name is required';
    if (!form.partyCode.trim()) newErrors.partyCode = 'Party Code is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.country.trim()) newErrors.country = 'Country is required';
    
    if (!form.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{4,10}$/.test(form.pincode.trim())) {
      newErrors.pincode = 'Invalid pincode (4-10 digits)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/; // Standard 10 digit Indian layout 

    const formMobiles = mobiles.map(m => m.trim()).filter(m => m !== '');
    if (formMobiles.length === 0) {
      newErrors.mobiles = 'At least one valid mobile number is required';
    } else {
      mobiles.forEach((m, idx) => {
        if (m.trim() !== '' && !mobileRegex.test(m.trim())) {
          newErrors[`mobile_${idx}`] = 'Invalid mobile number (10 digits expected)';
        }
      });
    }

    const formEmails = emails.map(e => e.trim()).filter(e => e !== '');
    if (formEmails.length === 0) {
      newErrors.emails = 'At least one valid email address is required';
    } else {
      emails.forEach((e, idx) => {
        if (e.trim() !== '' && !emailRegex.test(e.trim())) {
          newErrors[`email_${idx}`] = 'Invalid email address format';
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert('Please fix the validation errors', 'error');
      return;
    }

    const payload = {
      ...form,
      mobiles: formMobiles,
      emails: formEmails,
    };

    console.log('Saving Party Master:', payload);
    showAlert('Party Master saved successfully (Mock)');
    
    // Clear form
    setForm({
      partyName: '',
      partyCode: '',
      address: '',
      state: '',
      country: '',
      pincode: '',
    });
    setMobiles(['']);
    setEmails(['']);
    setErrors({});
  };

  return (
    <>
      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="section-head">
        <span className="section-title">ADD PARTY MASTER</span>
      </div>

      <div className="form-panel" style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div className="form-grid">
          <Input 
            label="Party Name *" 
            placeholder="Enter party name"
            value={form.partyName}
            onChange={(e) => handleChange('partyName', e.target.value)}
            error={errors.partyName}
          />
          <Input 
            label="Party Code *" 
            placeholder="Enter party code"
            value={form.partyCode}
            onChange={(e) => handleChange('partyCode', e.target.value)}
            error={errors.partyCode}
          />
          
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Address *</label>
            <textarea 
              className={`form-input ${errors.address ? 'input-error' : ''}`} 
              placeholder="Enter address"
              rows={3}
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
            {errors.address && <span className="error-text" style={{ color: '#e63946', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.address}</span>}
          </div>

          <Input 
            label="State *" 
            placeholder="Enter state"
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
            error={errors.state}
          />
          <Input 
            label="Country *" 
            placeholder="Enter country"
            value={form.country}
            onChange={(e) => handleChange('country', e.target.value)}
            error={errors.country}
          />
          <Input 
            label="Pincode *" 
            placeholder="Enter pincode"
            value={form.pincode}
            onChange={(e) => handleChange('pincode', e.target.value)}
            error={errors.pincode}
          />
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {/* Mobile Numbers Section */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ marginBottom: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Contact Details (Mobile) *</div>
            {errors.mobiles && <div style={{ color: '#e63946', fontSize: '0.8rem', marginBottom: '8px' }}>{errors.mobiles}</div>}
            {mobiles.map((mobile, idx) => (
              <div key={`mob-${idx}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <Input 
                  placeholder={`Mobile ${idx + 1}`}
                  value={mobile}
                  onChange={(e) => handleMobileChange(idx, e.target.value)}
                  style={{ flex: 1, minWidth: '200px' }}
                  error={errors[`mobile_${idx}`]}
                />
                {mobiles.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeMobile(idx)} style={{ color: '#e63946', height: 'fit-content', marginTop: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addMobile} style={{ marginTop: '4px' }}>
               + ADD MOBILE
            </Button>
          </div>

          {/* Email IDs Section */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ marginBottom: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Contact Details (Email) *</div>
            {errors.emails && <div style={{ color: '#e63946', fontSize: '0.8rem', marginBottom: '8px' }}>{errors.emails}</div>}
            {emails.map((email, idx) => (
              <div key={`email-${idx}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <Input 
                  placeholder={`Email ${idx + 1}`}
                  value={email}
                  onChange={(e) => handleEmailChange(idx, e.target.value)}
                  style={{ flex: 1, minWidth: '200px' }}
                  error={errors[`email_${idx}`]}
                />
                {emails.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeEmail(idx)} style={{ color: '#e63946', height: 'fit-content', marginTop: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addEmail} style={{ marginTop: '4px' }}>
               + ADD EMAIL
            </Button>
          </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
           <Button variant="primary" onClick={handleSave}>SAVE PARTY MASTER</Button>
        </div>
      </div>
    </>
  );
};

export default PartyMasterPage;
