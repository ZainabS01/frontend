import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAndGetRole } from '../firebaseAuth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import logo from '../assets/logo.jpg';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // ✅ Auto-redirect if already logged in
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const storedProfile = localStorage.getItem('user');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { user, profile } = await loginAndGetRole(form.email, form.password);
      if (profile) {
        const token = await user.getIdToken();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(profile));

        if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setMessage('User profile not found.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={logo} 
              alt="GGCP Logo" 
              className="h-20 w-20 rounded-full border-4 border-blue-100 shadow-md"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">GGCP CS Department</h1>
          <p className="text-gray-600">Student Portal</p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} autoComplete="on" className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                name="email" 
                id="login-email" 
                autoComplete="username" 
                type="email" 
                placeholder="Enter your email" 
                value={form.email} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
               
              </div>
              <input 
                name="password" 
                id="login-password" 
                autoComplete="current-password" 
                type="password" 
                placeholder="Enter your password" 
                value={form.password} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Sign In
            </button>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('failed') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {message}
              </div>
            )}

            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                Create account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
