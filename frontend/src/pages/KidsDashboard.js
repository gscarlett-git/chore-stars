import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Confetti } from '../components/Confetti';
import { ToastContainer, toast } from '../components/Toast';

const AVATARS = {
  star: '⭐', rocket: '🚀', rainbow: '🌈', dragon: '🐲',
  unicorn: '🦄', dinosaur: '🦖', robot: '🤖', superhero: '🦸',
  mermaid: '🧜', wizard: '🧙', fairy: '🧚', lion: '🦁',
  penguin: '🐧', panda: '🐼', fox: '🦊', bunny: '🐰',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─────────────────────────────────────────────
   Breakpoint hook: 'mobile' | 'desktop'
   Removes landscape phone mode entirely.
   Portrait on mobile/tablet, full layout on desktop.
   ───────────────────────────────────────────── */
function useBreakpoint() {
  const get = () => (window.innerWidth >= 1024 ? 'desktop' : 'mobile');
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const update = () => setBp(get());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

/* ─────────────────────────────────────────────
   Points Progress Bar (original logic preserved)
   ───────────────────────────────────────────── */
function PointsBar({ available, total, compact }) {
  const max = Math.max(total, 100);
  const pct = Math.min((available / max) * 100, 100);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.3)',
      borderRadius: 20,
      height: compact ? 8 : 14,
      overflow: 'hidden',
      marginTop: compact ? 3 : 6,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'linear-gradient(90deg, #FFE66D, #FFA552)',
        borderRadius: 20,
        transition: 'width 0.5s ease',
        boxShadow: '0 0 8px rgba(255,230,109,0.6)',
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Chore Card (original logic preserved exactly)
   Added `desktop` prop for scaling only.
   ───────────────────────────────────────────── */
function ChoreCard({ chore, childId, onComplete, onUncomplete, compact, desktop }) {
  const [busy, setBusy] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);

  const handleComplete = async () => {
    if (chore.completed || busy) return;
    setBusy(true);
    try {
      await api.post(`/chores/${chore.id}/complete`, { child_id: childId });
      onComplete(chore.points);
    } catch (err) {
      toast(err.response?.data?.error || 'Already done today!', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUncomplete = async () => {
    setBusy(true);
    try {
      await api.delete(`/chores/${chore.id}/complete`, { data: { child_id: childId } });
      onUncomplete(chore.points);
      setConfirmUndo(false);
    } catch (err) {
      toast(err.response?.data?.error || 'Could not undo', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Desktop scaling
  const p = compact
    ? '0.6rem 0.75rem'
    : desktop
      ? '1.1rem 1.25rem'
      : '1rem';
  const iconSize = compact ? 36 : desktop ? 52 : 44;
  const titleSize = compact ? '0.88rem' : desktop ? '1.1rem' : '1rem';
  const badgeSize = compact ? '0.78rem' : desktop ? '1rem' : '0.9rem';
  const badgePad = compact
    ? '0.15rem 0.5rem'
    : desktop
      ? '0.3rem 0.85rem'
      : '0.25rem 0.75rem';

  return (
    <div style={{
      background: chore.completed
        ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
        : 'white',
      borderRadius: compact ? 12 : desktop ? 18 : 16,
      padding: p,
      marginBottom: compact ? '0.4rem' : desktop ? '0.6rem' : '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: compact ? '0.6rem' : desktop ? '1.1rem' : '1rem',
      transition: 'all 0.3s',
      border: chore.completed ? '2px solid #6BCB77' : '2px solid transparent',
      boxShadow: chore.completed ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
      opacity: busy ? 0.7 : 1,
      position: 'relative',
    }}>
      <div
        onClick={chore.completed ? () => setConfirmUndo(true) : handleComplete}
        style={{
          width: iconSize, height: iconSize, borderRadius: '50%',
          background: chore.completed
            ? 'linear-gradient(135deg, #6BCB77, #4caf50)'
            : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? '1.1rem' : desktop ? '1.6rem' : '1.4rem',
          flexShrink: 0, cursor: 'pointer',
          transition: 'all 0.3s',
          boxShadow: chore.completed ? '0 4px 12px rgba(107,203,119,0.4)' : 'none',
        }}
      >
        {busy ? '⏳' : chore.completed ? '✅' : '⭐'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700,
          fontSize: titleSize,
          textDecoration: chore.completed ? 'line-through' : 'none',
          color: chore.completed ? '#6b7280' : '#2D3047',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {chore.title}
        </div>
        {chore.description && !compact && (
          <div style={{ fontSize: desktop ? '0.9rem' : '0.8rem', color: '#9ca3af', marginTop: 2 }}>
            {chore.description}
          </div>
        )}
        {chore.completed && (
          <div style={{ fontSize: compact ? '0.68rem' : desktop ? '0.82rem' : '0.75rem', color: '#6b7280', marginTop: 1 }}>
            Tap ✅ to undo
          </div>
        )}
      </div>

      <div
        className="points-badge"
        style={{
          flexShrink: 0,
          fontSize: badgeSize,
          padding: badgePad,
        }}
      >
        ⭐ {chore.points}
      </div>

      {confirmUndo && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.96)',
          borderRadius: compact ? 12 : desktop ? 18 : 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', padding: '0.75rem', zIndex: 10,
        }}>
          <span style={{ fontWeight: 700, fontSize: compact ? '0.8rem' : desktop ? '1rem' : '0.9rem' }}>
            Undo this chore?
          </span>
          <button className="btn btn-danger btn-sm" onClick={handleUncomplete}>Yes</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmUndo(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reward Modal (original logic preserved exactly)
   ───────────────────────────────────────────── */
function RewardModal({ child, onClose, onNominate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingPoints, setEditingPoints] = useState(null);

  const loadRewards = useCallback(async () => {
    const r = await api.get(`/rewards/child/${child.id}`);
    setRewards(r.data);
    setLoading(false);
  }, [child.id]);

  useEffect(() => { loadRewards(); }, [loadRewards]);

  const handleNominate = async () => {
    if (!title.trim()) return toast('Enter a reward name!', 'error');
    try {
      await api.post('/rewards', { child_id: child.id, title, description });
      toast(`🎁 Reward "${title}" requested!`, 'success');
      setTitle('');
      setDescription('');
      loadRewards();
      setActiveTab('list');
      if (onNominate) onNominate();
    } catch (err) {
      toast('Could not submit reward', 'error');
    }
  };

  const handleRedeem = async (reward) => {
    try {
      await api.post(`/rewards/${reward.id}/redeem`, { child_id: child.id });
      toast(`🎁 Redeemed "${reward.title}"!`, 'success');
      loadRewards();
      onClose();
    } catch (err) {
      toast(err.response?.data?.error || 'Cannot redeem', 'error');
    }
  };

  const handleSavePoints = async (reward) => {
    const newCost = parseInt(editingPoints.value);
    if (!newCost || newCost < 1) return toast('Enter a valid number!', 'error');
    try {
      await api.put(`/rewards/${reward.id}`, {
        status: reward.status,
        points_cost: newCost,
        special_day: reward.special_day || null,
        target_date: reward.target_date || null,
      });
      toast('⭐ Stars updated!', 'success');
      setEditingPoints(null);
      loadRewards();
    } catch {
      toast('Could not update stars', 'error');
    }
  };

  const statusColors = {
    pending: { bg: '#fef3c7', color: '#d97706', icon: '⏳' },
    approved: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
    rejected: { bg: '#fee2e2', color: '#991b1b', icon: '❌' },
    redeemed: { bg: '#ede9fe', color: '#5b21b6', icon: '🎁' },
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ margin: 0, fontSize: '1.4rem' }}>
            {AVATARS[child.avatar] || '⭐'} {child.name}'s Rewards
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: 12, padding: '0.6rem 1rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontWeight: 800, fontSize: '1rem',
        }}>
          ⭐ {child.available_points} stars available
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['list', 'new'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '0.5rem', borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: '0.85rem',
              background: activeTab === tab ? 'var(--coral)' : '#f3f4f6',
              color: activeTab === tab ? 'white' : '#6b7280',
              transition: 'all 0.2s', cursor: 'pointer',
            }}>
              {tab === 'list' ? '🎁 My Rewards' : '✨ Ask for New'}
            </button>
          ))}
        </div>

        {activeTab === 'list' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', fontSize: '2rem' }}>⏳</div>
            ) : rewards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎁</div>
                <p>No rewards yet! Ask for something special!</p>
              </div>
            ) : (
              rewards.map(r => {
                const s = statusColors[r.status] || statusColors.pending;
                const isEditingThis = editingPoints?.id === r.id;
                return (
                  <div key={r.id} style={{ background: s.bg, borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: s.color, fontSize: '0.95rem' }}>{r.title}</div>
                        {r.status !== 'redeemed' && r.status !== 'rejected' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 3 }}>
                            {isEditingThis ? (
                              <>
                                <input
                                  type="number" min={1} value={editingPoints.value}
                                  onChange={e => setEditingPoints(p => ({ ...p, value: e.target.value }))}
                                  style={{ width: 65, padding: '0.15rem 0.4rem', borderRadius: 8, border: '2px solid #d97706', fontFamily: 'Nunito', fontWeight: 700, fontSize: '0.85rem' }}
                                  autoFocus
                                />
                                <span style={{ fontSize: '0.8rem', color: s.color }}>⭐</span>
                                <button className="btn btn-success btn-sm" onClick={() => handleSavePoints(r)}>✓</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingPoints(null)}>✕</button>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: '0.8rem', color: s.color }}>⭐ {r.points_cost > 0 ? `${r.points_cost} stars` : 'Not set'}</span>
                                <button onClick={() => setEditingPoints({ id: r.id, value: r.points_cost || 50 })}
                                  style={{ background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 6, padding: '0.1rem 0.35rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700, color: s.color }}>
                                  ✏️
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {(r.target_date || r.special_day) && (
                          <div style={{ fontSize: '0.75rem', color: '#7e22ce', marginTop: 2, fontWeight: 700 }}>
                            🗓️ {r.special_day && r.special_day !== 'custom'
                              ? r.special_day.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : r.target_date ? new Date(r.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                        {r.status === 'approved' && child.available_points >= r.points_cost && (
                          <button className="btn btn-success btn-sm" onClick={() => handleRedeem(r)}>🎁 Redeem!</button>
                        )}
                        {r.status === 'approved' && child.available_points < r.points_cost && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>
                            Need {r.points_cost - child.available_points} more ⭐
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'new' && (
          <div>
            <div className="form-group">
              <label className="form-label">What do you want? 🎁</label>
              <input className="form-input" placeholder="e.g. Extra screen time, New toy..."
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tell us more (optional)</label>
              <textarea className="form-input" rows={2} placeholder="Describe what you'd like..."
                value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleNominate}>
              ✨ Submit My Wish!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Child Panel — preserves ALL original logic.
   Now uses `desktop` prop instead of `isLandscape`.
   Desktop gets: larger sizes, grid chore layout.
   Mobile gets: original portrait layout exactly.
   ───────────────────────────────────────────── */
function ChildPanel({ child, dayName, desktop }) {
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRewards, setShowRewards] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [localPoints, setLocalPoints] = useState({
    available: child.available_points,
    total: child.total_points,
  });

  const fetchChores = useCallback(async () => {
    try {
      const res = await api.get(`/chores/today/${child.id}`);
      setChores(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [child.id]);

  useEffect(() => {
    fetchChores();
    setLocalPoints({ available: child.available_points, total: child.total_points });
  }, [fetchChores, child]);

  const handleComplete = (points) => {
    setLocalPoints(prev => ({ available: prev.available + points, total: prev.total + points }));
    setConfetti(true);
    toast(`⭐ +${points} stars earned!`, 'success');
    fetchChores();
  };

  const handleUncomplete = (points) => {
    setLocalPoints(prev => ({
      available: Math.max(0, prev.available - points),
      total: Math.max(0, prev.total - points),
    }));
    toast(`⏪️ Chore undone, -${points} stars`, 'info');
    fetchChores();
  };

  const completedCount = chores.filter(c => c.completed).length;
  const allDone = chores.length > 0 && completedCount === chores.length;

  const gradients = {
    '#FF6B6B': 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
    '#4ECDC4': 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
    '#A855F7': 'linear-gradient(135deg, #A855F7, #6366f1)',
    '#6BCB77': 'linear-gradient(135deg, #6BCB77, #4caf50)',
    '#FFE66D': 'linear-gradient(135deg, #FFE66D, #FFA552)',
    '#FF69B4': 'linear-gradient(135deg, #FF69B4, #c2185b)',
  };
  const bg = gradients[child.color] || `linear-gradient(135deg, ${child.color}, ${child.color}cc)`;

  /* ── Desktop layout ── */
  if (desktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
        <Confetti active={confetti} onDone={() => setConfetti(false)} />

        {/* Child header card — desktop scaled */}
        <div style={{
          background: bg, borderRadius: 24, padding: '1.25rem 1.5rem',
          color: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            fontSize: '7rem', opacity: 0.15, lineHeight: 1, pointerEvents: 'none',
          }}>
            {AVATARS[child.avatar] || '⭐'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <div style={{
              fontSize: '2.5rem',
              background: 'rgba(255,255,255,0.25)', borderRadius: '50%',
              width: 60, height: 60,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: allDone ? 'bounce 1s ease-in-out infinite' : 'none',
            }}>
              {AVATARS[child.avatar] || '⭐'}
            </div>
            <div>
              <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.6rem', lineHeight: 1, margin: 0 }}>
                {child.name}
              </h2>
              <div style={{ opacity: 0.9, fontSize: '0.95rem', marginTop: 2 }}>
                {allDone ? '🎉 All done today!' : `${completedCount}/${chores.length} chores done`}
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>⭐ {localPoints.available} stars</span>
              <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>{localPoints.total} total earned</span>
            </div>
            <PointsBar available={localPoints.available} total={localPoints.total} />
          </div>
        </div>

        {/* Chores — grid layout for desktop to reduce scrolling */}
        <div style={{
          background: 'white', borderRadius: 20,
          padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          flex: 1, minHeight: 0, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', color: 'var(--dark)', margin: 0 }}>
              Today's Chores
            </h3>
            <span style={{ background: '#f3f4f6', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' }}>
              {dayName}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', fontSize: '2rem' }}>⏳</div>
          ) : chores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ fontWeight: 700 }}>No chores today!</p>
              <p style={{ fontSize: '0.85rem' }}>Enjoy your free time!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '0.5rem',
            }}>
              {chores.map(chore => (
                <div key={chore.id} style={{ position: 'relative' }}>
                  <ChoreCard
                    chore={chore}
                    childId={child.id}
                    onComplete={handleComplete}
                    onUncomplete={handleUncomplete}
                    desktop
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards button */}
        <button
          onClick={() => setShowRewards(true)}
          style={{
            background: 'linear-gradient(135deg, #A855F7, #6366f1)', color: 'white',
            border: 'none', borderRadius: 16, padding: '0.85rem',
            fontFamily: 'Fredoka One', fontSize: '1.05rem',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
            transition: 'all 0.2s', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          🎁 My Rewards
        </button>

        {showRewards && (
          <RewardModal
            child={{ ...child, available_points: localPoints.available }}
            onClose={() => setShowRewards(false)}
            onNominate={() => {}}
          />
        )}
      </div>
    );
  }

  /* ── Mobile / Tablet portrait layout (original, unchanged) ── */
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      {/* Child header card */}
      <div style={{
        background: bg, borderRadius: 24, padding: '1.5rem',
        color: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          fontSize: '8rem', opacity: 0.15, lineHeight: 1, pointerEvents: 'none',
        }}>
          {AVATARS[child.avatar] || '⭐'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            fontSize: '2.5rem',
            background: 'rgba(255,255,255,0.25)', borderRadius: '50%',
            width: 60, height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: allDone ? 'bounce 1s ease-in-out infinite' : 'none',
          }}>
            {AVATARS[child.avatar] || '⭐'}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.8rem', lineHeight: 1 }}>{child.name}</h2>
            <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>
              {allDone ? '🎉 All done today!' : `${completedCount}/${chores.length} chores done`}
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>⭐ {localPoints.available} stars</span>
            <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>{localPoints.total} total earned</span>
          </div>
          <PointsBar available={localPoints.available} total={localPoints.total} />
        </div>
      </div>

      {/* Chores */}
      <div style={{ background: 'white', borderRadius: 20, padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', color: 'var(--dark)' }}>Today's Chores</h3>
          <span style={{ background: '#f3f4f6', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' }}>
            {dayName}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontSize: '2rem' }}>⏳</div>
        ) : chores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <p style={{ fontWeight: 700 }}>No chores today!</p>
            <p style={{ fontSize: '0.85rem' }}>Enjoy your free time!</p>
          </div>
        ) : (
          chores.map(chore => (
            <div key={chore.id} style={{ position: 'relative' }}>
              <ChoreCard chore={chore} childId={child.id} onComplete={handleComplete} onUncomplete={handleUncomplete} />
            </div>
          ))
        )}
      </div>

      {/* Rewards button */}
      <button
        onClick={() => setShowRewards(true)}
        style={{
          background: 'linear-gradient(135deg, #A855F7, #6366f1)', color: 'white', border: 'none',
          borderRadius: 16, padding: '1rem', fontFamily: 'Fredoka One', fontSize: '1.1rem',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(168,85,247,0.4)', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        🎁 My Rewards
      </button>

      {showRewards && (
        <RewardModal
          child={{ ...child, available_points: localPoints.available }}
          onClose={() => setShowRewards(false)}
          onNominate={() => {}}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Dashboard
   ───────────────────────────────────────────── */
export default function KidsDashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const bp = useBreakpoint();
  const desktop = bp === 'desktop';
  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const dateStr = today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

  // Mobile tab state
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    api.get('/children/public')
      .then(r => setChildren(r.data))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
    }}>
      <ToastContainer />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFA552 50%, #FFE66D 100%)',
        padding: desktop ? '1rem 2rem' : '1.5rem 1.5rem 3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Decorative bubbles — desktop gets them too */}
        {['🌟', '✨', '⭐', '🫧', '🌈', '🎉'].map((e, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: desktop ? '1.8rem' : '1.5rem', opacity: 0.2,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            top: `${10 + (i % 3) * 30}%`, left: `${5 + i * 15}%`,
            animationDelay: `${i * 0.3}s`,
          }}>{e}</div>
        ))}

        {desktop ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.8rem' }}>⭐</span>
            <h1 style={{
              fontFamily: 'Fredoka One', fontSize: '2rem',
              color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.2)', margin: 0,
            }}>
              Chore Stars
            </h1>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', fontWeight: 700 }}>
              — {dateStr}
            </span>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'Fredoka One', fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              lineHeight: 1.1, marginBottom: '0.5rem',
            }}>
              ⭐ Chore Stars ⭐
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '1rem' }}>{dateStr}</p>
          </>
        )}

        <Link to="/parent/login" style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '1rem',
          background: 'rgba(255,255,255,0.25)', color: 'white',
          padding: desktop ? '0.4rem 1rem' : '0.4rem 0.8rem',
          borderRadius: 20, fontSize: desktop ? '0.9rem' : '0.8rem',
          fontWeight: 700, textDecoration: 'none',
          backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)',
        }}>
          👨‍👩‍👧 Parents
        </Link>
      </div>

      {/* Mobile: Tab bar to switch children */}
      {!desktop && children.length > 1 && (
        <div style={{
          display: 'flex',
          background: '#fff',
          borderBottom: '2px solid #f0f0f0',
          flexShrink: 0,
          overflowX: 'auto',
        }}>
          {children.map((child, i) => (
            <button
              key={child.id}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1, minWidth: 0,
                padding: '0.7rem 0.5rem',
                border: 'none',
                borderBottom: activeTab === i ? '3px solid #FF6B6B' : '3px solid transparent',
                background: activeTab === i ? '#fff5f5' : '#fff',
                fontFamily: 'Fredoka One',
                fontWeight: activeTab === i ? 800 : 500,
                fontSize: '1rem',
                color: activeTab === i ? '#FF6B6B' : '#999',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {AVATARS[child.avatar] || '⭐'} {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{
        margin: desktop ? 0 : '-2rem auto 0',
        padding: desktop ? '1.5rem 2rem' : '0 1rem',
        flex: 1,
        minHeight: 0,
        paddingBottom: desktop ? '1.5rem' : '2rem',
        width: '100%',
        boxSizing: 'border-box',
        /* NO max-width on desktop — fills entire screen */
        maxWidth: desktop ? '100%' : 900,
        alignSelf: 'center',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', fontSize: '3rem' }}>⏳</div>
        ) : children.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 24, padding: '3rem',
            textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍👩‍👧</div>
            <h2 style={{ fontFamily: 'Fredoka One', color: 'var(--coral)', marginBottom: '0.5rem' }}>
              Welcome to Chore Stars!
            </h2>
            <p style={{ color: '#6b7280' }}>A parent needs to log in and set up the children's profiles first.</p>
            <Link to="/parent/login" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
              👨‍👩‍👧 Parent Login
            </Link>
          </div>
        ) : desktop ? (
          /* ── Desktop: all children side by side, full width ── */
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            height: 'calc(100vh - 100px)',
            alignItems: 'stretch',
          }}>
            {children.map(child => (
              <div key={child.id} style={{ flex: '1 1 0', minWidth: 0 }}>
                <ChildPanel child={child} dayName={dayName} desktop />
              </div>
            ))}
          </div>
        ) : (
          /* ── Mobile: single active child (tab-based) ── */
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}>
            {children.length === 1 ? (
              <ChildPanel child={children[0]} dayName={dayName} desktop={false} />
            ) : (
              children[activeTab] && (
                <ChildPanel
                  key={children[activeTab].id}
                  child={children[activeTab]}
                  dayName={dayName}
                  desktop={false}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
