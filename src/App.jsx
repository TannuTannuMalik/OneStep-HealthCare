import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import VideoCall from "./pages/VideoCall";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import PharmacyHistory from "./pages/PharmacyHistory";
import PharmacyLogin from "./pages/PharmacyLogin";
import ChatBot from "./pages/ChatBot";
import HealthAssistant from "./pages/HealthAssistant";
export default function App() {
  return (
    <BrowserRouter>
      <ChatBot />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/find-doctor" element={<FindDoctor />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Patient Routes */}
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
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Appointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR"]}>
              <DoctorDashboard />
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

        {/* Video Call */}
        <Route
          path="/video-call/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={["DOCTOR", "PATIENT"]}>
              <VideoCall />
            </ProtectedRoute>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy Routes */}
        <Route path="/pharmacy/login" element={<PharmacyLogin />} />
        <Route path="/pharmacy" element={<Navigate to="/pharmacy/dashboard" replace />} />
        <Route
          path="/pharmacy/dashboard"
          element={
            <ProtectedRoute allowedRoles={["PHARMACIST"]}>
              <PharmacyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy/history"
          element={
            <ProtectedRoute allowedRoles={["PHARMACIST"]}>
              <PharmacyHistory />
            </ProtectedRoute>
          }
        />
<Route path="/health-assistant" element={<HealthAssistant />} />
        {/* 404 */}
        <Route
          path="*"
          element={<h1 style={{ padding: 20 }}>404 - Page Not Found</h1>}
        />
      </Routes>
    </BrowserRouter>
  );
}