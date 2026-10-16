import { useCallback, useEffect, useMemo, useState } from "react";
import API from "./api.js";
import AppointmentModal from "./AppointmentModal.jsx";

const SIDEBAR_TABS = [
  { key: "appointments", label: "Appointments" },
  { key: "doctors", label: "Doctors" },
  { key: "departments", label: "Departments" },
  { key: "reports", label: "Reports" },
];

const STATUS_TABS = [
  { key: "all", label: "All visits" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
  });
  const [sidebarTab, setSidebarTab] = useState("appointments");
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setBackendError("");
    try {
      const [rows, summary] = await Promise.all([API.list("all"), API.stats()]);
      setAppointments(rows);
      setStats(summary);
    } catch (err) {
      setBackendError(
        "Cannot reach the CareDesk backend. Check the API service and /api proxy.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Appointments view filtering
  const visibleAppointments = useMemo(() => {
    let list = appointments;
    if (statusTab !== "all") {
      list = list.filter((a) => a.status === statusTab);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) =>
      [a.patient_name, a.doctor_name, a.department, a.reason].some((f) =>
        String(f ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [appointments, statusTab, search]);

  // Doctors view data
  const doctors = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const name = (a.doctor_name || "").trim();
      if (!name) continue;
      if (!map.has(name)) {
        map.set(name, {
          name,
          departments: new Set(),
          total: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0,
        });
      }
      const doc = map.get(name);
      if (a.department) doc.departments.add(a.department.trim());
      doc.total += 1;
      if (a.status === "scheduled") doc.scheduled += 1;
      else if (a.status === "completed") doc.completed += 1;
      else if (a.status === "cancelled") doc.cancelled += 1;
    }
    return Array.from(map.values())
      .map((doc) => ({
        ...doc,
        department: Array.from(doc.departments).join(", ") || "General",
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [appointments]);

  const visibleDoctors = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q),
    );
  }, [doctors, doctorSearch]);

  // Departments view data
  const departments = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const deptName = (a.department || "General").trim();
      if (!deptName) continue;
      if (!map.has(deptName)) {
        map.set(deptName, {
          name: deptName,
          total: 0,
          scheduled: 0,
          completed: 0,
          cancelled: 0,
          doctors: new Set(),
        });
      }
      const dept = map.get(deptName);
      dept.total += 1;
      if (a.doctor_name) dept.doctors.add(a.doctor_name.trim());
      if (a.status === "scheduled") dept.scheduled += 1;
      else if (a.status === "completed") dept.completed += 1;
      else if (a.status === "cancelled") dept.cancelled += 1;
    }
    const totalAll = appointments.length || 1;
    return Array.from(map.values())
      .map((dept) => ({
        ...dept,
        doctorCount: dept.doctors.size,
        share: Math.round((dept.total / totalAll) * 100),
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [appointments]);

  // Reports view data
  const urgentCount = useMemo(() => {
    return appointments.filter((a) => a.priority === "urgent").length;
  }, [appointments]);

  const urgentAppointments = useMemo(() => {
    return appointments.filter((a) => a.priority === "urgent");
  }, [appointments]);

  const headerInfo = useMemo(() => {
    switch (sidebarTab) {
      case "doctors":
        return {
          title: "Doctors",
          subtitle:
            "Overview of hospital doctors, their primary departments, and appointment load.",
        };
      case "departments":
        return {
          title: "Departments",
          subtitle:
            "Distribution of appointments and workload across medical departments.",
        };
      case "reports":
        return {
          title: "Reports",
          subtitle:
            "Summary metrics, appointment volumes, and urgent care indicators.",
        };
      case "appointments":
      default:
        return {
          title: "Appointment bookings",
          subtitle:
            "Schedule, track and complete patient visits across departments.",
        };
    }
  }, [sidebarTab]);

  async function handleSave(payload) {
    setSaving(true);
    try {
      if (modal?.mode === "edit") await API.update(modal.item.id, payload);
      else await API.create(payload);
      setModal(null);
      await refresh();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this appointment permanently?")) return;
    try {
      await API.remove(id);
      await refresh();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  async function quickStatus(item, next) {
    try {
      await API.update(item.id, { status: next });
      await refresh();
    } catch (err) {
      alert(`Status change failed: ${err.message}`);
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-cross" aria-hidden="true">⋆˚࿔</span>
          <span>CareDesk</span>
        </div>
        <p className="brand-sub">City Care Hospital Center</p>
        <p className="nav-caption">YOUR WORKSPACE</p>
        <nav>
          {SIDEBAR_TABS.map((t) => (
            <button
              key={t.key}
              className={`nav-item ${sidebarTab === t.key ? "active" : ""}`}
              onClick={() => setSidebarTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="side-card">
          <strong>Today&apos;s load</strong>
          <span className="side-big">{stats.today}</span>
          <span>visits on the calendar</span>
          <span className="side-flourish" aria-hidden="true">⋆˚꩜｡</span>
        </div>
        <div className="owner-card">
          <span className="owner-monogram" aria-hidden="true">AT</span>
          <div><strong>Ankita Tripathi</strong><span>24bcs10062</span></div>
          <a href="mailto:ankita.24bcs10062@sst.scaler.com">ankita.24bcs10062@sst.scaler.com</a>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">ANKITA'S CLINIC DASHBOARD <span aria-hidden="true">⋆˚꩜｡</span></p>
            <h1>{headerInfo.title}</h1>
            <p>{headerInfo.subtitle}</p>
          </div>
          <button
            className="btn primary"
            onClick={() => setModal({ mode: "create" })}
          >
            <span aria-hidden="true">⋆˚࿔</span> New Appointment
          </button>
        </header>

        {loading ? (
          <section className="table-card">
            <p className="state">Loading {sidebarTab}...</p>
          </section>
        ) : backendError ? (
          <section className="table-card">
            <div className="state error">
              <p>{backendError}</p>
              <button className="btn ghost" onClick={refresh}>
                Retry
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* View 1: Appointments */}
            {sidebarTab === "appointments" && (
              <>
                <section className="kpis">
                  <Kpi
                    label="Total appointments"
                    value={stats.total}
                    accent="teal"
                  />
                  <Kpi
                    label="Scheduled"
                    value={stats.scheduled}
                    accent="blue"
                  />
                  <Kpi
                    label="Completed"
                    value={stats.completed}
                    accent="green"
                  />
                  <Kpi
                    label="Cancelled"
                    value={stats.cancelled}
                    accent="rose"
                  />
                </section>

                <section className="toolbar">
                  <div className="tabs">
                    {STATUS_TABS.map((t) => (
                      <button
                        key={t.key}
                        className={statusTab === t.key ? "tab active" : "tab"}
                        onClick={() => setStatusTab(t.key)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="search"
                    aria-label="Search appointments"
                    placeholder="Search patient, doctor, department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </section>

                <section className="table-card">
                  {visibleAppointments.length === 0 ? (
                    <p className="state">
                      No appointments match this view yet. Book the first visit!
                    </p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Department</th>
                          <th>Visit</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th className="actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleAppointments.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <strong>{a.patient_name}</strong>
                              <span className="muted">{a.reason || "-"}</span>
                            </td>
                            <td>{a.doctor_name}</td>
                            <td>{a.department}</td>
                            <td>{formatWhen(a.appointment_time)}</td>
                            <td>
                              <span className={`badge st-${a.status}`}>
                                {a.status}
                              </span>
                            </td>
                            <td>
                              <span className={`badge pr-${a.priority}`}>
                                {a.priority}
                              </span>
                            </td>
                            <td className="actions">
                              <button
                                className="link"
                                onClick={() =>
                                  setModal({ mode: "edit", item: a })
                                }
                              >
                                Edit
                              </button>
                              {a.status === "scheduled" && (
                                <button
                                  className="link ok"
                                  onClick={() => quickStatus(a, "completed")}
                                >
                                  Complete
                                </button>
                              )}
                              {a.status === "scheduled" && (
                                <button
                                  className="link warn"
                                  onClick={() => quickStatus(a, "cancelled")}
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                className="link danger"
                                onClick={() => handleDelete(a.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}

            {/* View 2: Doctors */}
            {sidebarTab === "doctors" && (
              <>
                <section className="kpis">
                  <Kpi
                    label="Total doctors"
                    value={doctors.length}
                    accent="teal"
                  />
                  <Kpi
                    label="Scheduled visits"
                    value={stats.scheduled}
                    accent="blue"
                  />
                  <Kpi
                    label="Completed visits"
                    value={stats.completed}
                    accent="green"
                  />
                  <Kpi
                    label="Active doctors"
                    value={doctors.filter((d) => d.scheduled > 0).length}
                    accent="rose"
                  />
                </section>

                <section className="toolbar">
                  <div className="tabs">
                    <span className="count-label">
                      {visibleDoctors.length}{" "}
                      {visibleDoctors.length === 1 ? "doctor" : "doctors"} on
                      record
                    </span>
                  </div>
                  <input
                    className="search"
                    aria-label="Search doctors"
                    placeholder="Search doctor or department..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                </section>

                <section className="table-card">
                  {visibleDoctors.length === 0 ? (
                    <p className="state">
                      No doctors found. Book an appointment to register a
                      doctor!
                    </p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Department</th>
                          <th>Total Appointments</th>
                          <th>Scheduled</th>
                          <th>Completed</th>
                          <th>Cancelled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleDoctors.map((doc) => (
                          <tr key={doc.name}>
                            <td>
                              <strong>{doc.name}</strong>
                            </td>
                            <td>
                              <span className="badge pr-normal">
                                {doc.department}
                              </span>
                            </td>
                            <td>
                              <strong>{doc.total}</strong>
                            </td>
                            <td>
                              <span className="badge st-scheduled">
                                {doc.scheduled}
                              </span>
                            </td>
                            <td>
                              <span className="badge st-completed">
                                {doc.completed}
                              </span>
                            </td>
                            <td>
                              <span className="badge st-cancelled">
                                {doc.cancelled}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}

            {/* View 3: Departments */}
            {sidebarTab === "departments" && (
              <>
                <section className="kpis">
                  <Kpi
                    label="Total departments"
                    value={departments.length}
                    accent="teal"
                  />
                  <Kpi
                    label="Total appointments"
                    value={stats.total}
                    accent="blue"
                  />
                  <Kpi
                    label="Scheduled visits"
                    value={stats.scheduled}
                    accent="green"
                  />
                  <Kpi
                    label="Completed visits"
                    value={stats.completed}
                    accent="rose"
                  />
                </section>

                <section className="table-card">
                  {departments.length === 0 ? (
                    <p className="state">
                      No department activity recorded yet.
                    </p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Appointments</th>
                          <th>Share of Total</th>
                          <th>Staff Doctors</th>
                          <th>Scheduled</th>
                          <th>Completed</th>
                          <th>Cancelled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map((dept) => (
                          <tr key={dept.name}>
                            <td>
                              <strong>{dept.name}</strong>
                            </td>
                            <td>
                              <strong>{dept.total}</strong>
                            </td>
                            <td style={{ minWidth: "180px" }}>
                              <div className="share-cell">
                                <div className="share-bar-track">
                                  <div
                                    className="share-bar-fill"
                                    style={{
                                      width: `${Math.max(dept.share, dept.total > 0 ? 5 : 0)}%`,
                                    }}
                                  />
                                </div>
                                <span className="share-label">
                                  {dept.share}%
                                </span>
                              </div>
                            </td>
                            <td>{dept.doctorCount}</td>
                            <td>
                              <span className="badge st-scheduled">
                                {dept.scheduled}
                              </span>
                            </td>
                            <td>
                              <span className="badge st-completed">
                                {dept.completed}
                              </span>
                            </td>
                            <td>
                              <span className="badge st-cancelled">
                                {dept.cancelled}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}

            {/* View 4: Reports */}
            {sidebarTab === "reports" && (
              <>
                <section className="kpis kpis-6">
                  <Kpi
                    label="Total appointments"
                    value={stats.total}
                    accent="teal"
                  />
                  <Kpi
                    label="Scheduled"
                    value={stats.scheduled}
                    accent="blue"
                  />
                  <Kpi
                    label="Completed"
                    value={stats.completed}
                    accent="green"
                  />
                  <Kpi
                    label="Cancelled"
                    value={stats.cancelled}
                    accent="rose"
                  />
                  <Kpi
                    label="Today's visits"
                    value={stats.today}
                    accent="teal"
                  />
                  <Kpi
                    label="Urgent appointments"
                    value={urgentCount}
                    accent="rose"
                  />
                </section>

                <section className="table-card">
                  <div className="report-section-header">
                    <h3 style={{ margin: 0, fontSize: "16px" }}>
                      Urgent Priority Appointments
                    </h3>
                    <span className="badge pr-urgent">
                      {urgentCount} Urgent
                    </span>
                  </div>
                  {urgentAppointments.length === 0 ? (
                    <p className="state">
                      No urgent priority appointments currently flagged.
                    </p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Department</th>
                          <th>Visit</th>
                          <th>Status</th>
                          <th>Reason</th>
                          <th className="actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {urgentAppointments.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <strong>{a.patient_name}</strong>
                            </td>
                            <td>{a.doctor_name}</td>
                            <td>{a.department}</td>
                            <td>{formatWhen(a.appointment_time)}</td>
                            <td>
                              <span className={`badge st-${a.status}`}>
                                {a.status}
                              </span>
                            </td>
                            <td>
                              <span className="muted" style={{ margin: 0 }}>
                                {a.reason || "-"}
                              </span>
                            </td>
                            <td className="actions">
                              <button
                                className="link"
                                onClick={() =>
                                  setModal({ mode: "edit", item: a })
                                }
                              >
                                Edit
                              </button>
                              {a.status === "scheduled" && (
                                <button
                                  className="link ok"
                                  onClick={() => quickStatus(a, "completed")}
                                >
                                  Complete
                                </button>
                              )}
                              {a.status === "scheduled" && (
                                <button
                                  className="link warn"
                                  onClick={() => quickStatus(a, "cancelled")}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}
          </>
        )}
        <footer className="page-footer"><span>CareDesk / Ankita Tripathi</span><span aria-hidden="true">⋆˚꩜｡</span></footer>
      </div>

      {modal && (
        <AppointmentModal
          initial={modal.mode === "edit" ? modal.item : null}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div className={`kpi kpi-${accent}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </div>
  );
}

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
