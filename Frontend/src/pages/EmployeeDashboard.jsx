// Redirect to My Work Dashboard - the focused employee view
import { Navigate } from 'react-router-dom';

export default function EmployeeDashboard() {
    return <Navigate to="/my-work" replace />;
}
