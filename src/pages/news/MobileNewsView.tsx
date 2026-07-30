import React from 'react';
import { Tv, Radio, RefreshCw } from 'lucide-react';
import type { NewsFeedItem } from '../../types/database';
import { format, formatDistanceToNow } from 'date-fns';

type NewsCategory = 'all' | 'parliament' | 'court' | 'supreme_court' | 'president' | 'ministry' | 'system';

interface MobileNewsViewProps {
  news: NewsFeedItem[];
  loading: boolean;
  category: NewsCategory;
  setCategory: (c: NewsCategory) => void;
  fetchNews: () => void;
  refreshing: boolean;
  time: Date;
  categories: NewsCategory[];
  CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }>;
  PRIORITY_CONFIG: Record<string, { label: string; color: string; pulse: boolean }>;
}

const MobileNewsView: React.FC<MobileNewsViewProps> = ({
  news, loading, category, setCategory, fetchNews, refreshing, time, categories, CATEGORY_CONFIG, PRIORITY_CONFIG
}) => {
  const featuredItem = news.find(n => n.priority === 'breaking') ?? news.find(n => n.priority === 'high') ?? news[0];
  const listItems = news.filter(n => n.id !== featuredItem?.id);

  return (
    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', width: '100%', background: 'var(--bg-default)', minHeight: '100vh' }}>
      
      {/* Mobile Compact Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0015 0%, #050030 100%)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, hsl(0,85%,40%), hsl(0,70%,30%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tv size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>CLMS <span style={{ color: 'hsl(0,85%,55%)' }}>NEWS</span></div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Live Broadcast</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(0,85%,55%)', animation: 'pulse-dot 1s infinite' }} />
            <span style={{ color: 'hsl(0,85%,70%)', fontWeight: 800, fontSize: '0.65rem' }}>ON AIR</span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)' }}>{format(time, 'HH:mm')}</div>
        </div>
      </div>

      {/* Mobile Filters (Horizontal Scroll) */}
      <div style={{ 
        padding: 'var(--space-3) var(--space-4)', 
        background: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', gap: 'var(--space-2)', 
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {categories.map(cat => {
          const catCfg = cat === 'all' ? null : CATEGORY_CONFIG[cat];
          const isActive = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: isActive ? (catCfg ? catCfg.bg : 'hsla(220,80%,60%,0.15)') : 'transparent',
                color: isActive ? (catCfg ? catCfg.color : 'hsl(220,80%,65%)') : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500, fontSize: '0.8rem',
                border: isActive ? `1px solid ${catCfg ? catCfg.color + '60' : 'hsla(220,80%,60%,0.4)'}` : '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              {catCfg ? catCfg.icon : <Radio size={13} />}
              {cat === 'all' ? 'All News' : catCfg?.label ?? cat}
            </button>
          );
        })}
      </div>

      {/* Mobile News Feed */}
      <div style={{ flex: 1, padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Latest Updates</h3>
          <button onClick={fetchNews} disabled={refreshing} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {loading ? (
           <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading live feed...</div>
        ) : news.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>No news found.</div>
        ) : (
          <>
            {/* Featured Item */}
            {featuredItem && (
              <div style={{
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                background: featuredItem.priority === 'breaking' ? 'linear-gradient(135deg, rgba(180,30,30,0.1), rgba(120,20,20,0.05))' : 'var(--bg-card)',
                border: featuredItem.priority === 'breaking' ? '1px solid hsl(0,85%,30%)' : '1px solid var(--border-subtle)',
              }}>
                <div style={{ padding: 'var(--space-3)', background: featuredItem.priority === 'breaking' ? 'hsl(0,85%,30%)' : 'var(--border-subtle)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>{featuredItem.priority === 'breaking' ? '🔴 BREAKING' : 'FEATURED'}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{formatDistanceToNow(new Date(featuredItem.created_at), { addSuffix: true })}</span>
                </div>
                <div style={{ padding: 'var(--space-4)' }}>
                  <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1.25rem', lineHeight: 1.3, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{featuredItem.headline}</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{featuredItem.body}</p>
                  <div style={{ marginTop: 'var(--space-3)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>By {featuredItem.posted_by}</div>
                </div>
              </div>
            )}

            {/* List Items */}
            {listItems.map(item => {
              const cat = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.system;
              return (
                <div key={item.id} style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  minWidth: 0, overflowWrap: 'break-word', wordBreak: 'break-word'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: cat.color, fontSize: '0.7rem', fontWeight: 700 }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                  <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: '1rem', lineHeight: 1.4 }}>{item.headline}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.body}
                  </p>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MobileNewsView;
