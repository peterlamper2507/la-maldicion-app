## 2025-05-14 - [Accessibility in Floating Widgets]
**Learning:** Floating widgets and minimalist dashboards often overlook foundational accessibility. In this app, many inputs lacked linked labels, and icon-only buttons lacked descriptive ARIA labels. For screen reader users, a launcher without a label is a "button" with no purpose.
**Action:** When working on widgets or dashboard overlays, always verify that: 1) every input has a label linked via 'htmlFor'/'id', 2) launchers use 'aria-expanded' to signal state changes, and 3) icon-only buttons have descriptive 'aria-label's.
