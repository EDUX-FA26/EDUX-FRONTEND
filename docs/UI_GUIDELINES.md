# EDUX — Global UI/UX Guidelines

> This document is the global UI/UX source of truth for the EDUX frontend.
>
> Every new page, component, feature, and UI modification should follow these guidelines unless a specific requirement explicitly overrides them.

---

# 1. Product Context

EDUX is a university learning platform for FPT University.

The platform supports:

* Students
* Lecturers
* Academic staff
* Administrators

Core features may include:

* Assignments
* Quizzes
* Flashcards
* Learning sessions
* Subjects
* Classes
* Learning materials
* Learning progress
* Learning streaks
* Student management
* Lecturer management
* Grading
* Notifications

The product should feel like a modern education SaaS platform.

It should be:

* Modern
* Soft
* Clean
* Friendly
* Academic
* Professional
* Accessible
* Easy to understand

---

# 2. Primary Design Goal

The UI must balance two audiences:

### Students

Students should feel:

* comfortable
* motivated
* focused
* confident
* able to understand the interface immediately

### Lecturers

Lecturers should feel:

* organized
* productive
* confident
* able to manage large amounts of information efficiently

The interface must not be designed exclusively for students or exclusively for lecturers.

---

# 3. Visual Personality

The desired visual personality is:

```text
Modern
   +
Soft
   +
Academic
   +
Friendly
   +
Professional
   +
Minimal
```

The interface should resemble a modern learning SaaS product.

Avoid making it look like:

* a gaming application
* a children's learning application
* an old-fashioned university management system
* an overly corporate enterprise dashboard
* a flashy social media application

---

# 4. Design Principles

Always prioritize the following:

## 4.1 Usability over decoration

If visual beauty conflicts with usability:

> Choose usability.

---

## 4.2 Clarity over complexity

If an interface can be simplified without losing functionality:

> Simplify it.

---

## 4.3 Consistency over novelty

Reuse existing design patterns whenever possible.

Do not introduce a new visual pattern simply because it looks interesting.

---

## 4.4 Accessibility over visual effects

Do not sacrifice:

* contrast
* readability
* keyboard navigation
* focus states
* touch usability

for visual effects.

---

## 4.5 Performance over animation

Animations should enhance the experience, not slow it down.

---

# 5. Color System

Use a restrained and professional color palette.

## Primary

Primary color:

```text
#2563EB
```

Primary hover:

```text
#1D4ED8
```

Primary light:

```text
#EFF6FF
```

Use blue primarily for:

* primary actions
* active navigation
* links
* important information
* selected states
* progress indicators

Do not make the entire interface blue.

---

## Neutral Colors

Background:

```text
#F8FAFC
```

Surface:

```text
#FFFFFF
```

Border:

```text
#E2E8F0
```

Primary text:

```text
#0F172A
```

Secondary text:

```text
#475569
```

Muted text:

```text
#94A3B8
```

Neutral colors should make up most of the interface.

---

## Semantic Colors

Success:

```text
#16A34A
```

Warning:

```text
#D97706
```

Error:

```text
#DC2626
```

Info:

```text
#0284C7
```

Use semantic colors only when they communicate meaning.

Do not use many saturated colors at the same time.

---

# 6. Color Usage Rules

Do:

* use neutral backgrounds
* use one dominant primary color
* use semantic colors consistently
* maintain sufficient contrast
* use lighter variants for backgrounds

Do not:

* use neon colors
* use excessive gradients
* use rainbow color palettes
* use many saturated colors
* use color only to communicate important information

Status should not depend on color alone.

---

# 7. Typography

Primary font:

```text
Inter
```

Fallback:

```text
system-ui
-apple-system
BlinkMacSystemFont
"Segoe UI"
sans-serif
```

Typography should prioritize readability.

## Recommended hierarchy

Page title:

```text
28–32px
font-weight: 600–700
```

Section title:

```text
20–24px
font-weight: 600
```

Card title:

```text
16–18px
font-weight: 600
```

Body:

```text
14–16px
font-weight: 400
```

Secondary text:

```text
13–14px
```

Do not use extremely large typography unless the page specifically requires it.

---

# 8. Spacing System

Use a consistent spacing system based primarily on multiples of 4px.

Preferred values:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Prefer consistent whitespace over dense layouts.

Avoid arbitrary spacing values unless necessary.

---

# 9. Border Radius

Use moderate rounded corners.

Small controls:

```text
8px
```

Inputs/buttons:

```text
8–10px
```

Cards:

```text
12–16px
```

Large feature cards:

```text
16–20px
```

Modals:

```text
16px
```

Avoid making every element completely pill-shaped.

Pills should mainly be used for:

* tags
* badges
* statuses
* filters
* compact controls

---

# 10. Shadows

Use subtle shadows.

Preferred visual hierarchy:

```text
border
+
very subtle shadow
```

rather than:

```text
large dark shadow
```

Avoid heavy shadows.

Cards should still look good with only a border.

---

# 11. Layout

Use generous whitespace.

Typical page structure:

```text
Page
├── Header
│   ├── Title
│   ├── Description
│   └── Primary Action
│
├── Tabs / Filters
│
├── Main Content
│
└── Secondary Actions / Pagination
```

Important actions should be easy to find.

Avoid unnecessary decorative sections.

---

# 12. Page Width

Content should not stretch unnecessarily across very large screens.

Use a sensible maximum content width when appropriate.

For dashboards:

* allow wide layouts when useful
* use grids for related information
* avoid extremely wide text blocks

For reading/learning pages:

* prioritize comfortable reading width

---

# 13. Navigation

Navigation should be predictable.

Desktop navigation may use:

* sidebar
* top navigation

Mobile navigation may use:

* drawer
* bottom navigation
* compact header

Navigation should clearly communicate:

* current location
* available sections
* hierarchy

Active items should use subtle primary styling.

Avoid extremely heavy navigation backgrounds.

---

# 14. Buttons

Buttons should have clear hierarchy.

## Primary

Use for:

* submit
* create
* save
* continue
* start
* confirm

## Secondary

Use for:

* cancel
* secondary actions
* alternative actions

## Destructive

Use only for:

* delete
* remove
* destructive actions

Do not place multiple visually dominant primary buttons next to each other unless there is a clear reason.

---

# 15. Inputs and Forms

Forms should be easy to scan.

Every important input should have:

* visible label
* appropriate placeholder when useful
* focus state
* validation state
* error message when needed

Do not rely only on placeholders as labels.

Group related fields.

Avoid unnecessarily long forms.

---

# 16. Cards

Cards should represent meaningful groups of information.

A card should have:

* clear hierarchy
* consistent padding
* readable title
* useful metadata
* appropriate action

Avoid excessive nested cards.

Do not put a card inside another card unless there is a strong information hierarchy.

---

# 17. Tables

Use tables when users need to compare multiple records.

Tables should have:

* readable headers
* consistent alignment
* sufficient row height
* subtle row hover
* clear actions
* pagination when necessary
* filters/search when appropriate

Avoid excessive borders.

For mobile:

* allow horizontal scrolling
* or transform the table into cards when appropriate

---

# 18. Statuses and Badges

Statuses should be immediately understandable.

Examples:

```text
Not started
In progress
Submitted
Late
Graded
Completed
Active
Inactive
```

Use:

* semantic color
* text
* optional icon

Never communicate an important status through color alone.

---

# 19. Empty States

An empty state should explain:

1. What is empty?
2. Why might it be empty?
3. What can the user do next?

Example:

```text
No assignments yet

There are currently no assignments for this class.

[Back to class]
```

Avoid simply displaying:

```text
No data
```

---

# 20. Loading States

Prefer skeleton loading for content-heavy pages.

Examples:

* card skeleton
* table skeleton
* dashboard skeleton
* list skeleton

Use spinners for short actions.

Avoid blocking the entire application unnecessarily.

---

# 21. Error States

Errors should be understandable to normal users.

Bad:

```text
500 Internal Server Error
```

Better:

```text
Something went wrong

We couldn't load this information.
Please try again.

[Try again]
```

Technical details should not be the primary user-facing message.

---

# 22. Modals

Use modals for focused tasks.

Good use cases:

* confirmation
* quick edit
* preview
* small forms

Avoid putting large multi-step workflows inside modals.

If a workflow is complex:

> Use a dedicated page.

---

# 23. Flashcards / Learning Experiences

Learning interfaces should minimize distractions.

Flashcard UI should prioritize:

* readable content
* large enough text
* generous whitespace
* clear progress
* obvious interaction
* subtle animation

Avoid excessive gamification.

Learning should feel focused rather than like a game.

---

# 24. Gamification

Gamification can be used for:

* streaks
* progress
* achievements
* completion

But it should remain subtle.

Good:

```text
🔥 7 day streak
```

Avoid:

* giant animated flames
* excessive confetti
* casino-like effects
* constant animations
* aggressive reward notifications

---

# 25. Charts and Data Visualization

Charts should answer a meaningful question.

Before adding a chart, ask:

> What information does this chart help the user understand?

Use charts for:

* progress
* performance
* activity
* trends
* comparisons

Do not add charts merely to make a dashboard look impressive.

---

# 26. Animation

Animations should be:

* short
* subtle
* functional

Recommended duration:

```text
150–300ms
```

Use animation for:

* hover
* focus
* modal appearance
* page transitions
* flashcard flip
* loading
* success feedback

Avoid:

* excessive bouncing
* long transitions
* constant movement
* distracting particles
* unnecessary parallax

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

---

# 27. Icons

Use a consistent icon library.

Preferred:

```text
Lucide Icons
```

Icons should communicate meaning.

Avoid:

* mixing multiple icon styles
* decorative icons everywhere
* oversized icons
* icon-only buttons without accessible labels

Recommended icon size:

```text
16–24px
```

---

# 28. Images and Illustrations

Images should support the product experience.

Prefer:

* simple illustrations
* educational imagery
* subtle visual accents

Avoid:

* random stock images
* overly decorative hero images
* visually noisy illustrations

If an image does not improve understanding or emotion:

> Consider removing it.

---

# 29. Responsive Design

Every UI must work on:

* desktop
* laptop
* tablet
* mobile

Do not simply shrink desktop layouts.

Adapt the layout.

Examples:

```text
Desktop:
Sidebar + content

Tablet:
Compact sidebar + content

Mobile:
Drawer + content
```

Grid layouts should collapse naturally.

Large tables should become:

* horizontally scrollable
* or card-based

Buttons should remain easy to tap.

---

# 30. Accessibility

Accessibility is required.

Always consider:

* semantic HTML
* keyboard navigation
* visible focus
* sufficient contrast
* readable font sizes
* labels
* accessible buttons
* meaningful error messages
* reduced motion

Never use color as the only indication of:

* success
* error
* selected state
* status

---

# 31. Mobile UX

Mobile users should be able to complete important tasks comfortably.

Prioritize:

* large touch targets
* clear actions
* readable text
* simple navigation
* minimal horizontal scrolling

Avoid:

* tiny buttons
* cramped forms
* excessive desktop-style tables
* overly dense dashboards

---

# 32. Component Reuse

Before creating a new component:

1. Search the existing codebase.
2. Check whether an equivalent component already exists.
3. Reuse it if possible.
4. Extend it if appropriate.
5. Create a new component only when necessary.

Avoid duplicate components such as:

```text
Button.jsx
PrimaryButton.jsx
ActionButton.jsx
SubmitButton.jsx
```

when one reusable component could handle the use cases.

---

# 33. Existing Project Architecture

The frontend uses:

* React.js
* Vite
* JavaScript

The project already has folders such as:

```text
src/
├── components/
├── pages/
├── services/
└── ...
```

Respect the existing architecture.

Do not reorganize the entire project simply to implement a UI.

Do not introduce a new state management library or UI framework unless explicitly requested.

---

# 34. API and Business Logic

UI implementation must not unnecessarily modify business logic.

Do not:

* invent API endpoints
* invent API fields
* change API contracts
* change database structures
* duplicate backend logic in the frontend

When a UI depends on backend data:

> Inspect the backend implementation and use the actual API contract.

The backend remains the source of truth for business rules and authorization.

---

# 35. Authentication and Authorization

The frontend may improve UX based on authentication state and user roles.

However:

> Frontend UI visibility is NOT security.

Backend authorization remains authoritative.

Do not assume roles or permissions.

Inspect the backend before implementing role-based UI.

---

# 36. Code Quality Rules for UI

When implementing UI:

* reuse existing components
* avoid duplicated JSX
* keep components focused
* avoid unnecessarily large components
* use meaningful variable names
* keep styling consistent
* avoid hardcoded URLs
* avoid unnecessary dependencies
* preserve existing functionality

Do not rewrite working code without a reason.

---

# 37. Before Creating a New Page

Always inspect:

1. Existing layout
2. Existing navigation
3. Existing components
4. Existing styles
5. Existing services
6. Existing API usage
7. Existing responsive patterns

Then implement the new page using those patterns.

---

# 38. AI Implementation Behavior

When an AI coding agent is asked to create or modify UI:

### Step 1

Inspect the existing frontend.

### Step 2

Inspect relevant backend APIs when the feature depends on backend data.

### Step 3

Identify reusable components.

### Step 4

Understand the user flow.

### Step 5

Implement the simplest design that satisfies the requirements.

### Step 6

Check desktop and mobile layouts.

### Step 7

Check loading, empty, error, and success states.

### Step 8

Check accessibility.

### Step 9

Compare the result against this document.

### Step 10

Only then consider decorative improvements.

---

# 39. Do Not Overdesign

This rule is extremely important.

Do not add visual effects just because they are technically possible.

Avoid:

* excessive gradients
* excessive glassmorphism
* neon colors
* huge shadows
* unnecessary 3D
* excessive animations
* decorative particles
* complicated backgrounds
* excessive rounded elements
* excessive cards
* excessive icons

The UI should look polished because of:

* spacing
* hierarchy
* typography
* consistency
* alignment
* restrained colors

not because of visual effects.

---

# 40. Decision Priority

When making a UI decision, use this priority:

```text
1. Functionality
2. Usability
3. Accessibility
4. Consistency
5. Readability
6. Performance
7. Visual polish
8. Decorative effects
```

Never sacrifice a higher-priority item for a lower-priority item.

---

# 41. Quality Checklist

Before considering a UI complete, verify:

### Visual

* [ ] Consistent typography
* [ ] Consistent spacing
* [ ] Consistent colors
* [ ] Consistent border radius
* [ ] Consistent buttons
* [ ] Consistent icons
* [ ] No unnecessary decoration

### UX

* [ ] Main action is obvious
* [ ] User understands the page immediately
* [ ] Navigation is clear
* [ ] Important information is easy to find
* [ ] Empty states are handled
* [ ] Error states are handled
* [ ] Loading states are handled
* [ ] Success states are handled

### Responsive

* [ ] Desktop works
* [ ] Tablet works
* [ ] Mobile works
* [ ] No accidental horizontal overflow
* [ ] Touch targets are usable

### Accessibility

* [ ] Keyboard navigation works
* [ ] Focus states are visible
* [ ] Labels are present
* [ ] Contrast is sufficient
* [ ] Color is not the only status indicator
* [ ] Reduced motion is respected

### Code

* [ ] Existing components were reused
* [ ] No unnecessary dependencies
* [ ] No duplicated logic
* [ ] No hardcoded API URLs
* [ ] Existing business logic remains intact

---

# 42. Final Design Rule

When uncertain, choose the solution that is:

> Simple, clear, consistent, accessible, and easy for both students and lecturers to understand.

EDUX should feel like a product that users can learn without being taught how to use it.
