import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, Filter, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../contexts/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import 'react-datepicker/dist/react-datepicker.css';

export function TradeList() {
  useSEO({
    title: 'Dashboard | TradeLog',
    description: 'View and filter your complete trading history to analyze patterns and profitability.'
  });
  
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbSymbols, setDbSymbols] = useState([]);
  const [dbIndicators, setDbIndicators] = useState([]);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    symbol_id: '',
    direction: '',
    indicator_id: ''
  });

  useEffect(() => {
    if (user) {
      loadTrades();
      loadRefs();
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

  const loadRefs = async () => {
    try {
      const [syms, inds] = await Promise.all([
        tradeService.getSymbols(),
        tradeService.getIndicators()
      ]);
      setDbSymbols(syms);
      setDbIndicators(inds);
    } catch (err) {
      console.error("Failed to load DB refs:", err);
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

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      symbol_id: '',
      direction: '',
      indicator_id: ''
    });
  };

  // Filter the trades list dynamically
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      let match = true;
      
      if (filters.startDate) {
        if (new Date(trade.entry_time) < filters.startDate) match = false;
      }
      
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(trade.entry_time) > endOfDay) match = false;
      }
      
      if (filters.symbol_id) {
        if (trade.symbol_id !== filters.symbol_id) match = false;
      }
      
      if (filters.direction) {
        if (!trade.direction || !trade.direction.includes(filters.direction)) match = false;
      }
      
      if (filters.indicator_id) {
        if (!trade.indicators || !trade.indicators.includes(filters.indicator_id)) match = false;
      }
      
      return match;
    });
  }, [trades, filters]);

  // React Select Styles
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      color: '#ffffff',
      boxShadow: state.isFocused ? '0 0 0 2px var(--accent-primary)' : 'none',
      '&:hover': {
        border: '1px solid rgba(255, 255, 255, 0.2)'
      },
      minHeight: '42px'
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#161b22',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 9999
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'rgba(56, 139, 253, 0.15)' : 'transparent',
      color: '#c9d1d9',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'rgba(56, 139, 253, 0.3)'
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#ffffff'
    }),
    input: (provided) => ({
      ...provided,
      color: '#ffffff'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'rgba(255,255,255,0.4)'
    })
  };

  const symbolOptions = dbSymbols.map(s => ({ value: s.id, label: `${s.name} (${s.asset_class})` }));
  const directionOptions = [
    { value: 'BUY', label: 'BUY' },
    { value: 'SELL', label: 'SELL' }
  ];
  const indicatorOptions = dbIndicators.map(i => ({ value: i.id, label: i.name }));

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Trade History</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} /> Filters
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard/trades/new')}
          >
            <Plus size={18} /> New Trade
          </button>
        </div>
      </header>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Filter Trades</h3>
            <button className="icon-btn" onClick={clearFilters} title="Clear Filters" style={{ color: 'var(--text-secondary)' }}>
              <X size={18} /> <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>Clear All</span>
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Date Range */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Start Date</label>
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                dateFormat="MMM d, yyyy"
                className="input-field full-width-date"
                placeholderText="Select start date"
                isClearable
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>End Date</label>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                dateFormat="MMM d, yyyy"
                className="input-field full-width-date"
                placeholderText="Select end date"
                isClearable
              />
            </div>

            {/* Symbol */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Symbol</label>
              <Select
                options={symbolOptions}
                value={symbolOptions.find(opt => opt.value === filters.symbol_id) || null}
                onChange={(option) => setFilters(prev => ({ ...prev, symbol_id: option ? option.value : '' }))}
                styles={customSelectStyles}
                placeholder="Any Symbol"
                isClearable
                isSearchable
              />
            </div>

            {/* Direction */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Direction</label>
              <Select
                options={directionOptions}
                value={directionOptions.find(opt => opt.value === filters.direction) || null}
                onChange={(option) => setFilters(prev => ({ ...prev, direction: option ? option.value : '' }))}
                styles={customSelectStyles}
                placeholder="Any Direction"
                isClearable
              />
            </div>

            {/* Indicator */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Indicator Used</label>
              <Select
                options={indicatorOptions}
                value={indicatorOptions.find(opt => opt.value === filters.indicator_id) || null}
                onChange={(option) => setFilters(prev => ({ ...prev, indicator_id: option ? option.value : '' }))}
                styles={customSelectStyles}
                placeholder="Any Indicator"
                isClearable
                isSearchable
              />
            </div>
          </div>
        </div>
      )}

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
            ) : filteredTrades.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  {trades.length === 0 ? 'No trades recorded yet. Time to hit the markets!' : 'No trades match your filters.'}
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade) => (
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
                        onClick={(e) => { e.stopPropagation(); handleRowClick(trade.id); }}
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
          Showing {filteredTrades.length} of {trades.length} trades
        </div>
      )}
    </div>
  );
}
