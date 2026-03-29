import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';

export function ThankYou() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center'
    }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px' }}>
        <MailCheck size={64} color="var(--accent-primary)" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ marginBottom: '1rem' }}>Check your email</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          We've sent a confirmation token and link to your email address. Please follow the instructions to verify your account and access the dashboard.
        </p>
        <Link to="/dashboard" className="btn btn-outline" style={{width: '100%'}}>
          (Mock) Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
