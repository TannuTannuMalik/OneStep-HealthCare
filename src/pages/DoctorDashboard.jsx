import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./DoctorDashboard.css";
import { api } from "../utils/api";
import { socket } from "../utils/socket";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const sidebarItems = [
    { key: "dashboard", icon: "▦" },
    { key: "calendar", icon: "🗓" },
    { key: "chat", icon: "💬" },
    { key: "stats", icon: "⏱" },
    { key: "settings", icon: "⚙" },
    { key: "logout", icon: "⎋" },
  ];

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const displayName = user?.fullName ? user.fullName : "Doctor";

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

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");
  const [photoErr, setPhotoErr] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [apptsErr, setApptsErr] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const selectedAppointment =
    appointments.find((a) => a.id === selectedAppointmentId) || null;

  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [improvementSuggestions, setImprovementSuggestions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [creatingReport, setCreatingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [reportErr, setReportErr] = useState("");

  const defaultImg =
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=60";

  const JOIN_WINDOW_MINUTES = 1;

  const canJoinVideoCall = (appointment) => {
    if (!appointment) return false;
    if (appointment.appointmentType !== "VIDEO") return false;
    if (appointment.status !== "CONFIRMED") return false;

    const now = new Date();
    const start = new Date(appointment.requestedStart);
    const end = new Date(appointment.requestedEnd);
    const joinWindowStart = new Date(
      start.getTime() - JOIN_WINDOW_MINUTES * 60 * 1000
    );

    return now >= joinWindowStart && now <= end;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) navigate("/login");
    if (user?.role !== "DOCTOR") navigate("/login");
  }, [navigate, user]);

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

  const loadAppointments = async () => {
    setApptsErr("");
    setLoadingAppts(true);
    try {
      const res = await api.get("/api/appointments/doctor/me");
      if (res.data.ok) {
        const list = res.data.data || [];
        setAppointments(list);

        if (list.length > 0) {
          setSelectedAppointmentId((prev) => {
            const stillExists = list.some((item) => item.id === prev);
            return stillExists ? prev : list[0].id;
          });
        } else {
          setSelectedAppointmentId(null);
        }
      } else {
        setApptsErr(res.data.error || "Failed to load appointments");
      }
    } catch (e) {
      setApptsErr(e.response?.data?.error || e.message);
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    socket.emit("join", { userId: user.id });

    const onStatus = () => {
      loadAppointments();
    };

    const onReport = () => {};

    socket.on("appointment_status", onStatus);
    socket.on("report_ready", onReport);

    return () => {
      socket.off("appointment_status", onStatus);
      socket.off("report_ready", onReport);
    };
  }, [user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAppointments((prev) => [...prev]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const onSidebarClick = (key) => {
    if (key === "logout") return handleLogout();
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
      if (res.data.ok) {
        setProfileMsg("Profile saved ✅ Patients can find you now.");
      } else {
        setProfileErr(res.data.error || "Save failed");
      }
    } catch (e2) {
      setProfileErr(e2.response?.data?.error || e2.message);
    } finally {
      setSavingProfile(false);
    }
  };

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
      formData.append("photo", photoFile);

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

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.patch(`/api/appointments/${appointmentId}/status`, { status });
      await loadAppointments();
      alert(`Appointment ${status} ✅`);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const markCompleted = async (appointmentId) => {
    await updateAppointmentStatus(appointmentId, "COMPLETED");
  };

  const confirmAppointment = async (appointmentId) => {
    await updateAppointmentStatus(appointmentId, "CONFIRMED");
  };

  const rejectAppointment = async (appointmentId) => {
    await updateAppointmentStatus(appointmentId, "REJECTED");
  };

  const createReport = async () => {
    setReportMsg("");
    setReportErr("");

    if (!selectedAppointment?.id) {
      setReportErr("Select an appointment first.");
      return;
    }

    if (selectedAppointment.status !== "COMPLETED") {
      setReportErr("Appointment must be COMPLETED before creating a report.");
      return;
    }

    try {
      setCreatingReport(true);

      const res = await api.post("/api/reports", {
        appointmentId: selectedAppointment.id,
        diagnosis,
        prescription,
        doctorNotes,
        improvementSuggestions,
        followUpDate: followUpDate || null,
      });

      if (res.data.ok) {
        setReportMsg("Report created ✅ PDF generated + saved.");
        setDiagnosis("");
        setPrescription("");
        setDoctorNotes("");
        setImprovementSuggestions("");
        setFollowUpDate("");
      } else {
        setReportErr(res.data.error || "Failed to create report");
      }
    } catch (e) {
      setReportErr(e.response?.data?.error || e.message);
    } finally {
      setCreatingReport(false);
    }
  };

  const totalAppts = appointments.length;

  return (
    <div className="doc-wrap">
      <div className="doc-shell">
        <div className="doc-app">
          <aside className="doc-sidebar">
            {sidebarItems.slice(0, 5).map((it) => (
              <button
                key={it.key}
                className="doc-sb-btn"
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
                <h3>Appointments</h3>
                <p className="doc-hero-big">{totalAppts}</p>
                <div style={{ opacity: 0.7 }}>
                  {loadingAppts
                    ? "Loading appointments..."
                    : apptsErr
                    ? apptsErr
                    : "From database ✅"}
                </div>
              </div>

              <div className="doc-hero-photo">
                <img
                  src={photoUrl || defaultImg}
                  alt="Doctor"
                  onError={(e) => (e.currentTarget.src = defaultImg)}
                />
              </div>
            </section>

            <section className="doc-bottom">
              <div className="doc-card">
                <div className="doc-card-title">
                  <h4>Patient List</h4>
                  <div className="doc-pill">Latest ▾</div>
                </div>

                {appointments.length === 0 ? (
                  <div style={{ opacity: 0.7, padding: 10 }}>
                    No appointments yet.
                  </div>
                ) : (
                  appointments.map((a) => {
                    const initials =
                      (a.patientName || "P")
                        .split(" ")
                        .slice(0, 2)
                        .map((x) => x[0]?.toUpperCase())
                        .join("") || "P";

                    return (
                      <div
                        key={a.id}
                        className={`patient-item ${
                          a.id === selectedAppointmentId ? "active" : ""
                        }`}
                        onClick={() => setSelectedAppointmentId(a.id)}
                      >
                        <div className="avatar">{initials}</div>

                        <div className="pmeta">
                          <div className="pname">{a.patientName}</div>
                          <div className="psub">
                            {a.appointmentType} • {a.status}
                          </div>
                        </div>

                        <div className="ptime">
                          {new Date(a.requestedStart).toLocaleString()}
                        </div>

                        {canJoinVideoCall(a) && (
                          <button
                            className="join-call-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/video-call/${a.id}`);
                            }}
                          >
                            📹 Join Call
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="doc-card">
                <div className="doc-card-title">
                  <h4>Consultation</h4>
                  <div className="doc-pill">Details</div>
                </div>

                {!selectedAppointment ? (
                  <div style={{ opacity: 0.7, padding: 10 }}>
                    Select an appointment to view details.
                  </div>
                ) : (
                  <>
                    <div className="consult-top">
                      <div className="consult-avatar">
                        {(selectedAppointment.patientName || "P")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900 }}>
                          {selectedAppointment.patientName}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {new Date(
                            selectedAppointment.requestedStart
                          ).toLocaleString()}{" "}
                          • {selectedAppointment.appointmentType}
                        </div>
                      </div>
                    </div>

                    <div className="note-box">
                      <b>Patient note:</b>{" "}
                      {selectedAppointment.patientNote
                        ? selectedAppointment.patientNote
                        : "—"}
                    </div>

                    <div className="note-box">
                      <b>Status:</b> {selectedAppointment.status}
                    </div>

                    {selectedAppointment.status === "REQUESTED" && (
                      <div
                        className="note-box"
                        style={{
                          marginTop: 10,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <b>Appointment Request Action</b>

                        <button
                          type="button"
                          onClick={() => confirmAppointment(selectedAppointment.id)}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "none",
                            background: "#0f7f7c",
                            color: "#fff",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          ✅ Confirm Appointment
                        </button>

                        <button
                          type="button"
                          onClick={() => rejectAppointment(selectedAppointment.id)}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "none",
                            background: "#b42318",
                            color: "#fff",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          ❌ Reject Appointment
                        </button>
                      </div>
                    )}

                    {selectedAppointment.appointmentType === "VIDEO" &&
                      selectedAppointment.status === "CONFIRMED" &&
                      !canJoinVideoCall(selectedAppointment) && (
                        <div className="note-box" style={{ marginTop: 10 }}>
                          Video call will be available {JOIN_WINDOW_MINUTES} minute
                          {JOIN_WINDOW_MINUTES > 1 ? "s" : ""} before the
                          appointment time.
                        </div>
                      )}

                    {canJoinVideoCall(selectedAppointment) && (
                      <div className="note-box" style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/video-call/${selectedAppointment.id}`)
                          }
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "#0f7f7c",
                            color: "#fff",
                            fontWeight: 900,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          📹 Start / Join Video Call
                        </button>
                      </div>
                    )}

                    <div className="note-box" style={{ marginTop: 10 }}>
                      <b>Create Consultation Report</b>

                      <div style={{ marginTop: 10 }}>
                        <Link
                          to={`/doctor/report/${selectedAppointment.id}`}
                          style={{
                            display: "inline-block",
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "#222",
                            color: "white",
                            fontWeight: 900,
                            textDecoration: "none",
                          }}
                        >
                          Open Full Report Page
                        </Link>
                      </div>

                      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={() => markCompleted(selectedAppointment.id)}
                          disabled={selectedAppointment.status !== "CONFIRMED"}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background:
                              selectedAppointment.status !== "CONFIRMED"
                                ? "#f5f5f5"
                                : "#fff",
                            fontWeight: 800,
                            cursor:
                              selectedAppointment.status !== "CONFIRMED"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {selectedAppointment.status === "COMPLETED"
                            ? "Already COMPLETED ✅"
                            : "Mark Appointment as COMPLETED"}
                        </button>

                        <input
                          placeholder="Diagnosis"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                          }}
                        />

                        <input
                          placeholder="Prescription"
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                          }}
                        />

                        <textarea
                          placeholder="Doctor Notes"
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          rows={3}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                          }}
                        />

                        <textarea
                          placeholder="Improvement Suggestions (important)"
                          value={improvementSuggestions}
                          onChange={(e) =>
                            setImprovementSuggestions(e.target.value)
                          }
                          rows={3}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                          }}
                        />

                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                          }}
                        />

                        <button
                          type="button"
                          onClick={createReport}
                          disabled={creatingReport}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "none",
                            background: "#0f7f7c",
                            color: "#fff",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          {creatingReport
                            ? "Creating..."
                            : "Create Report + Generate PDF"}
                        </button>

                        {reportMsg && (
                          <div style={{ color: "green", fontWeight: 800 }}>
                            {reportMsg}
                          </div>
                        )}
                        {reportErr && (
                          <div style={{ color: "crimson", fontWeight: 800 }}>
                            {reportErr}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </main>

          <aside className="doc-right">
            <div className="right-top">
              <button className="icon-btn" title="Messages">
                💬
              </button>
              <button className="icon-btn" title="Notifications">
                🔔
              </button>

              <div className="profile">
                <img
                  src={photoUrl || defaultImg}
                  alt="Profile"
                  onError={(e) => (e.currentTarget.src = defaultImg)}
                />
                <div style={{ fontWeight: 800, fontSize: 13 }}>
                  Dr. {displayName}
                </div>
              </div>
            </div>

            <div className="news" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 900 }}>
                PROFILE PHOTO
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

                {photoMsg && (
                  <div style={{ color: "green", fontWeight: 700 }}>
                    {photoMsg}
                  </div>
                )}
                {photoErr && (
                  <div style={{ color: "red", fontWeight: 700 }}>{photoErr}</div>
                )}
              </div>
            </div>

            <div className="news" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 900 }}>
                DOCTOR PROFILE
              </div>

              {loadingProfile ? (
                <p style={{ marginTop: 10 }}>Loading profile...</p>
              ) : (
                <form
                  onSubmit={saveProfile}
                  style={{ display: "grid", gap: 10, marginTop: 10 }}
                >
                  <input
                    name="specialty"
                    placeholder="Specialty (e.g., General Physician)"
                    value={profile.specialty}
                    onChange={onProfileChange}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
                  />

                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    placeholder="Experience (years)"
                    value={profile.experienceYears}
                    onChange={onProfileChange}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
                  />

                  <input
                    name="location"
                    placeholder="Location (e.g., Auckland)"
                    value={profile.location}
                    onChange={onProfileChange}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
                  />

                  <textarea
                    name="bio"
                    placeholder="Short bio"
                    value={profile.bio}
                    onChange={onProfileChange}
                    rows={3}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
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

                  {profileMsg && (
                    <div style={{ color: "green", fontWeight: 700 }}>
                      {profileMsg}
                    </div>
                  )}
                  {profileErr && (
                    <div style={{ color: "red", fontWeight: 700 }}>
                      {profileErr}
                    </div>
                  )}
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}