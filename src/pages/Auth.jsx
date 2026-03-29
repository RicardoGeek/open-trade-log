import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Lock, Mail, User } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import './Auth.css';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState('');
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMSG('');

    if (isLogin) {
      // Sign In Flow
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMSG(error.message);
      } else {
        navigate('/dashboard');
      }

    } else {
      // Sign Up Flow
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) {
        setErrorMSG(error.message);
      } else {
        navigate('/thank-you');
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <Link to="/" className="auth-logo text-gradient"><Target size={28} /> TradeLog</Link>
      
      <div className="glass-panel auth-card">
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setErrorMSG(''); }}
          >
            Login
          </button>
          <button 
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setErrorMSG(''); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          
          {errorMSG && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--loss-color)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {errorMSG}
            </div>
          )}

          {!isLogin && (
            <div className="input-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User className="input-icon" size={18} />
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  placeholder="trader123" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                required 
                className="input-field" 
                placeholder="trader@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                required 
                className="input-field" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading} style={{opacity: loading ? 0.7 : 1}}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}
