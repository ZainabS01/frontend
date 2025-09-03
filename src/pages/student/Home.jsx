import { FiUser, FiCalendar, FiCheckCircle, FiBookOpen } from 'react-icons/fi';

const Home = ({ profile, attendanceStats }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-[16px] font-bold text-gray-800">Welcome back, {profile?.name || 'Student'}!</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Info Card */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Student Name</p>
              <p className="text-[16px] font-semibold text-gray-900">{profile?.name|| 'N/A'}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiUser className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        {/* Semester Card */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Semester</p>
              <p className="text-[16px] font-semibold text-gray-900">
                {profile?.semester ? `Semester ${profile.semester}` : 'N/A'}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCalendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        {/* Attendance Summary Card */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance</p>
              <p className="text-[16px] font-semibold text-gray-900">
                {attendanceStats.present}/{attendanceStats.total} ({attendanceStats.percentage}%)
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>
    
      
    </div>
  );
};

export default Home;
