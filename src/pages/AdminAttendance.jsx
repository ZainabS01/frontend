import { useEffect, useMemo, useState } from 'react';
import { getAllAttendance, deleteAttendance as deleteAttendanceRecord } from '../firebaseAttendance';
import { toast } from 'react-toastify';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  // Group records by user
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const u = r.user; // can be string id or populated object
      const id = typeof u === 'object' && u !== null ? u._id : String(u);
      if (!id) continue;
      const name = typeof u === 'object' && u?.name ? u.name : (r.userName || 'Unknown');
      const email = typeof u === 'object' && u?.email ? u.email : (r.userEmail || '');
      if (!map.has(id)) map.set(id, { id, name, email, items: [] });
      map.get(id).items.push(r);
    }
    // Convert to array and sort by name
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [grouped, search]);

  const selectedGroup = useMemo(() => filtered.find(s => s.id === selectedUserId) || null, [filtered, selectedUserId]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <button onClick={fetchAttendance} className="px-3 py-1.5 rounded bg-brand-blue text-white hover:bg-blue-700">Refresh</button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: student cards */}
          <div className="md:col-span-1">
            <div className="mb-3">
              <input
                placeholder="Search student by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="grid gap-3">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedUserId(s.id)}
                  className={`text-left border rounded-lg p-3 bg-white shadow-card hover:shadow-md transition ${selectedUserId===s.id ? 'ring-2 ring-brand-blue' : ''}`}
                >
                  <div className="font-semibold text-brand-black">{s.name || 'Unknown Student'}</div>
                  {s.email && <div className="text-xs text-gray-600">{s.email}</div>}
                  <div className="text-xs mt-1"><span className="text-gray-500">Classes attended:</span> {s.items.length}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-gray-500">No students found</div>
              )}
            </div>
          </div>

          {/* Right: selected student's attendance detail */}
          <div className="md:col-span-2">
            {!selectedGroup ? (
              <div className="text-sm text-gray-600">Select a student to view detailed attendance</div>
            ) : (
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold">{selectedGroup.name || 'Student'}</div>
                    {selectedGroup.email && <div className="text-xs text-gray-600">{selectedGroup.email}</div>}
                  </div>
                  <div className="text-sm"><span className="text-gray-500">Total classes:</span> {selectedGroup.items.length}</div>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedGroup.items
                    .slice()
                    .sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
                    .map((r) => {
                      const t = r.task;
                      const title = (typeof t === 'object' && t?.title) ? t.title : (r.taskTitle || 'Task');
                      const ts = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
                      const isDeleting = deletingId === r._id;
                      
                      return (
                        <div key={r._id} className="border rounded-lg p-3 hover:shadow-md transition-shadow relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-brand-black">{title}</div>
                              <div className="text-xs text-gray-600">{ts}</div>
                            </div>
                            <button
                              onClick={() => !isDeleting && deleteAttendance(r._id)}
                              disabled={isDeleting}
                              className={`text-red-500 hover:text-red-700 ${isDeleting ? 'opacity-50' : ''}`}
                              title="Delete attendance record"
                            >
                              {isDeleting ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {r.courseName && (
                            <div className="mt-2">
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {r.courseName}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                
                {selectedGroup.items.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No attendance records found for this student.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
