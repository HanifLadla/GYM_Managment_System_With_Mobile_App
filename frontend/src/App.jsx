import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberCard from './pages/MemberCard';
import Accounting from './pages/Accounting';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Trainers from './pages/Trainers';
import TrainerCard from './pages/TrainerCard';
import Classes from './pages/Classes';
import Equipment from './pages/Equipment';
import Reports from './pages/Reports';
import Devices from './pages/Devices';
import HR from './pages/HR';
import Plans from './pages/Plans';
import Users from './pages/Users';
import DietPlans from './pages/DietPlans';
import Progress from './pages/Progress';
import PaymentVerify from './pages/PaymentVerify';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-payment/:paymentId" element={<PaymentVerify />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="member-card/:id" element={<MemberCard />} />
            <Route path="trainers" element={<Trainers />} />
            <Route path="trainer-card/:id" element={<TrainerCard />} />
            <Route path="classes" element={<Classes />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="plans" element={<Plans />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payments" element={<Payments />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="reports" element={<Reports />} />
            <Route path="devices" element={<Devices />} />
            <Route path="hr" element={<HR />} />
            <Route path="progress" element={<Progress />} />
            <Route path="diet-plans" element={<DietPlans />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
