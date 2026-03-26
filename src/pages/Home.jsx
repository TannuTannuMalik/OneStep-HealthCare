import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.heroTextWrap}>
            <div style={styles.heroTag}>Trusted Digital Healthcare Platform</div>

            <h1 style={styles.h1}>
              Providing Quality Healthcare for a Brighter and Healthy Future
            </h1>

            <p style={styles.p}>
              OneStep HealthCare helps patients enter symptoms in simple language,
              then recommends suitable doctors based on availability, experience,
              and ratings.
            </p>

            <div style={styles.actions}>
              <Link to="/find-doctor" style={styles.primaryBtn}>
                Find a Doctor
              </Link>
              <Link to="/register" style={styles.secondaryBtn}>
                Sign Up
              </Link>
            </div>

            <div style={styles.heroMiniStats}>
              <MiniStat label="Doctors" value="150+" />
              <MiniStat label="Appointments" value="12k+" />
              <MiniStat label="Reports" value="Secure PDF" />
            </div>
          </div>

          <div style={styles.heroCard}>
            <div style={styles.heroBadge}>24/7 Support</div>

            <div style={styles.heroImageWrap}>
              <div style={styles.heroIconCircle}>👩‍⚕️</div>
              <div style={styles.heroImageContent}>
                <div style={styles.heroImageTitle}>Online Consultation</div>
                <div style={styles.heroImageText}>
                  Book appointments, connect with doctors, and access reports in
                  one secure place.
                </div>
              </div>
            </div>

            <div style={styles.heroBottomCards}>
              <div style={styles.smallInfoCard}>
                <div style={styles.smallInfoIcon}>🩺</div>
                <div>
                  <div style={styles.smallInfoTitle}>Verified Doctors</div>
                  <div style={styles.smallInfoText}>Experienced specialists</div>
                </div>
              </div>

              <div style={styles.smallInfoCard}>
                <div style={styles.smallInfoIcon}>📄</div>
                <div>
                  <div style={styles.smallInfoTitle}>Medical Reports</div>
                  <div style={styles.smallInfoText}>Download PDF anytime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.findBar}>
          <div style={styles.findTitle}>Find A Doctor</div>

          <div style={styles.findRow}>
            <input style={styles.input} placeholder="Name" />
            <input style={styles.input} placeholder="Specialty" />

            <label style={styles.toggleWrap}>
              <input type="checkbox" />
              <span>Available</span>
            </label>

            <Link to="/find-doctor" style={styles.searchBtn}>
              Search
            </Link>
          </div>
        </section>

        <section style={styles.stats}>
          <Stat value="99%" label="Customer satisfaction" icon="⭐" />
          <Stat value="15k" label="Online Patients" icon="🧑‍🤝‍🧑" />
          <Stat value="12k" label="Patients Recovered" icon="💚" />
          <Stat value="240%" label="Company growth" icon="📈" />
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Services we provide</h2>
          <p style={styles.p2}>
            Explore the most common services. (UI-only for now)
          </p>

          <div style={styles.cards}>
            <ServiceCard
              title="Dental treatments"
              icon="🦷"
              desc="Professional dental care and oral health consultation."
            />
            <ServiceCard
              title="Cardiology"
              icon="❤️"
              desc="Heart care support with specialist consultation."
            />
            <ServiceCard
              title="Surgery"
              icon="🏥"
              desc="Guidance and support for surgical appointments."
            />
            <ServiceCard
              title="Eye Care"
              icon="👁️"
              desc="Vision-related consultation and eye health support."
            />
            <ServiceCard
              title="Diagnosis"
              icon="🧪"
              desc="Find the right doctor based on your symptoms."
            />
            <ServiceCard
              title="Bone treatments"
              icon="🦴"
              desc="Orthopedic care for bones, joints, and mobility."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniStatValue}>{value}</div>
      <div style={styles.miniStatLabel}>{label}</div>
    </div>
  );
}

function Stat({ value, label, icon }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statTopRow}>
        <div style={styles.statIcon}>{icon}</div>
      </div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ServiceCard({ title, icon, desc }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardImg}>
        <span style={styles.cardIcon}>{icon}</span>
      </div>
      <div style={{ fontWeight: 900, marginTop: 12, fontSize: 16 }}>{title}</div>
      <div style={styles.cardText}>{desc}</div>
      <div style={styles.cardLink}>Learn more →</div>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(180deg, #f7fffe 0%, #ffffff 30%, #f8fafc 100%)",
    minHeight: "100vh",
  },

  main: {
    maxWidth: 1140,
    margin: "0 auto",
    padding: "24px 18px 28px",
  },

  hero: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 22,
    alignItems: "center",
    padding: "18px 0 24px",
  },

  heroTextWrap: {
    paddingRight: 8,
  },

  heroTag: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(15,127,124,0.10)",
    color: "#0f7f7c",
    fontWeight: 800,
    fontSize: 13,
    marginBottom: 14,
  },

  h1: {
    fontSize: 42,
    margin: 0,
    lineHeight: 1.12,
    color: "#0f172a",
    fontWeight: 900,
  },

  p: {
    marginTop: 14,
    lineHeight: 1.8,
    maxWidth: 640,
    color: "#475569",
    fontSize: 16,
  },

  actions: {
    marginTop: 18,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  primaryBtn: {
    textDecoration: "none",
    background: "#0f7f7c",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 14,
    fontWeight: 900,
    boxShadow: "0 10px 24px rgba(15,127,124,0.18)",
  },

  secondaryBtn: {
    textDecoration: "none",
    border: "1px solid rgba(15,127,124,0.18)",
    background: "#ffffff",
    color: "#222",
    padding: "12px 18px",
    borderRadius: 14,
    fontWeight: 900,
  },

  heroMiniStats: {
    marginTop: 22,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  miniStat: {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 16,
    padding: "12px 14px",
    minWidth: 120,
    boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
  },

  miniStatValue: {
    fontWeight: 900,
    color: "#0f7f7c",
    fontSize: 15,
  },

  miniStatLabel: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },

  heroCard: {
    background: "linear-gradient(135deg, #dff8f6 0%, #eef7ff 100%)",
    borderRadius: 28,
    padding: 18,
    position: "relative",
    minHeight: 340,
    boxShadow: "0 18px 40px rgba(15,127,124,0.12)",
    border: "1px solid rgba(15,127,124,0.08)",
  },

  heroBadge: {
    position: "absolute",
    right: 18,
    top: 18,
    background: "#fff",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 900,
    border: "1px solid rgba(0,0,0,0.08)",
    color: "#0f7f7c",
    fontSize: 13,
  },

  heroImageWrap: {
    marginTop: 34,
    background: "#ffffff",
    borderRadius: 24,
    minHeight: 190,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 20,
    border: "1px solid rgba(0,0,0,0.05)",
  },

  heroIconCircle: {
    width: 92,
    height: 92,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0f7f7c 0%, #34d399 100%)",
    display: "grid",
    placeItems: "center",
    fontSize: 42,
    color: "#fff",
    boxShadow: "0 14px 26px rgba(15,127,124,0.18)",
  },

  heroImageContent: {
    marginTop: 16,
  },

  heroImageTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#0f172a",
  },

  heroImageText: {
    marginTop: 8,
    color: "#64748b",
    lineHeight: 1.7,
    maxWidth: 310,
    fontSize: 14,
  },

  heroBottomCards: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  smallInfoCard: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "1px solid rgba(0,0,0,0.05)",
  },

  smallInfoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(15,127,124,0.10)",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
  },

  smallInfoTitle: {
    fontWeight: 800,
    fontSize: 14,
    color: "#0f172a",
  },

  smallInfoText: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },

  findBar: {
    background: "linear-gradient(135deg, #eef2ff 0%, #ecfeff 100%)",
    borderRadius: 20,
    padding: 18,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },

  findTitle: {
    fontWeight: 900,
    marginBottom: 12,
    fontSize: 18,
    color: "#0f172a",
  },

  findRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  input: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    minWidth: 170,
    outline: "none",
    background: "#fff",
    fontSize: 14,
  },

  toggleWrap: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontWeight: 800,
    fontSize: 13,
    color: "#333",
    background: "#fff",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
  },

  searchBtn: {
    textDecoration: "none",
    background: "#0f7f7c",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 900,
    boxShadow: "0 10px 24px rgba(15,127,124,0.16)",
  },

  stats: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
  },

  stat: {
    background: "#fff",
    borderRadius: 20,
    padding: 18,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },

  statTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "rgba(15,127,124,0.10)",
    display: "grid",
    placeItems: "center",
    fontSize: 20,
  },

  statValue: {
    fontWeight: 900,
    fontSize: 24,
    color: "#0f7f7c",
    marginTop: 12,
  },

  statLabel: {
    marginTop: 6,
    fontSize: 14,
    color: "#555",
  },

  section: {
    marginTop: 28,
  },

  h2: {
    margin: "0 0 8px 0",
    fontSize: 28,
    color: "#0f172a",
  },

  p2: {
    margin: "0 0 16px 0",
    color: "#64748b",
    fontSize: 15,
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 14,
  },

  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
    transition: "0.2s ease",
  },

  cardImg: {
    height: 120,
    borderRadius: 16,
    background: "linear-gradient(135deg, #ecfeff 0%, #eef2ff 100%)",
    display: "grid",
    placeItems: "center",
  },

  cardIcon: {
    fontSize: 42,
  },

  cardText: {
    marginTop: 8,
    fontSize: 13,
    color: "#555",
    lineHeight: 1.7,
  },

  cardLink: {
    marginTop: 12,
    fontWeight: 900,
    color: "#0f7f7c",
    fontSize: 13,
  },
};