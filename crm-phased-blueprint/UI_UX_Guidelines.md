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

---

## Phase 4 Specific Components

### Analytics Tab Components

#### KPI Cards
- **Dimensions**: 
  - Width: `calc(25% - 12px)` (4 cards per row with 16px gap)
  - Height: `120px`
  - Mobile: `100%` width (stacked)
- **Layout**:
  - Top: Large number (32px, Bold)
  - Middle: Label (12px, uppercase, secondary text)
  - Bottom: Trend indicator + sparkline
- **Trend Indicator**:
  - Positive: Green arrow ↑ + percentage
  - Negative: Red arrow ↓ + percentage
  - Neutral: Gray dash —
- **Sparkline**:
  - Height: 24px
  - Stroke width: 2px
  - Color: Accent primary (faded 40%)

#### Filter Bar
- **Position**: Sticky (top: 0, z-index: 100)
- **Background**: `rgba(15, 17, 23, 0.95)` with backdrop blur
- **Height**: 64px
- **Padding**: 12px 24px
- **Layout**: Horizontal flex, gap 12px
- **Filter Chips**:
  - Background: `rgba(255, 255, 255, 0.08)`
  - Border radius: 8px
  - Padding: 8px 12px
  - Active state: Border `1px solid #6366F1`
  - Clear button: X icon (hover: red)

#### Charts
- **Container**:
  - Background: Glass card
  - Padding: 24px
  - Min-height: 400px
- **Chart Colors** (for multi-series):
  - Series 1: `#6366F1` (Primary)
  - Series 2: `#22C55E` (Success)
  - Series 3: `#F59E0B` (Warning)
  - Series 4: `#EF4444` (Danger)
  - Series 5+: Auto-generated from HSL palette
- **Tooltip**:
  - Background: `rgba(0, 0, 0, 0.9)`
  - Border: `1px solid rgba(255, 255, 255, 0.2)`
  - Padding: 12px
  - Border radius: 8px
  - Font size: 14px
- **Grid Lines**:
  - Color: `rgba(255, 255, 255, 0.05)`
  - Stroke width: 1px
  - Dashed: `[4, 4]`

#### Alerts Rail
- **Width**: 280px (desktop), 100% (mobile)
- **Background**: `rgba(255, 255, 255, 0.04)`
- **Border left**: `1px solid rgba(255, 255, 255, 0.08)`
- **Alert Card**:
  - Padding: 12px
  - Border radius: 8px
  - Border left: `3px solid` (color based on severity)
  - Margin bottom: 8px
  - Severity colors:
    - Critical: `#EF4444`
    - Warning: `#F59E0B`
    - Info: `#6366F1`

#### Slide-Over Drilldown
- **Width**: 600px (desktop), 100% (mobile)
- **Animation**: Slide from right (300ms ease-out)
- **Backdrop**: `rgba(0, 0, 0, 0.6)` with backdrop blur
- **Content**:
  - Header: 64px height, title + close button
  - Body: Scrollable, padding 24px
  - Footer: Action buttons, padding 16px

### Reports Tab Components

#### Reports Library (Sidebar)
- **Width**: 320px (desktop), hidden on mobile (drawer)
- **Background**: `rgba(255, 255, 255, 0.04)`
- **Search Bar**:
  - Height: 40px
  - Icon: Magnifying glass (left)
  - Clear button: X (right, when active)
- **Category Headers**:
  - Font size: 12px
  - Uppercase
  - Color: Secondary text
  - Padding: 8px 16px
- **Report Items**:
  - Padding: 12px 16px
  - Border radius: 8px
  - Hover: Background `rgba(255, 255, 255, 0.06)`
  - Selected: Background `rgba(99, 102, 241, 0.15)`, border left `3px solid #6366F1`
  - Quick actions: Icon buttons (Run, Edit, Delete) on hover

#### Report Builder Wizard
- **Step Indicator**:
  - Top of panel
  - 3 circles connected by lines
  - Active step: Filled circle, primary color
  - Completed: Checkmark, success color
  - Pending: Outline circle, secondary text
- **Field Selector** (Step 1):
  - Two-column layout (Available | Selected)
  - Drag handle: 6-dot icon
  - Remove button: X icon (red on hover)
  - Search: Debounced 300ms
- **Layout Configurator** (Step 2):
  - Form layout: 2 columns on desktop, 1 on mobile
  - Filter builder: AND/OR toggle buttons
  - Preview count: Badge showing "X rows match"
- **Export Scheduler** (Step 3):
  - Format selector: Radio buttons with icons
  - Schedule: Toggle between "Run Once" and recurring
  - Recipients: Tag input (chips for emails)
  - Preview button: Opens modal

#### Report Preview Modal
- **Size**: 80vw x 80vh (max 1200px x 800px)
- **Header**: Report name + export button
- **Table**:
  - Fixed header on scroll
  - Alternating row colors
  - Pagination: Bottom, 10/25/50/100 per page

### Admin Tab Components

#### Admin Sidebar Navigation
- **Width**: 240px (desktop), drawer on mobile
- **Section Headers**:
  - Font size: 11px
  - Uppercase
  - Letter spacing: 0.1em
  - Color: Secondary text
  - Padding: 16px 16px 8px
- **Nav Items**:
  - Padding: 10px 16px
  - Border radius: 8px
  - Icon + text (gap 12px)
  - Active: Background primary accent (10% opacity)
  - Hover: Background `rgba(255, 255, 255, 0.06)`

#### User Management Table
- **Columns**:
  - Avatar: 32px circle
  - Name: Bold, 14px
  - Email: Secondary text, 13px
  - Role: Badge component
  - Status: Dot + text
  - Last Login: Relative time (e.g., "2 hours ago")
  - Actions: Icon buttons (Edit, Delete, More)
- **Bulk Actions Bar**:
  - Appears when rows selected
  - Fixed to top of table
  - Background: Primary accent
  - Text: White
  - Actions: Dropdown + count badge

#### Role Permission Matrix
- **Layout**: Grid (CSS Grid)
- **Rows**: Feature names (sticky left column)
- **Columns**: Permission types (sticky header)
- **Cells**: Checkboxes (custom styled)
- **Checkbox States**:
  - Unchecked: Border only
  - Checked: Filled with checkmark
  - Indeterminate: Dash (for partial permissions)
  - Disabled: Grayed out (for system roles)

#### Integration Cards
- **Layout**: Grid (2 columns desktop, 1 mobile)
- **Card**:
  - Padding: 20px
  - Logo: 48px x 48px (top left)
  - Status badge: Top right
  - Name: 18px, bold
  - Description: 14px, secondary text
  - Configure button: Bottom, full width
- **Status Badge**:
  - Connected: Green dot + "Connected"
  - Disconnected: Gray dot + "Not Connected"
  - Error: Red dot + "Error"

#### System Health Dashboard
- **Metric Cards**: 2x2 grid on desktop
- **Chart Type**: Line chart (last 24 hours)
- **Status Indicators**:
  - Healthy: Green circle
  - Warning: Yellow triangle
  - Critical: Red octagon
- **Thresholds**:
  - Display as horizontal line on chart
  - Dashed, warning color

#### Audit Log Table
- **Expandable Rows**:
  - Click row to expand
  - Expand icon: Chevron (rotates 90° when open)
  - Expanded content: Indented, gray background
- **Timestamp**: Relative + absolute (tooltip)
- **User**: Avatar + name
- **Action**: Color-coded badge
  - Created: Blue
  - Updated: Yellow
  - Deleted: Red
  - Viewed: Gray
- **Export**: CSV download button (top right)

---

## Interaction Patterns

### Loading States
- **Skeleton Screens**: For initial page load
  - Animated gradient shimmer
  - Match layout of actual content
- **Spinners**: For inline actions
  - Size: 16px (small), 24px (medium), 32px (large)
  - Color: Primary accent
  - Animation: Smooth rotation (1s linear infinite)
- **Progress Bars**: For long operations (exports, imports)
  - Height: 4px
  - Background: `rgba(255, 255, 255, 0.1)`
  - Fill: Primary accent gradient
  - Indeterminate: Animated stripe pattern

### Empty States
- **Illustration**: Centered, max-width 300px
- **Heading**: 20px, bold
- **Description**: 14px, secondary text, max-width 400px
- **CTA Button**: Primary button, centered
- **Example**: "No reports yet. Create your first report to get started."

### Error States
- **Inline Errors**: Below input field
  - Icon: Warning triangle
  - Color: Danger
  - Font size: 13px
- **Toast Notifications**:
  - Position: Top right
  - Duration: 4s (auto-dismiss)
  - Types: Success, Error, Warning, Info
  - Icon + message + close button
- **Error Pages** (404, 500):
  - Centered content
  - Large error code (72px)
  - Friendly message
  - "Go Home" button

### Modals & Dialogs
- **Backdrop**: `rgba(0, 0, 0, 0.7)` with backdrop blur
- **Modal**:
  - Max-width: 600px (small), 900px (large)
  - Border radius: 16px
  - Padding: 24px
  - Header: Title + close button
  - Footer: Action buttons (right-aligned)
- **Animation**: Fade in + scale (200ms ease-out)
- **Close**: Click backdrop, ESC key, X button

### Drag & Drop
- **Draggable Item**:
  - Cursor: grab (idle), grabbing (dragging)
  - Opacity: 0.5 while dragging
  - Ghost: Semi-transparent copy follows cursor
- **Drop Zone**:
  - Border: Dashed, primary accent
  - Background: `rgba(99, 102, 241, 0.1)` on hover
  - Feedback: "Drop here" text appears

---

## Responsive Breakpoints

### Desktop (≥1280px)
- Full sidebar navigation
- Multi-column layouts
- All features visible

### Tablet (768px - 1279px)
- Collapsible sidebar (hamburger menu)
- 2-column layouts (charts, cards)
- Simplified tables (hide less important columns)

### Mobile (<768px)
- Bottom navigation (5 icons max)
- Single column layouts
- Stacked cards
- Swipeable charts
- Accordion sections
- Full-screen modals

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- **Tab Order**: Logical, top-to-bottom, left-to-right
- **Focus Indicators**: 2px solid outline, primary accent color
- **Skip Links**: "Skip to main content" at top
- **Shortcuts**: Document and announce (e.g., Cmd+K for search)

### Screen Readers
- **ARIA Labels**: All interactive elements
- **Live Regions**: For dynamic content updates (charts, notifications)
- **Landmarks**: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`
- **Alt Text**: Descriptive for images, charts

### Color & Contrast
- **Minimum Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: Never rely on color alone (use icons, text)
- **High Contrast Mode**: Support OS-level high contrast

### Forms
- **Labels**: Always visible (not placeholder-only)
- **Error Messages**: Associated with field (aria-describedby)
- **Required Fields**: Asterisk + aria-required
- **Help Text**: Below field, linked with aria-describedby

---

## Performance Guidelines

### Images
- **Format**: WebP (with PNG/JPG fallback)
- **Lazy Loading**: Below-the-fold images
- **Responsive**: Multiple sizes (srcset)
- **Compression**: 80% quality for photos, lossless for UI

### Fonts
- **Preload**: Critical fonts (Inter Regular, Bold)
- **Subset**: Only Latin characters if applicable
- **Fallback**: System fonts (sans-serif)

### JavaScript
- **Code Splitting**: Route-based chunks
- **Lazy Loading**: Non-critical components
- **Tree Shaking**: Remove unused code
- **Minification**: Production builds

### CSS
- **Critical CSS**: Inline above-the-fold styles
- **Purge**: Remove unused Tailwind classes (if used)
- **Minification**: Production builds

---

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
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

---

## Component Library Reference

### Reusable Components
1. **Button** (Primary, Secondary, Danger, Ghost)
2. **Input** (Text, Email, Password, Number, Date)
3. **Select** (Single, Multi)
4. **Checkbox** & **Radio**
5. **Badge** (Status, Count)
6. **Avatar** (User, Initials)
7. **Card** (Glass, Solid)
8. **Table** (Sortable, Filterable, Paginated)
9. **Modal** (Small, Large, Full-screen)
10. **Toast** (Success, Error, Warning, Info)
11. **Tooltip** (Top, Bottom, Left, Right)
12. **Dropdown** (Menu, Actions)
13. **Tabs** (Horizontal, Vertical)
14. **Accordion** (Single, Multiple)
15. **Progress** (Linear, Circular)
16. **Skeleton** (Text, Card, Table)
17. **Chart** (Line, Bar, Pie, Funnel)
18. **DatePicker** (Single, Range)
19. **TimePicker** (12h, 24h)
20. **FileUpload** (Drag & Drop)

Each component should have:
- Default state
- Hover state
- Active/Focus state
- Disabled state
- Error state (if applicable)
- Loading state (if applicable)
