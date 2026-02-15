# Analytics Tab Validation Checklist

## 1. Date Filtering Verification (CRITICAL)
This section verifies that date filters correctly include data based on local time boundaries.

- [ ] **"Today" Filter Test**
    1. Navigate to `Leads` tab.
    2. Create a **NEW Lead** (e.g., "Analytics Test Lead").
    3. Note the current time.
    4. Navigate to `Analytics` tab.
    5. Click the **"Today"** preset filter.
    6. **VERIFICATION**: 
        - The `Lead Volume Over Time` chart should show a bar for today's date with count >= 1.
        - The `Total Leads` KPI card should include this new lead (incremented by 1).
        - If the chart is empty, the filter logic is broken (likely timezone issue).

- [ ] **"Custom Range" Filter Test**
    1. Select a Custom Date Range:
        - `From`: Today's Date.
        - `To`: Today's Date.
    2. **VERIFICATION**:
        - Should match the "Today" preset result.
    3. Select `From`: Yesterday, `To`: Today.
    4. **VERIFICATION**:
        - Should include leads from both days.

## 2. KPI Metrics Accuracy
Verify that the top cards reflect the database state.

- [ ] **Total Leads**
    - Compare usage of `SELECT COUNT(*) FROM leads` vs displayed number.
    - Should match the total count visible in the `Leads` tab (when no filters applied).

- [ ] **Total Enrollments**
    - Count leads with status `Enrolled` in `Leads` tab.
    - Match with `Enrollments` card.

- [ ] **Conversion Rate**
    - Formula: `(Total Enrollments / Total Leads) * 100`.
    - Example: 5 Enrolled / 10 Total = 50%.
    - Verify the displayed percentage matches this calculation.

- [ ] **Active Pipeline**
    - Count leads NOT in `Enrolled` or `Lost` status.
    - Match with `Active Pipeline` card.

## 3. Charts & Visuals Validation

- [ ] **Lead Volume Over Time (Bar Chart)**
    - X-Axis: Dates.
    - Y-Axis: Count of leads created.
    - Tooltip: Hovering over a bar shows exact date and count.

- [ ] **Pipeline Funnel (Horizontal Bar)**
    - Stages: `New`, `Attempted Contact`, `Connected`, `Visit Scheduled`, `Application Submitted`, `Enrolled`, `Lost`.
    - Check that counts align with `Leads` tab filters by status.

- [ ] **Conversion by Source**
    - Verify bars for `Website`, `Walk In`, `Referral`, `Social`.
    - Ensure filtered source (e.g., "Website") updates this chart to show only that source or highlights it.

- [ ] **Counselor Performance Table**
    - Lists counselors with assigned leads.
    - check `Total Leads` per counselor matches their assigned count.

## 4. Edge Cases

- [ ] **Timezone Boundary Test**
    - Usage: Create a lead late at night (e.g., 11:30 PM).
    - Check filters immediately.
    - Check filters the next morning. It should appear in "Yesterday" or "Last 7 Days".

- [ ] **Zero Data State**
    - Select a date range with NO leads (e.g., last year).
    - Charts should show valid empty states (zeros), not broken UI or infinite loading.
