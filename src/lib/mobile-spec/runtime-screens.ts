// The fixed screens of every spec-driven mobile app, written into the project as .tsx files. They read the app's shape from schema.ts and
// the look from theme.ts, so the same screens serve a billing book and a gym register. RULES: String.raw templates, so NO backticks and
// NO ${ sequences inside them (use string concatenation). Nothing here claims what is not true: no invented insights, no "synced", no "secure".

export const ROW_ITEM_TSX = String.raw`// One row of one entity, the same everywhere it appears (list, home, deck, search results).
import { View } from 'react-native'
import { APP, type Entity, type Row } from '../schema'
import { Badge, ListRow } from './ui'
import { metaOf, statusOf, subtitleOf } from '../lib/present'
import { titleOf } from '../lib/logic'
import type { Store } from '../lib/db'

export default function RowItem({ store, entity, row, onPress, onLongPress, showEntity }: { store: Store; entity: Entity; row: Row; onPress: () => void; onLongPress?: () => void; showEntity?: boolean }) {
  const st = statusOf(entity, row)
  const sub = subtitleOf(store, entity, row)
  const badge = st || row.demo ? (
    <View style={{ flexDirection: 'row' }}>
      {row.demo ? <View style={{ marginRight: st ? 6 : 0 }}><Badge label="Demo" tone="accent" /></View> : null}
      {st ? <Badge label={st.label} tone={st.tone} /> : null}
    </View>
  ) : undefined
  return (
    <ListRow
      title={titleOf(entity, row) || entity.singular}
      subtitle={(showEntity ? entity.singular + (sub ? ' · ' : '') : '') + sub}
      meta={metaOf(store, entity, row)}
      badge={badge}
      plain={APP.layout.rows === 'plain'}
      dense={APP.layout.density === 'compact'}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  )
}
`

export const SETUP_TSX = String.raw`// First run: say what the app does, take an optional name, and start empty. Demo data is a choice, never a default.
import { useState } from 'react'
import { Text, View } from 'react-native'
import { APP } from '../schema'
import { theme, type as T, space as S, serifFamily } from '../theme'
import { Button, Screen, TextField } from '../components/ui'
import type { Api } from '../lib/api'

export default function Setup({ api }: { api: Api }) {
  const [name, setName] = useState('')
  return (
    <Screen>
      <View style={{ paddingTop: S.xxl, paddingBottom: S.xl }}>
        <Text accessibilityRole="header" style={[T.title, { color: theme.text, fontFamily: serifFamily }]}>{APP.name}</Text>
        <Text style={[T.body, { color: theme.textSecondary, marginTop: S.sm }]}>{APP.tagline}</Text>
        <Text style={[T.body, { color: theme.text, marginTop: S.lg }]}>{APP.homeIntro}</Text>
      </View>
      <TextField label="Your business name (optional)" value={name} onChangeText={setName} helper="Shown at the top of the app and in reminder messages." />
      <Button label="Start with an empty app" full onPress={() => api.finishSetup(name, false)} />
      <View style={{ height: S.md }} />
      <Button label="Load sample data (demo)" variant="secondary" full onPress={() => api.finishSetup(name, true)} />
      <Text style={[T.caption, { color: theme.textMuted, marginTop: S.md }]}>Sample rows are marked Demo and can be removed in Settings. Saved on this phone only.</Text>
    </Screen>
  )
}
`

export const HOME_TSX = String.raw`// Home. The layout follows the direction's structure (APP.layout.structure): dashboard, feed, tool, card deck, plain list or menu sheet.
import React, { useRef, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { APP, ENTITY_ICONS, type Entity, type Row } from '../schema'
import { theme, type as T, space as S, serifFamily } from '../theme'
import { BigNumber, Button, Card, EmptyState, Fab, Header, IconButton, ListRow, Notice, Screen, SectionLabel, Sheet, Stat, Badge, type Tone } from '../components/ui'
import RowItem from '../components/RowItem'
import { attention, filterRows, mainEntities, metaOf, primaryEntity, recentRows, statusOf, subtitleOf } from '../lib/present'
import { formatMoney, hasSample, isEmpty, metricValue, titleOf } from '../lib/logic'
import { list } from '../lib/db'
import type { Api } from '../lib/api'

export default function Home({ api }: { api: Api }) {
  const { store } = api
  const L = APP.layout
  const [avail, setAvail] = useState(320)
  const [menu, setMenu] = useState(false)
  const [card, setCard] = useState(0)
  const deck = useRef<ScrollView>(null)
  const main = mainEntities()
  const primary = primaryEntity()
  const name = store.settings.businessName || APP.name
  const stats = APP.metrics.map(m => {
    const v = metricValue(store, m)
    const late = m.where && m.where.op === 'overdue'
    return { id: m.id, label: m.label, value: m.money ? formatMoney(v) : String(v), tone: (late && v > 0 ? 'danger' : undefined) as Tone | undefined }
  })
  const notes = attention(store)
  const empty = isEmpty(store)
  const demo = hasSample(store)
  const openEntity = (e: Entity, overdue?: boolean) => (main.includes(e) && !overdue && api.tabs.includes(e.id) ? api.go(e.id) : api.push({ kind: 'list', entity: e.id, overdue }))
  const addPrimary = () => api.push({ kind: 'form', entity: primary.id })
  const showFab = L.add === 'fab' && !empty && L.structure !== 'tool-first'

  const hero = (
    <Card>
      <Text style={[T.label, { color: theme.textSecondary }]}>{stats[0].label}</Text>
      <View style={{ marginTop: S.xs }}><BigNumber value={stats[0].value} tone={stats[0].tone} /></View>
    </Card>
  )
  // The other figures as one ruled list: label left, value right. Any count of metrics lines up, so there is never an orphan cell.
  const grid = stats.length > 1 ? (
    <View style={{ marginTop: S.md }}>
      {stats.slice(1).map(s => (
        <View key={s.id} accessible accessibilityLabel={s.label + ': ' + s.value} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <Text style={[T.body, { color: theme.textSecondary, flex: 1 }]}>{s.label}</Text>
          <Text style={[T.body, { color: s.tone === 'danger' ? theme.danger : theme.text, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{s.value}</Text>
        </View>
      ))}
    </View>
  ) : null
  const alerts = notes.map(n => <View key={n.entityId} style={{ marginTop: S.md }}><Notice tone="warning" text={n.text} actionLabel="Show" onAction={() => api.push({ kind: 'list', entity: n.entityId, overdue: true })} /></View>)
  const shortcuts = (
    <View>
      <SectionLabel>Sections</SectionLabel>
      {APP.entities.map(e => (
        <ListRow key={e.id} title={e.label} subtitle={e.blurb} meta={String(list(store, e.id).length)} plain={L.rows === 'plain'} dense={L.density === 'compact'} onPress={() => openEntity(e)} />
      ))}
    </View>
  )
  const feed = (n: number, label: string) => {
    const rows = recentRows(store, n)
    return rows.length ? (
      <View>
        <SectionLabel>{label}</SectionLabel>
        {rows.map(r => <RowItem key={r.entity.id + r.row.id} store={store} entity={r.entity} row={r.row} showEntity={main.length > 1} onPress={() => api.push({ kind: 'detail', entity: r.entity.id, id: r.row.id })} />)}
      </View>
    ) : null
  }

  let body: React.ReactNode
  if (empty) {
    body = (
      <View>
        <EmptyState title={'No ' + primary.label.toLowerCase() + ' yet'} body={APP.homeIntro} actionLabel={'Add ' + primary.singular.toLowerCase()} onAction={addPrimary} icon={ENTITY_ICONS[primary.id]} />
        <View style={{ alignItems: 'center' }}><Button label="Load sample data (demo)" variant="secondary" onPress={api.loadSample} /></View>
      </View>
    )
  } else if (L.structure === 'tabs-feed') {
    body = (
      <View>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{stats.slice(0, 3).map(s => <View key={s.id} style={{ flex: 1, minWidth: 96, paddingRight: S.sm }}><Stat label={s.label} value={s.value} tone={s.tone} /></View>)}</View>
        </Card>
        {alerts}
        {feed(10, 'Recent')}
      </View>
    )
  } else if (L.structure === 'tool-first') {
    body = (
      <View>
        <Card>
          <Text style={[T.label, { color: theme.textSecondary }]}>{stats[0].label}</Text>
          <View style={{ marginTop: S.xs, marginBottom: S.lg }}><BigNumber value={stats[0].value} tone={stats[0].tone} /></View>
          <Button label={'Add ' + primary.singular.toLowerCase()} icon="plus" full onPress={addPrimary} />
        </Card>
        {alerts}
        {grid}
        {feed(4, 'Latest')}
      </View>
    )
  } else if (L.structure === 'cards-swipe') {
    const rows = filterRows(store, primary, list(store, primary.id), { q: '', status: '', overdue: false })
    const w = Math.max(240, Math.min(avail, 520))
    const go = (i: number) => { const k = Math.max(0, Math.min(rows.length - 1, i)); setCard(k); deck.current?.scrollTo({ x: k * (w + S.md), animated: true }) }
    body = (
      <View>
        {alerts}
        <SectionLabel>{primary.label}</SectionLabel>
        {rows.length === 0 ? <EmptyState title={'No ' + primary.label.toLowerCase() + ' yet'} body={primary.blurb} actionLabel={'Add ' + primary.singular.toLowerCase()} onAction={addPrimary} /> : (
          <View onLayout={ev => setAvail(ev.nativeEvent.layout.width)}>
            <ScrollView ref={deck} horizontal pagingEnabled={false} snapToInterval={w + S.md} decelerationRate="fast" showsHorizontalScrollIndicator={false} onMomentumScrollEnd={ev => setCard(Math.round(ev.nativeEvent.contentOffset.x / (w + S.md)))}>
              {rows.map(r => <View key={r.id} style={{ width: w, marginRight: S.md }}><RowItemCard api={api} entity={primary} row={r} /></View>)}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.md }}>
              <IconButton icon="chevronLeft" label="Previous card" onPress={() => go(card - 1)} />
              <Text accessibilityLiveRegion="polite" style={[T.body, { color: theme.textSecondary }]}>{Math.min(card + 1, rows.length) + ' of ' + rows.length}</Text>
              <IconButton icon="chevronRight" label="Next card" onPress={() => go(card + 1)} />
            </View>
          </View>
        )}
        {grid ? <View style={{ marginTop: S.md }}>{grid}</View> : null}
        {shortcuts}
      </View>
    )
  } else if (L.structure === 'split-list') {
    const rows = filterRows(store, primary, list(store, primary.id), { q: '', status: '', overdue: false }).slice(0, 12)
    body = (
      <View>
        <Text style={[T.body, { color: theme.textSecondary }]}>{stats.slice(0, 3).map(s => s.label + ' ' + s.value).join('  ·  ')}</Text>
        {alerts}
        <SectionLabel>{primary.label}</SectionLabel>
        {rows.map(r => <RowItem key={r.id} store={store} entity={primary} row={r} onPress={() => api.push({ kind: 'detail', entity: primary.id, id: r.id })} />)}
        {list(store, primary.id).length > rows.length ? <ListRow title={'All ' + primary.label.toLowerCase()} meta={String(list(store, primary.id).length)} plain onPress={() => openEntity(primary)} /> : null}
        {main.length > 1 ? shortcuts : null}
      </View>
    )
  } else {
    body = (
      <View>
        {hero}
        {grid}
        {alerts}
        {shortcuts}
      </View>
    )
  }

  const sections = APP.entities
  return (
    <View style={{ flex: 1 }}>
      <Screen bottomSpace={showFab ? 80 : 0}>
        <Header title={name} subtitle={L.structure === 'split-list' ? undefined : APP.tagline} large={L.titles === 'large'}
          right={<View style={{ flexDirection: 'row' }}>
            {L.add === 'header' && !empty && L.structure !== 'tool-first' ? <IconButton icon="plus" label={'Add ' + primary.singular.toLowerCase()} onPress={addPrimary} /> : null}
            {L.structure === 'sheet-nav' ? <IconButton icon="menu" label="Open menu" onPress={() => setMenu(true)} /> : null}
          </View>} />
        {demo ? <View style={{ marginBottom: S.md }}><Notice text="Demo data is loaded. These rows are samples, not your records." actionLabel="Remove demo data" onAction={api.removeSample} /></View> : null}
        {body}
      </Screen>
      {showFab ? <Fab label={'Add ' + primary.singular.toLowerCase()} onPress={addPrimary} /> : null}
      <Sheet open={menu} title="Menu" onClose={() => setMenu(false)}>
        {sections.map(e => <ListRow key={e.id} title={e.label} chevron={false} onPress={() => { setMenu(false); openEntity(e) }} />)}
        <ListRow title="Settings" subtitle="Your data, privacy and about" chevron={false} onPress={() => { setMenu(false); if (api.tabs.length) api.go('settings'); else api.push({ kind: 'settings' }) }} />
      </Sheet>
    </View>
  )
}

function RowItemCard({ api, entity, row }: { api: Api; entity: Entity; row: Row }) {
  const st = statusOf(entity, row)
  const meta = metaOf(api.store, entity, row)
  return (
    <Card pad={S.xl}>
      <View style={{ flexDirection: 'row' }}>
        {row.demo ? <View style={{ marginRight: S.sm }}><Badge label="Demo" tone="accent" /></View> : null}
        {st ? <Badge label={st.label} tone={st.tone} /> : null}
      </View>
      <Text style={[T.title, { color: theme.text, marginTop: S.md, fontFamily: serifFamily }]}>{titleOf(entity, row) || entity.singular}</Text>
      <Text style={[T.body, { color: theme.textSecondary, marginTop: S.xs }]}>{subtitleOf(api.store, entity, row)}</Text>
      {meta ? <View style={{ marginTop: S.lg }}><BigNumber value={meta} /></View> : null}
      <View style={{ marginTop: S.lg }}><Button label={'Open ' + entity.singular.toLowerCase()} variant="secondary" onPress={() => api.push({ kind: 'detail', entity: entity.id, id: row.id })} /></View>
    </Card>
  )
}
`

export const LIST_TSX = String.raw`// A list with search, a stage filter and an overdue filter. Every row can be opened or long-pressed for Edit and Delete.
import { useState } from 'react'
import { View } from 'react-native'
import { APP, ENTITY_ICONS, type Entity, type Row } from '../schema'
import { space as S } from '../theme'
import { Button, Chips, EmptyState, Fab, Header, ListRow, Screen, SearchBar, Sheet } from '../components/ui'
import RowItem from '../components/RowItem'
import { filterRows, isChild } from '../lib/present'
import { isEmpty, titleOf } from '../lib/logic'
import { list } from '../lib/db'
import type { Api } from '../lib/api'

export default function EntityList({ api, entity, overdue, pushed }: { api: Api; entity: Entity; overdue?: boolean; pushed: boolean }) {
  const { store } = api
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [od, setOd] = useState(Boolean(overdue))
  const [menu, setMenu] = useState<Row | null>(null)
  const all = list(store, entity.id)
  const rows = filterRows(store, entity, all, { q, status, overdue: od })
  const statusOptions = (entity.status ? entity.fields.find(f => f.id === entity.status)?.options || [] : []).map(o => ({ value: o, label: o }))
  const filterOptions = entity.due ? [...statusOptions, { value: '__overdue', label: 'Overdue' }] : statusOptions
  const add = () => api.push({ kind: 'form', entity: entity.id })
  const useFab = APP.layout.add === 'fab'
  const open = (r: Row) => api.push({ kind: 'detail', entity: entity.id, id: r.id })

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomSpace={useFab ? 80 : 0}>
        <Header title={entity.label} large={APP.layout.titles === 'large'} onBack={pushed ? api.pop : undefined}
          right={useFab ? undefined : <Button label={'Add ' + entity.singular.toLowerCase()} icon="plus" onPress={add} />}
          subtitle={all.length ? all.length + (all.length === 1 ? ' ' + entity.singular.toLowerCase() : ' ' + entity.label.toLowerCase()) : entity.blurb} />
        {all.length > 0 ? (
          <View>
            <SearchBar value={q} onChangeText={setQ} placeholder={'Search ' + entity.label.toLowerCase()} />
            {filterOptions.length > 0 ? (
              <View style={{ marginTop: S.md }}>
                <Chips options={filterOptions} value={od ? '__overdue' : status} allLabel="All" onChange={v => { if (v === '__overdue') { setOd(true); setStatus('') } else { setOd(false); setStatus(v) } }} />
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={{ marginTop: S.md }}>
          {all.length === 0 ? (
            <View>
              <EmptyState title={'No ' + entity.label.toLowerCase() + ' yet'} body={isChild(entity) ? 'These are added from the item they belong to, or here.' : entity.blurb} actionLabel={'Add ' + entity.singular.toLowerCase()} onAction={add} icon={ENTITY_ICONS[entity.id]} />
              {isEmpty(store) ? <View style={{ alignItems: 'center' }}><Button label="Load sample data (demo)" variant="secondary" onPress={api.loadSample} /></View> : null}
            </View>
          ) : rows.length === 0 ? (
            <EmptyState title="No matches" body="Nothing fits this search or filter. Clear it to see everything." actionLabel="Clear filters" onAction={() => { setQ(''); setStatus(''); setOd(false) }} icon="search" />
          ) : rows.map(r => <RowItem key={r.id} store={store} entity={entity} row={r} onPress={() => open(r)} onLongPress={() => setMenu(r)} />)}
        </View>
      </Screen>
      {useFab ? <Fab label={'Add ' + entity.singular.toLowerCase()} onPress={add} /> : null}
      <Sheet open={menu !== null} title={menu ? titleOf(entity, menu) || entity.singular : ''} onClose={() => setMenu(null)}>
        <ListRow title="Open" chevron={false} onPress={() => { const r = menu; setMenu(null); if (r) open(r) }} />
        <ListRow title="Edit" chevron={false} onPress={() => { const r = menu; setMenu(null); if (r) api.push({ kind: 'form', entity: entity.id, id: r.id }) }} />
        <ListRow title="Delete" subtitle="You can undo this right after" chevron={false} onPress={() => { const r = menu; setMenu(null); if (r) api.remove(entity.id, r.id) }} />
      </Sheet>
    </View>
  )
}
`

export const DETAIL_TSX = String.raw`// One row: its fields, a quick stage change, totals worked out from child rows, the WhatsApp reminder, and Edit / Delete.
import { Linking, Text, View } from 'react-native'
import { type Entity } from '../schema'
import { theme, type as T, space as S } from '../theme'
import { BigNumber, Button, Card, Chips, EmptyState, Header, IconButton, Notice, Screen, SectionLabel } from '../components/ui'
import RowItem from '../components/RowItem'
import { childLinks, shown, statusOf } from '../lib/present'
import { computedValue, formatMoney, formatValue, reminderEligible, reminderLink, titleOf } from '../lib/logic'
import { get, list } from '../lib/db'
import type { Api } from '../lib/api'

export default function Detail({ api, entity, id }: { api: Api; entity: Entity; id: string }) {
  const { store } = api
  const row = get(store, entity.id, id)
  if (!row) {
    return (
      <Screen>
        <Header title={entity.singular} onBack={api.pop} />
        <EmptyState title="This one is gone" body="It was deleted or removed with its demo data." actionLabel="Go back" onAction={api.pop} />
      </Screen>
    )
  }
  const st = statusOf(entity, row)
  const statusField = entity.status ? entity.fields.find(f => f.id === entity.status) : undefined
  const link = reminderEligible(entity, row) ? reminderLink(store, entity, row) : ''
  const kids = childLinks(entity)
  const remind = () => {
    Linking.openURL(link).catch(() => api.notify('Could not open WhatsApp. Check that it is installed.'))
  }
  return (
    <Screen>
      <Header title={titleOf(entity, row) || entity.singular} onBack={api.pop}
        right={<View style={{ flexDirection: 'row' }}>
          <IconButton icon="edit" label={'Edit ' + entity.singular.toLowerCase()} onPress={() => api.push({ kind: 'form', entity: entity.id, id })} />
          <IconButton icon="trash" label={'Delete ' + entity.singular.toLowerCase()} tone="danger" onPress={() => { api.remove(entity.id, id); api.pop() }} />
        </View>}
        subtitle={row.demo ? 'Demo row. Remove demo data in Settings.' : st ? st.label : undefined} />

      {statusField && statusField.options ? (
        <View style={{ marginBottom: S.lg }}>
          <Chips label={statusField.label} options={statusField.options.map(o => ({ value: o, label: o }))} value={String(row[statusField.id] ?? '')} onChange={v => api.update(entity.id, id, { [statusField.id]: v })} />
        </View>
      ) : null}

      <Card>
        {entity.fields.filter(f => f.id !== entity.title && f.id !== entity.status && formatValue(store, entity, f, row) !== '').map((f, i, a) => (
          <View key={f.id} style={{ paddingVertical: S.md, borderBottomWidth: i === a.length - 1 && !(entity.computed || []).length ? 0 : 1, borderBottomColor: theme.border }}>
            <Text style={[T.caption, { color: theme.textSecondary }]}>{f.label}</Text>
            <Text style={[T.body, { color: theme.text, marginTop: 2 }]}>{shown(store, entity, f, row)}</Text>
          </View>
        ))}
        {(entity.computed || []).map(c => (
          <View key={c.id} style={{ paddingVertical: S.md }}>
            <Text style={[T.caption, { color: theme.textSecondary }]}>{c.label}</Text>
            <BigNumber value={formatMoney(computedValue(store, entity, c, row))} max={32} />
          </View>
        ))}
      </Card>

      {entity.contact && reminderEligible(entity, row) ? (
        <View style={{ marginTop: S.lg }}>
          {link ? (
            <Card tone="flat">
              <Text style={[T.body, { color: theme.text, marginBottom: S.md }]}>Opens WhatsApp with the message written. Nothing is sent until you press send there.</Text>
              <Button label="Remind on WhatsApp" icon="chat" onPress={remind} />
            </Card>
          ) : <Notice text="Add a phone number with at least 10 digits to send a reminder." actionLabel="Edit" onAction={() => api.push({ kind: 'form', entity: entity.id, id })} />}
        </View>
      ) : null}

      {kids.map(k => {
        const rows = list(store, k.entity.id).filter(r => r[k.field.id] === id)
        return (
          <View key={k.entity.id + k.field.id}>
            <SectionLabel right={<Button label={'Add ' + k.entity.singular.toLowerCase()} variant="ghost" icon="plus" onPress={() => api.push({ kind: 'form', entity: k.entity.id, preset: { [k.field.id]: id } })} />}>{k.entity.label}</SectionLabel>
            {rows.length === 0 ? <Text style={[T.body, { color: theme.textSecondary }]}>{'No ' + k.entity.label.toLowerCase() + ' yet.'}</Text> : rows.map(r => <RowItem key={r.id} store={store} entity={k.entity} row={r} onPress={() => api.push({ kind: 'detail', entity: k.entity.id, id: r.id })} />)}
          </View>
        )
      })}
    </Screen>
  )
}
`

export const FORM_TSX = String.raw`// Add or edit one row. Fields follow their type: chips or a picker for choices, a calendar for dates, number pads for amounts.
import { useState } from 'react'
import { View } from 'react-native'
import { type Entity } from '../schema'
import { space as S } from '../theme'
import { Button, DatePickerField, Header, Screen, Select, SwitchField, TextField } from '../components/ui'
import { draftFromRow, refOptions, rowFromDraft, validateDraft, type FormDraft } from '../lib/present'
import { get } from '../lib/db'
import type { Api } from '../lib/api'

export default function Form({ api, entity, id, preset }: { api: Api; entity: Entity; id?: string; preset?: Record<string, string> }) {
  const existing = id ? get(api.store, entity.id, id) : undefined
  const [draft, setDraft] = useState<FormDraft>(() => draftFromRow(entity, existing, preset))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: string, v: string | boolean) => setDraft(d => ({ ...d, [k]: v }))
  const save = () => {
    const found = validateDraft(entity, draft)
    setErrors(found)
    if (Object.keys(found).length) return
    const values = rowFromDraft(entity, draft)
    if (existing) api.update(entity.id, existing.id, values)
    else api.create(entity.id, values)
    api.notify(existing ? entity.singular + ' saved' : entity.singular + ' added')
    api.pop()
  }
  return (
    <Screen>
      <Header title={(existing ? 'Edit ' : 'Add ') + entity.singular.toLowerCase()} onBack={api.pop} />
      {entity.fields.filter(f => !(preset && preset[f.id] !== undefined)).map(f => {
        const v = draft[f.id]
        if (f.type === 'checkbox') return <SwitchField key={f.id} label={f.label} value={Boolean(v)} onChange={x => set(f.id, x)} />
        if (f.type === 'date') return <DatePickerField key={f.id} label={f.label} value={String(v || '')} onChange={x => set(f.id, x)} />
        if (f.type === 'select') return <Select key={f.id} label={f.label} value={String(v || '')} options={(f.options || []).map(o => ({ value: o, label: o }))} onChange={x => set(f.id, x)} />
        if (f.type === 'ref') return <Select key={f.id} label={f.label} value={String(v || '')} options={refOptions(api.store, f)} onChange={x => set(f.id, x)} placeholder={'Choose ' + (f.label.toLowerCase())} />
        return (
          <TextField key={f.id} label={f.label} value={String(v ?? '')} onChangeText={x => set(f.id, x)} error={errors[f.id]} required={f.id === entity.title || f.required}
            multiline={f.type === 'longtext'} keyboardType={f.type === 'phone' ? 'phone-pad' : f.type === 'number' || f.type === 'money' ? 'decimal-pad' : 'default'} />
        )
      })}
      <Button label="Save" full onPress={save} />
      <View style={{ height: S.sm }} />
      <Button label="Cancel" variant="ghost" full onPress={api.pop} />
    </Screen>
  )
}
`

export const SETTINGS_TSX = String.raw`// Settings, privacy and your data. States plainly where the data lives and gives the owner export and a typed-confirmation delete.
import { useState } from 'react'
import { Linking, Share, Text, View } from 'react-native'
import { APP } from '../schema'
import { OWNER } from '../lib/owner-details'
import { theme, type as T, space as S } from '../theme'
import { Button, Card, Header, Notice, Screen, SectionLabel, Sheet, TextField } from '../components/ui'
import { exportAll } from '../lib/db'
import { hasSample, isEmpty } from '../lib/logic'
import type { Api } from '../lib/api'

export default function Settings({ api, pushed }: { api: Api; pushed?: boolean }) {
  const { store } = api
  const [name, setName] = useState(store.settings.businessName)
  const [confirm, setConfirm] = useState(false)
  const [typed, setTyped] = useState('')
  const exportData = async () => {
    try { await Share.share({ title: APP.name + ' data', message: exportAll(store) }) } catch { api.notify('Could not open the share sheet.') }
  }
  const open = (url: string) => { Linking.openURL(url).catch(() => api.notify('Could not open that link.')) }
  return (
    <Screen>
      <Header title="Settings" large={APP.layout.titles === 'large'} onBack={pushed ? api.pop : undefined} />

      <SectionLabel>Your data</SectionLabel>
      <Card>
        <Text accessibilityRole="header" style={[T.body, { color: theme.text, fontWeight: '700' }]}>Saved on this phone only.</Text>
        <Text style={[T.body, { color: theme.textSecondary, marginTop: S.sm }]}>Nothing is uploaded and there is no account. If you delete the app or clear its storage, your records go with it. Export a copy now and then.</Text>
        {api.saved ? null : <View style={{ marginTop: S.md }}><Notice tone="danger" text="The last change could not be saved to this phone." /></View>}
      </Card>
      <View style={{ marginTop: S.lg }}>
        <Button label="Export my data" icon="share" variant="secondary" onPress={exportData} />
        <Text style={[T.caption, { color: theme.textMuted, marginTop: S.xs }]}>Opens the share sheet with a JSON copy of everything.</Text>
      </View>

      <SectionLabel>Your business</SectionLabel>
      <TextField label="Business name" value={name} onChangeText={setName} helper="Shown at the top and in reminder messages." />
      <Button label="Save name" variant="secondary" disabled={name.trim() === store.settings.businessName} onPress={() => { api.setBusinessName(name.trim()); api.notify('Name saved') }} />

      <SectionLabel>Sample data</SectionLabel>
      {hasSample(store)
        ? <Button label="Remove demo data" variant="secondary" onPress={api.removeSample} />
        : isEmpty(store)
          ? <Button label="Load sample data (demo)" variant="secondary" onPress={api.loadSample} />
          : <Text style={[T.body, { color: theme.textSecondary }]}>Sample data can be loaded only while the app is empty, so it never mixes with your records.</Text>}

      <SectionLabel>Privacy</SectionLabel>
      <Card>
        {OWNER.dataCollected.map((line, i) => <Text key={i} style={[T.body, { color: theme.text, marginBottom: i === OWNER.dataCollected.length - 1 ? 0 : S.sm }]}>{line}</Text>)}
      </Card>
      <View style={{ flexDirection: 'row', marginTop: S.md }}>
        {OWNER.privacyUrl ? <View style={{ marginRight: S.sm }}><Button label="Privacy policy" variant="ghost" onPress={() => open(OWNER.privacyUrl)} /></View> : null}
        {OWNER.termsUrl ? <Button label="Terms" variant="ghost" onPress={() => open(OWNER.termsUrl)} /> : null}
      </View>
      {OWNER.email ? <Text style={[T.body, { color: theme.textSecondary }]}>{'Questions: ' + OWNER.email}</Text> : null}

      <SectionLabel>About</SectionLabel>
      <Text style={[T.body, { color: theme.text }]}>{APP.name}</Text>
      <Text style={[T.caption, { color: theme.textMuted, marginTop: 2 }]}>{'Version ' + APP.version}</Text>

      <SectionLabel>Delete</SectionLabel>
      <Button label="Delete my data" variant="danger" onPress={() => { setTyped(''); setConfirm(true) }} />
      <Text style={[T.caption, { color: theme.textMuted, marginTop: S.xs }]}>Erases every record and setting on this phone. This cannot be undone.</Text>

      <Sheet open={confirm} title="Delete my data" onClose={() => setConfirm(false)}>
        <Text style={[T.body, { color: theme.text, marginBottom: S.lg }]}>This erases everything saved on this phone. Export a copy first if you may need it. Type DELETE to confirm.</Text>
        <TextField label="Type DELETE" value={typed} onChangeText={setTyped} autoFocus />
        <Button label="Delete everything" variant="danger" disabled={typed.trim() !== 'DELETE'} onPress={() => { setConfirm(false); api.wipe() }} />
      </Sheet>
    </Screen>
  )
}
`
