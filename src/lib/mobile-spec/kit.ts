// The small React Native component kit written into every spec-driven mobile app as components/ui.tsx. Original code, no third-party UI library:
// only react-native and react-native-safe-area-context. RULES for this file: the source lives in a String.raw template, so NO backticks and
// NO ${ sequences inside it (use string concatenation). Quiet craft: hairlines and surface steps, no gradients, glow, blur or shadows.
// Every icon button needs an accessibilityLabel, every touch target is at least 44pt, text containers have no fixed heights.

export const MOBILE_KIT_SOURCE = String.raw`// UI kit. Tokens come from ../theme. Nothing here is specific to one app.
import { useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme, type as T, space as S, serifFamily } from '../theme'

export const MIN_TARGET = 44
const hair = StyleSheet.hairlineWidth

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
const toneColor = (t: Tone): string => (t === 'accent' ? theme.accent : t === 'success' ? theme.success : t === 'warning' ? theme.warning : t === 'danger' ? theme.danger : theme.textSecondary)

// ---------------------------------------------------------------- icons (drawn with views, one weight, so they look the same everywhere)
export type IconName = 'plus' | 'close' | 'check' | 'chevronRight' | 'chevronLeft' | 'search' | 'trash' | 'edit' | 'share' | 'home' | 'list' | 'people' | 'calendar' | 'wallet' | 'shield' | 'more' | 'chat' | 'box' | 'receipt' | 'menu'

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const c = color || theme.text
  const u = size / 24
  const w = Math.max(1.5, 2 * u)
  const box: ViewStyle = { width: size, height: size, alignItems: 'center', justifyContent: 'center' }
  const bar = (len: number, rot = '0deg', x = 0, y = 0): ViewStyle => ({ position: 'absolute', width: len * u, height: w, borderRadius: w, backgroundColor: c, transform: [{ translateX: x * u }, { translateY: y * u }, { rotate: rot }] })
  const dot = (x: number, y: number): ViewStyle => ({ position: 'absolute', width: 2.5 * u, height: 2.5 * u, borderRadius: 2 * u, backgroundColor: c, transform: [{ translateX: x * u }, { translateY: y * u }] })
  const outline = (wd: number, ht: number, r: number): ViewStyle => ({ width: wd * u, height: ht * u, borderWidth: w, borderColor: c, borderRadius: r * u })
  let inner: ReactNode = null
  switch (name) {
    case 'plus': inner = <><View style={bar(14)} /><View style={bar(14, '90deg')} /></>; break
    case 'close': inner = <><View style={bar(16, '45deg')} /><View style={bar(16, '-45deg')} /></>; break
    case 'check': inner = <View style={{ width: 7 * u, height: 12 * u, borderRightWidth: w, borderBottomWidth: w, borderColor: c, transform: [{ rotate: '45deg' }, { translateY: -1 * u }] }} />; break
    case 'chevronRight': inner = <View style={{ width: 9 * u, height: 9 * u, borderTopWidth: w, borderRightWidth: w, borderColor: c, transform: [{ rotate: '45deg' }, { translateX: -2 * u }] }} />; break
    case 'chevronLeft': inner = <View style={{ width: 9 * u, height: 9 * u, borderTopWidth: w, borderLeftWidth: w, borderColor: c, transform: [{ rotate: '-45deg' }, { translateX: 2 * u }] }} />; break
    case 'search': inner = <><View style={[outline(13, 13, 7), { position: 'absolute', left: 2 * u, top: 2 * u }]} /><View style={bar(7, '45deg', 6, 6)} /></>; break
    case 'trash': inner = <><View style={bar(16, '0deg', 0, -7)} /><View style={bar(6, '0deg', 0, -9)} /><View style={[outline(12, 14, 2), { marginTop: 4 * u, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]} /></>; break
    case 'edit': inner = <View style={[outline(5, 17, 1), { transform: [{ rotate: '45deg' }] }]} />; break
    case 'share': inner = <><View style={[outline(14, 9, 2), { marginTop: 6 * u, borderTopWidth: 0 }]} /><View style={bar(12, '90deg', 0, -4)} /><View style={{ position: 'absolute', top: 1 * u, width: 7 * u, height: 7 * u, borderTopWidth: w, borderLeftWidth: w, borderColor: c, transform: [{ rotate: '45deg' }] }} /></>; break
    case 'home': inner = <><View style={{ position: 'absolute', top: 4 * u, width: 12 * u, height: 12 * u, borderTopWidth: w, borderLeftWidth: w, borderColor: c, transform: [{ rotate: '45deg' }] }} /><View style={[outline(14, 9, 1), { marginTop: 7 * u, borderTopWidth: 0 }]} /></>; break
    case 'list': inner = <><View style={bar(12, '0deg', 3, -6)} /><View style={bar(12, '0deg', 3, 0)} /><View style={bar(12, '0deg', 3, 6)} /><View style={dot(-8, -6)} /><View style={dot(-8, 0)} /><View style={dot(-8, 6)} /></>; break
    case 'people': inner = <><View style={[outline(8, 8, 4), { marginBottom: 2 * u }]} /><View style={{ width: 16 * u, height: 7 * u, borderWidth: w, borderBottomWidth: 0, borderColor: c, borderTopLeftRadius: 8 * u, borderTopRightRadius: 8 * u, marginTop: 1 * u }} /></>; break
    case 'calendar': inner = <><View style={[outline(17, 16, 3), { borderTopWidth: 4 * u }]} /><View style={bar(3, '90deg', -4, -9)} /><View style={bar(3, '90deg', 4, -9)} /></>; break
    case 'wallet': inner = <><View style={outline(19, 14, 3)} /><View style={[outline(5, 5, 1), { position: 'absolute', right: 2 * u }]} /></>; break
    case 'shield': inner = <View style={[outline(14, 17, 3), { borderBottomLeftRadius: 8 * u, borderBottomRightRadius: 8 * u }]} />; break
    case 'more': inner = <View style={{ flexDirection: 'row' }}>{[0, 1, 2].map(i => <View key={i} style={{ width: 4 * u, height: 4 * u, borderRadius: 3 * u, backgroundColor: c, marginHorizontal: 1.5 * u }} />)}</View>; break
    case 'menu': inner = <><View style={bar(16, '0deg', 0, -6)} /><View style={bar(16, '0deg', 0, 0)} /><View style={bar(16, '0deg', 0, 6)} /></>; break
    case 'chat': inner = <><View style={[outline(18, 14, 5), { marginBottom: 2 * u }]} /><View style={{ position: 'absolute', left: 5 * u, bottom: 2 * u, width: 5 * u, height: 5 * u, borderLeftWidth: w, borderBottomWidth: w, borderColor: c, transform: [{ rotate: '-20deg' }] }} /></>; break
    case 'box': inner = <><View style={outline(16, 16, 2)} /><View style={bar(16, '0deg', 0, -2)} /></>; break
    case 'receipt': inner = <><View style={outline(14, 18, 2)} /><View style={bar(7, '0deg', 0, -3)} /><View style={bar(7, '0deg', 0, 2)} /></>; break
  }
  return <View style={box} accessible={false} importantForAccessibility="no-hide-descendants">{inner}</View>
}

// ---------------------------------------------------------------- buttons
export function IconButton({ icon, label, onPress, color, tone }: { icon: IconName; label: string; onPress: () => void; color?: string; tone?: Tone }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
      style={({ pressed }) => ({ width: MIN_TARGET, height: MIN_TARGET, borderRadius: MIN_TARGET / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? theme.elevated : 'transparent' })}>
      <Icon name={icon} color={color || (tone ? toneColor(tone) : theme.text)} />
    </Pressable>
  )
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, full, accessibilityLabel }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: IconName; disabled?: boolean; full?: boolean; accessibilityLabel?: string }) {
  const bg = variant === 'primary' ? theme.accent : variant === 'danger' ? theme.danger : variant === 'secondary' ? theme.surface : 'transparent'
  const fg = variant === 'primary' ? theme.onAccent : variant === 'danger' ? theme.bg : variant === 'ghost' ? theme.accent : theme.text
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: S.lg, borderRadius: theme.radius, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderWidth: variant === 'secondary' ? 1 : 0, borderColor: theme.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1, alignSelf: full ? 'stretch' : 'flex-start' })}>
      {icon ? <View style={{ marginRight: S.sm }}><Icon name={icon} size={20} color={fg} /></View> : null}
      <Text style={[T.body, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  )
}

// ---------------------------------------------------------------- layout
export function Screen({ children, scroll = true, bottomSpace = 0 }: { children: ReactNode; scroll?: boolean; bottomSpace?: number }) {
  const insets = useSafeAreaInsets()
  const body = scroll
    ? <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: bottomSpace + S.xxl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
    : <View style={{ flex: 1, paddingHorizontal: S.lg }}>{children}</View>
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
    </KeyboardAvoidingView>
  )
}

export function Header({ title, subtitle, large, onBack, right }: { title: string; subtitle?: string; large?: boolean; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={{ paddingTop: S.sm, paddingBottom: large ? S.md : S.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: MIN_TARGET, marginLeft: onBack ? -S.sm : 0 }}>
        {onBack ? <IconButton icon="chevronLeft" label="Go back" onPress={onBack} /> : null}
        {large ? <View style={{ flex: 1 }} /> : <Text accessibilityRole="header" numberOfLines={2} style={[T.title, { flex: 1, color: theme.text, fontSize: Math.min(T.title.fontSize, 22), fontFamily: serifFamily }]}>{title}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>{right}</View>
      </View>
      {large ? <Text accessibilityRole="header" style={[T.title, { color: theme.text, fontFamily: serifFamily }]}>{title}</Text> : null}
      {subtitle ? <Text style={[T.body, { color: theme.textSecondary, marginTop: S.xs }]}>{subtitle}</Text> : null}
    </View>
  )
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.xl, marginBottom: S.sm }}>
      <Text accessibilityRole="header" style={[T.label, { color: theme.textSecondary }]}>{children}</Text>
      {right}
    </View>
  )
}

export function Card({ children, onPress, accessibilityLabel, tone, pad = S.lg }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string; tone?: 'raised' | 'flat'; pad?: number }) {
  const style: StyleProp<ViewStyle> = { backgroundColor: tone === 'flat' ? theme.elevated : theme.surface, borderRadius: theme.radius, borderWidth: tone === 'flat' ? 0 : hair, borderColor: theme.border, padding: pad }
  if (!onPress) return <View style={style}>{children}</View>
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [style, pressed ? { backgroundColor: theme.elevated } : null]}>{children}</Pressable>
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = toneColor(tone)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: 6, backgroundColor: tone === 'neutral' ? theme.elevated : c + '1F' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c, marginRight: 6 }} />
      <Text style={[T.caption, { color: tone === 'neutral' ? theme.textSecondary : c, fontWeight: '600' }]}>{label}</Text>
    </View>
  )
}

export function ListRow({ title, subtitle, meta, badge, leading, onPress, onLongPress, accessibilityLabel, plain = true, chevron = true, dense }: { title: string; subtitle?: string; meta?: string; badge?: ReactNode; leading?: ReactNode; onPress?: () => void; onLongPress?: () => void; accessibilityLabel?: string; plain?: boolean; chevron?: boolean; dense?: boolean }) {
  const pad = dense ? S.sm : S.md
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title + (subtitle ? ', ' + subtitle : '') + (meta ? ', ' + meta : '')} onPress={onPress} onLongPress={onLongPress}
      style={({ pressed }) => [{ minHeight: dense ? 52 : 60, flexDirection: 'row', alignItems: 'center', paddingVertical: pad, paddingHorizontal: plain ? 0 : S.lg, backgroundColor: pressed ? theme.elevated : plain ? 'transparent' : theme.surface }, plain ? { borderBottomWidth: hair, borderBottomColor: theme.border } : { borderRadius: theme.radius, borderWidth: hair, borderColor: theme.border, marginBottom: S.sm }]}>
      {leading ? <View style={{ marginRight: S.md }}>{leading}</View> : null}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={[T.body, { color: theme.text, fontWeight: '600', fontFamily: serifFamily }]}>{title}</Text>
        {subtitle ? <Text numberOfLines={2} style={[T.caption, { color: theme.textSecondary, marginTop: 2 }]}>{subtitle}</Text> : null}
        {badge ? <View style={{ marginTop: S.xs, flexDirection: 'row', alignItems: 'center' }}>{badge}</View> : null}
      </View>
      {meta ? <Text style={[T.body, { color: theme.text, fontWeight: '600', fontVariant: ['tabular-nums'], marginLeft: S.md }]}>{meta}</Text> : null}
      {chevron && onPress ? <View style={{ marginLeft: S.sm }}><Icon name="chevronRight" size={18} color={theme.textMuted} /></View> : null}
    </Pressable>
  )
}

/** A figure in the direction's number style, scaled down by length so a long amount never clips (on every platform), and never above max. */
export function BigNumber({ value, tone, max }: { value: string; tone?: Tone; max?: number }) {
  const cap = Math.min(T.number.fontSize, max || T.number.fontSize)
  const size = value.length <= 6 ? cap : Math.max(22, Math.floor((cap * 6) / value.length))
  return <Text style={[T.number, { color: tone ? toneColor(tone) : theme.text, fontSize: size, lineHeight: Math.round(size * 1.15) }]}>{value}</Text>
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <View accessible accessibilityLabel={label + ': ' + value} style={{ flex: 1, minWidth: 96 }}>
      <BigNumber value={value} tone={tone} max={30} />
      <Text style={[T.caption, { color: theme.textSecondary, marginTop: 2 }]}>{label}</Text>
    </View>
  )
}

export function Notice({ text, tone = 'neutral', actionLabel, onAction }: { text: string; tone?: Tone; actionLabel?: string; onAction?: () => void }) {
  const c = toneColor(tone)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: S.md, borderRadius: theme.radius, backgroundColor: tone === 'neutral' ? theme.elevated : c + '1A', borderLeftWidth: 3, borderLeftColor: c }}>
      <Text style={[T.caption, { flex: 1, color: theme.text }]}>{text}</Text>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={{ minHeight: MIN_TARGET, justifyContent: 'center', paddingHorizontal: S.sm }}><Text style={[T.caption, { color: theme.accent, fontWeight: '700' }]}>{actionLabel}</Text></Pressable> : null}
    </View>
  )
}

export function EmptyState({ title, body, actionLabel, onAction, icon = 'list' }: { title: string; body: string; actionLabel?: string; onAction?: () => void; icon?: IconName }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: S.xxl, paddingHorizontal: S.lg }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.elevated, alignItems: 'center', justifyContent: 'center', marginBottom: S.md }}><Icon name={icon} size={24} color={theme.textSecondary} /></View>
      <Text accessibilityRole="header" style={[T.title, { fontSize: 20, color: theme.text, textAlign: 'center', marginBottom: S.sm }]}>{title}</Text>
      <Text style={[T.body, { color: theme.textSecondary, textAlign: 'center', maxWidth: 320, marginBottom: S.lg }]}>{body}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" style={{ paddingTop: S.lg }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ paddingVertical: S.md }}>
          <View style={{ height: 16, width: i % 2 ? '55%' : '72%', borderRadius: 6, backgroundColor: theme.elevated, marginBottom: S.sm }} />
          <View style={{ height: 12, width: i % 2 ? '35%' : '48%', borderRadius: 6, backgroundColor: theme.elevated }} />
        </View>
      ))}
    </View>
  )
}

// ---------------------------------------------------------------- inputs
export function SearchBar({ value, onChangeText, placeholder = 'Search' }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: theme.radius, backgroundColor: theme.surface, borderWidth: hair, borderColor: theme.border, paddingLeft: S.md }}>
      <Icon name="search" size={18} color={theme.textMuted} />
      <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textMuted} returnKeyType="search" autoCorrect={false}
        style={[T.body, { flex: 1, color: theme.text, paddingHorizontal: S.sm, paddingVertical: S.md }]} />
      {value ? <IconButton icon="close" label="Clear search" onPress={() => onChangeText('')} color={theme.textSecondary} /> : null}
    </View>
  )
}

export function TextField({ label, value, onChangeText, placeholder, multiline, keyboardType, error, helper, required, autoFocus }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: KeyboardTypeOptions; error?: string; helper?: string; required?: boolean; autoFocus?: boolean }) {
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ marginBottom: S.lg }}>
      <Text style={[T.label, { color: theme.textSecondary, marginBottom: S.xs }]}>{label + (required ? ' (required)' : '')}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textMuted} multiline={multiline} keyboardType={keyboardType} autoFocus={autoFocus}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={[T.body, { minHeight: multiline ? 96 : 48, color: theme.text, backgroundColor: theme.surface, borderRadius: theme.radius, borderWidth: focus ? 2 : 1, borderColor: error ? theme.danger : focus ? theme.accent : theme.border, paddingHorizontal: S.md, paddingVertical: S.md, textAlignVertical: multiline ? 'top' : 'center' }]} />
      {error ? <Text accessibilityLiveRegion="polite" style={[T.caption, { color: theme.danger, marginTop: S.xs }]}>{error}</Text> : helper ? <Text style={[T.caption, { color: theme.textMuted, marginTop: S.xs }]}>{helper}</Text> : null}
    </View>
  )
}

export function SwitchField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md }}>
      <Text style={[T.body, { color: theme.text, flex: 1 }]}>{label}</Text>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: theme.border, true: theme.accent }} thumbColor={theme.surface} />
    </View>
  )
}

export type Option = { value: string; label: string }

export function Chips({ options, value, onChange, label, allLabel }: { options: Option[]; value: string; onChange: (v: string) => void; label?: string; allLabel?: string }) {
  const items: Option[] = allLabel ? [{ value: '', label: allLabel }, ...options] : options
  return (
    <View>
      {label ? <Text style={[T.label, { color: theme.textSecondary, marginBottom: S.xs }]}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: S.lg }} accessibilityRole="radiogroup">
        {items.map(o => {
          const on = o.value === value
          return (
            <Pressable key={o.value || 'all'} accessibilityRole="radio" accessibilityLabel={o.label} accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
              style={{ minHeight: MIN_TARGET, paddingHorizontal: S.lg, borderRadius: MIN_TARGET / 2, justifyContent: 'center', marginRight: S.sm, backgroundColor: on ? theme.accent : theme.surface, borderWidth: on ? 0 : 1, borderColor: theme.border }}>
              <Text style={[T.body, { color: on ? theme.onAccent : theme.text, fontWeight: on ? '700' : '500' }]}>{o.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: theme.radius + 8, borderTopRightRadius: theme.radius + 8, paddingBottom: insets.bottom + S.lg, maxHeight: '88%' }}>
            <View style={{ alignItems: 'center', paddingTop: S.sm }}><View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border }} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: S.lg, paddingRight: S.sm }}>
              <Text accessibilityRole="header" style={[T.title, { flex: 1, fontSize: 20, color: theme.text, paddingVertical: S.md }]}>{title}</Text>
              <IconButton icon="close" label={'Close ' + title} onPress={onClose} />
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: S.sm }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export function Select({ label, value, options, onChange, placeholder = 'Choose' }: { label: string; value: string; options: Option[]; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  if (options.length >= 1 && options.length <= 4) return <View style={{ marginBottom: S.lg }}><Chips label={label} options={options} value={value} onChange={onChange} /></View>
  const current = options.find(o => o.value === value)
  return (
    <View style={{ marginBottom: S.lg }}>
      <Text style={[T.label, { color: theme.textSecondary, marginBottom: S.xs }]}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={label + ': ' + (current ? current.label : placeholder)} onPress={() => setOpen(true)}
        style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, borderRadius: theme.radius, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
        <Text style={[T.body, { color: current ? theme.text : theme.textMuted }]}>{current ? current.label : placeholder}</Text>
        <Icon name="chevronRight" size={18} color={theme.textMuted} />
      </Pressable>
      <Sheet open={open} title={label} onClose={() => setOpen(false)}>
        {options.length === 0 ? <Text style={[T.body, { color: theme.textSecondary, paddingVertical: S.lg }]}>Nothing to choose from yet.</Text> : null}
        {options.map(o => <ListRow key={o.value} title={o.label} chevron={false} onPress={() => { onChange(o.value); setOpen(false) }} badge={o.value === value ? <Icon name="check" size={18} color={theme.accent} /> : undefined} />)}
      </Sheet>
    </View>
  )
}

// ---------------------------------------------------------------- dates (own small calendar, no native picker needed)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const pad2 = (n: number) => (n < 10 ? '0' + n : String(n))
export const isoOf = (y: number, m: number, d: number) => y + '-' + pad2(m + 1) + '-' + pad2(d)
export const todayIso = () => { const t = new Date(); return isoOf(t.getFullYear(), t.getMonth(), t.getDate()) }
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1].slice(0, 3) + ' ' + m[1] : ''
}

export function DatePickerField({ label, value, onChange }: { label: string; value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false)
  const seed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayIso()
  const [ym, setYm] = useState({ y: Number(seed.slice(0, 4)), m: Number(seed.slice(5, 7)) - 1 })
  const first = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7
  const count = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells: (number | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: count }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const step = (n: number) => setYm(p => { const d = new Date(p.y, p.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const today = todayIso()
  return (
    <View style={{ marginBottom: S.lg }}>
      <Text style={[T.label, { color: theme.textSecondary, marginBottom: S.xs }]}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={label + ': ' + (value ? formatDate(value) : 'not set')} onPress={() => setOpen(true)}
        style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, borderRadius: theme.radius, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
        <Text style={[T.body, { color: value ? theme.text : theme.textMuted }]}>{value ? formatDate(value) : 'Pick a date'}</Text>
        <Icon name="calendar" size={20} color={theme.textSecondary} />
      </Pressable>
      <Sheet open={open} title={label} onClose={() => setOpen(false)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="chevronLeft" label="Previous month" onPress={() => step(-1)} />
          <Text accessibilityLiveRegion="polite" style={[T.body, { color: theme.text, fontWeight: '600' }]}>{MONTHS[ym.m] + ' ' + ym.y}</Text>
          <IconButton icon="chevronRight" label="Next month" onPress={() => step(1)} />
        </View>
        <View style={{ flexDirection: 'row' }}>{DAYS.map(d => <Text key={d} style={[T.caption, { flex: 1, textAlign: 'center', color: theme.textMuted, paddingVertical: S.xs }]}>{d}</Text>)}</View>
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
              if (d === null) return <View key={i} style={{ flex: 1, height: MIN_TARGET }} />
              const iso = isoOf(ym.y, ym.m, d)
              const on = iso === value
              return (
                <Pressable key={i} accessibilityRole="button" accessibilityLabel={formatDate(iso)} accessibilityState={{ selected: on }} onPress={() => { onChange(iso); setOpen(false) }}
                  style={{ flex: 1, height: MIN_TARGET, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? theme.accent : 'transparent', borderWidth: iso === today && !on ? 1 : 0, borderColor: theme.accent }}>
                    <Text style={[T.body, { color: on ? theme.onAccent : theme.text, fontVariant: ['tabular-nums'] }]}>{d}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))}
        <View style={{ flexDirection: 'row', marginTop: S.md }}>
          <View style={{ marginRight: S.sm }}><Button label="Today" variant="secondary" onPress={() => { onChange(today); setOpen(false) }} /></View>
          {value ? <Button label="Clear date" variant="ghost" onPress={() => { onChange(''); setOpen(false) }} /> : null}
        </View>
      </Sheet>
    </View>
  )
}

// ---------------------------------------------------------------- navigation chrome and floating bits
export type TabItem = { id: string; label: string; icon: IconName }

export function TabBar({ items, active, onChange }: { items: TabItem[]; active: string; onChange: (id: string) => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: theme.bg, borderTopWidth: hair, borderTopColor: theme.border, paddingBottom: insets.bottom }}>
      {items.map(it => {
        const on = it.id === active
        return (
          <Pressable key={it.id} accessibilityRole="tab" accessibilityLabel={it.label} accessibilityState={{ selected: on }} onPress={() => onChange(it.id)}
            style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: S.xs }}>
            <Icon name={it.icon} size={22} color={on ? theme.accent : theme.textMuted} />
            <Text numberOfLines={1} style={[T.caption, { fontSize: 11, marginTop: 2, color: on ? theme.accent : theme.textSecondary, fontWeight: on ? '700' : '500' }]}>{it.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function Fab({ label, onPress, icon = 'plus', bottom = 0 }: { label: string; onPress: () => void; icon?: IconName; bottom?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => ({ position: 'absolute', right: S.lg, bottom: bottom + S.lg, minWidth: 56, height: 56, borderRadius: theme.radius + 4, paddingHorizontal: S.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 })}>
      <Icon name={icon} size={22} color={theme.onAccent} />
      <Text style={[T.body, { color: theme.onAccent, fontWeight: '700', marginLeft: S.sm }]}>{label}</Text>
    </Pressable>
  )
}

export function UndoBar({ message, actionLabel = 'Undo', onAction, onDismiss, bottom = 0 }: { message: string; actionLabel?: string; onAction?: () => void; onDismiss: () => void; bottom?: number }) {
  return (
    <View accessibilityLiveRegion="polite" style={{ position: 'absolute', left: S.lg, right: S.lg, bottom: bottom + S.lg, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingLeft: S.lg, borderRadius: theme.radius, backgroundColor: theme.text }}>
      <Text style={[T.caption, { flex: 1, color: theme.bg, paddingVertical: S.md }]}>{message}</Text>
      {onAction ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={{ minHeight: MIN_TARGET, justifyContent: 'center', paddingHorizontal: S.md }}><Text style={[T.body, { color: theme.bg, fontWeight: '700', textDecorationLine: 'underline' }]}>{actionLabel}</Text></Pressable> : null}
      <IconButton icon="close" label="Dismiss message" onPress={onDismiss} color={theme.bg} />
    </View>
  )
}
`
