import { FiCheckCircle, FiXCircle, FiClock, FiCalendar } from 'react-icons/fi';

const Attendance = ({ myAttendance, tasks, markAttendanceForTask, busyTask, formatDate }) => {
  // Helper function to check if attendance is marked for a task
  const isAttendanceMarked = (taskId) => {
    return myAttendance.some(a => a.taskId === taskId);
  };

  // Get attendance status for a task
  const getAttendanceStatus = (taskId) => {
    const attendance = myAttendance.find(a => a.taskId === taskId);
    if (!attendance) return null;
    return attendance.status;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
      
      {/* Attendance Summary */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {myAttendance.filter(a => a.status === 'present').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {myAttendance.filter(a => a.status === 'absent').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tasks.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiCalendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Attendance */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Attendance</h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500">No upcoming attendance sessions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => {
                  const isMarked = isAttendanceMarked(task._id);
                  const status = getAttendanceStatus(task._id);
                  
                  return (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(task.attendanceStart)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isMarked ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {status === 'present' ? 'Present' : 'Absent'}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!isMarked ? (
                          <button
                            onClick={() => markAttendanceForTask(task)}
                            disabled={busyTask[task._id]}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            {busyTask[task._id] ? 'Marking...' : 'Mark Attendance'}
                          </button>
                        ) : (
                          <span className="text-gray-500">Attendance marked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Attendance History */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance History</h2>
        {myAttendance.length === 0 ? (
          <p className="text-gray-500">No attendance records found.</p>
        ) : (
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
                {myAttendance.map((attendance) => {
                  const task = tasks.find(t => t._id === attendance.taskId);
                  return (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {task?.title || 'Task not found'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(attendance.markedAt || attendance.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attendance.status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attendance.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
