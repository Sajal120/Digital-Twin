# Mobile Plain Chat - Quick Visual Guide

## Before vs After

### ❌ Before (Mobile)
```
┌─────────────────────┐
│  Header (no menu)   │
├─────────────────────┤
│                     │
│   Chat Messages     │
│   (No history       │
│    access!)         │
│                     │
└─────────────────────┘
```

### ✅ After (Mobile)
```
┌─────────────────────┐
│ ☰ Header            │  ← Hamburger menu!
├─────────────────────┤
│                     │
│   Chat Messages     │
│                     │
│                     │
│                     │
└─────────────────────┘

Tap hamburger (☰):
┌──────────┬──────────┐
│          │          │
│ History  │ Messages │
│ Sidebar  │          │
│ ────────→│          │
│ Slides   │          │
│ in!      │          │
└──────────┴──────────┘
```

## Mobile Interaction Flow

```
1. User opens Plain Chat
   ↓
2. Sees hamburger menu (☰) in header
   ↓
3. Taps hamburger
   ↓
4. Sidebar slides in from left
   ↓
5. Sees all chat histories
   ↓
6. Taps a history → Sidebar closes, chat loads
   OR
   Taps "New Chat" → Sidebar closes, new session
   OR
   Taps X or overlay → Sidebar closes
```

## Desktop View (No Change)

```
┌─────────┬─────────────────────┐
│         │  Header             │
│ History ├─────────────────────┤
│ Sidebar │                     │
│ (Fixed) │   Chat Messages     │
│         │                     │
│         │                     │
└─────────┴─────────────────────┘
```

## Key UI Elements

### Hamburger Button
```tsx
Position: Header left side (mobile only)
Icon: ☰ (Menu icon)
Action: Opens sidebar drawer
Visibility: Hidden on desktop (lg:hidden)
```

### Sidebar Drawer (Mobile)
```tsx
Width: 256px (w-64)
Animation: Slide from left (-100% → 0)
Background: Dark glass (slate-950/95)
Z-index: 50 (above overlay)
```

### Dark Overlay (Mobile)
```tsx
Coverage: Full screen
Color: Black 60% opacity
Blur: Backdrop blur
Action: Closes sidebar on tap
Z-index: 40 (below sidebar)
```

### Close Button (Mobile)
```tsx
Position: Top right of sidebar
Icon: X
Action: Closes sidebar
Visibility: Mobile only (lg:hidden)
```

## Responsive Breakpoints

| Screen Size | Behavior |
|-------------|----------|
| < 1024px (Mobile/Tablet) | Hamburger menu + slide-in drawer |
| ≥ 1024px (Desktop) | Fixed sidebar, no hamburger |

## Touch Targets (Mobile)

All interactive elements meet minimum touch target size:
- Hamburger button: 40x40px (p-2 with icon)
- History items: 48px height (p-3)
- New Chat button: 48px height (py-3)
- Close button: 32x32px (p-1 with icon)

## Animation Timing

```
Sidebar slide: Spring animation
  - Damping: 25
  - Stiffness: 200
  - Duration: ~300ms

Overlay fade: Linear
  - Duration: ~200ms
  - Easing: ease-in-out
```

## Color Scheme

```
Sidebar: slate-950/95 (dark translucent)
Overlay: black/60 (semi-transparent)
Border: white/10 (subtle)
Active history: purple-600/30
Hover history: white/10
```
