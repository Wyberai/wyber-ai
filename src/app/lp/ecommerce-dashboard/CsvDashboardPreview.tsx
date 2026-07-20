'use client';
import { useRef, useState } from 'react';
import { track } from '@/lib/track';

// Parses the uploaded file entirely in the browser (same XLSX.read(buf, {type:'array'})
// approach ChatPanel.tsx already uses for spreadsheet attachments) — the file is never
// sent to a server, which is both the fastest path to a working preview and a real
// privacy claim we can make honestly to sellers uploading real sales data.
const MAX_BYTES = 10 * 1024 * 1024;

const AMOUNT_RE = /amount|price|revenue|total|sale|sales/i;
const FEE_RE = /fee|commission/i;
const COST_RE = /cost|cogs|cogs/i;
const CHANNEL_RE = /channel|platform|marketplace|source|store/i;

type Cell = string | number | Date;
type ParsedState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ready'; fileName: string; headers: string[]; rows: Cell[][]; summary: Summary };

const fmtCell = (v: Cell | undefined): string =>
  v instanceof Date ? v.toLocaleDateString() : String(v ?? '');

interface Summary {
  rowCount: number;
  colCount: number;
  amountCol: string | null;
  feeCol: string | null;
  costCol: string | null;
  channelCol: string | null;
  totalRevenue: number | null;
  totalFees: number | null;
  netMargin: number | null;
  byChannel: { name: string; total: number }[];
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[,$₹\s]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function summarize(headers: string[], rows: Cell[][]): Summary {
  const amountIdx = headers.findIndex(h => AMOUNT_RE.test(h));
  const feeIdx = headers.findIndex(h => FEE_RE.test(h));
  const costIdx = headers.findIndex(h => COST_RE.test(h));
  const channelIdx = headers.findIndex(h => CHANNEL_RE.test(h));

  let totalRevenue: number | null = null;
  let totalFees: number | null = null;
  let totalCost: number | null = null;
  const byChannelMap = new Map<string, number>();

  if (amountIdx >= 0) {
    totalRevenue = 0;
    for (const row of rows) {
      const n = toNumber(row[amountIdx]);
      if (n !== null) totalRevenue += n;
      if (channelIdx >= 0) {
        const name = String(row[channelIdx] ?? 'Unspecified').trim() || 'Unspecified';
        byChannelMap.set(name, (byChannelMap.get(name) ?? 0) + (n ?? 0));
      }
    }
  }
  if (feeIdx >= 0) {
    totalFees = 0;
    for (const row of rows) { const n = toNumber(row[feeIdx]); if (n !== null) totalFees += n; }
  }
  if (costIdx >= 0) {
    totalCost = 0;
    for (const row of rows) { const n = toNumber(row[costIdx]); if (n !== null) totalCost += n; }
  }

  const netMargin = totalRevenue !== null
    ? totalRevenue - (totalFees ?? 0) - (totalCost ?? 0)
    : null;

  const byChannel = [...byChannelMap.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    rowCount: rows.length,
    colCount: headers.length,
    amountCol: amountIdx >= 0 ? headers[amountIdx] : null,
    feeCol: feeIdx >= 0 ? headers[feeIdx] : null,
    costCol: costIdx >= 0 ? headers[costIdx] : null,
    channelCol: channelIdx >= 0 ? headers[channelIdx] : null,
    totalRevenue, totalFees, netMargin, byChannel,
  };
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

export function CsvDashboardPreview() {
  const [state, setState] = useState<ParsedState>({ status: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    track('lp_ecommerce_dashboard_file_selected', { fileType: file.name.split('.').pop() });
    if (file.size > MAX_BYTES) {
      setState({ status: 'error', message: 'That file is over 10MB — try exporting a smaller date range and upload again.' });
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as Cell[][];
      if (raw.length < 2) {
        setState({ status: 'error', message: "Couldn't find any data rows in that file — make sure the first row is your column headers." });
        return;
      }
      const headers = raw[0].map(h => String(h ?? '').trim());
      const rows = raw.slice(1);
      setState({ status: 'ready', fileName: file.name, headers, rows, summary: summarize(headers, rows) });
      track('lp_ecommerce_dashboard_preview_shown', { rows: rows.length });
    } catch {
      setState({ status: 'error', message: "Couldn't read that file — make sure it's a .csv, .xlsx, or .xls export." });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const s = { card: 'var(--brand-bg-raised)', border: 'var(--brand-border)', text: 'var(--brand-text)', muted: 'var(--brand-text-dim)', dim: 'var(--brand-text-faint)' };
  const color = '#0EA5E9';

  if (state.status === 'ready') {
    const { summary, headers, rows, fileName } = state;
    const maxChannel = summary.byChannel[0]?.total ?? 1;
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, color: s.muted }}>📄 {fileName} — {summary.rowCount} rows, {summary.colCount} columns</div>
          <button onClick={() => setState({ status: 'idle' })} style={{ fontSize: 12, color: s.dim, background: 'none', border: `1px solid ${s.border}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>Upload a different file</button>
        </div>

        {summary.totalRevenue !== null ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
            <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: s.dim, marginBottom: 6 }}>Total revenue ({summary.amountCol})</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(summary.totalRevenue)}</div>
            </div>
            {summary.totalFees !== null && (
              <div style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: s.dim, marginBottom: 6 }}>Total fees ({summary.feeCol})</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(summary.totalFees)}</div>
              </div>
            )}
            {summary.netMargin !== null && (
              <div style={{ background: s.card, border: `1px solid ${color}40`, borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: s.dim, marginBottom: 6 }}>Estimated net margin</div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{fmt(summary.netMargin)}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '14px 18px', borderRadius: 10, background: `${color}10`, border: `1px solid ${color}30`, fontSize: 13, color: s.muted, marginBottom: 24 }}>
            We couldn't auto-detect a revenue column in this file — no problem, sign up and describe your columns and we'll build the exact mapping for your export format.
          </div>
        )}

        {summary.byChannel.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Revenue by {summary.channelCol}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {summary.byChannel.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 12, color: s.muted, width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ flex: 1, background: s.card, borderRadius: 6, overflow: 'hidden', height: 22 }}>
                    <div style={{ width: `${Math.max(4, (c.total / maxChannel) * 100)}%`, height: '100%', background: color, borderRadius: 6 }} />
                  </div>
                  <div style={{ fontSize: 12, color: s.text, width: 90, textAlign: 'right', flexShrink: 0 }}>{fmt(c.total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto', border: `1px solid ${s.border}`, borderRadius: 10, marginBottom: 20 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                {headers.slice(0, 8).map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '8px 12px', color: s.dim, borderBottom: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>{h || `Column ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 6).map((row, i) => (
                <tr key={i}>
                  {row.slice(0, 8).map((cell, j) => (
                    <td key={j} style={{ padding: '8px 12px', color: s.muted, borderBottom: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>{fmtCell(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: s.dim }}>Showing the first 6 of {summary.rowCount} rows and first {Math.min(8, summary.colCount)} of {summary.colCount} columns.</div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? color : s.border}`,
          borderRadius: 14,
          padding: 'clamp(32px,6vw,56px) 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? `${color}0a` : 'transparent',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Drop your orders export here</div>
        <div style={{ fontSize: 13, color: s.muted, marginBottom: 4 }}>.csv, .xlsx, or .xls — from Amazon, Shopify, Etsy, or anywhere</div>
        <div style={{ fontSize: 12, color: s.dim }}>Processed entirely in your browser — the file is never uploaded anywhere</div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {state.status === 'error' && (
        <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#ef444414', border: '1px solid #ef444440', fontSize: 13, color: '#fca5a5' }}>
          {state.message}
        </div>
      )}
    </div>
  );
}
