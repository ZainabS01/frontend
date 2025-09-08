import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="md:flex">
          {/* Left Side - Welcome Content */}
          <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-center">
            <div className="flex justify-center md:justify-start mb-6">
              <img 
                src={logo} 
                alt="GGCP Logo" 
                className="h-24 w-24 rounded-full border-4 border-blue-100 shadow-md"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">GGCP CS Department</h1>
            <p className="text-gray-600 mb-8">Welcome to the Computer Science Department Portal</p>
            <div className="space-y-4">
              <Link 
                to="/login" 
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors shadow-md hover:shadow-lg"
              >
                Student Login
              </Link>
             
            </div>
          </div>
          
          {/* Right Side - Decorative */}
          <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
            <div className="h-full flex flex-col justify-center items-center text-center">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl w-full max-w-xs">
                <h2 className="text-2xl font-bold mb-4">Features</h2>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center">
                    <span className="bg-white/30 p-1 rounded-full mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Attendance Management
                  </li>
                  <li className="flex items-center">
                    <span className="bg-white/30 p-1 rounded-full mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Task Submissions
                  </li>
                  <li className="flex items-center">
                    <span className="bg-white/30 p-1 rounded-full mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Real-time Updates
                  </li>
                  <li className="flex items-center">
                    <span className="bg-white/30 p-1 rounded-full mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Secure Access
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


