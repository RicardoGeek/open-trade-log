import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Calendar, TrendingUp, ImageIcon } from 'lucide-react';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../contexts/AuthContext';

export function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trade, setTrade] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && id) {
      tradeService.getTradeById(id, user.id)
        .then(data => setTrade(data))
        .catch(err => setErrorMsg(err.message));
    }
  }, [id, user]);

  if (errorMsg) {
    return <div style={{ padding: '2rem', color: 'var(--loss-color)' }}>Error: {errorMsg}</div>;
  }

  if (!trade) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading trade details...</div>;
  }

  const isProfit = trade.pnl >= 0;
  const attachedIndicators = trade.indicatorConfigs || [];

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="icon-btn" onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="page-title">
            <span style={{
              color: trade.direction?.includes('BUY') ? 'var(--profit-color)' : 
                     trade.direction?.includes('SELL') ? 'var(--loss-color)' : 'inherit',
              marginRight: '0.5rem'
            }}>{trade.direction}</span> 
            {trade.symbols?.name || 'Unknown'}
          </h1>
          <span style={{ 
            fontSize: '1rem', 
            padding: '0.2rem 0.8rem', 
            borderRadius: '1rem', 
            background: isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isProfit ? 'var(--profit-color)' : 'var(--loss-color)',
            fontWeight: 600
          }}>
            {isProfit ? 'WIN' : 'LOSS'}
          </span>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(`/dashboard/trades/${id}/edit`)}>
          <Edit2 size={18} /> Edit
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        
        {/* Left Side: Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16}/> Outcome
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>P&L</span>
              <span className={isProfit ? 'text-profit' : 'text-loss'} style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {isProfit ? '+' : ''}${trade.pnl || '0'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pips</span>
              <span className={isProfit ? 'text-profit' : 'text-loss'} style={{ fontWeight: 600 }}>
                {isProfit ? '+' : ''}{trade.pips != null ? Number(trade.pips).toFixed(2) : '0.00'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Pip Value</span>
              <span>${trade.pip_value || '0'}</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16}/> Execution
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Trade Size</div>
              <div style={{ fontWeight: 500 }}>{trade.trade_size || '1'} Lot(s)</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Entry</div>
              <div style={{ fontWeight: 500 }}>{trade.entry_price}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(trade.entry_time).toLocaleString()}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Exit</div>
              <div style={{ fontWeight: 500 }}>{trade.exit_price || 'N/A'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{trade.exit_time ? new Date(trade.exit_time).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Right Side: Visuals & Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {trade.screenshot_url ? (
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <img 
                src={trade.screenshot_url} 
                alt="Trade Setup" 
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          ) : (
             <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>No screenshot attached.</p>
             </div>
          )}

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Notes & Setup</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Indicators</span>
              
              {attachedIndicators.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
                  {attachedIndicators.map(ind => (
                    <div key={ind.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
                      <strong style={{ display: 'block', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                        {ind.indicators?.name || 'Unknown Indicator'}
                      </strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {Object.entries(ind.recorded_values || {}).map(([key, value]) => (
                          <div key={key}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key}: </span>
                            <span>{value.toString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px' }}>
                  No indicators recorded.
                </p>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Journal Entry</span>
              <p style={{ marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '8px', lineHeight: 1.6 }}>
                {trade.notes || 'No journal notes provided.'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
