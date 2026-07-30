import React, { useState, useEffect, useCallback } from 'react';
import { Tv, Radio, AlertTriangle, Scale, Crown, Building2, Vote, Globe, RefreshCw } from 'lucide-react';
import { DataStore } from '../../lib/dataStore';
import type { NewsFeedItem } from '../../types/database';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Category Config ──────────────────────────────────────────────────────────

type NewsCategory = 'all' | 'parliament' | 'court' | 'supreme_court' | 'president' | 'ministry' | 'system';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  parliament:     { label: 'Parliament',     color: 'hsl(265,80%,65%)', bg: 'hsla(265,80%,65%,0.12)', icon: <Vote size={14} /> },
  court:          { label: 'High Court',     color: 'hsl(220,80%,60%)', bg: 'hsla(220,80%,60%,0.12)', icon: <Scale size={14} /> },
  supreme_court:  { label: 'Supreme Court',  color: 'hsl(43,96%,60%)',  bg: 'hsla(43,96%,60%,0.12)', icon: <span style={{ fontSize: '0.9rem' }}>🏛️</span> },
  president:      { label: 'President',      color: 'hsl(43,96%,55%)',  bg: 'hsla(43,96%,55%,0.12)', icon: <Crown size={14} /> },
  ministry:       { label: 'Ministry',       color: 'hsl(152,70%,45%)', bg: 'hsla(152,70%,45%,0.12)', icon: <Building2 size={14} /> },
  system:         { label: 'System',         color: 'hsl(220,15%,55%)', bg: 'hsla(220,15%,55%,0.08)', icon: <Globe size={14} /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
  breaking: { label: '🔴 BREAKING',  color: 'hsl(0,85%,55%)',   pulse: true  },
  high:     { label: '🟡 DEVELOPING',color: 'hsl(43,96%,55%)',  pulse: false },
  normal:   { label: 'NEWS',         color: 'hsl(220,80%,60%)', pulse: false },
  low:      { label: 'UPDATE',       color: 'hsl(220,15%,55%)', pulse: false },
};

// ─── Ticker ───────────────────────────────────────────────────────────────────

const NewsTicker: React.FC<{ items: NewsFeedItem[] }> = ({ items }) => {
  const headlines = items.slice(0, 20).map(i => `${PRIORITY_CONFIG[i.priority]?.label || 'NEWS'}: ${i.headline}`);
  const text = headlines.join('   •   ');

  return (
    <div style={{
      background: 'hsl(0,85%,25%)',
      borderTop: '2px solid hsl(0,85%,45%)',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      position: 'relative',
      height: 36,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        background: 'hsl(0,85%,40%)',
        color: 'white', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em',
        padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center',
        flexShrink: 0, zIndex: 1, borderRight: '2px solid hsl(0,85%,55%)',
        textTransform: 'uppercase',
      }}>
        LIVE
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'inline-block',
          animation: 'tickerScroll 60s linear infinite',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '0.78rem',
          fontWeight: 500,
          paddingLeft: '100%',
          letterSpacing: '0.02em',
        }}>
          {text || 'Welcome to CLMS News 24 — Your source for live government activity'}
        </div>
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes breaking-flash {
          0%, 100% { background: hsl(0,85%,25%); }
          50% { background: hsl(0,85%,18%); }
        }
      `}</style>
    </div>
  );
};

// ─── News Card ────────────────────────────────────────────────────────────────

const NewsCard: React.FC<{ item: NewsFeedItem; featured?: boolean }> = ({ item, featured }) => {
  const cat = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.system;
  const pri = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.normal;

  if (featured) {
    return (
      <div style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: item.priority === 'breaking'
          ? '1.5px solid hsl(0,85%,40%)'
          : '1px solid var(--border-default)',
        background: item.priority === 'breaking'
          ? 'linear-gradient(135deg, rgba(180,30,30,0.15), rgba(120,20,20,0.08))'
          : 'linear-gradient(135deg, rgba(30,50,120,0.15), rgba(20,40,100,0.08))',
        marginBottom: 'var(--space-6)',
      }}>
        {/* Category & priority bar */}
        <div style={{
          padding: 'var(--space-3) var(--space-6)',
          background: item.priority === 'breaking' ? 'hsla(0,85%,30%,0.5)' : 'hsla(220,80%,30%,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        }}>
          {item.priority === 'breaking' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'hsl(0,85%,55%)', animation: 'pulse-dot 1s infinite' }} />
              <span style={{ color: 'hsl(0,85%,65%)', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>BREAKING NEWS</span>
            </div>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: cat.bg, color: cat.color, fontSize: '0.68rem', fontWeight: 700,
            border: `1px solid ${cat.color}40`,
          }}>
            {cat.icon} {cat.label}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
        </div>
        <div style={{ padding: 'var(--space-8)' }}>
          <h2 style={{ margin: '0 0 var(--space-4) 0', fontSize: '1.5rem', lineHeight: 1.3, color: 'var(--text-primary)' }}>{item.headline}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item.body}</p>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>By <strong style={{ color: 'var(--text-secondary)' }}>{item.posted_by}</strong></span>
            <span>{format(new Date(item.created_at), 'MMM dd, yyyy — hh:mm a')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-card)',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cat.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      <div style={{
        height: 4,
        background: item.priority === 'breaking'
          ? 'linear-gradient(90deg, hsl(0,85%,50%), hsl(0,70%,40%))'
          : item.priority === 'high'
          ? 'linear-gradient(90deg, hsl(43,96%,55%), hsl(35,90%,45%))'
          : `linear-gradient(90deg, ${cat.color}, ${cat.color}80)`,
      }} />
      <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: cat.bg, color: cat.color, fontSize: '0.65rem', fontWeight: 700,
            border: `1px solid ${cat.color}30`,
          }}>
            {cat.icon} {cat.label}
          </span>
          {item.priority === 'breaking' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'hsl(0,85%,55%)', fontWeight: 800 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(0,85%,55%)', animation: 'pulse-dot 1s infinite' }} />
              BREAKING
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
        </div>
        <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.4, color: 'var(--text-primary)' }}>{item.headline}</h3>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.body}</p>
        <div style={{ marginTop: 'var(--space-3)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {item.posted_by} · {format(new Date(item.created_at), 'hh:mm a')}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<NewsCategory>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [time, setTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchNews = useCallback(async () => {
    setRefreshing(true);
    const items = await DataStore.getNews(category === 'all' ? undefined : category, 60);
    setNews(items);
    setLastRefresh(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [category]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const featuredItem = news.find(n => n.priority === 'breaking') ?? news.find(n => n.priority === 'high') ?? news[0];
  const gridItems = news.filter(n => n.id !== featuredItem?.id);

  const categories: NewsCategory[] = ['all', 'parliament', 'court', 'supreme_court', 'president', 'ministry', 'system'];

  return (
    <div className="page-container" style={{ padding: 0, maxWidth: '100%' }}>
      {/* TV Channel Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0015 0%, #050030 50%, #000a20 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: 'var(--space-4) var(--space-8)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap',
      }}>
        {/* Channel branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{
            position: 'relative',
            width: 52, height: 52, borderRadius: 12,
            background: 'linear-gradient(135deg, hsl(0,85%,40%), hsl(0,70%,30%))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px hsla(0,85%,40%,0.4)',
          }}>
            <Tv size={24} color="white" />
            {/* On Air dot */}
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 14, height: 14, borderRadius: '50%',
              background: 'hsl(0,85%,55%)', border: '2px solid #0a0015',
              animation: 'pulse-dot 1.5s infinite',
            }} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
              CLMS <span style={{ color: 'hsl(0,85%,55%)' }}>NEWS</span> 24
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Official Government Broadcasting Channel
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'hsla(0,85%,40%,0.2)', border: '1px solid hsla(0,85%,40%,0.4)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(0,85%,55%)', animation: 'pulse-dot 1s infinite' }} />
          <span style={{ color: 'hsl(0,85%,70%)', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.12em' }}>ON AIR</span>
        </div>

        {/* Live time */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            {format(time, 'HH:mm:ss')}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
            {format(time, 'EEEE, MMM dd, yyyy')}
          </div>
        </div>
      </div>

      {/* News Ticker */}
      <NewsTicker items={news} />

      {/* Main content area */}
      <div style={{ padding: 'var(--space-6) var(--space-8)' }}>

        {/* Controls bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)', flexWrap: 'wrap',
        }}>
          {/* Category filters */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', flex: 1 }}>
            {categories.map(cat => {
              const catCfg = cat === 'all' ? null : CATEGORY_CONFIG[cat];
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    background: isActive
                      ? (catCfg ? catCfg.bg : 'hsla(220,80%,60%,0.15)')
                      : 'var(--bg-glass)',
                    color: isActive
                      ? (catCfg ? catCfg.color : 'hsl(220,80%,65%)')
                      : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 400, fontSize: '0.78rem',
                    border: isActive
                      ? `1px solid ${catCfg ? catCfg.color + '60' : 'hsla(220,80%,60%,0.4)'}`
                      : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {catCfg ? catCfg.icon : <Radio size={13} />}
                  {cat === 'all' ? 'All News' : catCfg?.label ?? cat}
                </button>
              );
            })}
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchNews}
            disabled={refreshing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)', cursor: 'pointer',
              background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.78rem',
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : `Updated ${formatDistanceToNow(lastRefresh, { addSuffix: true })}`}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : news.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-muted)' }}>
            <Tv size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.3 }} />
            <h2 style={{ color: 'var(--text-secondary)' }}>No News Yet</h2>
            <p>As government activities happen, they'll be broadcast here automatically.</p>
          </div>
        ) : (
          <>
            {/* Featured / Breaking News */}
            {featuredItem && <NewsCard item={featuredItem} featured />}

            {/* Stats bar */}
            <div style={{
              display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap',
            }}>
              {[
                { label: 'Breaking', value: news.filter(n => n.priority === 'breaking').length, color: 'hsl(0,85%,55%)' },
                { label: 'Court Orders', value: news.filter(n => ['court', 'supreme_court'].includes(n.category)).length, color: 'hsl(265,80%,65%)' },
                { label: 'Parliament', value: news.filter(n => n.category === 'parliament').length, color: 'hsl(265,80%,65%)' },
                { label: 'Total Stories', value: news.length, color: 'hsl(220,15%,55%)' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: '1 1 80px', padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* News Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-4)',
            }}>
              {gridItems.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {news.length >= 60 && (
              <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Showing latest 60 stories. Older stories are archived.
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NewsPage;
