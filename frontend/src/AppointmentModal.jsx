import { useState } from 'react';

const DEPARTMENTS = ['General', 'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Ophthalmology', 'ENT', 'Dental'];

export default function AppointmentModal({ initial, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    patient_name: initial?.patient_name ?? '',
    doctor_name: initial?.doctor_name ?? '',
    department: initial?.department ?? 'General',
    reason: initial?.reason ?? '',
    appointment_time: initial ? toInputValue(initial.appointment_time) : defaultTime(),
    status: initial?.status ?? 'scheduled',
    priority: initial?.priority ?? 'normal',
  }));
  const [error, setError] = useState('');

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.patient_name.trim() || !form.doctor_name.trim()) {
      setError('Patient and doctor names are required.');
      return;
    }
    if (!form.appointment_time) {
      setError('Pick a date and time for the visit.');
      return;
    }
    setError('');
    onSave({ ...form, appointment_time: new Date(form.appointment_time).toISOString() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{initial ? 'Reschedule appointment' : 'Book new appointment'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <label>Patient name<input value={form.patient_name} onChange={(e) => set('patient_name', e.target.value)} placeholder="e.g. Aarav Sharma" /></label>
            <label>Doctor<input value={form.doctor_name} onChange={(e) => set('doctor_name', e.target.value)} placeholder="e.g. Dr. Nisha Rao" /></label>
          </div>
          <div className="grid-2">
            <label>Department
              <select value={form.department} onChange={(e) => set('department', e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>Visit date &amp; time<input type="datetime-local" value={form.appointment_time} onChange={(e) => set('appointment_time', e.target.value)} /></label>
          </div>
          <label>Reason for visit<textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} rows={3} placeholder="Symptoms, follow-up details…" /></label>
          <div className="grid-2">
            <label>Status
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>Priority
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Book appointment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultTime() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return toInputValue(d.toISOString());
}
