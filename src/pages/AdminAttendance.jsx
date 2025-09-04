import { useEffect, useMemo, useState } from 'react';
import { 
  getAllAttendance, 
  deleteAttendance as deleteAttendanceRecord,
  addAttendance,
  updateAttendance 
} from '../firebaseAttendance';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deletingId, setDeletingId] = useState(null);
  const now = new Date();

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all attendance records
      const attendanceData = await getAllAttendance();
      setRecords(Array.isArray(attendanceData) ? attendanceData : []);
      
      // Fetch all students
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
      
    } catch (e) {
      console.error('Error fetching data:', e);
      setError(e.message);
      toast.error('Failed to load data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAttendance = async (attendanceId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }
    setDeletingId(attendanceId);
    try {
      await deleteAttendanceRecord(attendanceId);
      setRecords(prev => prev.filter(record => record.id !== attendanceId));
      
      // Update selected user's records if viewing a specific student
      if (selectedUserId) {
        const updatedGroup = grouped.find(g => g.id === selectedUserId);
        if (updatedGroup && updatedGroup.items.some(item => item.id === attendanceId)) {
          updatedGroup.items = updatedGroup.items.filter(item => item.id !== attendanceId);
          if (updatedGroup.items.length === 0) {
            setSelectedUserId(null);
          }
        }
      }
      
      toast.success('Attendance record deleted successfully');
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance record: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };
  useEffect(() => { fetchAttendance(); }, []);

  // Group records by user with attendance statistics
  const grouped = useMemo(() => {
    const map = new Map();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Initialize all students with zero counts
    students.forEach(student => {
      map.set(student.id, {
        ...student,
        presentCount: 0,
     
        totalClasses: 0,
        items: [],
        attendance: {}
      });
    });
    
    // If no records, return students with zero counts
    if (!records || records.length === 0) {
      return Array.from(map.values()).sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );
    }

    // Helper function to safely convert Firestore Timestamp to Date
    const toDate = (timestamp) => {
      try {
        return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      } catch (e) {
        console.warn('Error converting timestamp:', e);
        return new Date(); // Return current date as fallback
      }
    };
    
    // First, add all students to ensure they appear in the list
    students.forEach(student => {
      // Initialize with default values for today's attendance
      const defaultAttendance = {
        status: 'present',
        recordId: null
      };
      
      map.set(student.id, {
        id: student.id,
        name: student.name || 'Unknown',
        email: student.email || '',
        semester: student.semester || 'N/A',
        items: [],
        attendance: {
          [today]: { ...defaultAttendance }
        },
        presentCount: 0,
        totalClasses: 0
      });
    });

    // Then, process attendance records
    records.forEach(record => {
      // Check if attendance was marked within the 30-minute window
      let recordDate;
      try {
        // Use markedAt if available, otherwise fall back to createdAt or current time
        const timestamp = record.markedAt || record.createdAt || now;
        recordDate = toDate(timestamp);
        
        // Ensure we have a valid date
        if (isNaN(recordDate.getTime())) {
          console.warn('Invalid date in record:', record);
          return; // Skip this record if date is invalid
        }
      } catch (e) {
        console.warn('Error processing date:', e);
        return; // Skip this record if there's an error
      }
      
      const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
      let recordDateStr;
      try {
        recordDateStr = format(recordDate, 'yyyy-MM-dd');
      } catch (e) {
        console.warn('Error formatting date:', e);
        return; // Skip this record if we can't format the date
      }
      
      // No need to change status for older records
      
      // Get the user ID from the record
      const userId = record.userId || (record.user && (record.user._id || record.user.id)) || '';
      if (!userId || !map.has(userId)) {
        console.warn('User not found in students list:', userId);
        return;
      }
      
      const student = map.get(userId);
      // Use the marked date or the formatted date string
      const date = record.markedAt ? format(toDate(record.markedAt), 'yyyy-MM-dd') : recordDateStr;
      
      if (date) {
        // Initialize or update attendance for this date
        const wasPresent = student.attendance[date]?.status === 'present';
        const isPresent = record.status === 'present';
        
        // Only update if this is a new record or status has changed
        if (!student.items.some(item => item.id === record.id)) {
          // If this is a new record
          student.attendance[date] = {
            status: isPresent ? 'present' : 'absent',
            recordId: record.id
          };
          
          // Update counts
          if (isPresent) {
            student.presentCount = (student.presentCount || 0) + 1;
          }
          student.totalClasses = Object.keys(student.attendance).length;
        } else if (wasPresent !== isPresent) {
          // If status changed for existing record
          student.attendance[date].status = isPresent ? 'present' : 'absent';
          
          // Update present count
          if (isPresent && !wasPresent) {
            student.presentCount = (student.presentCount || 0) + 1;
          } else if (!isPresent && wasPresent) {
            student.presentCount = Math.max(0, (student.presentCount || 1) - 1);
          }
        }
      }
      
      student.items.push(record);
    });

    // Convert to array and sort by name
    return Array.from(map.values()).sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );
  }, [records, students]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return grouped;
    
    return grouped.filter(student =>
      (student.name || '').toLowerCase().includes(query) ||
      (student.email || '').toLowerCase().includes(query) ||
      (student.semester?.toString() || '').includes(query)
    );
  }, [grouped, search]);

  const selectedGroup = useMemo(() => filtered.find(s => s.id === selectedUserId) || null, [filtered, selectedUserId]);

  const toggleAttendance = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const attendanceRecord = student.attendance[selectedDate];
      const newStatus = attendanceRecord?.status === 'present' ? 'absent' : 'present';
      
      // If record exists, update it, otherwise create a new one
      if (attendanceRecord?.recordId) {
        await updateAttendance(attendanceRecord.recordId, { status: newStatus });
      } else {
        await addAttendance({
          studentId,
          date: selectedDate,
          status: newStatus
        });
      }
      
      await fetchAttendance();
      toast.success(`Attendance marked as ${status} for ${student.name}`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Student Attendance</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <button 
            onClick={fetchAttendance} 
            className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && (
        <div className="grid gap-6">
          {/* Search and Filter */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Students
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, email, or semester..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Classes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Today's Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length > 0 ? (
                  filtered.map(student => {
                    const attendance = student.attendance[selectedDate] || { status: 'present' };
                    const isPresent = true; // Always show as present by default
                    
                    return (
                      <tr 
                        key={student.id} 
                        className={`hover:bg-gray-50 ${selectedUserId === student.id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedUserId(student.id === selectedUserId ? null : student.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {student.presentCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {student.totalClasses || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Present
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAttendance(student.id);
                              }}
                              className={`px-3 py-1 rounded text-xs ${
                                isPresent 
                                  ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' 
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                              title="Toggle Attendance"
                            >
                              {isPresent ? '✓ Present' : 'Mark Present'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      {search ? 'No matching students found' : 'No students available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Attendance Summary */}
        {selectedUserId && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Attendance Summary
              </h2>
              <p className="text-sm text-gray-600">
                Showing attendance for {selectedGroup?.name || 'selected student'}
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Present</p>
                  <p className="text-2xl font-bold text-green-700">
                    {selectedGroup?.items?.filter(item => item.status === 'present').length || 0}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Total Classes</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedGroup?.items?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
