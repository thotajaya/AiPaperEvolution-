// pages/Login.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExamContext } from '../context/ExamContext';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setFacultyName } = useContext(ExamContext);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const facultyId = result.user._id;
        const facultyEmail = result.user.email;
        const facultyName = facultyEmail.split('@')[0];

        localStorage.setItem('facultyId', facultyId);
        localStorage.setItem('facultyName', facultyName);
        localStorage.setItem('facultyEmail', facultyEmail); // ✅ <-- Add this


        setFacultyName(facultyName);

        navigate('/examsetup'); // ✅ Navigate after login
      } else {
        setError(result.message || 'Login failed. Try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <img
          src="/images/aditya1-logo.png"
          alt="Aditya Engineering College Logo"
          className="college-logo"
        />
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Faculty Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="login-password-field">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)}>👁</button>
      </div>

      {error && <p className="error">{error}</p>}

      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p>New user? <Link to="/signup">Signup</Link></p>
    </div>
  );
};

export default Login;
