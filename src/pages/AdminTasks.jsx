import { useEffect, useState } from 'react';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    link: '', 
    courseName: '',
    attendanceStart: '', 
    attendanceEnd: '' 
  });
  
  // List of available courses
  const courses = [
    'Web Development',
    'Mobile App Development',
    'Data Science',
    'Machine Learning',
    'Graphic Design',
    'Digital Marketing',
    'UI/UX Design',
    'Other'
  ];
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const { apiFetch } = await import('../api');
      const res = await apiFetch('/task/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createTask = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { apiFetch } = await import('../api');
      const res = await apiFetch('/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          attendanceStart: form.attendanceStart ? new Date(form.attendanceStart).toISOString() : undefined,
          attendanceEnd: form.attendanceEnd ? new Date(form.attendanceEnd).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task');
      setMessage('Task created successfully!');
      setForm({ 
        title: '', 
        description: '', 
        link: '', 
        courseName: '',
        attendanceStart: '', 
        attendanceEnd: '' 
      });
      fetchTasks();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This will also delete all related attendance records.')) {
      return;
    }
    try {
      const { apiFetch } = await import('../api');
      const res = await apiFetch(`/task/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete task');
      setMessage('Task deleted successfully');
      fetchTasks();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Create Task</h1>
        <form onSubmit={createTask} className="grid gap-3 bg-white p-4 rounded shadow max-w-xl">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="px-3 py-2 border rounded" required />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="px-3 py-2 border rounded" />
          <input name="link" value={form.link} onChange={handleChange} placeholder="Link (optional)" className="px-3 py-2 border rounded" />
          
          <div className="grid gap-3">
            <label className="text-sm text-gray-700">
              <span className="block mb-1 font-medium">Course</span>
              <select 
                name="courseName" 
                value={form.courseName} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              <span className="block mb-1 font-medium">Attendance Start (optional)</span>
              <input 
                type="datetime-local" 
                name="attendanceStart" 
                value={form.attendanceStart} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded" 
              />
            </label>
            <label className="text-sm text-gray-700">
              <span className="block mb-1 font-medium">Attendance End (optional)</span>
              <input 
                type="datetime-local" 
                name="attendanceEnd" 
                value={form.attendanceEnd} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border rounded" 
              />
            </label>
          </div>
          <button type="submit" className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Create</button>
          {message && <p className="text-blue-600">{message}</p>}
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">All Tasks</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map(t => (
            <div key={t._id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{t.title}</h3>
                  {t.courseName && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mt-1">
                      {t.courseName}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => deleteTask(t._id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {t.description && <p className="text-sm text-gray-700 mt-2">{t.description}</p>}
              {t.link && (
                <a 
                  className="text-blue-600 text-sm mt-2 inline-block hover:underline" 
                  href={t.link.startsWith('http') ? t.link : `https://${t.link}`} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  Open link
                </a>
              )}
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                {t.attendanceStart && (
                  <div className="flex items-center">
                    <svg className="h-3 w-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Starts: {new Date(t.attendanceStart).toLocaleString()}
                  </div>
                )}
                {t.attendanceEnd && (
                  <div className="flex items-center">
                    <svg className="h-3 w-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Ends: {new Date(t.attendanceEnd).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!loading && tasks.length === 0 && <p>No tasks yet.</p>}
        </div>
      </div>
    </div>
  );
}
