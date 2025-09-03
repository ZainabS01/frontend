import { useEffect, useMemo, useState, useRef } from 'react';

// Timer component to show countdown for attendance
const Timer = ({ task }) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const timerRef = useRef();

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!task.attendanceStart) return { minutes: 0, seconds: 0 };
      
      const now = new Date();
      const start = new Date(task.attendanceStart);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes from start
      
      if (now < start) return { minutes: 30, seconds: 0 };
      if (now > end) return { minutes: 0, seconds: 0 };
      
      const remaining = end - now;
      const minutes = Math.floor((remaining / 1000 / 60) % 60);
      const seconds = Math.floor((remaining / 1000) % 60);
      
      return { minutes, seconds };
    };

    // Update immediately
    setTimeLeft(calculateTimeLeft());

    // Then update every second
    timerRef.current = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [task.attendanceStart]);

  return (
    <div className="text-xs text-gray-500">
      Time left: {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </div>
  );
};

import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiCheckSquare, FiCalendar, FiUser, FiLogOut, FiFileText, FiXCircle } from 'react-icons/fi';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';

export default function StudentDashboard() {
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myAttendance, setMyAttendance] = useState([]); // user attendance records
  const [busyTask, setBusyTask] = useState({}); // { [taskId]: boolean }
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const [activeTab, setActiveTab] = useState('Home');
  const [profileMsg, setProfileMsg] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMarksheet, setShowMarksheet] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, percentage: 0 });

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

  // Set up auth state listener for profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user document from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const safe = {
            id: user.uid,
            name: user.displayName || user.email,
            email: user.email,
            role: userData.role || 'student',
            semester: userData.semester || '',
            phone: userData.phone || ''
          };
          setProfile(safe);
          localStorage.setItem('user', JSON.stringify(safe));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const attendedTaskIds = useMemo(() => {
    // r.task can be an id string or a populated object; normalize to string id
    return new Set(
      myAttendance
        .filter(r => r.task)
        .map(r => {
          const t = r.task;
          const id = typeof t === 'object' && t !== null ? t._id : t;
          return String(id);
        })
    );
  }, [myAttendance]);

  const taskTitleById = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => map.set(String(t._id), t.title));
    return map;
  }, [tasks]);

  const recentAttendance = useMemo(() => {
    return [...myAttendance]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);
  }, [myAttendance]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);
  }, [tasks]);

  // Check if task is active (current time is between start and end time)
  const isTaskActive = (task) => {
    if (!task.attendanceStart || !task.attendanceEnd) return false;
    const now = new Date();
    const start = new Date(task.attendanceStart);
    const end = new Date(task.attendanceEnd);
    return now >= start && now <= end;
  };

  // Check if attendance was already marked for a task
  const isAttendanceMarked = (taskId) => {
    return myAttendance.some(a => a.taskId === taskId);
  };

  // Format date for display
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
        // Try to parse the date string
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        } else {
          // If it's a Firestore timestamp string (e.g., from toISOString())
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
      
      // Check if we have a valid date
      if (!date || isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format the date
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

  // Calculate remaining time for a task
  const getRemainingTime = (task) => {
    if (!task.attendanceStart) return null;
    const now = new Date();
    const start = new Date(task.attendanceStart);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes from start
    
    if (now < start) return { minutes: 0, seconds: 0, isActive: false };
    if (now > end) return { minutes: 0, seconds: 0, isActive: false };
    
    const remaining = end - now;
    const minutes = Math.floor((remaining / 1000 / 60) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);
    
    return { minutes, seconds, isActive: true };
  };

  // Calculate attendance statistics
  const calculateAttendanceStats = useMemo(() => {
    const totalTasks = tasks.length;
    const presentCount = myAttendance.length;
    const percentage = totalTasks > 0 ? Math.round((presentCount / totalTasks) * 100) : 0;
    
    return {
      total: totalTasks,
      present: presentCount,
      percentage: percentage,
      activeTasks: tasks.filter(task => isTaskActive(task)).length
    };
  }, [tasks, myAttendance]);

  // Update attendance stats when they change
  useEffect(() => {
    setAttendanceStats(calculateAttendanceStats);
  }, [calculateAttendanceStats]);

  const markAttendanceForTask = async (task) => {
    const taskId = task._id || task;
    setAttendanceMsg('');
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

      // Create new attendance record with only primitive values
      const attendanceData = {
        userId: user.uid,
        taskId: taskId,
        status: 'present',
        markedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      // Only add title and link if they exist and are strings
      if (task.title && typeof task.title === 'string') {
        attendanceData.taskTitle = task.title;
      }
      
      if (task.link && typeof task.link === 'string') {
        attendanceData.taskLink = task.link;
      }
      
      await addDoc(collection(db, 'attendance'), attendanceData);

      // If task has a link, open it in a new tab
      if (task.link) {
        window.open(task.link, '_blank', 'noopener,noreferrer');
      }
      
      toast.success('Attendance marked successfully');
      setAttendanceMsg('Attendance marked successfully');
    } catch (e) {
      setAttendanceMsg(e.message || 'Failed to mark attendance');
    } finally {
      setBusyTask(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const openMarksheet = () => {
    setShowMarksheet(true);
  };

  const closeMarksheet = () => {
    setShowMarksheet(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', icon: <FiHome className="mr-2" /> },
    { name: 'Tasks', icon: <FiCheckSquare className="mr-2" /> },
    { name: 'Attendance', icon: <FiCalendar className="mr-2" /> },
    { name: 'Profile', icon: <FiUser className="mr-2" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-black via-gray-900 to-brand-blue p-2 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur rounded-xl shadow-card overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <div className="font-semibold text-brand-black">Student Portal</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
            {profile?.name ? profile.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'ST'}
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden md:grid grid-cols-3 items-center px-6 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
              {profile?.name ? profile.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'ST'}
            </div>
            <div className="font-semibold text-brand-black">Student Portal</div>
          </div>
          <div className="flex items-center justify-center gap-1">
            {navItems.map(({name}) => (
              <button
                key={name}
                onClick={() => {
                  setActiveTab(name);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === name ? 'bg-brand-blue text-white' : 'text-brand-black hover:bg-gray-100'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end">
            <button 
              onClick={logout} 
              className="px-3 py-1.5 rounded-md text-sm bg-brand-red text-white hover:bg-red-700 flex items-center"
            >
              <FiLogOut className="mr-1" /> Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => setActiveTab('Home')}
              className={`flex items-center space-x-2 p-2 rounded-lg ${activeTab === 'Home' ? 'bg-gray-100' : ''}`}
            >
              <FiHome className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setActiveTab('Attendance')}
              className={`flex items-center space-x-2 p-2 rounded-lg ${activeTab === 'Attendance' ? 'bg-gray-100' : ''}`}
            >
              <FiCheckSquare className="w-5 h-5" />
              <span>Attendance</span>
            </button>
            <button
              onClick={openMarksheet}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <FiFileText className="w-5 h-5" />
              <span>Marksheet</span>
            </button>
            <button
              onClick={() => setActiveTab('Profile')}
              className={`flex items-center space-x-2 p-2 rounded-lg ${activeTab === 'Profile' ? 'bg-gray-100' : ''}`}
            >
              <FiUser className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </nav>
        )}

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {attendanceMsg && <p className="mb-4 text-blue-600 text-sm">{attendanceMsg}</p>}

          {activeTab === 'Home' && (
            <div className="overflow-x-auto mx-3 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                 
                
                </div>
              </table>
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-3">Recent Tasks</h3>
                <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {recentTasks.map(task => (
                    <li key={task._id} className="border p-3 rounded-lg bg-white shadow-card hover:shadow-md transition-shadow">
                      <div className="font-semibold">{task.title}</div>
                      {task.description && <div className="text-sm text-gray-700 mt-1 line-clamp-2">{task.description}</div>}
                      <div className="text-xs text-gray-500 mt-1">{formatDate(task.createdAt)}</div>
                    </li>
                  ))}
                  {recentTasks.length === 0 && (
                    <li className="text-sm text-gray-500">No tasks yet</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Tasks</h3>
              {loading ? <p>Loading...</p> : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tasks.map((task) => {
                    const start = task.attendanceStart ? new Date(task.attendanceStart) : null;
                    const end = task.attendanceEnd ? new Date(task.attendanceEnd) : null;
                    const now = new Date();
                    const inWindow = (!start || now >= start) && (!end || now <= end);
                    const alreadyMarked = attendedTaskIds.has(String(task._id));
                    return (
                      <li key={task._id} className="border p-3 rounded-lg flex flex-col gap-1 bg-white shadow-card hover:shadow-md transition-shadow">
                        <span className="font-semibold">{task.title}</span>
                        {task.description && <span className="text-sm text-gray-700">{task.description}</span>}
                        {task.link && (
                          alreadyMarked ? (
                            <a href={task.link} className="text-blue-600 underline text-sm" target="_blank" rel="noopener noreferrer">Open Link</a>
                          ) : (
                            <span className="text-gray-400 text-sm">Mark attendance to unlock link</span>
                          )
                        )}
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                          {start && <div>Start: {formatDate(task.attendanceStart)}</div>}
                          {end && <div>End: {formatDate(task.attendanceEnd)}</div>}
                        </div>
                        <button
                          onClick={() => markAttendanceForTask(task)}
                          disabled={!inWindow || alreadyMarked || busyTask[task._id]}
                          className={`mt-2 px-3 py-1.5 text-sm rounded-md ${alreadyMarked 
                            ? 'bg-green-100 text-green-800' 
                            : inWindow 
                              ? 'bg-brand-blue text-white hover:bg-blue-700' 
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                        >
                          {busyTask[task._id] 
                            ? 'Processing...' 
                            : alreadyMarked 
                              ? '✓ Done' 
                              : inWindow 
                                ? 'Mark Attendance' 
                                : 'Not Available'}
                        </button>
                        {!inWindow && (
                          <span className="ml-2 text-xs text-gray-500">{start && now < start ? 'Not started' : 'Window ended'}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'Attendance' && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">My Attendance</h3>
              <ul className="divide-y divide-gray-100 bg-white rounded-lg border">
                {recentAttendance.length > 0 ? recentAttendance.map((r, idx) => {
                  const t = r.task;
                  const id = typeof t === 'object' && t !== null ? t._id : t;
                  const title = (typeof t === 'object' && t?.title) ? t.title : (taskTitleById.get(String(id)) || 'Task');
                  const ts = r.createdAt ? new Date(r.createdAt) : null;
                  return (
                    <li key={r._id || idx} className="p-3">
                      <div className="text-sm font-medium text-brand-black truncate">{title}</div>
                      <div className="text-xs text-gray-600">{formatDate(r.createdAt)}</div>
                    </li>
                  );
                }) : (
                  <li className="p-3 text-sm text-gray-500">No attendance yet</li>
                )}
              </ul>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="max-w-xl">
              {profileMsg && <p className={`mb-3 text-sm ${profileMsg.startsWith('Profile updated') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProfileMsg('');
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const name = formData.get('name');
                  const email = formData.get('email');
                  const semester = formData.get('semester');
                  const currentPassword = formData.get('currentPassword');
                  const newPassword = formData.get('newPassword');
                  const confirmPassword = formData.get('confirmPassword');
                  const phone = formData.get('phone');
                  if (newPassword && newPassword !== confirmPassword) {
                    setProfileMsg('New passwords do not match');
                    return;
                  }
                  if (newPassword && !/[!@#$%^&*()]/.test(newPassword)) {
                    setProfileMsg('New password must include at least one special character: ! @ # $ % ^ & * ( )');
                    return;
                  }
                  try {
                    const { apiFetch } = await import('../api');
                    const res = await apiFetch('/auth/me', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        name,
                        email,
                        semester: semester ? Number(semester) : undefined,
                        currentPassword: currentPassword || undefined,
                        newPassword: newPassword || undefined,
                        phone: phone || undefined,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setProfileMsg(data.message || 'Failed to update profile');
                      return;
                    }
                    setProfileMsg('Profile updated successfully');
                    if (data.user) {
                      localStorage.setItem('user', JSON.stringify(data.user));
                      setProfile(data.user);
                    }
                    form.reset();
                  } catch (err) {
                    setProfileMsg(err.message || 'Failed to update profile');
                  }
                }}
                className="bg-white rounded-lg border p-4 space-y-3"
              >
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input name="name" defaultValue={profile?.name || ''} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input type="email" name="email" defaultValue={profile?.email || ''} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone (03XXXXXXXXX)</label>
                  <input
                    type="tel"
                    name="phone"
                    pattern="03[0-9]{9}"
                    title="Must start with 03 and be 11 digits (numbers only)"
                    placeholder="e.g., 03xxxxxxxxx"
                    defaultValue={profile?.phone || ''}
                    onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 11); }}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must start with 03 and be 11 digits.</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Semester</label>
                  <input type="number" min="1" max="8" name="semester" defaultValue={profile?.semester ?? ''} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <hr />
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                    <input type="password" name="currentPassword" placeholder="••••••••" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">New Password</label>
                    <input type="password" name="newPassword" placeholder="••••••••" pattern="^(?=.*[!@#$%^&*()]).{6,}$" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    <p className="mt-1 text-xs text-gray-500">Must be 6+ chars and include at least one of ! @ # $ % ^ & * ( )</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
                    <input type="password" name="confirmPassword" placeholder="••••••••" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Changes</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Marksheet Modal */}
      {showMarksheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Marksheet</h2>
              <button 
                onClick={closeMarksheet}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Attendance Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Attendance Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{attendanceStats.present}</p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{attendanceStats.total}</p>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{attendanceStats.percentage}%</p>
                    <p className="text-sm text-gray-600">Attendance</p>
                  </div>
                </div>
              </div>

              {/* Tasks List with Attendance Status */}
              <div>
                <h3 className="text-lg font-medium mb-3">Task-wise Attendance</h3>
                <div className="space-y-3">
                  {tasks.map(task => {
                    const isPresent = myAttendance.some(a => a.taskId === task._id);
                    return (
                      <div key={task._id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            {isPresent && task.link && (
                              <a 
                                href={task.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm hover:underline block mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Open Task
                              </a>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            {(isPresent || isAttendanceMarked(task._id)) ? (
                              <div className="flex flex-col items-end">
                                <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                  Present
                                </span>
                                {task.link && (
                                  <a 
                                    href={task.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 text-sm hover:underline mt-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Open Task Link
                                  </a>
                                )}
                              </div>
                            ) : isTaskActive(task) ? (
                              <div className="flex flex-col items-end">
                                <button
                                  onClick={() => markAttendanceForTask(task)}
                                  className="px-3 py-1 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 mb-1"
                                >
                                  Mark Attendance
                                </button>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>Starts: {formatDate(task.attendanceStart)}</div>
                                  <div>Ends: {formatDate(task.attendanceEnd)}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                                  Absent
                                </span>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>Starts: {formatDate(task.attendanceStart)}</div>
                                  <div>Ends: {formatDate(task.attendanceEnd)}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
