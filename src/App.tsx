import { useState, useEffect, useCallback } from 'react'
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
const POLL_INTERVAL = 1_000

// ─── LiveCountUp — no remount, spring animates to new value ──────────────────
function LiveCountUp({ value, separator = ',' }: { value: number; separator?: string }) {
  return <CountUp to={value} separator={separator} duration={0.8} />
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [data,        setData]        = useState<QuotaData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_URL, { cache: 'no-store' })
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

  const used    = data ? TOTAL_QUOTA - data.remaining : 0
  const pctLeft = data ? (data.remaining / TOTAL_QUOTA) * 100 : 100
  const pctUsed = 100 - pctLeft

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <img
              src="/thai-chuay-thai-plus-60-40.png"
              alt="โครงการไทยช่วยไทย พลัส"
              className="header__logo-img"
              width="80"
              height="53"
            />
          </div>
          {timeStr && <span className="header__time">{timeStr}</span>}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main" id="main-content">

        {/* Page title */}
        <div className="page-title">
          <h1 className="page-title__h1">ติดตาม Quota คงเหลือ</h1>
          <p className="page-title__sub">โครงการไทยช่วยไทย พลัส</p>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              width="18" height="18" aria-hidden="true">
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
          <div className="skeleton-card" aria-busy="true" aria-label="กำลังโหลด">
            <div className="skeleton skeleton--number" />
            <div className="skeleton skeleton--bar" style={{ width: '100%' }} />
            <div className="skeleton skeleton--stats" />
          </div>
        )}

        {/* Main quota card */}
        {!loading && data && (
          <div className="quota-card">

            {/* Big number */}
            <div className="quota-display">
              <p className="quota-display__label">สิทธิ์คงเหลือ</p>
              <div className="quota-display__number" aria-live="polite" aria-atomic="true">
                <LiveCountUp value={data.remaining} />
              </div>
            </div>

            {/* Progress bar — used */}
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-header__label">สิทธิ์ที่ใช้ไปแล้ว</span>
                <span className="progress-header__pct">
                  {used.toLocaleString('en-US').replace(/,/g, ',')} / 30,000,000
                </span>
              </div>
              <div className="progress-track" role="progressbar"
                aria-valuenow={pctUsed} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-fill progress-fill--used" style={{ width: `${pctUsed}%` }} />
              </div>
            </div>

            {/* Stats row */}
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-item__label">คงเหลือ</span>
                <span className="stat-item__value stat-item__value--blue">
                  <LiveCountUp value={data.remaining} />
                </span>
                <span className="stat-item__sub">สิทธิ์</span>
              </div>

              <div className="stats-divider" aria-hidden="true" />

              <div className="stat-item">
                <span className="stat-item__label">ใช้ไปแล้ว</span>
                <span className="stat-item__value stat-item__value--red">
                  <LiveCountUp value={used} />
                </span>
                <span className="stat-item__sub">สิทธิ์</span>
              </div>

              <div className="stats-divider" aria-hidden="true" />

              <div className="stat-item">
                <span className="stat-item__label">ได้รับสิทธิ์แล้ว (%)</span>
                <span className="stat-item__value stat-item__value--amber">
                  {pctUsed.toFixed(2)}%
                </span>
                <span className="stat-item__sub">จากทั้งหมด 30,000,000 สิทธิ์</span>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  )
}
