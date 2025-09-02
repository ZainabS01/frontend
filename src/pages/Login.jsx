import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAndGetRole } from '../firebaseAuth';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { user, profile } = await loginAndGetRole(form.email, form.password);
      if (profile) {
        // Store both the user token and profile
        const token = await user.getIdToken();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(profile));
        
        // Redirect based on role
        if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-black via-gray-900 to-brand-blue px-4">
      <form onSubmit={handleSubmit} autoComplete="on" className="bg-white/95 backdrop-blur rounded-xl shadow-card w-full max-w-md p-6 md:p-8">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-brand-black tracking-tight">Welcome to GGCP CS Department</h2>
        <input name="email" id="login-email" autoComplete="username" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="mb-4 w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60" />
        <input name="password" id="login-password" autoComplete="current-password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="mb-2 w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60" />
        <div className="mb-4 text-right">
          <Link to="/forgot" className="text-sm text-brand-blue hover:underline">Forgot password?</Link>
         </div>
        <button type="submit" className="w-full bg-brand-blue text-white py-2.5 rounded-md hover:bg-blue-700 transition-colors">Login</button>
        {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}
        <p className="mt-4 text-center text-sm">Don't have an account? <Link to="/signup" className="text-brand-blue hover:underline font-medium">Sign up</Link></p>
      </form>
    </div>
  );
}
