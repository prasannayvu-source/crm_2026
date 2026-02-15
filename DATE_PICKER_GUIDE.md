# Date Picker Troubleshooting & Usage Guide

## How to Use the Date Filters

### Method 1: Quick Presets (Recommended) ⚡
Simply click one of the preset buttons at the top:
- **All Time** - No date filter
- **Today** - Today's data
- **Last 7 Days** - Past week
- **Last 30 Days** - Past month
- **This Month** - Current month to date
- **Last Month** - Complete previous month

### Method 2: Custom Date Selection 📅

#### Step-by-Step:
1. **Look for the "Custom Range" section** below the preset buttons
2. **Click on the FIRST date input box** (left side)
3. **A calendar should pop up** from your browser
4. **Select your start date** from the calendar
5. **Click on the SECOND date input box** (right side, after "to")
6. **Select your end date** from the calendar
7. **Data refreshes automatically**

## If Calendar Doesn't Appear

### Quick Fixes:

#### Fix 1: Click the Calendar Icon
- Look for a **small calendar icon** on the right side of the date input
- It should be **white/light colored**
- Click directly on this icon

#### Fix 2: Click Inside the Input Box
- Click in the **middle** of the date input box
- Don't click on the edges
- The calendar should appear

#### Fix 3: Use Keyboard
1. Click in the date input box
2. Press **Tab** to move between day/month/year
3. Type numbers directly (DD-MM-YYYY format)
4. Or press **Space** to open calendar

#### Fix 4: Browser Compatibility
Some browsers show date pickers differently:

**Chrome/Edge (Best Support)**:
- Calendar icon appears on the right
- Click icon or input to open calendar
- Full calendar view with month/year navigation

**Firefox**:
- Calendar icon appears on the right
- Similar to Chrome
- Full calendar support

**Safari**:
- Dropdown spinners for day/month/year
- Different UI but works the same

**If using older browser**:
- Update to latest version
- Or use the **Quick Presets** instead

## Visual Guide

### What You Should See:

```
┌─────────────────────────────────────────────────────┐
│ Custom Range                                         │
│ ┌──────────────────┐  to  ┌──────────────────┐     │
│ │ dd-mm-yyyy    📅 │      │ dd-mm-yyyy    📅 │     │
│ └──────────────────┘      └──────────────────┘     │
└─────────────────────────────────────────────────────┘
         ↑                           ↑
    Click here               Or click here
```

### When You Click:

```
┌──────────────────┐
│ dd-mm-yyyy    📅 │
└──────────────────┘
         ↓
┌──────────────────────────┐
│  February 2026           │
│ ┌──┬──┬──┬──┬──┬──┬──┐  │
│ │Su│Mo│Tu│We│Th│Fr│Sa│  │
│ ├──┼──┼──┼──┼──┼──┼──┤  │
│ │  │  │  │  │  │  │ 1│  │
│ │ 2│ 3│ 4│ 5│ 6│ 7│ 8│  │
│ │ 9│10│11│12│13│14│15│  │
│ │16│17│18│19│20│21│22│  │
│ │23│24│25│26│27│28│  │  │
│ └──┴──┴──┴──┴──┴──┴──┘  │
│  [< Prev]    [Next >]    │
└──────────────────────────┘
```

## Alternative: Use Preset Buttons

If the date picker is not working, **just use the preset buttons**! They're faster anyway:

### Common Use Cases:

**Weekly Report**:
- Click **"Last 7 Days"**
- Done! ✅

**Monthly Report**:
- Click **"This Month"** (for current month)
- Or **"Last Month"** (for previous month)
- Done! ✅

**Today's Activity**:
- Click **"Today"**
- Done! ✅

**All Historical Data**:
- Click **"All Time"**
- Done! ✅

## Technical Details

### Browser Date Input Support
- ✅ Chrome 20+
- ✅ Edge 12+
- ✅ Firefox 57+
- ✅ Safari 14.1+
- ✅ Opera 15+

### What We've Implemented
1. **Native HTML5 date input** (`<input type="date">`)
2. **Dark theme support** (color-scheme: dark)
3. **Enhanced calendar icon** (white, larger, more visible)
4. **Date validation** (can't select end date before start date)
5. **Auto-refresh** (data updates when dates change)

### CSS Enhancements
- Larger calendar icon (20px × 20px)
- White color for visibility
- Proper spacing and padding
- Focus states with purple highlight
- Dark theme calendar popup

## Still Not Working?

### Last Resort Options:

#### Option 1: Use Preset Buttons Only
The preset buttons cover 90% of use cases. Just use those!

#### Option 2: Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for any red errors
4. Share the error message with me

#### Option 3: Try Different Browser
- Open in **Google Chrome** (best support)
- Or **Microsoft Edge**
- These have the best date picker support

#### Option 4: Clear Browser Cache
1. Press **Ctrl + Shift + Delete**
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (**Ctrl + Shift + R**)

## Expected Behavior

### When Working Correctly:
1. ✅ Calendar icon visible (white, right side of input)
2. ✅ Click icon → calendar pops up
3. ✅ Click date → input fills with selected date
4. ✅ Date shows in format: DD-MM-YYYY
5. ✅ Charts refresh automatically

### If You See:
- ❌ "dd-mm-yyyy" text that doesn't change → Calendar not opening
- ❌ No calendar icon → CSS not loaded
- ❌ Can't click anything → JavaScript error

## Contact Support

If none of these work, please share:
1. **Browser name and version** (e.g., Chrome 120)
2. **Operating System** (e.g., Windows 11)
3. **Screenshot** of the date inputs
4. **Browser console errors** (F12 → Console tab)

---

**TL;DR**: Click the preset buttons (All Time, Today, Last 7 Days, etc.) for quick filtering. They work perfectly and are faster than manual date selection!
