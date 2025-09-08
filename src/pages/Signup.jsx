import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupWithRole } from '../firebaseAuth';
import logo from '../assets/logo.jpg';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', semester: '', phone: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      setForm({ ...form, phone: digits });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);
    try {
      // Client-side validations
      if (form.phone && !/^03\d{9}$/.test(form.phone)) {
        throw new Error('Phone must start with 03 and be 11 digits');
      }
      if (!/[!@#$%^&*()]/.test(form.password)) {
        throw new Error('Password must include at least one special character: ! @ # $ % ^ & * ( )');
      }
      if (form.password !== form.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      // Firebase Auth signup and Firestore profile
      await signupWithRole(form.email, form.password, {
        name: form.name,
        semester: form.semester ? Number(form.semester) : undefined,
        phone: form.phone || undefined,
      });
      setMessage({
        text: 'Signup successful! Redirecting to login...',
        type: 'success',
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMessage({
        text: error.message || 'Failed to sign up. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
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
        
        {/* Signup Form */}
        <form onSubmit={handleSubmit} autoComplete="on" className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="space-y-4">
            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {message.text}
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                name="name" 
                id="name" 
                type="text" 
                required 
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                name="email" 
                id="email" 
                type="email" 
                required 
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (03XXXXXXXXX)</label>
              <input 
                name="phone" 
                id="phone" 
                type="tel" 
                required 
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="03XXXXXXXXX"
                minLength={11}
                maxLength={11}
              />
              <p className="mt-1 text-xs text-gray-500">Must start with 03 and be 11 digits</p>
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select 
                name="semester" 
                id="semester" 
                required 
                value={form.semester}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">3rd Semester</option>
                <option value="4">4th Semester</option>
                <option value="5">5th Semester</option>
                <option value="6">6th Semester</option>
                <option value="7">7th Semester</option>
                <option value="8">8th Semester</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                name="password" 
                id="password" 
                type="password" 
                required 
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Create a password"
                minLength={6}
                pattern="^(?=.*[!@#$%^&*()]).{6,}$"
              />
              <p className="mt-1 text-xs text-gray-500">Must be 6+ characters and include at least one special character: ! @ # $ % ^ & * ( )</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                name="confirmPassword" 
                id="confirmPassword" 
                type="password" 
                required 
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
