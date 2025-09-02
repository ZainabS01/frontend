import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-black via-gray-900 to-brand-blue px-4">
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-card w-full max-w-2xl p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-black tracking-tight">GGCP CS Department</h1>
        <p className="mt-3 text-gray-700">Welcome to the attendance and task portal.</p>
        <div className="mt-6">
          <Link to="/login" className="inline-block bg-brand-blue text-white px-6 py-2.5 rounded-md hover:bg-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}


