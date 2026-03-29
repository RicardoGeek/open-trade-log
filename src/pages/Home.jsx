import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, Activity, Target, BookOpen } from 'lucide-react';
import './Home.css'; // Let's use scoped styling for complex pages

export function Home() {
  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="logo text-gradient"><Target size={24} /> TradeLog</div>
        <Link to="/auth" className="btn btn-outline">Login / Register</Link>
      </nav>
      
      <main className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Master Your Edge with <br/><span className="text-gradient">TradeLog</span></h1>
          <p className="hero-subtitle">
            The ultimate journal for serious traders. Record symbol, entries, exits, P&L, indicator values, and screenshots. Watch your strategy evolve.
          </p>
          <div className="hero-actions">
            <Link to="/auth" className="btn btn-primary">Start Journaling <ArrowRight size={18}/></Link>
          </div>
        </div>
        
        <div className="features-grid">
          <div className="glass-panel feature-card">
            <BarChart2 className="feature-icon" color="var(--profit-color)" />
            <h3>Automatic Calculations</h3>
            <p>Automatically calculates your pips, pip value, and overall P&L based on your entry and exit points.</p>
          </div>
          <div className="glass-panel feature-card">
            <Activity className="feature-icon" color="var(--accent-primary)" />
            <h3>Indicator Tracking</h3>
            <p>Keep a historical record of indicator values like RSI, MACD, and price action setups at the exact moment of your trade.</p>
          </div>
          <div className="glass-panel feature-card">
            <BookOpen className="feature-icon" color="#f59e0b" />
            <h3>Visual Evidence</h3>
            <p>Attach screenshots of your chart setups and write detailed personal notes to review your execution.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
