import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ParentLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/parent');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        animation: 'pop 0.4s ease-out'
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'bounce 2s ease-in-out infinite' }}>
            👨‍👩‍👧
          </div>
          <h1 style={{
            fontFamily: 'Fredoka One',
            fontSize: '2.5rem',
            color: 'white',
            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            Parent Portal
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
            ⭐ Chore Stars
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{
            fontFamily: 'Fredoka One',
            fontSize: '1.5rem',
            color: '#2D3047',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Sign In
          </h2>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: 12,
              marginBottom: '1rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: 12,
            fontSize: '0.85rem',
            color: '#166534'
          }}>
            <strong>Default login:</strong> admin / admin123<br />
            <em>Please change this after first login!</em>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}>
            ← Back to Kids Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
