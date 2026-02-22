import { useMemo, useState } from "react";
import "./DoctorDashboard.css";

export default function DoctorDashboard() {
  const sidebarItems = [
    { key: "dashboard", icon: "▦" },
    { key: "calendar", icon: "🗓" },
    { key: "chat", icon: "💬" },
    { key: "stats", icon: "⏱" },
    { key: "settings", icon: "⚙" },
    { key: "logout", icon: "⎋" },
  ];

  const patients = useMemo(
    () => [
      { id: 1, name: "Stacy Mitchell", type: "Weekly Visit", time: "9:15 AM", initials: "SM" },
      { id: 2, name: "Amy Dunham", type: "Routine Checkup", time: "9:30 AM", initials: "AD" },
      { id: 3, name: "Demi Joan", type: "Report", time: "9:50 AM", initials: "DJ" },
      { id: 4, name: "Susan Myers", type: "Weekly Visit", time: "10:15 AM", initials: "SM" },
    ],
    []
  );

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0].id);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="doc-wrap">
      <div className="doc-shell">
        <div className="doc-app">
          {/* Sidebar */}
          <aside className="doc-sidebar">
            {sidebarItems.slice(0, 5).map((it) => (
              <button
                key={it.key}
                className={`doc-sb-btn ${activeMenu === it.key ? "active" : ""}`}
                onClick={() => setActiveMenu(it.key)}
                title={it.key}
              >
                {it.icon}
              </button>
            ))}

            <div className="doc-sb-spacer" />

            {sidebarItems.slice(5).map((it) => (
              <button
                key={it.key}
                className="doc-sb-btn"
                onClick={() => setActiveMenu(it.key)}
                title={it.key}
              >
                {it.icon}
              </button>
            ))}
          </aside>

          {/* Main */}
          <main className="doc-main">
            {/* Top search */}
            <div className="doc-topbar">
              <div className="doc-search">
                <span style={{ opacity: 0.6 }}>🔎</span>
                <input placeholder="Search" />
              </div>
            </div>

            {/* Greeting */}
            <div className="doc-greet">
              Good Morning <span>Dr. Tannu</span>
            </div>

            {/* Hero + Stats */}
            <section className="doc-hero">
              <div>
                <h3>Visits for Today</h3>
                <p className="doc-hero-big">104</p>

                <div className="doc-mini-cards">
                  <div className="doc-mini">
                    <div className="label">New Patients</div>
                    <div className="value">
                      40 <span className="trend trend-up">51% ↗</span>
                    </div>
                  </div>

                  <div className="doc-mini">
                    <div className="label">Old Patients</div>
                    <div className="value">
                      64 <span className="trend trend-down">20% ↘</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replace this image with your own later */}
              <div className="doc-hero-photo">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=60"
                  alt="Doctor"
                />
              </div>
            </section>

            {/* Bottom: Patient list + Consultation */}
            <section className="doc-bottom">
              {/* Patient List */}
              <div className="doc-card">
                <div className="doc-card-title">
                  <h4>Patient List</h4>
                  <div className="doc-pill">Today ▾</div>
                </div>

                {patients.map((p) => (
                  <div
                    key={p.id}
                    className={`patient-item ${p.id === selectedPatientId ? "active" : ""}`}
                    onClick={() => setSelectedPatientId(p.id)}
                  >
                    <div className="avatar">{p.initials}</div>
                    <div className="pmeta">
                      <div className="pname">{p.name}</div>
                      <div className="psub">{p.type}</div>
                    </div>
                    <div className="ptime">{p.time}</div>
                  </div>
                ))}
              </div>

              {/* Consultation */}
              <div className="doc-card">
                <div className="doc-card-title">
                  <h4>Consultation</h4>
                  <div className="doc-pill">Details</div>
                </div>

                <div className="consult-top">
                  <div className="consult-avatar">{selectedPatient?.initials}</div>
                  <div>
                    <div style={{ fontWeight: 900 }}>{selectedPatient?.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Male • 28 Years 3 Months (demo)</div>
                  </div>
                </div>

                <div className="chips">
                  <span className="chip">🤒 Fever</span>
                  <span className="chip">😷 Cough</span>
                  <span className="chip">🔥 Heart Burn</span>
                </div>

                <div className="small-row">
                  <span>Last Checked</span>
                  <span>Dr. Tannu • 21 Apr 2026</span>
                </div>

                <div className="note-box">
                  <b>Observation:</b> High fever and cough; patient reports tiredness. <br />
                  <b>Prescription:</b> Paracetamol — 2 times a day (demo). <br />
                  <b>Next Step:</b> Book follow-up if symptoms continue.
                </div>
              </div>
            </section>
          </main>

          {/* Right panel */}
          <aside className="doc-right">
            <div className="right-top">
              <button className="icon-btn" title="Messages">💬</button>
              <button className="icon-btn" title="Notifications">🔔</button>

              <div className="profile">
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=60"
                  alt="Profile"
                />
                <div style={{ fontWeight: 800, fontSize: 13 }}>Dr. Tannu</div>
              </div>
            </div>

            {/* Calendar */}
            <div className="calendar">
              <div className="cal-head">
                <b>Calendar</b>
                <span style={{ opacity: 0.7 }}>September 2026</span>
              </div>

              <div className="cal-grid" style={{ opacity: 0.7, marginTop: 10 }}>
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                  <div key={d} style={{ fontWeight: 700 }}>{d}</div>
                ))}
              </div>

              <div className="cal-grid">
                {[...Array(3)].map((_, i) => <div key={`e${i}`} style={{ opacity: 0 }} className="cal-day">0</div>)}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                  <div key={n} className={`cal-day ${[8, 14, 21].includes(n) ? "dot" : ""}`}>
                    {n}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming */}
            <div className="upcoming">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b>Upcoming</b>
                <span style={{ fontSize: 12, color: "#0f7f7c", fontWeight: 800, cursor: "pointer" }}>
                  View All
                </span>
              </div>

              <div className="up-row">
                <div className="up-badge">M</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>Monthly doctor's meet</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>8 April, 2026 • 04:00 PM</div>
                </div>
              </div>
            </div>

            {/* News */}
            <div className="news">
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 900 }}>DAILY READ</div>
              <div style={{ fontWeight: 900, marginTop: 6 }}>
                Equitable medical education with efforts toward real change
              </div>
              <div className="news-img" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}