import { useState, useEffect, useCallback, useRef } from 'react'
import CountUp from './CountUp'
import './App.css'

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuotaData {
  remaining: number
  remainingBudget: number
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_QUOTA   = 30_000_000
const API_URL       = '/api/quota'
const POLL_INTERVAL = 1_000 // 1 second

// ─── Format helpers ──────────────────────────────────────────────────────────
function formatNumber(n: number) {
  return n.toLocaleString('th-TH')
}

// ─── Circular Progress ───────────────────────────────────────────────────────
function CircularProgress({ pct, color, size = 160 }: { pct: number; color: string; size?: number }) {
  const r      = (size - 16) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="ring-track" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  )
}

// ─── Animated CountUp wrapper that re-animates on value change ───────────────
function LiveCountUp({ value, separator = ',' }: { value: number; separator?: string }) {
  const prevRef = useRef<number>(value)
  const [key, setKey]   = useState(0)
  const [from, setFrom] = useState(value)

  useEffect(() => {
    if (value !== prevRef.current) {
      setFrom(prevRef.current)
      prevRef.current = value
      setKey(k => k + 1)
    }
  }, [value])

  return (
    <CountUp
      key={key}
      from={from}
      to={value}
      separator={separator}
      duration={0.8}
      direction={value >= from ? 'up' : 'down'}
    />
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label:    string
  sublabel: string
  value:    number
  total:    number
  color:    string
  formatFn: (n: number) => string
  unit:     string
  icon:     React.ReactNode
}

function StatCard({ label, sublabel, value, total, color, formatFn, unit, icon }: StatCardProps) {
  const used    = total - value
  const pct     = Math.max(0, Math.min(100, (value / total) * 100))
  const usedPct = 100 - pct

  return (
    <div className="stat-card" role="region" aria-label={label}>
      <div className="stat-card__header">
        <div className="stat-card__icon" style={{ color }}>{icon}</div>
        <div>
          <h2 className="stat-card__label">{label}</h2>
          <p className="stat-card__sublabel">{sublabel}</p>
        </div>
      </div>

      <div className="stat-card__body">
        {/* Ring */}
        <div className="stat-card__ring">
          <CircularProgress pct={pct} color={color} size={160} />
          <div className="stat-card__ring-inner">
            <span className="stat-card__pct" style={{ color }}>{pct.toFixed(1)}%</span>
            <span className="stat-card__pct-label">คงเหลือ</span>
          </div>
        </div>

        {/* Numbers */}
        <div className="stat-card__numbers">
          {/* คงเหลือ */}
          <div className="stat-card__number-row">
            <span className="stat-card__number-dot" style={{ background: color }} />
            <div>
              <p className="stat-card__number-label">คงเหลือ</p>
              <p className="stat-card__number-value" style={{ color }}>
                <LiveCountUp value={value} separator="," />
                {' '}<span className="stat-card__unit">{unit}</span>
              </p>
            </div>
          </div>

          {/* ใช้ไปแล้ว */}
          <div className="stat-card__number-row">
            <span className="stat-card__number-dot" style={{ background: '#94a3b8' }} />
            <div>
              <p className="stat-card__number-label">ใช้ไปแล้ว</p>
              <p className="stat-card__number-value stat-card__number-value--muted">
                <LiveCountUp value={used} separator="," />
                {' '}<span className="stat-card__unit">{unit}</span>
              </p>
            </div>
          </div>

          <div className="stat-card__divider" />

          {/* ทั้งหมด */}
          <div className="stat-card__number-row">
            <span className="stat-card__number-dot" style={{ background: '#e2e8f0' }} />
            <div>
              <p className="stat-card__number-label">ทั้งหมด</p>
              <p className="stat-card__number-value stat-card__number-value--total">
                {formatNumber(total)}{' '}<span className="stat-card__unit">{unit}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="stat-card__bar-wrap" aria-label={`ใช้ไปแล้ว ${usedPct.toFixed(1)}%`}>
        <div className="stat-card__bar-track">
          <div className="stat-card__bar-fill" style={{ width: `${usedPct}%`, background: color }} />
        </div>
        <div className="stat-card__bar-labels">
          <span>ใช้ไปแล้ว {usedPct.toFixed(1)}%</span>
          <span>คงเหลือ {pct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Pulse dot ───────────────────────────────────────────────────────────────
function PulseDot({ active }: { active: boolean }) {
  return (
    <span className={`pulse-dot ${active ? 'pulse-dot--active' : ''}`} aria-hidden="true">
      <span className="pulse-dot__ring" />
      <span className="pulse-dot__core" />
    </span>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [data,        setData]        = useState<QuotaData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(API_URL, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: QuotaData = await res.json()
      setData(json)
      setLastUpdated(new Date())
      setError(null)
    } catch {
      setError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <div className="header__logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div>
              <h1 className="header__title">ไทยช่วยไทย พลัส</h1>
            </div>
          </div>

          <div className="header__status">
            {timeStr && <span className="header__time">อัปเดต {timeStr}</span>}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main" id="main-content">
        {/* Hero */}
        <section className="hero-banner" aria-label="ข้อมูลโครงการ">
          <div className="hero-banner__inner">
            <div className="hero-banner__badge">โครงการรัฐบาล</div>
            <h2 className="hero-banner__title">โครงการไทยช่วยไทย พลัส</h2>
            <p className="hero-banner__desc">
              ติดตาม Quota สิทธิ์คงเหลือและงบประมาณแบบ Real-time
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="error-banner" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              width="20" height="20" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
            <button className="error-banner__retry" onClick={fetchData}>ลองใหม่</button>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="cards-grid cards-grid--single" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
            <div className="skeleton-card">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--circle" />
              <div className="skeleton skeleton--bar" />
              <div className="skeleton skeleton--bar skeleton--bar-short" />
            </div>
          </div>
        )}

        {/* Cards */}
        {!loading && data && (
          <div className="cards-grid cards-grid--single">
            <StatCard
              label="สิทธิ์คงเหลือ"
              sublabel="จำนวนสิทธิ์ที่ยังไม่ถูกใช้งาน"
              value={data.remaining}
              total={TOTAL_QUOTA}
              color="#0369a1"
              formatFn={formatNumber}
              unit="สิทธิ์"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          </div>
        )}

        {/* Summary */}
        {!loading && data && (() => {
          const usedQuota = TOTAL_QUOTA - data.remaining
          return (
          <section className="summary-bar" aria-label="สรุปข้อมูล">
            <div className="summary-bar__inner">
              <div className="summary-item">
                <span className="summary-item__label">สิทธิ์ที่ใช้ไปแล้ว</span>
                <span className="summary-item__value summary-item__value--blue">
                  <LiveCountUp value={usedQuota} separator="," />
                  {' '}สิทธิ์
                </span>
              </div>
              <div className="summary-divider" aria-hidden="true" />
              <div className="summary-item">
                <span className="summary-item__label">อัตราการใช้สิทธิ์</span>
                <span className="summary-item__value summary-item__value--orange">
                  {((usedQuota / TOTAL_QUOTA) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </section>
          )
        })()}
      </main>
    </div>
  )
}
