import React from "react";
import { Routes, Route } from "react-router-dom";

import Register from "./pages/Student/authStudent/Register";
import Login from "./pages/Student/authStudent/Login";
import Home from "./pages/Home";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

import OrganizerLogin from "./pages/Organizer/authOrg/OrganizerLogin";
import OrganizerRegister from "./pages/Organizer/authOrg/OrganizerRegister";
import AdminLogin from "./pages/Admin/AdminLogin";
import StudentDashboard from "./pages/Student/StudentDashboard";
import BrowseEvents from "./pages/Organizer/BrowseEvents";
import MyRegistrations from "./pages/Student/Myregistrations";
import OrganizerDashboard from "./pages/Organizer/OrganzierDashboard";
import CreateEvent from "./pages/Organizer/CreateEvent";
import MyEvents from "./pages/Organizer/Myevents";
import OrganizerTasks from "./pages/Organizer/OrganizerTasks";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ManageEvents from "./pages/Admin/ManageEvents";
import ManageStudents from "./pages/Admin/ManageStudents";
import OrganizerGallery from './pages/Organizer/OrganizerGallery';
import StudentGallery from "./pages/Student/StudentGallery";
import AdminGallery from "./pages/Admin/AdminGallery";
import ScanAttendance from "./pages/Organizer/ScanAttendance";
import EventAttendance from "./pages/Organizer/EventAttendance";
import AboutUs from "./pages/AboutUs";
import OrganizerFeedback from "./pages/Organizer/OrganizerFeedback";
import OrganizerCertificates from "./pages/Organizer/OrganizerCertificates";
import OrganizerProfile from "./pages/Organizer/OrganizerProfile";
import StudentProfile from "./pages/Student/StudentProfile";
import StudentCertificates from "./pages/Student/StudentCertificates";
import VerifyCertificate from "./pages/VerifyCertificate";
import StudentTasks from "./pages/Student/StudentTasks";
import ManageOrganizers from "./pages/Admin/ManageOrganizers";
import AdminManageTasks from "./pages/Admin/AdminManageTasks";
import ManageFeedback from "./pages/Admin/ManageFeedback";
import ManageFeedbacks from "./pages/Admin/ManageFeedback.jsx";
import ManageCertificates from "./pages/Admin/ManageCertificates";
import AttendanceReports from "./pages/Admin/AttendanceReports";






function App() {
  return (
    <Routes>
      {/* Default page */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutUs />} />
  
      <Route path="/faq" element={<FAQ />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />






      {/* Student Auth */}
      <Route path="/student-register" element={<Register />} />
      <Route path="/student-login" element={<Login />} />
      
      {/* Organizer Auth */}
      <Route path="/login-organizer" element={<OrganizerLogin />} />
      <Route path="/register-organizer" element={<OrganizerRegister />} />

      {/* Admin Auth */}
      <Route path="/login-admin" element={<AdminLogin />} />




      {/* Student Pages */}
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/browse-events" element={<BrowseEvents />} />
      <Route path="/student/my-registrations" element={<MyRegistrations />} />
      <Route path="/student/gallery" element={<StudentGallery />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/certificates" element={<StudentCertificates />} />
      <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
      <Route path="/student/tasks" element={<StudentTasks />} />







      {/* Organizer Pages */}
      <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/create-event" element={<CreateEvent />} />
      <Route path="/organizer/my-events" element={<MyEvents />} />
      <Route path="/organizer/tasks" element={<OrganizerTasks />} />
      <Route path="/organizer/edit-event/:id" element={<CreateEvent />} />
      <Route path="/organizer/gallery" element={<OrganizerGallery />} />
      <Route path="/organizer/scan-attendance" element={<ScanAttendance />} />
      <Route path="/organizer/attendance/:eventId" element={<EventAttendance />} />
      <Route path="/organizer/feedback" element={<OrganizerFeedback />} />
      <Route path="/organizer/certificates" element={<OrganizerCertificates />} />
      <Route path="/organizer/profile" element={<OrganizerProfile />} />

    




       {/* Admin Pages */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin/events" element={<ManageEvents />} />
      <Route path="/admin/students" element={<ManageStudents />} />
      <Route path="/admin/organizers" element={<ManageOrganizers />} />
      <Route path="/admin/gallery" element={<AdminGallery />} />
      <Route path="/admin/manage-tasks" element={<AdminManageTasks />} />
      <Route path="/admin/feedback" element={<ManageFeedbacks />} />
      <Route path="/admin/certificates" element={<ManageCertificates />} />
      <Route path="/admin/attendance-reports" element={<AttendanceReports />} />

    </Routes>
  );
}

export default App;