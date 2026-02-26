import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorDashboard.css";
import { api } from "../utils/api";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  // Sidebar items
  const sidebarItems = [
    { key: "dashboard", icon: "▦" },
    { key: "calendar", icon: "🗓" },
    { key: "chat", icon: "💬" },
    { key: "stats", icon: "⏱" },
    { key: "settings", icon: "⚙" },
    { key: "logout", icon: "⎋" },
  ];

  // Demo patients (keep until appointments module)
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

  // Logged in user
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // Doctor profile (from DB)
  const [profile, setProfile] = useState({
    specialty: "",
    experienceYears: 0,
    location: "",
    bio: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // ✅ Photo states
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");
  const [photoErr, setPhotoErr] = useState("");

  const defaultImg =
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=60";

  // Ensure only doctor can stay here
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) navigate("/login");
    if (user?.role !== "DOCTOR") navigate("/login");
  }, [navigate, user]);

  // Load doctor profile from backend
  useEffect(() => {
    const load = async () => {
      setProfileErr("");
      setProfileMsg("");
      setPhotoErr("");
      setPhotoMsg("");
      setLoadingProfile(true);
      try {
        const res = await api.get("/api/doctors/me");
        if (res.data.ok && res.data.doctor) {
          const d = res.data.doctor;
          setProfile({
            specialty: d.specialty || "",
            experienceYears: d.experienceYears || 0,
            location: d.location || "",
            bio: d.bio || "",
          });
          setPhotoUrl(d.photoUrl || "");
        }
      } catch (e) {
        setProfileErr(e.response?.data?.error || e.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const onSidebarClick = (key) => {
    if (key === "logout") return handleLogout();
    setActiveMenu(key);
  };

  const onProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({
      ...p,
      [name]: name === "experienceYears" ? Number(value) : value,
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileErr("");
    setProfileMsg("");
    setSavingProfile(true);

    try {
      const res = await api.post("/api/doctors/me", profile);
      if (res.data.ok) setProfileMsg("Profile saved ✅ Patients can find you now.");
      else setProfileErr(res.data.error || "Save failed");
    } catch (e2) {
      setProfileErr(e2.response?.data?.error || e2.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ✅ Upload / change doctor photo
  const uploadPhoto = async () => {
    setPhotoErr("");
    setPhotoMsg("");

    if (!photoFile) {
      setPhotoErr("Please choose an image first.");
      return;
    }

    try {
      setPhotoUploading(true);
      const formData = new FormData();
      formData.append("photo", photoFile); // ✅ must match upload.single("photo")

      const res = await api.post("/api/upload/doctor-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.ok) {
        setPhotoUrl(res.data.photoUrl);
        setPhotoMsg("Photo updated ✅");
        setPhotoFile(null);
      } else {
        setPhotoErr(res.data.error || "Upload failed");
      }
    } catch (e) {
      setPhotoErr(e.response?.data?.error || e.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const displayName = user?.fullName ? user.fullName : "Doctor";

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
                onClick={() => onSidebarClick(it.key)}
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
                onClick={() => onSidebarClick(it.key)}
                title={it.key}
              >
                {it.icon}
              </button>
            ))}
          </aside>

          {/* Main */}
          <main className="doc-main">
            <div className="doc-topbar">
              <div className="doc-search">
                <span style={{ opacity: 0.6 }}>🔎</span>
                <input placeholder="Search (demo)" />
              </div>
            </div>

            <div className="doc-greet">
              Good Morning <span>Dr. {displayName}</span>
            </div>

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

              <div className="doc-hero-photo">
                <img src={defaultImg} alt="Doctor" />
              </div>
            </section>

            <section className="doc-bottom">
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

              <div className="doc-card">
                <div className="doc-card-title">
                  <h4>Consultation</h4>
                  <div className="doc-pill">Details</div>
                </div>

                <div className="consult-top">
                  <div className="consult-avatar">{selectedPatient?.initials}</div>
                  <div>
                    <div style={{ fontWeight: 900 }}>{selectedPatient?.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Patient details will be dynamic in Week 5 (Appointments module).
                    </div>
                  </div>
                </div>

                <div className="chips">
                  <span className="chip">🤒 Fever</span>
                  <span className="chip">😷 Cough</span>
                  <span className="chip">🔥 Heart Burn</span>
                </div>

                <div className="note-box">
                  <b>Note:</b> This section is demo until appointments + symptom summary are connected.
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
                  src={photoUrl || defaultImg}
                  alt="Profile"
                  onError={(e) => (e.currentTarget.src = defaultImg)}
                />
                <div style={{ fontWeight: 800, fontSize: 13 }}>Dr. {displayName}</div>
              </div>
            </div>

            {/* ✅ Upload / Change Photo */}
            <div className="news" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 900 }}>PROFILE PHOTO</div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: 999, overflow: "hidden", border: "1px solid #ddd" }}>
                  <img
                    src={photoUrl || defaultImg}
                    alt="Doctor"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => (e.currentTarget.src = defaultImg)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900 }}>Dr. {displayName}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>Upload / Change your photo</div>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />

                <button
                  type="button"
                  onClick={uploadPhoto}
                  disabled={photoUploading}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    background: "#222",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {photoUploading ? "Uploading..." : "Upload Photo"}
                </button>

                {photoMsg && <div style={{ color: "green", fontWeight: 700 }}>{photoMsg}</div>}
                {photoErr && <div style={{ color: "red", fontWeight: 700 }}>{photoErr}</div>}
              </div>
            </div>

            {/* ✅ Doctor Profile (REAL DB CONNECTED) */}
            <div className="news" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 900 }}>DOCTOR PROFILE</div>

              {loadingProfile ? (
                <p style={{ marginTop: 10 }}>Loading profile...</p>
              ) : (
                <form onSubmit={saveProfile} style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <input
                    name="specialty"
                    placeholder="Specialty (e.g., General Physician)"
                    value={profile.specialty}
                    onChange={onProfileChange}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                  />

                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    placeholder="Experience (years)"
                    value={profile.experienceYears}
                    onChange={onProfileChange}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                  />

                  <input
                    name="location"
                    placeholder="Location (e.g., Auckland)"
                    value={profile.location}
                    onChange={onProfileChange}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                  />

                  <textarea
                    name="bio"
                    placeholder="Short bio"
                    value={profile.bio}
                    onChange={onProfileChange}
                    rows={3}
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                  />

                  <button
                    type="submit"
                    disabled={savingProfile}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "none",
                      background: "#0f7f7c",
                      color: "white",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>

                  {profileMsg && <div style={{ color: "green", fontWeight: 700 }}>{profileMsg}</div>}
                  {profileErr && <div style={{ color: "red", fontWeight: 700 }}>{profileErr}</div>}
                </form>
              )}
            </div>

            {/* Calendar + Upcoming demo */}
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
                {[...Array(3)].map((_, i) => (
                  <div key={`e${i}`} style={{ opacity: 0 }} className="cal-day">0</div>
                ))}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                  <div key={n} className={`cal-day ${[8, 14, 21].includes(n) ? "dot" : ""}`}>
                    {n}
                  </div>
                ))}
              </div>
            </div>

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
          </aside>
        </div>
      </div>
    </div>
  );
}