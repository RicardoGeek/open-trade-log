import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { User, Mail, Lock, Save } from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

export function Settings() {
  useSEO({
    title: 'Settings | TradeLog',
    description: 'Manage your TradeLog account settings and update your profile information.'
  });
  
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMSG, setErrorMSG] = useState('');

  const username = user?.user_metadata?.username || 'N/A';
  const email = user?.email || 'N/A';

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setErrorMSG('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setErrorMSG('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorMSG('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setMessage('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMSG(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
      </header>

      {/* Profile Info Section */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Profile Information</h2>
        
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Username</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.8rem 1rem', borderRadius: '8px' }}>
              <User size={18} style={{ marginRight: '0.8rem', color: 'var(--text-secondary)' }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{username}</span>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Registered Email</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.8rem 1rem', borderRadius: '8px' }}>
              <Mail size={18} style={{ marginRight: '0.8rem', color: 'var(--text-secondary)' }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Section */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Change Password</h2>
        
        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--profit-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {message}
          </div>
        )}
        
        {errorMSG && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--loss-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {errorMSG}
          </div>
        )}

        <form onSubmit={handlePasswordReset}>
          <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.8rem' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.8rem' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <Save size={18} /> {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
