import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    setError('');

    const isValidEmail = /\S+@\S+\.\S+/.test(email);
    if (!email.trim() || !password.trim()) {
      setError('Please fill out all fields.');
      return;
    }
    if (!isValidEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Signup successful! Please login.');
        navigate('/login');
      } else {
        setError(result.message || 'Signup failed. Try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <img
        src="/images/aditya1-logo.png"
        alt="Aditya Engineering College Logo"
        className="college-logo"
      />
      <h2>Signup</h2>

      <input
        type="email"
        placeholder="Faculty Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="signup-password-field">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)}>👁</button>
      </div>

      {error && <p className="error">{error}</p>}

      <button onClick={handleSignup} disabled={loading}>
        {loading ? 'Signing up...' : 'Signup'}
      </button>

      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
};

export default Signup;
