import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          await auth.signOut();
          navigate('/login');
          return;
        }

        setUser({
          ...userDoc.data(),
          uid: currentUser.uid
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.name || 'Admin'}!</h1>
        <p className="text-gray-600 mb-6">You are now logged in to the admin dashboard.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <DashboardCard 
            title="User Management"
            description="Manage user accounts and permissions"
            link="/admin/users"
            icon="👥"
          />
          <DashboardCard 
            title="Approvals"
            description="Review and approve pending requests"
            link="/admin/approvals"
            icon="✅"
          />
          <DashboardCard 
            title="Settings"
            description="Configure system settings"
            link="/admin/settings"
            icon="⚙️"
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, description, link, icon }) {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(link)}
      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow duration-200 flex items-start space-x-4"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}
