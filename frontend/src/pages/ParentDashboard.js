import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from '../components/Toast';
import api from '../api';

const AVATARS = ['star', 'rocket', 'rainbow', 'dragon', 'unicorn', 'dinosaur', 'robot', 'superhero', 'mermaid', 'wizard', 'fairy', 'lion', 'penguin', 'panda', 'fox', 'bunny'];
const AVATAR_EMOJIS = { star: '⭐', rocket: '🚀', rainbow: '🌈', dragon: '🐲', unicorn: '🦄', dinosaur: '🦕', robot: '🤖', superhero: '🦸', mermaid: '🧜', wizard: '🧙', fairy: '🧚', lion: '🦁', penguin: '🐧', panda: '🐼', fox: '🦊', bunny: '🐰' };
const COLORS = ['#FF6B6B', '#4ECDC4', '#A855F7', '#6BCB77', '#FFE66D', '#FF69B4', '#45B7D1', '#FFA552', '#6366f1', '#ec4899'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FREQ_LABELS = { daily: '📅 Every Day', school_days: '🏫 School Days', weekend: '🎉 Weekends', specific_days: '📋 Specific Days', monthly: '🗓️ Monthly' };
const SCHOOL_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri
const WEEKEND_DAYS = [0, 6]; // Sun, Sat
const STATUS_CONFIG = {
  pending: { color: '#d97706', bg: '#fef3c7', icon: '⏳', label: 'Pending' },
  approved: { color: '#065f46', bg: '#d1fae5', icon: '✅', label: 'Approved' },
  rejected: { color: '#991b1b', bg: '#fee2e2', icon: '❌', label: 'Rejected' },
  redeemed: { color: '#5b21b6', bg: '#ede9fe', icon: '🎉', label: 'Redeemed' },
};

// ============= TAB NAV =============
function TabNav({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      background: 'white',
      padding: '0.5rem',
      borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      flexWrap: 'wrap'
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: '1 1 auto',
          padding: '0.65rem 1rem',
          borderRadius: 12,
          border: 'none',
          fontFamily: 'Nunito',
          fontWeight: 700,
          fontSize: '0.9rem',
          background: active === t.id ? 'linear-gradient(135deg, #FF6B6B, #FFA552)' : 'transparent',
          color: active === t.id ? 'white' : '#6b7280',
          transition: 'all 0.2s',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ============= CHILDREN MANAGEMENT =============
function ChildrenTab() {
  const [children, setChildren] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', avatar: 'star', color: '#FF6B6B' });

  const load = useCallback(async () => {
    const r = await api.get('/children');
    setChildren(r.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', avatar: 'star', color: '#FF6B6B' }); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, avatar: c.avatar, color: c.color }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast('Enter a name!', 'error');
    try {
      if (editing) {
        await api.put(`/children/${editing.id}`, form);
        toast('✅ Child updated!', 'success');
      } else {
        await api.post('/children', form);
        toast('🎉 Child added!', 'success');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast('Error saving', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}? This will delete all their chores and data.`)) return;
    try {
      await api.delete(`/children/${id}`);
      toast('Removed', 'info');
      load();
    } catch { toast('Error removing', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.5rem' }}>Children</h2>
        <button className="btn btn-primary" onClick={openCreate}>➕ Add Child</button>
      </div>

      {children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👶</div>
          <p style={{ color: '#6b7280' }}>No children added yet. Add your first child!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {children.map(c => (
            <div key={c.id} className="card" style={{ borderTop: `4px solid ${c.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: `${c.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem'
                }}>
                  {AVATAR_EMOJIS[c.avatar] || '⭐'}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1.3rem' }}>{c.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    ⭐ {c.available_points} available • {c.total_points} total
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-mint btn-sm" style={{ flex: 1 }} onClick={() => openEdit(c)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                {editing ? '✏️ Edit Child' : '➕ Add Child'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="Child's name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem' }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setForm(p => ({ ...p, avatar: a }))} style={{
                    padding: '0.4rem',
                    borderRadius: 8,
                    border: form.avatar === a ? '3px solid var(--coral)' : '2px solid transparent',
                    background: form.avatar === a ? '#fff0f0' : '#f9fafb',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    {AVATAR_EMOJIS[a]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Colour</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COLORS.map(col => (
                  <button key={col} onClick={() => setForm(p => ({ ...p, color: col }))} style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: col,
                    border: form.color === col ? '3px solid #374151' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    transform: form.color === col ? 'scale(1.2)' : 'scale(1)'
                  }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{
              background: `${form.color}15`,
              borderRadius: 12,
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
              border: `2px solid ${form.color}40`
            }}>
              <div style={{ fontSize: '2rem' }}>{AVATAR_EMOJIS[form.avatar]}</div>
              <div style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', color: form.color }}>
                {form.name || 'Preview'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
                {editing ? '💾 Save Changes' : '➕ Add Child'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= CHORES MANAGEMENT =============
function ChoresTab() {
  const [chores, setChores] = useState([]);
  const [children, setChildren] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', points: 10,
    frequency: 'daily', days_of_week: [], child_id: ''
  });

  const load = useCallback(async () => {
    const [c, ch] = await Promise.all([api.get('/chores'), api.get('/children')]);
    setChores(c.data);
    setChildren(ch.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', points: 10, frequency: 'daily', days_of_week: [], child_id: '' });
    setShowForm(true);
  };

  const openEdit = (chore) => {
    setEditing(chore);
    setForm({
      title: chore.title,
      description: chore.description || '',
      points: chore.points,
      frequency: chore.frequency,
      days_of_week: chore.days_of_week
        ? (typeof chore.days_of_week === 'string' ? JSON.parse(chore.days_of_week) : chore.days_of_week)
        : [],
      child_id: chore.child_id || ''
    });
    setShowForm(true);
  };

  const toggleDay = (d) => {
    setForm(p => ({
      ...p,
      days_of_week: p.days_of_week.includes(d)
        ? p.days_of_week.filter(x => x !== d)
        : [...p.days_of_week, d]
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast('Enter a chore title!', 'error');
    const payload = {
      ...form,
      child_id: form.child_id || null,
      days_of_week: (form.frequency === 'specific_days' || form.frequency === 'weekly') ? form.days_of_week : null
    };
    try {
      if (editing) {
        await api.put(`/chores/${editing.id}`, { ...payload, active: true });
        toast('✅ Chore updated!', 'success');
      } else {
        await api.post('/chores', payload);
        toast('🎉 Chore created!', 'success');
      }
      setShowForm(false);
      load();
    } catch { toast('Error saving chore', 'error'); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove chore "${title}"?`)) return;
    try {
      await api.delete(`/chores/${id}`);
      toast('Removed', 'info');
      load();
    } catch { toast('Error', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.5rem' }}>Chores</h2>
        <button className="btn btn-primary" onClick={openCreate}>➕ Add Chore</button>
      </div>

      {chores.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ color: '#6b7280' }}>No chores yet! Create your first chore.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {chores.map(c => (
            <div key={c.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #FF6B6B20, #FFA55220)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', flexShrink: 0
                }}>📋</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: 2 }}>
                    <span>{FREQ_LABELS[c.frequency]}</span>
                    <span>⭐ {c.points} pts</span>
                    {c.child_name && <span>👤 {c.child_name}</span>}
                    {!c.child_id && <span>👥 All children</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button className="btn btn-mint btn-sm" onClick={() => openEdit(c)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.title)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? '✏️ Edit Chore' : '➕ New Chore'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">Chore Title</label>
              <input className="form-input" placeholder="e.g. Make your bed" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-input" rows={2} placeholder="Any extra details..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">⭐ Points</label>
                <input className="form-input" type="number" min={1} max={500} value={form.points} onChange={e => setForm(p => ({ ...p, points: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <select className="form-input" value={form.child_id} onChange={e => setForm(p => ({ ...p, child_id: e.target.value }))}>
                  <option value="">👥 All children</option>
                  {children.map(c => <option key={c.id} value={c.id}>{AVATAR_EMOJIS[c.avatar]} {c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Frequency</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {Object.entries(FREQ_LABELS).map(([val, label]) => (
                  <button key={val} onClick={() => setForm(p => ({ ...p, frequency: val }))} style={{
                    padding: '0.6rem',
                    borderRadius: 10,
                    border: form.frequency === val ? '2px solid var(--coral)' : '2px solid #e5e7eb',
                    background: form.frequency === val ? '#fff0f0' : 'white',
                    fontFamily: 'Nunito',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: form.frequency === val ? 'var(--coral)' : '#6b7280'
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.frequency === 'specific_days' && (
              <div className="form-group">
                <label className="form-label">Pick Days</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <button onClick={() => setForm(p => ({ ...p, days_of_week: SCHOOL_DAYS }))} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: JSON.stringify(form.days_of_week) === JSON.stringify(SCHOOL_DAYS) ? '#4ECDC4' : '#f3f4f6',
                    color: JSON.stringify(form.days_of_week) === JSON.stringify(SCHOOL_DAYS) ? 'white' : '#6b7280',
                    fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s'
                  }}>🏫 School Days</button>
                  <button onClick={() => setForm(p => ({ ...p, days_of_week: WEEKEND_DAYS }))} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: JSON.stringify(form.days_of_week) === JSON.stringify(WEEKEND_DAYS) ? '#A855F7' : '#f3f4f6',
                    color: JSON.stringify(form.days_of_week) === JSON.stringify(WEEKEND_DAYS) ? 'white' : '#6b7280',
                    fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s'
                  }}>🎉 Weekends</button>
                  <button onClick={() => setForm(p => ({ ...p, days_of_week: [] }))} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: '#f3f4f6', color: '#6b7280',
                    fontWeight: 700, fontSize: '0.8rem'
                  }}>Clear</button>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {DAYS.map((day, i) => (
                    <button key={i} onClick={() => toggleDay(i)} style={{
                      padding: '0.4rem 0.7rem',
                      borderRadius: 8,
                      border: 'none',
                      background: form.days_of_week.includes(i) ? 'var(--coral)' : '#f3f4f6',
                      color: form.days_of_week.includes(i) ? 'white' : '#6b7280',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
                {editing ? '💾 Save Changes' : '➕ Create Chore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= REWARDS MANAGEMENT =============
const SPECIAL_DAYS = [
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'christmas', label: '🎄 Christmas' },
  { value: 'easter', label: '🐣 Easter' },
  { value: 'halloween', label: '🎃 Halloween' },
  { value: 'end_of_year', label: '🎓 End of School Year' },
  { value: 'custom', label: '📅 Specific Date' },
];

function formatTargetDate(r) {
  if (r.special_day && r.special_day !== 'custom') {
    return SPECIAL_DAYS.find(s => s.value === r.special_day)?.label || r.special_day;
  }
  if (r.target_date) {
    return '📅 ' + new Date(r.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return null;
}

function RewardEditModal({ reward, onClose, onSaved }) {
  const [form, setForm] = useState({
    points_cost: reward.points_cost || 50,
    status: reward.status,
    special_day: reward.special_day || '',
    target_date: reward.target_date ? reward.target_date.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/rewards/${reward.id}`, {
        status: form.status,
        points_cost: parseInt(form.points_cost) || 50,
        special_day: form.special_day || null,
        target_date: (form.special_day === 'custom' || !form.special_day) && form.target_date ? form.target_date : null,
      });
      toast('💾 Reward saved!', 'success');
      onSaved();
      onClose();
    } catch { toast('Error saving', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>✏️ Manage Reward</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Reward info */}
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{reward.title}</div>
          {reward.description && <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>{reward.description}</div>}
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 4 }}>👤 {reward.child_name}</div>
        </div>

        {/* Status */}
        <div className="form-group">
          <label className="form-label">Status</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {['pending', 'approved', 'rejected', 'redeemed'].map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))} style={{
                  padding: '0.5rem',
                  borderRadius: 10,
                  border: form.status === s ? `2px solid ${cfg.color}` : '2px solid #e5e7eb',
                  background: form.status === s ? cfg.bg : 'white',
                  fontFamily: 'Nunito', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                  color: form.status === s ? cfg.color : '#6b7280'
                }}>
                  {cfg.icon} {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Points */}
        <div className="form-group">
          <label className="form-label">⭐ Stars Required</label>
          <input
            className="form-input"
            type="number"
            min={1}
            value={form.points_cost}
            onChange={e => setForm(p => ({ ...p, points_cost: e.target.value }))}
          />
        </div>

        {/* Target / Special Day */}
        <div className="form-group">
          <label className="form-label">🗓️ Target / Special Day (optional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button onClick={() => setForm(p => ({ ...p, special_day: '', target_date: '' }))} style={{
              gridColumn: '1 / -1',
              padding: '0.5rem', borderRadius: 10, cursor: 'pointer', fontFamily: 'Nunito',
              fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
              border: !form.special_day ? '2px solid #6b7280' : '2px solid #e5e7eb',
              background: !form.special_day ? '#f3f4f6' : 'white',
              color: !form.special_day ? '#374151' : '#6b7280'
            }}>
              🚫 No target date
            </button>
            {SPECIAL_DAYS.map(sd => (
              <button key={sd.value} onClick={() => setForm(p => ({ ...p, special_day: sd.value }))} style={{
                padding: '0.5rem', borderRadius: 10, cursor: 'pointer', fontFamily: 'Nunito',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                border: form.special_day === sd.value ? '2px solid var(--purple)' : '2px solid #e5e7eb',
                background: form.special_day === sd.value ? '#f3e8ff' : 'white',
                color: form.special_day === sd.value ? 'var(--purple)' : '#6b7280'
              }}>
                {sd.label}
              </button>
            ))}
          </div>
          {(form.special_day === 'custom' || (!form.special_day && form.target_date !== undefined)) && form.special_day === 'custom' && (
            <input
              className="form-input"
              type="date"
              value={form.target_date}
              onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardsTab() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReward, setEditingReward] = useState(null);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api.get('/rewards');
    setRewards(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleQuickApprove = async (reward) => {
    try {
      await api.put(`/rewards/${reward.id}`, { status: 'approved', points_cost: reward.points_cost || 50 });
      toast('✅ Reward approved!', 'success');
      load();
    } catch { toast('Error', 'error'); }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/rewards/${id}`, { status: 'rejected', points_cost: 0 });
      toast('❌ Reward rejected', 'info');
      load();
    } catch { toast('Error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reward request?')) return;
    try {
      await api.delete(`/rewards/${id}`);
      toast('🗑️ Deleted', 'info');
      load();
    } catch { toast('Error', 'error'); }
  };

  const filters = ['pending', 'approved', 'rejected', 'redeemed'];
  const filtered = rewards.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = rewards.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.5rem' }}>
          Reward Requests
          {pendingCount > 0 && (
            <span style={{
              background: 'var(--coral)', color: 'white',
              borderRadius: '50%', width: 24, height: 24,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', marginLeft: '0.5rem', fontFamily: 'Nunito'
            }}>{pendingCount}</span>
          )}
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {filters.map(f => {
          const s = STATUS_CONFIG[f] || {};
          const count = rewards.filter(r => r.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.4rem 0.9rem', borderRadius: 20, border: 'none',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              background: filter === f ? s.bg : '#f3f4f6',
              color: filter === f ? s.color : '#6b7280',
              transition: 'all 0.2s'
            }}>
              {s.icon} {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', fontSize: '2rem' }}>⏳</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
          <p style={{ color: '#6b7280' }}>No {filter} rewards</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filtered.map(r => {
            const s = STATUS_CONFIG[r.status];
            const targetLabel = formatTargetDate(r);
            return (
              <div key={r.id} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${s.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.title}</div>
                    {r.description && <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>{r.description}</div>}
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span>👤 {r.child_name}</span>
                      <span>📩 {new Date(r.nominated_at).toLocaleDateString('en-AU')}</span>
                      {r.points_cost > 0 && r.status !== 'pending' && <span>⭐ {r.points_cost} stars</span>}
                      {targetLabel && (
                        <span style={{
                          background: '#f3e8ff', color: '#7e22ce',
                          padding: '0.1rem 0.5rem', borderRadius: 10, fontWeight: 700
                        }}>
                          {targetLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <button className="btn btn-mint btn-sm" onClick={() => setEditingReward(r)}>✏️ Edit</button>
                    {r.status === 'pending' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleQuickApprove(r)}>✅ Approve</button>
                    )}
                    {r.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)}>❌ Reject</button>
                    )}
                    {(r.status === 'rejected' || r.status === 'redeemed') && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>🗑️ Delete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingReward && (
        <RewardEditModal
          reward={editingReward}
          onClose={() => setEditingReward(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

// ============= SETTINGS TAB =============
function SettingsTab() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (form.newPassword !== form.confirmPassword) return toast('Passwords do not match!', 'error');
    if (form.newPassword.length < 6) return toast('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast('✅ Password changed!', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast(err.response?.data?.error || 'Error changing password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Settings</h2>

      <div className="card">
        <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--coral)' }}>
          🔐 Change Password
        </h3>
        <div style={{
          background: '#f0fdf4', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem',
          fontSize: '0.85rem', color: '#166534', fontWeight: 600
        }}>
          Logged in as: <strong>{user?.username}</strong>
        </div>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-input" type="password" value={form.currentPassword} onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className="form-input" type="password" value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input className="form-input" type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
        </div>
        <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
          {saving ? '⏳ Saving...' : '🔐 Change Password'}
        </button>
      </div>
    </div>
  );
}

// ============= OVERVIEW TAB =============
function OverviewTab() {
  const [children, setChildren] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/children').then(r => {
      setChildren(r.data);
      r.data.forEach(async c => {
        const s = await api.get(`/stats/child/${c.id}`);
        setStats(prev => ({ ...prev, [c.id]: s.data }));
      });
    });
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Overview</h2>

      {children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#6b7280' }}>Add children to see their overview</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {children.map(c => {
            const childStats = stats[c.id] || {};
            const history = childStats.history || [];
            const weekTotal = history.slice(0, 7).reduce((a, b) => a + b.points, 0);

            return (
              <div key={c.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `${c.color}20`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.8rem'
                  }}>
                    {AVATAR_EMOJIS[c.avatar]}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem' }}>{c.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      ⭐ {c.available_points} available stars
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Total Earned', value: c.total_points, icon: '⭐' },
                    { label: 'This Week', value: weekTotal, icon: '📅' },
                    { label: 'Available', value: c.available_points, icon: '💰' },
                    { label: 'Days Active', value: history.length, icon: '🗓️' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: '#f9fafb', borderRadius: 12, padding: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.2rem' }}>{stat.icon}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark)' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {history.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.5rem' }}>
                      Recent Activity
                    </div>
                    {history.slice(0, 5).map(h => (
                      <div key={h.date} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '0.3rem 0', borderBottom: '1px solid #f3f4f6',
                        fontSize: '0.85rem'
                      }}>
                        <span style={{ color: '#374151' }}>{new Date(h.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span style={{ fontWeight: 700 }}>⭐ {h.points} ({h.chores} chores)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============= PARENT DASHBOARD =============
export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'children', icon: '👧', label: 'Children' },
    { id: 'chores', icon: '📋', label: 'Chores' },
    { id: 'rewards', icon: '🎁', label: 'Rewards' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--light)' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(102,126,234,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.8rem' }}>👨‍👩‍👧</span>
          <div>
            <h1 style={{
              fontFamily: 'Fredoka One',
              fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
              color: 'white',
              lineHeight: 1
            }}>
              Parent Portal
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 600 }}>
              ⭐ Chore Stars
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/" style={{
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.85rem',
            background: 'rgba(255,255,255,0.15)',
            padding: '0.4rem 0.8rem',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            🏠 Kids View
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              padding: '0.4rem 0.8rem',
              borderRadius: 20,
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>

        <div style={{ animation: 'pop 0.3s ease-out' }} key={activeTab}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'children' && <ChildrenTab />}
          {activeTab === 'chores' && <ChoresTab />}
          {activeTab === 'rewards' && <RewardsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
