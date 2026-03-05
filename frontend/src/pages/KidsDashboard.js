import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Confetti } from '../components/Confetti';
import { ToastContainer, toast } from '../components/Toast';

const AVATARS = {
  star: '⭐', rocket: '🚀', rainbow: '🌈', dragon: '🐲',
  unicorn: '🦄', dinosaur: '🦕', robot: '🤖', superhero: '🦸',
  mermaid: '🧜', wizard: '🧙', fairy: '🧚', lion: '🦁',
  penguin: '🐧', panda: '🐼', fox: '🦊', bunny: '🐰',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function PointsBar({ available, total }) {
  const max = Math.max(total, 100);
  const pct = Math.min((available / max) * 100, 100);
  return (
    <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 20, height: 14, overflow: 'hidden', marginTop: 6 }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'linear-gradient(90deg, #FFE66D, #FFA552)',
        borderRadius: 20,
        transition: 'width 0.5s ease',
        boxShadow: '0 0 8px rgba(255,230,109,0.6)'
      }} />
    </div>
  );
}

function ChoreCard({ chore, childId, onComplete, onUncomplete }) {
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

  return (
    <div style={{
      background: chore.completed ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'white',
      borderRadius: 16,
      padding: '1rem',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'all 0.3s',
      border: chore.completed ? '2px solid #6BCB77' : '2px solid transparent',
      boxShadow: chore.completed ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
      opacity: busy ? 0.7 : 1,
    }}>
      {/* Checkbox button */}
      <div
        onClick={chore.completed ? () => setConfirmUndo(true) : handleComplete}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: chore.completed
            ? 'linear-gradient(135deg, #6BCB77, #4caf50)'
            : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0, cursor: 'pointer',
          transition: 'all 0.3s',
          boxShadow: chore.completed ? '0 4px 12px rgba(107,203,119,0.4)' : 'none'
        }}>
        {busy ? '⏳' : chore.completed ? '✅' : '⭕'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: '1rem',
          textDecoration: chore.completed ? 'line-through' : 'none',
          color: chore.completed ? '#6b7280' : '#2D3047',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {chore.title}
        </div>
        {chore.description && (
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 2 }}>{chore.description}</div>
        )}
        {chore.completed && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
            Tap ✅ to undo
          </div>
        )}
      </div>

      <div className="points-badge" style={{ flexShrink: 0 }}>⭐ {chore.points}</div>

      {/* Undo confirmation */}
      {confirmUndo && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)',
          borderRadius: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '0.75rem', padding: '1rem',
          zIndex: 10
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Undo this chore?</span>
          <button className="btn btn-danger btn-sm" onClick={handleUncomplete}>Yes, undo</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmUndo(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function RewardModal({ child, onClose, onNominate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [editingPoints, setEditingPoints] = useState(null); // { id, value }

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
      toast(`🌟 Reward "${title}" requested!`, 'success');
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
      toast(`🎉 Redeemed "${reward.title}"!`, 'success');
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
    redeemed: { bg: '#ede9fe', color: '#5b21b6', icon: '🎉' },
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            {AVATARS[child.avatar] || '⭐'} {child.name}'s Rewards
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontWeight: 800, fontSize: '1.1rem'
        }}>
          ⭐ {child.available_points} stars available
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['list', 'new'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: '0.9rem',
              background: activeTab === tab ? 'var(--coral)' : '#f3f4f6',
              color: activeTab === tab ? 'white' : '#6b7280',
              transition: 'all 0.2s', cursor: 'pointer'
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
                  <div key={r.id} style={{
                    background: s.bg, borderRadius: 12, padding: '1rem',
                    marginBottom: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: s.color }}>{r.title}</div>

                        {/* Star cost row */}
                        {r.status !== 'redeemed' && r.status !== 'rejected' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
                            {isEditingThis ? (
                              <>
                                <input
                                  type="number"
                                  min={1}
                                  value={editingPoints.value}
                                  onChange={e => setEditingPoints(p => ({ ...p, value: e.target.value }))}
                                  style={{
                                    width: 70, padding: '0.2rem 0.5rem', borderRadius: 8,
                                    border: '2px solid #d97706', fontFamily: 'Nunito',
                                    fontWeight: 700, fontSize: '0.9rem'
                                  }}
                                  autoFocus
                                />
                                <span style={{ fontSize: '0.85rem', color: s.color }}>⭐ stars</span>
                                <button className="btn btn-success btn-sm" onClick={() => handleSavePoints(r)}>✓</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingPoints(null)}>✕</button>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: '0.85rem', color: s.color }}>
                                  ⭐ {r.points_cost > 0 ? `${r.points_cost} stars` : 'Not set'}
                                </span>
                                <button
                                  onClick={() => setEditingPoints({ id: r.id, value: r.points_cost || 50 })}
                                  style={{
                                    background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 6,
                                    padding: '0.1rem 0.4rem', fontSize: '0.75rem', cursor: 'pointer',
                                    fontWeight: 700, color: s.color
                                  }}>
                                  ✏️ Edit
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {r.target_date || r.special_day ? (
                          <div style={{ fontSize: '0.78rem', color: '#7e22ce', marginTop: 2, fontWeight: 700 }}>
                            🗓️ {r.special_day && r.special_day !== 'custom'
                              ? r.special_day.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : r.target_date ? new Date(r.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                        {r.status === 'approved' && child.available_points >= r.points_cost && (
                          <button className="btn btn-success btn-sm" onClick={() => handleRedeem(r)}>
                            🎉 Redeem!
                          </button>
                        )}
                        {r.status === 'approved' && child.available_points < r.points_cost && (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'right' }}>
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
              <label className="form-label">What do you want? 🌟</label>
              <input className="form-input" placeholder="e.g. Extra screen time, New toy..."
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tell us more (optional)</label>
              <textarea className="form-input" rows={3} placeholder="Describe what you'd like..."
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

function ChildPanel({ child, dayName }) {
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRewards, setShowRewards] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [localPoints, setLocalPoints] = useState({
    available: child.available_points,
    total: child.total_points
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
    setLocalPoints(prev => ({
      available: prev.available + points,
      total: prev.total + points
    }));
    setConfetti(true);
    toast(`⭐ +${points} stars earned!`, 'success');
    fetchChores();
  };

  const handleUncomplete = (points) => {
    setLocalPoints(prev => ({
      available: Math.max(0, prev.available - points),
      total: Math.max(0, prev.total - points)
    }));
    toast(`↩️ Chore undone, -${points} stars`, 'info');
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

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      {/* Child header card */}
      <div style={{
        background: bg,
        borderRadius: 24,
        padding: '1.5rem',
        color: 'white',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          fontSize: '8rem', opacity: 0.15, lineHeight: 1,
          pointerEvents: 'none'
        }}>
          {AVATARS[child.avatar] || '⭐'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            fontSize: '2.5rem',
            background: 'rgba(255,255,255,0.25)',
            borderRadius: '50%',
            width: 60, height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: allDone ? 'bounce 1s ease-in-out infinite' : 'none'
          }}>
            {AVATARS[child.avatar] || '⭐'}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.8rem', lineHeight: 1 }}>
              {child.name}
            </h2>
            <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>
              {allDone ? '🎉 All done today!' : `${completedCount}/${chores.length} chores done`}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              ⭐ {localPoints.available} stars
            </span>
            <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>
              {localPoints.total} total earned
            </span>
          </div>
          <PointsBar available={localPoints.available} total={localPoints.total} />
        </div>
      </div>

      {/* Chores */}
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '1.25rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        flex: 1
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', color: 'var(--dark)' }}>
            Today's Chores
          </h3>
          <span style={{
            background: '#f3f4f6',
            padding: '0.2rem 0.6rem',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#6b7280'
          }}>
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
              <ChoreCard
                chore={chore}
                childId={child.id}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
              />
            </div>
          ))
        )}
      </div>

      {/* Rewards button */}
      <button
        onClick={() => setShowRewards(true)}
        style={{
          background: 'linear-gradient(135deg, #A855F7, #6366f1)',
          color: 'white',
          border: 'none',
          borderRadius: 16,
          padding: '1rem',
          fontFamily: 'Fredoka One',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
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

export default function KidsDashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const dayName = DAYS[today.getDay()];
  const dateStr = today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    api.get('/children/public')
      .then(r => setChildren(r.data))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 2rem' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFA552 50%, #FFE66D 100%)',
        padding: '1.5rem 1.5rem 3rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative bubbles */}
        {['🌟', '✨', '⭐', '💫', '🌈', '🎉'].map((e, i) => (
          <div key={i} style={{
            position: 'absolute',
            fontSize: '1.5rem',
            opacity: 0.2,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            top: `${10 + (i % 3) * 30}%`,
            left: `${5 + i * 15}%`,
            animationDelay: `${i * 0.3}s`
          }}>{e}</div>
        ))}

        <h1 style={{
          fontFamily: 'Fredoka One',
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          color: 'white',
          textShadow: '0 4px 20px rgba(0,0,0,0.2)',
          lineHeight: 1.1,
          marginBottom: '0.5rem'
        }}>
          ⭐ Chore Stars ⭐
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 700,
          fontSize: '1rem'
        }}>
          {dateStr}
        </p>

        <Link to="/parent/login" style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(255,255,255,0.25)',
          color: 'white',
          padding: '0.4rem 0.8rem',
          borderRadius: 20,
          fontSize: '0.8rem',
          fontWeight: 700,
          textDecoration: 'none',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          👨‍👩‍👧 Parents
        </Link>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: 900,
        margin: '-2rem auto 0',
        padding: '0 1rem',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', fontSize: '3rem' }}>⏳</div>
        ) : children.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍👩‍👧</div>
            <h2 style={{ fontFamily: 'Fredoka One', color: 'var(--coral)', marginBottom: '0.5rem' }}>
              Welcome to Chore Stars!
            </h2>
            <p style={{ color: '#6b7280' }}>
              A parent needs to log in and set up the children's profiles first.
            </p>
            <Link to="/parent/login" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
              👨‍👩‍👧 Parent Login
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            {children.map(child => (
              <div key={child.id} style={{ flex: '1 1 320px', minWidth: 0 }}>
                <ChildPanel child={child} dayName={dayName} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
