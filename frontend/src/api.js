const API = {
  async list(status) {
    const url = status && status !== 'all' ? `/api/appointments?status=${status}` : '/api/appointments';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`List failed (${res.status})`);
    return res.json();
  },
  async stats() {
    const res = await fetch('/api/appointments/stats');
    if (!res.ok) throw new Error(`Stats failed (${res.status})`);
    return res.json();
  },
  async create(payload) {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create failed (${res.status})`);
    return res.json();
  },
  async update(id, payload) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Update failed (${res.status})`);
    return res.json();
  },
  async remove(id) {
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(`Delete failed (${res.status})`);
  },
};

export default API;
