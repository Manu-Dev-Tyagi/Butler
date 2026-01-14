import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import PMDashboard from './pages/PMDashboard';
import CreateProject from './pages/CreateProject';
import CreateTicket from './pages/CreateTicket';
import ProjectDetail from './pages/ProjectDetail';
import TicketDetail from './pages/TicketDetail';
import EmployeeDashboard from './pages/EmployeeDashboard';
import LeavePortal from './pages/LeavePortal';
import Offboarding from './pages/Offboarding';
import ResponseSheet from './pages/ResponseSheet';
import { Skeleton } from './components/ui/Skeleton';

// ... (ProtectedRoute stays same, no need to touch it if lines match) ...

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex-center" style={{ height: '100vh' }}><Skeleton style={{ width: '200px', height: '10px' }} /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard/admin" replace />} />
              <Route path="dashboard/admin" element={<AdminDashboard />} />
              <Route path="dashboard/pm" element={<PMDashboard />} />
              <Route path="dashboard/employee" element={<EmployeeDashboard />} />
              <Route path="projects/create" element={<CreateProject />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="tickets/create" element={<CreateTicket />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="leave-portal" element={<LeavePortal />} />
              <Route path="offboarding" element={<Offboarding />} />
              <Route path="response-sheets" element={<ResponseSheet />} />
              {/* Add more routes here */}
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider >
  );
}

export default App;
