import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, X, Plus, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useDropzone } from 'react-dropzone';
import Select from 'react-select';
import { tradeService } from '../../services/tradeService';
import { useAuth } from '../../contexts/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import 'react-datepicker/dist/react-datepicker.css';
import './TradeForm.css';

export function TradeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  useSEO({
    title: isEditing ? 'Edit Trade | TradeLog' : 'New Trade | TradeLog',
    description: 'Record or edit trade details including entry price, exit price, and technical indicators.'
  });

  // React Select Theme specific for glassmorphism
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
      minHeight: '42px' // matches other inputs roughly
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#161b22', // close to github dark mode generic
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

  // DB reference state
  const [dbSymbols, setDbSymbols] = useState([]);
  const [dbIndicators, setDbIndicators] = useState([]);

  // Core Trade Data
  const [formData, setFormData] = useState({
    symbol_id: '',
    direction: '',
    trade_size: '',
    entry_price: '',
    exit_price: '',
    entry_time: new Date(),
    exit_time: new Date(),
    notes: '',
    pnl: '',
    pip_value: '',
    screenshot_url: ''
  });

  // Complex Indicator Data
  // Format: [{ id: uuid, indicator_id: '', params: [{key: '', value: ''}] }]
  const [configuredIndicators, setConfiguredIndicators] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch reference data instantly
  useEffect(() => {
    async function loadRefs() {
      try {
        const [syms, inds] = await Promise.all([
          tradeService.getSymbols(),
          tradeService.getIndicators()
        ]);
        setDbSymbols(syms);
        setDbIndicators(inds);
        
        // Initial state is blank so user has to explicitly search/select
      } catch (err) {
        console.error("Failed to load DB refs:", err);
      }
    }
    loadRefs();
  }, [formData.symbol_id, isEditing]);

  // 2. Load trade if editing
  useEffect(() => {
    if (isEditing && user) {
      tradeService.getTradeById(id, user.id).then(data => {
        if (data) {
          setFormData({
            symbol_id: data.symbol_id || '',
            direction: data.direction || 'BUY',
            trade_size: data.trade_size || '',
            entry_price: data.entry_price || '',
            exit_price: data.exit_price || '',
            entry_time: data.entry_time ? new Date(data.entry_time) : new Date(),
            exit_time: data.exit_time ? new Date(data.exit_time) : new Date(),
            notes: data.notes || '',
            pnl: data.pnl !== null ? data.pnl : '',
            pip_value: data.pip_value || '',
            screenshot_url: data.screenshot_url || ''
          });

          // Reconstruct UI indicator array
          if (data.indicatorConfigs) {
            const mapped = data.indicatorConfigs.map(iconf => {
              const params = Object.entries(iconf.recorded_values || {}).map(([k, v]) => ({
                key: k, value: v.toString()
              }));
              return {
                id: Math.random().toString(36),
                indicator_id: iconf.indicator_id,
                params: params.length > 0 ? params : [{ key: '', value: '' }]
              };
            });
            setConfiguredIndicators(mapped);
          }
        }
      });
    }
  }, [id, user, isEditing]);

  // 3. Smart Symbol Multiplier & Size Fetcher
  useEffect(() => {
    if (!user || isEditing) return; // Don't override if editing an existing trade
    
    if (!formData.symbol_id) {
       // Clear fields if no symbol selected
       setFormData(prev => ({ ...prev, pip_value: '', trade_size: '', pnl: '' }));
       return;
    }

    let isMounted = true;
    async function fetchPreference() {
       const pref = await tradeService.getUserSymbolPreference(user.id, formData.symbol_id);
       if (isMounted) {
         if (pref !== null) {
           setFormData(prev => ({ ...prev, pip_value: pref.pip_value, trade_size: pref.trade_size || prev.trade_size }));
         } else {
           // Fallbacks
           const sym = dbSymbols.find(s => s.id === formData.symbol_id);
           const fallback = sym?.asset_class === 'FOREX' ? 10 : 100;
           setFormData(prev => ({ ...prev, pip_value: fallback, trade_size: '' }));
         }
       }
    }
    fetchPreference();
    return () => { isMounted = false; };
  }, [formData.symbol_id, user, isEditing, dbSymbols]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, name) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  // Real file upload logic
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setScreenshotFile(file);
      setFormData(prev => ({ 
        ...prev, 
        screenshot_url: URL.createObjectURL(file) 
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false });

  // react-select formatted options
  const symbolOptions = dbSymbols.map(s => ({ value: s.id, label: `${s.name} (${s.asset_class})` }));
  const directionOptions = [
    { value: 'BUY', label: 'BUY' },
    { value: 'SELL', label: 'SELL' },
    { value: 'PENDING BUY', label: 'PENDING BUY' },
    { value: 'PENDING SELL', label: 'PENDING SELL' },
    { value: 'LIMIT BUY', label: 'LIMIT BUY' },
    { value: 'LIMIT SELL', label: 'LIMIT SELL' }
  ];
  const indicatorOptions = dbIndicators.map(i => ({ value: i.id, label: i.name }));

  // UI calculations
  const calculatePips = (entry, exit, direction, symbol_id) => {
    if (!entry || !exit || !symbol_id) return 0;
    const sym = dbSymbols.find(s => s.id === symbol_id);
    if (!sym) return 0;
    
    const diff = parseFloat(exit) - parseFloat(entry);
    const trueDiff = direction.includes('SELL') ? -diff : diff;

    // Standardize points vs pips based on asset class
    if (sym.asset_class === 'FOREX') {
       const isJpy = sym.name.includes('JPY');
       const multiplier = isJpy ? 100 : 10000;
       return trueDiff * multiplier;
    }
    
    // For Indices, Commodities, Crypto, etc. we use the raw difference as "points"
    return trueDiff;
  };

  // Live Auto-calc Effect
  useEffect(() => {
    if (formData.entry_price && formData.exit_price && formData.trade_size && formData.symbol_id) {
       const pips = calculatePips(formData.entry_price, formData.exit_price, formData.direction, formData.symbol_id);
       const lots = parseFloat(formData.trade_size);
       const sym = dbSymbols.find(s => s.id === formData.symbol_id);
       
       let currentPipValue = parseFloat(formData.pip_value);
       if (isNaN(currentPipValue)) {
          currentPipValue = sym?.asset_class === 'FOREX' ? 10 : 100;
       }

       const calculatedPnl = pips * lots * currentPipValue;
       
       // Only forcefully overwrite if the math changed from underlying variables
       const currentPnl = parseFloat(formData.pnl) || 0;
       if (Math.abs(calculatedPnl - currentPnl) > 0.01) {
          setFormData(prev => ({ ...prev, pnl: calculatedPnl.toFixed(2) }));
       }
    }
  }, [formData.entry_price, formData.exit_price, formData.trade_size, formData.pip_value, formData.direction, formData.symbol_id, dbSymbols]);

  // Configured Indicators Handlers
  const addIndicatorBlock = () => {
    setConfiguredIndicators([
      ...configuredIndicators, 
      { id: Math.random().toString(36), indicator_id: '', params: [{key: '', value: ''}] }
    ]);
  };

  const updateIndicatorSelection = (blockId, indId) => {
    setConfiguredIndicators(list => list.map(b => b.id === blockId ? { ...b, indicator_id: indId } : b));
  };

  const removeIndicatorBlock = (blockId) => {
    setConfiguredIndicators(list => list.filter(b => b.id !== blockId));
  };

  const handleParamChange = (blockId, paramIndex, field, val) => {
    setConfiguredIndicators(list => list.map(b => {
      if (b.id !== blockId) return b;
      const newParams = [...b.params];
      newParams[paramIndex][field] = val;
      return { ...b, params: newParams };
    }));
  };

  const addParamToBlock = (blockId) => {
    setConfiguredIndicators(list => list.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, params: [...b.params, { key: '', value: '' }] };
    }));
  };

  const removeParamFromBlock = (blockId, paramIndex) => {
    setConfiguredIndicators(list => list.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, params: b.params.filter((_, i) => i !== paramIndex) };
    }));
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      setUploadingStatus('');
      let finalUrl = formData.screenshot_url;

      if (!formData.symbol_id) throw new Error("A symbol must be selected.");
      if (!formData.direction) throw new Error("A direction must be selected.");
      if (!formData.trade_size) throw new Error("A trade size must be entered.");

      if (screenshotFile) {
        setUploadingStatus('Uploading image...');
        finalUrl = await tradeService.uploadScreenshot(screenshotFile, user.id);
      }

      setUploadingStatus('Saving trade...');

      const submissionData = {
        ...formData,
        entry_time: formData.entry_time?.toISOString() || null,
        exit_time: formData.exit_time?.toISOString() || null
      };

      const sym = dbSymbols.find(s => s.id === formData.symbol_id);
      let currentPipValue = parseFloat(submissionData.pip_value);
      if (isNaN(currentPipValue)) {
         currentPipValue = sym?.asset_class === 'FOREX' ? 10 : 100;
      }

      const finalPips = calculatePips(submissionData.entry_price, submissionData.exit_price, submissionData.direction, submissionData.symbol_id);
      
      // Trust the UI's pnl value which could be user overrode or auto-calculated
      const finalPnl = submissionData.pnl ? parseFloat(submissionData.pnl) : (finalPips * (parseFloat(submissionData.trade_size) || 1) * currentPipValue);
      
      const coreTradePayload = {
        symbol_id: submissionData.symbol_id,
        direction: submissionData.direction,
        trade_size: submissionData.trade_size ? parseFloat(submissionData.trade_size) : null,
        entry_price: parseFloat(submissionData.entry_price),
        exit_price: submissionData.exit_price ? parseFloat(submissionData.exit_price) : null,
        entry_time: submissionData.entry_time,
        exit_time: submissionData.exit_time,
        notes: submissionData.notes,
        screenshot_url: finalUrl,
        pips: finalPips,
        pnl: finalPnl,
        pip_value: currentPipValue,
      };

      // Zip the UI params into JSON dictionaries for the DB
      const formattedIndicators = configuredIndicators
        .filter(ind => ind.indicator_id)
        .map(ind => {
          const dict = {};
          ind.params.forEach(p => {
            if (p.key.trim() !== '') {
               // Try to parse numbers, else string
               const n = Number(p.value);
               dict[p.key.trim()] = isNaN(n) ? p.value : n;
            }
          });
          return { indicator_id: ind.indicator_id, recorded_values: dict };
        });

      if (isEditing) {
        await tradeService.updateTrade(id, user.id, coreTradePayload, formattedIndicators);
        navigate(`/dashboard/trades/${id}`);
      } else {
        await tradeService.addTrade(coreTradePayload, user.id, formattedIndicators);
        navigate('/dashboard');
      }

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      <header className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Trade' : 'Record New Trade'}</h1>
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
      </header>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--loss-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass-panel form-container" style={{ padding: '2rem', marginBottom: '2rem', zIndex: 20, position: 'relative' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Trade Basics</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Symbol</label>
              <Select
                options={symbolOptions}
                value={symbolOptions.find(opt => opt.value === formData.symbol_id) || null}
                onChange={(option) => {
                  setFormData(prev => ({ ...prev, symbol_id: option ? option.value : '' }));
                }}
                styles={customSelectStyles}
                placeholder="Search symbol..."
                isClearable
                isSearchable
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Direction</label>
              <Select
                options={directionOptions}
                value={directionOptions.find(opt => opt.value === formData.direction) || null}
                onChange={(option) => {
                  setFormData(prev => ({ ...prev, direction: option ? option.value : '' }));
                }}
                styles={customSelectStyles}
                placeholder="Select direction..."
                isClearable
                isSearchable
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Entry Price</label>
              <input required type="number" step="0.00001" name="entry_price" value={formData.entry_price} onChange={handleChange} className="input-field" placeholder="1.08500" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Exit Price</label>
              <input type="number" step="0.00001" name="exit_price" value={formData.exit_price} onChange={handleChange} className="input-field" placeholder="1.09000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Trade Size (Lots)</label>
              <input type="number" step="0.01" name="trade_size" value={formData.trade_size} onChange={handleChange} className="input-field" placeholder="1.0" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Contract Multiplier</label>
              <input type="number" step="0.01" name="pip_value" value={formData.pip_value} onChange={handleChange} className="input-field" placeholder="Auto" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>P&amp;L (Override)</label>
              <input type="number" step="0.01" name="pnl" value={formData.pnl} onChange={handleChange} className="input-field" placeholder="e.g. 500" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Entry Time</label>
              <DatePicker
                selected={formData.entry_time}
                onChange={(date) => handleDateChange(date, 'entry_time')}
                showTimeSelect
                timeFormat="HH:mm"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="input-field full-width-date"
              />
            </div>
            <div className="input-group">
              <label>Exit Time</label>
              <DatePicker
                selected={formData.exit_time}
                onChange={(date) => handleDateChange(date, 'exit_time')}
                showTimeSelect
                timeFormat="HH:mm"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="input-field full-width-date"
              />
            </div>
          </div>
        </div>

        {/* Indicators Section */}
        <div className="glass-panel form-container" style={{ padding: '2rem', marginBottom: '2rem', zIndex: 10, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Indicator Confluences</h2>
            <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }} onClick={addIndicatorBlock}>
              <Plus size={16} /> Add Indicator
            </button>
          </div>

          {configuredIndicators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              No indicators attached to this trade.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {configuredIndicators.map((block) => (
                <div key={block.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', position: 'relative' }}>
                  <button type="button" onClick={() => removeIndicatorBlock(block.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="input-group" style={{ maxWidth: '300px' }}>
                    <label>Indicator Type</label>
                    <Select
                      options={indicatorOptions}
                      value={indicatorOptions.find(opt => opt.value === block.indicator_id) || null}
                      onChange={(option) => updateIndicatorSelection(block.id, option ? option.value : '')}
                      styles={customSelectStyles}
                      isSearchable
                      placeholder="Search indicator..."
                    />
                  </div>

                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Parameters</label>
                  {block.params.map((param, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <input type="text" value={param.key} onChange={(e) => handleParamChange(block.id, pIdx, 'key', e.target.value)} className="input-field" placeholder="key (e.g. 'upper_band')" style={{ flex: 1 }} />
                      <input type="text" value={param.value} onChange={(e) => handleParamChange(block.id, pIdx, 'value', e.target.value)} className="input-field" placeholder="value (e.g. '1.10')" style={{ flex: 1 }} />
                      <button type="button" onClick={() => removeParamFromBlock(block.id, pIdx)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--loss-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 0.5rem' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addParamToBlock(block.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                    + Add Parameter Key
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes & Upload Section */}
        <div className="glass-panel form-container" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Documentation</h2>
          
          <div className="input-group">
            <label>Setup Screenshot</label>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${formData.screenshot_url ? 'has-image' : ''}`}>
              <input {...getInputProps()} />
              {formData.screenshot_url ? (
                <div className="preview-container">
                  <img src={formData.screenshot_url} alt="Screenshot Preview" className="preview-image" />
                  <button type="button" className="icon-btn danger remove-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setScreenshotFile(null);
                      setFormData(prev => ({...prev, screenshot_url: ''})); 
                    }} 
                    title="Remove image">
                    <X size={20} />
                  </button>
                  {screenshotFile && <div className="preview-overlay">Pending Upload</div>}
                </div>
              ) : (
                <div className="dropzone-content">
                  <UploadCloud size={36} color="var(--accent-primary)" style={{marginBottom: '1rem'}} />
                  <p>Drag & drop a screenshot here, or click to browse</p>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>Personal Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field" rows="4" placeholder="What went well? What went wrong?"></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <span style={{ marginRight: '1rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>{uploadingStatus}</span>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{opacity: loading ? 0.7 : 1}}>
              <Save size={18} /> {loading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Record Trade')}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
