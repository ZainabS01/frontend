import { FiCalendar, FiCheckCircle, FiClock, FiExternalLink } from 'react-icons/fi';

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

const Tasks = ({ tasks, myAttendance, markAttendanceForTask, busyTask, formatDate }) => {
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

  // Get attendance status for a task
  const getAttendanceStatus = (taskId) => {
    const attendance = myAttendance.find(a => a.taskId === taskId);
    if (!attendance) return null;
    return attendance.status;
  };

  // Get upcoming tasks (not yet started or in progress)
  const upcomingTasks = tasks.filter(task => {
    const now = new Date();
    const start = task.attendanceStart ? new Date(task.attendanceStart) : null;
    return start && start > now;
  });

  // Get active tasks (currently in attendance window)
  const activeTasks = tasks.filter(task => {
    if (!task.attendanceStart || !task.attendanceEnd) return false;
    const now = new Date();
    const start = new Date(task.attendanceStart);
    const end = new Date(task.attendanceEnd);
    return now >= start && now <= end;
  });

  // Get completed tasks (attendance window has passed)
  const completedTasks = tasks.filter(task => {
    if (!task.attendanceEnd) return false;
    const now = new Date();
    const end = new Date(task.attendanceEnd);
    return now > end;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
      
      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiClock className="mr-2 text-yellow-500" /> Active Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTasks.map((task) => {
              const isMarked = isAttendanceMarked(task._id);
              const status = getAttendanceStatus(task._id);
              
              return (
                <div key={task._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    {task.link && (
                      <a 
                        href={task.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1 w-4 h-4" />
                      {formatDate(task.attendanceStart)}
                    </div>
                    <Timer task={task} />
                  </div>
                  
                  <div className="mt-4">
                    {!isMarked ? (
                      <button
                        onClick={() => markAttendanceForTask(task)}
                        disabled={busyTask[task._id]}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {busyTask[task._id] ? 'Marking...' : 'Mark Attendance'}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        status === 'present' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {status === 'present' ? 'Attendance Marked' : 'Marked Absent'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Tasks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Starts At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500">{task.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(task.attendanceStart)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Upcoming
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Completed Tasks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedTasks.map((task) => {
                  const attendance = myAttendance.find(a => a.taskId === task._id);
                  const status = attendance ? attendance.status : 'absent';
                  
                  return (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500">{task.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(task.attendanceEnd || task.attendanceStart)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {tasks.length === 0 && (
        <div className="text-center py-10">
          <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any tasks assigned yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default Tasks;
