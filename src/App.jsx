import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Forgot from './pages/Forgot';
import Reset from './pages/Reset';
import StudentDashboard from './pages/StudentDashboard';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprovals from './pages/AdminApprovals';
import AdminAttendance from './pages/AdminAttendance';
import AdminTasks from './pages/AdminTasks';

function App() {
  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/student" element={<StudentDashboard />} />

      {/* Admin nested routes with sidebar layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="tasks" element={<AdminTasks />} />
      </Route>

      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  );
}

export default App;