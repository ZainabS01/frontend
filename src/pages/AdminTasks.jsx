import { useEffect, useState } from 'react';
import { getAllTasks, addTask, deleteTask } from '../firebaseTask';
import { toast } from 'react-toastify';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({});
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

  const fetchAttendanceStats = async (taskId) => {
    try {
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('taskId', '==', taskId));
      const querySnapshot = await getDocs(q);
      
      let presentCount = 0;
      let absentCount = 0;
      let attendanceDates = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'present') {
          presentCount++;
        } else if (data.status === 'absent') {
          absentCount++;
        }
        if (data.date) {
          attendanceDates.push(data.date);
        }
      });
      
      return {
        present: presentCount,
        absent: absentCount,
        total: presentCount + absentCount,
        dates: [...new Set(attendanceDates)]
      };
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      return { present: 0, absent: 0, total: 0, dates: [] };
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await getAllTasks();
      const tasksWithStats = await Promise.all(
        tasksData.map(async (task) => {
          const stats = await fetchAttendanceStats(task.id);
          return { ...task, stats };
        })
      );
      setTasks(Array.isArray(tasksWithStats) ? tasksWithStats : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTasks(); 
  }, []);

  const handleChange = (e) => {
    setForm({ 
      ...form, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const now = new Date();
      const attendanceEnd = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
      
      const taskData = {
        ...form,
        attendanceStart: now.toISOString(),
        attendanceEnd: attendanceEnd.toISOString(),
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      await addTask(taskData);
      toast.success('Task created successfully!');
      setForm({ 
        title: '', 
        description: '', 
        link: '', 
        courseName: '',
        attendanceStart: '', 
        attendanceEnd: '' 
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task: ' + error.message);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully!');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold mb-4">Create Task</h1>
        <form onSubmit={handleSubmit} className="grid gap-3 bg-white p-4 rounded-lg shadow-md max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter task title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter task description"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              name="courseName"
              value={form.courseName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              Attendance will be open for 30 minutes after task creation.
            </p>
          </div>

          <div className="mt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">All Tasks</h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No tasks found. Create your first task above.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete task"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  
                  {task.courseName && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1 mb-2">
                      {task.courseName}
                    </span>
                  )}

                  {task.description && (
                    <p className="text-gray-600 text-sm mt-2">{task.description}</p>
                  )}

                  {task.link && (
                    <a
                      href={task.link.startsWith('http') ? task.link : `https://${task.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-blue-600 hover:underline text-sm"
                    >
                      View Task Link
                    </a>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-green-50 p-2 rounded text-center">
                        <div className="text-green-800 font-medium">{task.stats?.present || 0}</div>
                        <div className="text-xs text-green-600">Present</div>
                      </div>
                      <div className="bg-red-50 p-2 rounded text-center">
                        <div className="text-red-800 font-medium">{task.stats?.absent || 0}</div>
                        <div className="text-xs text-red-600">Absent</div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <svg
                          className="h-4 w-4 text-green-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {format(new Date(task.attendanceStart), 'MMM d, yyyy hh:mm a')}
                      </div>

                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <svg
                          className="h-4 w-4 text-red-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {format(new Date(task.attendanceEnd), 'MMM d, yyyy hh:mm a')}
                      </div>
                    </div>
                    
                    {task.stats?.dates && task.stats.dates.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Attendance Dates:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {task.stats.dates.map((date, idx) => (
                            <div key={idx} className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                              {format(new Date(date), 'MMM d, yyyy')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}