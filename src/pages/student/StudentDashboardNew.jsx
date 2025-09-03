import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';

// Components
import MainLayout from '../../components/Layout/MainLayout';
import Home from './Home';
import Attendance from './Attendance';
import Tasks from './Tasks';
import Profile from './Profile';

// Helper function to format dates
const formatDate = (dateValue) => {
  if (!dateValue) return 'Not set';
  
  try {
    let date;
    
    // Handle Firestore Timestamp
    if (dateValue.toDate) {
      date = dateValue.toDate();
    } 
    // Handle string date
    else if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate;
      } else {
        const timestampMatch = dateValue.match(/Timestamp\s*\(\s*seconds\s*=\s*(\d+)/);
        if (timestampMatch) {
          date = new Date(parseInt(timestampMatch[1]) * 1000);
        } else {
          return 'Invalid date';
        }
      }
    }
    // Handle numeric timestamp
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    // Handle Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'Invalid date';
    }
    
    if (!date || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return 'Invalid date';
  }
};
export default function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myAttendance, setMyAttendance] = useState([]);
  const [busyTask, setBusyTask] = useState({});
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('user') || '{}'); 
    } catch { 
      return {}; 
    }
  });
  
  const [activeTab, setActiveTab] = useState('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ 
    total: 0, 
    present: 0, 
    percentage: 0 
  });

  // Set up Firebase listeners
  useEffect(() => {
    let unsubscribeTasks = () => {};
    let unsubscribeAttendance = () => {};

    const setupFirebaseListeners = (userId) => {
      // Set up real-time listener for tasks
      const tasksQuery = query(collection(db, 'tasks'));
      unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data()
        }));
        setTasks(tasksData);
        setLoading(false);
      });

      // Set up real-time listener for user's attendance
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', userId)
      );
      unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
        const attendanceData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMyAttendance(attendanceData);
      });
    };

    // Set up auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setupFirebaseListeners(user.uid);
      } else {
        navigate('/login');
      }
    });

    // Cleanup function
    return () => {
      unsubscribeTasks();
      unsubscribeAttendance();
      unsubscribeAuth();
    };
  }, [navigate]);

  // Calculate attendance statistics
  useEffect(() => {
    const presentCount = myAttendance.filter(a => a.status === 'present').length;
    const totalCount = tasks.length || 1; // Avoid division by zero
    const percentage = Math.round((presentCount / totalCount) * 100) || 0;
    
    setAttendanceStats({
      total: tasks.length,
      present: presentCount,
      percentage: percentage
    });
  }, [tasks, myAttendance]);

  // Mark attendance for a task
  const markAttendanceForTask = async (task) => {
    const taskId = task._id || task;
    setBusyTask(prev => ({ ...prev, [taskId]: true }));
    
    const user = auth.currentUser;
    if (!user) {
      toast.error('You must be logged in to mark attendance');
      return;
    }

    try {
      // Check if attendance already exists for this task
      const existingAttendance = myAttendance.find(a => a.taskId === taskId);
      
      if (existingAttendance) {
        toast.info('Attendance already marked for this task');
        return;
      }

      // Create new attendance record
      const attendanceData = {
        userId: user.uid,
        taskId: taskId,
        status: 'present',
        markedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        taskTitle: task.title || 'Task',
        taskLink: task.link || ''
      };
      
      await addDoc(collection(db, 'attendance'), attendanceData);
      
      // If task has a link, open it in a new tab
      if (task.link) {
        window.open(task.link, '_blank', 'noopener,noreferrer');
      }
      
      toast.success('Attendance marked successfully');
    } catch (e) {
      console.error('Error marking attendance:', e);
      toast.error(e.message || 'Failed to mark attendance');
    } finally {
      setBusyTask(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Update user profile
  const updateProfile = async (newProfile) => {
    try {
      // Here you would typically update the profile in your backend
      // For now, we'll just update the local state and localStorage
      const updatedProfile = { ...profile, ...newProfile };
      setProfile(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating profile:', error);
      return Promise.reject(error);
    }
  };

  // Render the current tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <Home profile={profile} attendanceStats={attendanceStats} />;
      case 'Attendance':
        return (
          <Attendance 
            myAttendance={myAttendance} 
            tasks={tasks} 
            markAttendanceForTask={markAttendanceForTask} 
            busyTask={busyTask} 
            formatDate={formatDate} 
          />
        );
      case 'Tasks':
        return (
          <Tasks 
            tasks={tasks} 
            myAttendance={myAttendance} 
            markAttendanceForTask={markAttendanceForTask} 
            busyTask={busyTask} 
            formatDate={formatDate} 
          />
        );
      case 'Profile':
        return <Profile profile={profile} updateProfile={updateProfile} />;
      default:
        return <div>Page not found</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      profile={profile}
      mobileMenuOpen={mobileMenuOpen}
      setMobileMenuOpen={setMobileMenuOpen}
    >
      {renderContent()}
    </MainLayout>
  );
}
