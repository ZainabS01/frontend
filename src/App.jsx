import { useEffect, useMemo, useState } from 'react';
import { 
  getAllAttendance, 
  deleteAttendance as deleteAttendanceRecord, 
  updateAttendance,
  createAttendance 
} from '../firebaseAttendance';
import { getAllTasks } from '../firebaseTask';
import { toast } from 'react-toastify';
import { collection, getDocs } from "firebase/firestore";
import { db } from "./../firebase";
import { format } from 'date-fns';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  ​
  // Fetch all tasks to get all possible class dates
  const [tasks, setTasks] = useState([]);
  const [allDates, setAllDates] = useState([]);
  ​
  // Fetch all tasks and process dates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tasksData = await getAllTasks();
        const validTasks = Array.isArray(tasksData) ? tasksData : [];
        setTasks(validTasks);
        
        // Extract and sort unique dates
        const dates = [...new Set(validTasks
          .map(task => task.dueDate)
          .filter(Boolean)
        )].sort((a, b) => new Date(a) - new Date(b));
        
        setAllDates(dates);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load class dates');
      }
    };
    fetchData();
  }, []);
  ​
  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const attendanceData = await getAllAttendance();
      setRecords(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (e) {
      setError(e.message);
      toast.error('Failed to load attendance: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  ​
  useEffect(() => { 
    fetchAttendance(); 
  }, []);
  ​
  // Group records by user
  const grouped = useMemo(() => {
    const map = new Map();
    
    for (const record of records) {
      const user = record.user;
      const userId = typeof user === 'object' && user !== null ? user._id : String(user);
      if (!userId) continue;
      
      const userName = typeof user === 'object' && user?.name ? user.name : (record.userName || 'Unknown');
      const userEmail = typeof user === 'object' && user?.email ? user.email : (record.userEmail || '');
      const semester = typeof user === 'object' && user?.semester ? user.semester : (record.semester || 'N/A');
      ​
      if (!map.has(userId)) {
        map.set(userId, { 
          id: userId,
          name: userName,
          email: userEmail,
          semester,
          items: [],
          attendance: {}
        });
      }
      ​
      const date = record.date || record.timestamp?.toDate().toISOString().split('T')[0];
      if (date) {
        map.get(userId).attendance[date] = {
          status: record.status || 'present',
          recordId: record.id
        };
      }
      ​
      map.get(userId).items.push(record);
    }
    ​
    // Convert to array and sort by name
    return Array.from(map.values()).sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );
  }, [records]);
  ​
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return grouped;
    
    return grouped.filter(student =>
      (student.name || '').toLowerCase().includes(query) ||
      (student.email || '').toLowerCase().includes(query)
    );
  }, [grouped, search]);
  ​
  const selectedStudent = useMemo(() => {
    if (!selectedUserId) return null;
    const student = grouped.find(s => s.id === selectedUserId);
    if (!student) return null;
    
    // Calculate attendance stats
    const presentCount = Object.values(student.attendance)
      .filter(a => a.status === 'present').length;
    const totalDates = allDates.length;
    const absentCount = Math.max(0, totalDates - presentCount);
    
    return {
      ...student,
      presentCount,
      absentCount,
      totalDates
    };
  }, [selectedUserId, grouped, allDates]);
  ​
  const toggleAttendance = async (userId, date, newStatus) => {
    try {
      const student = grouped.find(s => s.id === userId);
      if (!student) return;
      
      // Find existing attendance record for this date
      const existingRecord = student.items.find(item => {
        const itemDate = item.date || item.timestamp?.toDate().toISOString().split('T')[0];
        return itemDate === date;
      });
      ​
      if (existingRecord) {
        // Update existing record
        await updateAttendance(existingRecord.id, { status: newStatus });
      } else {
        // Create new attendance record
        await createAttendance({
          user: userId,
          date,
          status: newStatus,
          timestamp: new Date(),
          userName: student.name,
          userEmail: student.email,
          semester: student.semester
        });
      }
      ​
      await fetchAttendance();
      toast.success(`Marked as ${newStatus} for ${format(new Date(date), 'PPP')}`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance: ' + error.message);
    }
  };
  ​
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">Student Attendance</h1>
        <button 
          onClick={fetchAttendance} 
          className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      
      {loading && <div className="text-center py-4">Loading attendance data...</div>}
      {error && <div className="text-red-600 p-4 bg-red-50 rounded mb-4">{error}</div>}
      
      {!loading && (
        <div className="grid md:grid-cols-4 gap-6">
          {/* Student List */}
          <div className="md:col-span-1">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {filtered.length > 0 ? (
                filtered.map(student => {
                  const present = student.items.length;
                  const total = allDates.length;
                  const absent = Math.max(0, total - present);
                  
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedUserId(student.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedUserId === student.id 
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-600">{student.email}</div>
                      <div className="mt-1 flex justify-between text-xs">
                        <span className="text-green-700">P: {present}</span>
                        <span className="text-red-700">A: {absent}</span>
                        <span className="text-gray-500">Total: {total}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {search ? 'No matching students found' : 'No students found'}
                </div>
              )}
            </div>
          </div>
          
          {/* Attendance Details */}
          <div className="md:col-span-3">
            {!selectedStudent ? (
              <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
                Select a student to view attendance details
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                {/* Student Info Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedStudent.name}
                      </h2>
                      <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="text-gray-500">Semester: </span>
                        <span className="font-medium">{selectedStudent.semester}</span>
                      </div>
                      <div className="mt-1 flex gap-4 text-sm">
                        <span className="text-green-700">
                          <span className="font-medium">Present:</span> {selectedStudent.presentCount}
                        </span>
                        <span className="text-red-700">
                          <span className="font-medium">Absent:</span> {selectedStudent.absentCount}
                        </span>
                        <span className="text-gray-600">
                          <span className="font-medium">Total:</span> {selectedStudent.totalDates}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Attendance Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allDates.length > 0 ? (
                        allDates.map((date, index) => {
                          const attendance = selectedStudent.attendance[date] || { status: 'absent' };
                          const formattedDate = format(new Date(date), 'PPP');
                          const isPresent = attendance.status === 'present';
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formattedDate}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  isPresent
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {isPresent ? 'Present' : 'Absent'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => toggleAttendance(
                                    selectedStudent.id, 
                                    date, 
                                    isPresent ? 'absent' : 'present'
                                  )}
                                  className={`px-3 py-1 rounded text-xs ${
                                    isPresent
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  Mark as {isPresent ? 'Absent' : 'Present'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                            No class dates found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}