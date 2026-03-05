import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import FindDoctor from "./pages/FindDoctor";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import BookAppointment from "./pages/BookAppointment";
import Appointments from "./pages/Appointments";
import Reports from "./pages/Reports";
import PatientDashboard from "./pages/PatientDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateReport from "./pages/CreateReport";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/find-doctor" element={<FindDoctor />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Protected Dashboards */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
<Route
  path="/book/:doctorId"
  element={
    <ProtectedRoute allowedRoles={["PATIENT"]}>
      <BookAppointment />
    </ProtectedRoute>
  }
/>
<Route
  path="/doctor/report/:appointmentId"
  element={
    <ProtectedRoute allowedRoles={["DOCTOR"]}>
      <CreateReport />
    </ProtectedRoute>
  }
/>
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<Reports />} />

        <Route path="*" element={<h1 style={{ padding: 20 }}>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
