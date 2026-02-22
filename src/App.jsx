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

        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Optional fallback */}
        <Route path="*" element={<h1 style={{ padding: 20 }}>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}