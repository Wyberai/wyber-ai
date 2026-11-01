import s from './expo.module.css'
import type { AudienceId } from './data'

// The "after": a believable little product for each audience. All data is made up.
export function AppMock({ audience, shaped }: { audience: AudienceId; shaped: boolean }) {
  if (audience === 'business') {
    const rows = [
      ['#1042', 'Patel Dyers', '400 m grey cloth', '52 days out', 'PENDING', false],
      ['#1038', 'Shah Processors', '250 m grey cloth', 'Returned', 'BACK', false],
      ['#1019', 'Modi Finishers', '120 pcs castings', '11 months out', 'NEAR LIMIT', true],
      ['#1011', 'Raval Works', '80 pcs castings', '11 months out', 'NEAR LIMIT', true],
    ] as const
    return (
      <div className={s.win}>
        <div className={s.wbar}><i /><i /><i /><span>JOB-WORK TRACKER</span></div>
        <div className={s.wbody}>
          <div className={s.kpi}><b>23</b><span>challans out · 4 near the one-year limit</span></div>
          {rows.map(r => (
            <div key={r[0]} className={`${s.arow} ${shaped && r[5] ? s.arowWarn : ''}`}>
              <div><div className={s.an}>{r[1]}</div><div className={s.as}>{r[0]} · {r[2]}</div></div>
              <div className={s.as}>{r[3]}</div>
              <span className={`${s.achip} ${r[5] ? s.achipHot : ''}`}>{r[4]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (audience === 'software') {
    const rows = [
      ['Larkspur Health', '142 h', '$4,260', '₹3.56L', 'PAID'],
      ['Cobalt Freight', '96 h', '$2,880', '₹2.40L', 'UNPAID'],
      ['Mapleton Labs', '56 h', '$1,680', '₹1.40L', 'UNPAID'],
    ] as const
    return (
      <div className={s.win}>
        <div className={s.wbar}><i /><i /><i /><span>TIMESHEET TO INVOICE</span></div>
        <div className={s.wbody}>
          <div className={s.kpi}><b>$8,820</b><span>March invoices · 2 unpaid</span></div>
          {rows.map(r => (
            <div key={r[0]} className={s.arow} style={{ gridTemplateColumns: shaped ? '1.3fr .6fr .8fr .8fr auto' : '1.3fr .6fr .8fr auto' }}>
              <div><div className={s.an}>{r[0]}</div></div>
              <div className={s.as}>{r[1]}</div>
              <div className={s.an}>{r[2]}</div>
              {shaped && <div className={`${s.an} ${s.rupee}`}>{r[3]}</div>}
              <span className={`${s.achip} ${r[4] === 'UNPAID' ? s.achipHot : ''}`}>{r[4]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const rows = [
    ['Cedar Analytics', 'Round 2 · Mon 9:30'],
    ['Brightwave Tech', 'Aptitude · Wed 2:00'],
    ['Orion Systems', 'HR round · Fri 11:00'],
  ] as const
  return (
    <div className={`${s.win} ${s.phone}`}>
      <div className={s.wbar}><i /><i /><i /><span>PLACEMENT TRACKER</span></div>
      <div className={s.wbody}>
        <div className={s.kpi}><b>12</b><span>companies · 3 this week</span></div>
        {rows.map(r => (
          <div key={r[0]} className={s.arow} style={{ gridTemplateColumns: '1fr auto' }}>
            <div><div className={s.an}>{r[0]}</div><div className={s.as}>{r[1]}</div></div>
            {shaped && <span className={s.achip}>PREP NOTES</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
