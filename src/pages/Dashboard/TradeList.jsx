import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, ImageIcon } from 'lucide-react';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../contexts/AuthContext';

export function TradeList() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTrades();
    }
  }, [user]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const data = await tradeService.getTrades(user.id);
      setTrades(data || []);
    } catch (err) {
      console.error('Error loading trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await tradeService.deleteTrade(id, user.id);
        loadTrades();
      } catch (err) {
        alert('Failed to delete trade: ' + err.message);
      }
    }
  };

  const handleRowClick = (id) => {
    navigate(`/dashboard/trades/${id}`);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Trade History</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/dashboard/trades/new')}
        >
          <Plus size={18} /> New Trade
        </button>
      </header>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Direction</th>
              <th>Entry Date</th>
              <th>Entry Price</th>
              <th>Exit Price</th>
              <th>Pips</th>
              <th>P&L</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Loading trades...
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No trades recorded yet. Time to hit the markets!
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} onClick={() => handleRowClick(trade.id)} style={{cursor: 'pointer'}}>
                  <td style={{fontWeight: 600}}>{trade.symbols?.name || trade.symbol || 'Unknown'}</td>
                  <td style={{
                    color: trade.direction?.includes('BUY') ? 'var(--profit-color)' : 
                           trade.direction?.includes('SELL') ? 'var(--loss-color)' : 'inherit',
                    fontWeight: 500
                  }}>
                    {trade.direction}
                  </td>
                  <td>{new Date(trade.entry_time).toLocaleDateString()}</td>
                  <td>{trade.entry_price}</td>
                  <td>{trade.exit_price || '-'}</td>
                  <td className={trade.pips >= 0 ? 'text-profit' : 'text-loss'}>
                    {trade.pips > 0 ? '+' : ''}{trade.pips != null ? Number(trade.pips).toFixed(2) : '-'}
                  </td>
                  <td className={trade.pnl >= 0 ? 'text-profit' : 'text-loss'} style={{fontWeight: 600}}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl || '-'}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button 
                        className="icon-btn" 
                        title="View Details"
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/trades/${trade.id}`); }}
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="icon-btn danger" 
                        title="Delete Trade"
                        onClick={(e) => handleDelete(e, trade.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && trades.length > 0 && (
        <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'right' }}>
          Showing 1 to {trades.length} of {trades.length} trades
        </div>
      )}
    </div>
  );
}
