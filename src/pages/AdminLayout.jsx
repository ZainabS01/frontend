import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('No authenticated user');
        }
        
        // Force token refresh
        await user.getIdToken(true);
        
        // Get fresh user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }
        
        const userData = userDoc.data();
        
        if (userData.role !== 'admin') {
          throw new Error('Insufficient permissions');
        }
        
        // Update local storage with fresh user data
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          uid: user.uid
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Admin verification error:', error);
        await signOut(auth);
        localStorage.removeItem('user');
        navigate('/login');
        toast.error('Admin access required');
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        verifyAdmin();
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors
     hover:bg-brand-blue/10 text-gray-700 ${isActive ? 'bg-brand-blue/20 text-brand-blue font-semibold' : ''}`;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          `fixed z-40 inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200
           ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`
        }
      >
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-extrabold tracking-tight text-brand-black">Admin Panel</h2>
          <p className="text-xs text-gray-500">Manage users, attendance, and tasks</p>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          <NavLink to="/admin/approvals" className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full bg-brand-blue" />
            Approvals
          </NavLink>
          <NavLink to="/admin/attendance" className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full bg-brand-red" />
            Attendance
          </NavLink>
          <NavLink to="/admin/tasks" className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full bg-brand-blue" />
            Tasks
          </NavLink>
        </nav>
        <div className="p-3 border-t">
          <button onClick={logout} className="w-full bg-brand-red text-white py-2 rounded-md hover:bg-red-700 transition-colors">Logout</button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-3 md:px-6 gap-3">
          {/* Hamburger button on mobile */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="text-sm text-brand-black font-semibold">Dashboard</div>
        </header>
        <main className="p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
