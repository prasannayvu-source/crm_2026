# UI/UX Guidelines - CRM Application

## Design Philosophy
**Theme**: Modern SaaS Dark + Glassmorphism.
**Goal**: Professional, premium, and distraction-free for long operational hours.
**Key Characteristics**:
- **Dark Background**: Minimizes eye strain.
- **Glassmorphism**: subtle blur + transparency for depth without visual clutter.
- **Subtle Glow**: Used strictly for emphasis, not decoration.
- **High Contrast**: Ensuring readability and accessibility despite the dark theme.

## Color System

### Base Colors
- **App Background**: `#0F1117`
- **Card / Surface**: `rgba(255, 255, 255, 0.06)` (with backdrop-filter: blur(10px))
- **Border**: `rgba(255, 255, 255, 0.08)`

### Typography Colors
- **Primary Text**: `#E5E7EB` (High readability on dark bg)
- **Secondary Text**: `#9CA3AF` (Subtext, metadata)

### Brand & Status Colors
- **Primary Accent**: `#6366F1` (Action buttons, active states, key highlights)
- **Secondary Accent (Success)**: `#22C55E` (Completed tasks, positive metrics)
- **Warning**: `#F59E0B` (Pending actions, cautionary status)
- **Danger**: `#EF4444` (Critical alerts, destructive actions)

## Typography

### Font Family
- **Headings**: `Inter` (or `Satoshi` if available), bold weights (600, 700).
- **Body**: `Inter`, regular weight (400).
- **Data/Tables**: `Inter Medium`, specifically for tabular data (500).

### Hierarchy
- **H1 (Page Title)**: 24px - 32px, Bold.
- **H2 (Section Header)**: 20px - 24px, Semi-Bold.
- **H3 (Card Title)**: 16px - 18px, Medium.
- **Body**: 14px - 16px, Regular.
- **Caption / Label**: 12px, Medium, uppercase for table headers.

## Components

### Cards (Glassmorphism)
- **Background**: `rgba(255, 255, 255, 0.06)`
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`
- **Backdrop Filter**: `blur(12px)`
- **Border Radius**: `12px` or `16px` depending on context.
- **Box Shadow**: `0 4px 30px rgba(0, 0, 0, 0.1)`

### Buttons
- **Primary**:
  - Background: `#6366F1` (linear-gradient recommended for depth: `linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)`)
  - Text: White
  - Hover: Slight brightness increase + scale (1.02)
- **Secondary**:
  - Background: Transparent
  - Border: `1px solid rgba(255, 255, 255, 0.2)`
  - Text: `#E5E7EB`
  - Hover: Background `rgba(255, 255, 255, 0.1)`

### Inputs & Forms
- **Background**: `rgba(0, 0, 0, 0.2)`
- **Border**: `1px solid rgba(255, 255, 255, 0.1)`
- **Text**: `#E5E7EB`
- **Placeholder**: `#6B7280`
- **Focus**: Border color `#6366F1`, Box-shadow `0 0 0 2px rgba(99, 102, 241, 0.2)`

### Tables
- **Header**: `#9CA3AF`, uppercase, 12px, letter-spacing 0.05em. Bottom border only.
- **Rows**: Hover background `rgba(255, 255, 255, 0.03)`.
- **Cell Padding**: generous (16px vertical) for readability.

## Implementation (CSS Variables)
Recommended root variables for referencing the design tokens:

```css
:root {
  --color-bg-app: #0F1117;
  --color-bg-card: rgba(255, 255, 255, 0.06);
  --color-border: rgba(255, 255, 255, 0.08);

  --color-text-primary: #E5E7EB;
  --color-text-secondary: #9CA3AF;

  --color-accent-primary: #6366F1;
  --color-accent-secondary: #22C55E;
  --color-status-warning: #F59E0B;
  --color-status-danger: #EF4444;

  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```
