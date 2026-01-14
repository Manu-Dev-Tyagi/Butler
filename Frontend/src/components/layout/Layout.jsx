import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    FolderPlus,
    Folder,
    Users,
    LogOut,
    Menu,
    Bell,
    Search,
    CheckSquare,
    FileText,
    UserX,
    User
} from 'lucide-react';
import { NotificationPanel } from '../ui/NotificationPanel';
import { GlobalSearch } from '../search/GlobalSearch';
import { useNotifications } from '../../context/NotificationContext';
import '../../styles/components.css';

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const { unreadCount } = useNotifications();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname.startsWith(path);

    const LINKS = [
        // Dashboards - Show Overall to all users
        { label: 'Overall', path: '/dashboard/admin', icon: LayoutDashboard },
        ...(user?.role === 'PM' || user?.role === 'ADMIN' ? [{ label: 'PM', path: '/dashboard/pm', icon: Users }] : []),
        { label: 'Employee', path: '/dashboard/employee', icon: User },
        { label: 'Activity Feed', path: '/activity-feed', icon: CheckSquare },

        ...(user?.role === 'ADMIN' || user?.role === 'PM' ? [
            { label: 'Create Project', path: '/projects/create', icon: FolderPlus },
            { label: 'Response Sheets', path: '/response-sheets', icon: FileText },
        ] : []),
        ...(user?.role === 'ADMIN' ? [
            { label: 'Offboarding', path: '/offboarding', icon: UserX }
        ] : []),
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: 'var(--color-bg-card)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 50
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>
                        <span className="gradient-text">PMS Enterprise</span>
                    </h2>
                </div>

                <nav style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Menu
                    </div>
                    {LINKS.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                                color: isActive(link.path) ? '#fff' : 'var(--color-text-muted)',
                                background: isActive(link.path) ? 'var(--color-primary)' : 'transparent',
                                fontWeight: isActive(link.path) ? 500 : 400,
                                transition: 'all 0.2s',
                                textDecoration: 'none'
                            }}
                        >
                            <link.icon size={18} />
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            width: '100%', padding: '0.75rem',
                            background: 'transparent', border: 'none',
                            color: 'var(--color-danger)', cursor: 'pointer',
                            borderRadius: 'var(--radius-md)',
                            transition: 'background 0.2s'
                        }}
                        className="hover-danger"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Topbar */}
                <header style={{
                    height: '70px', borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 2rem', background: 'rgba(15, 17, 26, 0.8)', backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 40
                }}>
                    <div>
                        {/* Breadcrumbs or Title could go here */}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button 
                            onClick={() => setShowSearch(true)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                            title="Search (Ctrl+K)"
                        >
                            <Search size={20} />
                        </button>
                        {showSearch && <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />}
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', position: 'relative' }}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -5, right: -5, minWidth: '16px', height: '16px', padding: '0 4px',
                                    background: 'var(--color-danger)', borderRadius: '10px', border: '2px solid var(--color-bg-card)',
                                    fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--color-border)' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.role}</div>
                            </div>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600
                            }}>
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ padding: '2rem', flex: 1 }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
