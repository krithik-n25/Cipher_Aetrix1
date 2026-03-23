# Margdarshak — Frontend Product Requirements Document (PRD)
**Version:** 1.0  
**Product:** Margdarshak (मार्गदर्शक) — AI-Powered Multilingual Symptom Checker  
**Type:** Web Application (React + Vite)  
**Audience:** Rural patients, ASHA workers, District health administrators  
**Hackathon:** 36-Hour Healthcare Track  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Design System](#2-design-system)
3. [Global Layout & Navigation](#3-global-layout--navigation)
4. [Page 1 — Login](#4-page-1--login)
5. [Page 2 — Language Selection (User)](#5-page-2--language-selection-user)
6. [Page 3 — Patient Info (User)](#6-page-3--patient-info-user)
7. [Page 4 — Symptom Input (User)](#7-page-4--symptom-input-user)
8. [Page 5 — Follow-Up Questions (User)](#8-page-5--follow-up-questions-user)
9. [Page 6 — Triage Result (User)](#9-page-6--triage-result-user)
10. [Page 7 — Feedback Loop (User)](#10-page-7--feedback-loop-user)
11. [Page 8 — ASHA Dashboard](#11-page-8--asha-dashboard)
12. [Page 9 — Assess Patient (ASHA)](#12-page-9--assess-patient-asha)
13. [Page 10 — Patient List (ASHA)](#13-page-10--patient-list-asha)
14. [Page 11 — Follow Up (ASHA)](#14-page-11--follow-up-asha)
15. [Page 12 — Monthly Report (ASHA)](#15-page-12--monthly-report-asha)
16. [Page 13 — Admin Dashboard](#16-page-13--admin-dashboard)
17. [Page 14 — Symptom Heatmap (Admin)](#17-page-14--symptom-heatmap-admin)
18. [Page 15 — PHC Monitor (Admin)](#18-page-15--phc-monitor-admin)
19. [Page 16 — ASHA Tracker (Admin)](#19-page-16--asha-tracker-admin)
20. [Page 17 — Outbreak Alerts (Admin)](#20-page-17--outbreak-alerts-admin)
21. [Page 18 — Reports (Admin)](#21-page-18--reports-admin)
22. [Reusable Components](#22-reusable-components)
23. [Context & State Management](#23-context--state-management)
24. [API Integration Layer](#24-api-integration-layer)
25. [Routing Architecture](#25-routing-architecture)
26. [Accessibility & Performance](#26-accessibility--performance)
27. [Responsive Behavior](#27-responsive-behavior)
28. [Animation & Motion System](#28-animation--motion-system)

---

## 1. Product Overview

### 1.1 What Is Margdarshak

Margdarshak is a multilingual, AI-powered symptom triage web application designed for rural India. It accepts symptom descriptions in Hindi, Marathi, Gujarati, Tamil, and English — via voice or text — and classifies urgency into three tiers: Emergency (RED), Visit Clinic (YELLOW), or Self-Care (GREEN). It recommends the nearest appropriate health facility and provides actionable guidance in the user's own language.

### 1.2 Three User Roles

| Role | Primary Goal | Access Level |
|---|---|---|
| Patient / Family (user) | Check symptoms, get triage result | Guest or logged in |
| ASHA Worker (asha) | Triage patients in their community | Must log in |
| District Officer (admin) | Monitor district health trends | Must log in |

### 1.3 Core User Journeys

**Patient Journey:**
Login/Guest → Language Select → Patient Info → Symptom Input → Follow-Up Questions → Triage Result → (48hr later) Feedback Loop

**ASHA Worker Journey:**
Login → Dashboard → Assess Patient → Triage Result → Patient Saved → Follow Up → Monthly Report

**Admin Journey:**
Login → Master Dashboard → Heatmap / PHC Monitor / ASHA Tracker / Outbreak Alerts / Reports

---

## 2. Design System

### 2.1 Style Identity

The visual language of Margdarshak combines:
- Modern Healthcare SaaS
- Soft 3D realism with floating glassmorphism elements
- Premium minimalism with generous whitespace
- Futuristic but approachable and trustworthy
- Inspired by: Apple Health + Stripe + a rural India context

The design must feel premium enough to impress hackathon judges while remaining simple enough for an ASHA worker on a basic Android phone.

### 2.2 Color System

#### Primary Palette
```
Deep Navy:       #0B1F3A   (primary text, headers)
Primary Blue:    #2F6BFF   (CTAs, active states, highlights)
Light Blue:      #EAF2FF   (backgrounds, cards, hover states)
White:           #FFFFFF   (card backgrounds, main surfaces)
Success Green:   #10B981   (GREEN triage, positive states)
Warning Amber:   #F59E0B   (YELLOW triage, moderate states)
Emergency Red:   #EF4444   (RED triage, emergencies)
Muted Gray:      #6B7280   (secondary text, labels)
Border Gray:     #E5E7EB   (card borders, dividers)
```

#### Gradient Definitions
```
Primary Gradient:     linear-gradient(135deg, #2F6BFF, #6EA8FF)
Hero Gradient:        linear-gradient(135deg, #0B1F3A 0%, #1a3a6b 50%, #2F6BFF 100%)
Card Glow Blue:       linear-gradient(135deg, rgba(47,107,255,0.08), rgba(110,168,255,0.04))
Emergency Gradient:   linear-gradient(135deg, #EF4444, #FF6B6B)
Success Gradient:     linear-gradient(135deg, #10B981, #34D399)
Warning Gradient:     linear-gradient(135deg, #F59E0B, #FCD34D)
Background Blob:      radial-gradient(ellipse at top right, rgba(47,107,255,0.12) 0%, transparent 60%)
```

#### Background Style
- Main app background: #F8FAFF (near-white with blue tint)
- Section backgrounds: White or #EAF2FF
- Add subtle radial gradient blobs (low opacity: 0.06–0.12) positioned at top-right and bottom-left of hero sections
- No dark backgrounds except Login page (which uses the existing dark theme)

### 2.3 Typography

#### Font Stack
```
Display / Headings:   'Poppins', sans-serif (weights: 600, 700, 800)
Body / UI:            'Inter', sans-serif (weights: 400, 500, 600)
Monospace / Labels:   'DM Mono', monospace (weights: 400, 500)
Hindi/Regional text:  Inherit from system (Noto Sans Devanagari auto-loads via browser)
```

Import in index.html or CSS:
```
Google Fonts: Poppins (600, 700, 800), Inter (400, 500, 600), DM Mono (400, 500)
```

#### Type Scale
```
H1 (Page titles):         2.5rem / 700 weight / -0.02em letter-spacing / line-height 1.15
H2 (Section headers):     1.75rem / 700 weight / -0.01em letter-spacing
H3 (Card titles):         1.25rem / 600 weight / normal letter-spacing
H4 (Sub-labels):          1rem / 600 weight
Body Large:               1rem / 400 weight / 1.6 line-height
Body Regular:             0.875rem / 400 weight / 1.5 line-height
Label / Caption:          0.75rem / 500 weight / 0.08em letter-spacing / uppercase
Micro:                    0.625rem / 500 weight / 0.1em letter-spacing
```

#### Bilingual Text Rule
Every user-facing label must show English above and regional language below (or alongside). Regional text uses slightly smaller size (85% of English size) and muted color (opacity 0.6).

### 2.4 Spacing System

Based on 4px base unit:
```
xs:   4px
sm:   8px
md:   16px
lg:   24px
xl:   32px
2xl:  48px
3xl:  64px
4xl:  96px
```

Sections use minimum 48px vertical padding. Cards use 24px internal padding. Mobile reduces by 25%.

### 2.5 Border Radius System

```
Small (inputs, tags):    8px
Medium (cards):          16px
Large (modals, panels):  20px
XLarge (hero sections):  28px
Full (pills, badges):    9999px
```

### 2.6 Shadow System

All shadows are soft and directional — never harsh:

```
Shadow XS:   0 1px 3px rgba(11,31,58,0.06)
Shadow SM:   0 4px 12px rgba(11,31,58,0.08)
Shadow MD:   0 8px 24px rgba(11,31,58,0.10)
Shadow LG:   0 16px 48px rgba(11,31,58,0.12)
Shadow XL:   0 24px 64px rgba(11,31,58,0.14)
Glow Blue:   0 0 0 3px rgba(47,107,255,0.12), 0 8px 24px rgba(47,107,255,0.15)
Glow Green:  0 0 0 3px rgba(16,185,129,0.12), 0 8px 24px rgba(16,185,129,0.15)
Glow Red:    0 0 0 3px rgba(239,68,68,0.15), 0 8px 24px rgba(239,68,68,0.20)
```

### 2.7 Glassmorphism Style

Used sparingly on floating cards and overlays:
```
Background:      rgba(255,255,255,0.72)
Backdrop filter: blur(16px)
Border:          1px solid rgba(255,255,255,0.6)
Shadow:          0 8px 32px rgba(11,31,58,0.10)
```

### 2.8 Button System

#### Primary Button
- Background: Primary Gradient (#2F6BFF → #6EA8FF)
- Text: White, 14px, 600 weight, 0.04em letter-spacing
- Padding: 14px 28px
- Border radius: 10px
- Shadow: 0 4px 16px rgba(47,107,255,0.35)
- Hover: translateY(-2px), shadow increases to 0 8px 24px rgba(47,107,255,0.45)
- Active: translateY(0px), shadow decreases
- Disabled: opacity 0.5, cursor not-allowed, no hover effect
- Transition: all 0.2s cubic-bezier(0.16,1,0.3,1)

#### Secondary Button
- Background: White
- Border: 1.5px solid #E5E7EB
- Text: #0B1F3A, 14px, 500 weight
- Hover: border-color #2F6BFF, background #EAF2FF
- Same padding and radius as primary

#### Ghost Button
- Background: transparent
- Text: #2F6BFF, 14px, 500 weight
- Hover: background rgba(47,107,255,0.06)

#### Danger Button
- Background: Emergency Gradient (#EF4444 → #FF6B6B)
- Used only for emergency call-to-action (Call 108)
- Larger size: 16px text, 18px 36px padding
- Animated pulse on RED triage screens

#### Icon Button
- 40px × 40px
- Border radius: 10px
- Background: #EAF2FF or transparent
- Hover: background #dbeafe

### 2.9 Form Input System

All inputs follow this specification:

```
Height:            52px
Border:            1.5px solid #E5E7EB
Border radius:     10px
Background:        #FFFFFF
Padding:           14px 16px
Font size:         15px
Font weight:       400
Color:             #0B1F3A
Placeholder color: #9CA3AF
```

Focus state:
```
Border color:  #2F6BFF
Box shadow:    0 0 0 3px rgba(47,107,255,0.12)
Outline:       none
```

Error state:
```
Border color:  #EF4444
Box shadow:    0 0 0 3px rgba(239,68,68,0.10)
```

Labels: 11px, uppercase, 0.08em letter-spacing, #6B7280, displayed above input with 6px margin-bottom

### 2.10 Card System

Standard card:
```
Background:    #FFFFFF
Border:        1px solid #E5E7EB
Border radius: 16px
Padding:       24px
Shadow:        Shadow MD
```

Highlighted card (active/selected):
```
Background:    #EAF2FF
Border:        1.5px solid #2F6BFF
Shadow:        Glow Blue
```

Floating card (glassmorphism):
```
Background:    rgba(255,255,255,0.72)
Backdrop:      blur(16px)
Border:        1px solid rgba(255,255,255,0.6)
Shadow:        Shadow LG
```

Triage cards:
```
RED card:    background #FEF2F2, border #FECACA, left-border 4px solid #EF4444
YELLOW card: background #FFFBEB, border #FDE68A, left-border 4px solid #F59E0B
GREEN card:  background #F0FDF4, border #BBF7D0, left-border 4px solid #10B981
```

### 2.11 3D Visual Elements

Several pages include decorative 3D-style visual elements. These are built with CSS and SVG — no external 3D library required:

**Floating blob shapes:**
- Organic SVG blob shapes with blue/teal gradient fill
- Applied opacity: 0.08–0.15
- Positioned absolutely as background decoration
- Animated with a slow floating keyframe (8–12s cycle)

**Floating card effect:**
- Cards with box-shadow and slight perspective transform
- On hover: translateY(-4px) + increased shadow
- Creates illusion of physical depth

**Medical icon illustrations:**
- SVG-based medical icons (cross, shield, stethoscope, location pin)
- Filled with gradient, slight drop-shadow
- Used in section headers and empty states

**Glassmorphism panels:**
- Overlapping semi-transparent white cards
- Creates depth and layering without true 3D

### 2.12 Badge & Tag System

```
Badge base: padding 4px 10px, border-radius 9999px, 11px font, 600 weight

RED badge:    background #FEE2E2, color #DC2626, text "EMERGENCY"
YELLOW badge: background #FEF3C7, color #D97706, text "VISIT CLINIC"
GREEN badge:  background #D1FAE5, color #059669, text "SELF CARE"
ACTIVE badge: background #DBEAFE, color #1D4ED8
INACTIVE:     background #F3F4F6, color #6B7280
```

### 2.13 Loading & Skeleton States

Every data-fetching component must show:
- Skeleton shimmer animation (light gray to slightly lighter gray, 1.5s loop)
- Skeleton shapes match the real content layout
- No spinners alone — always skeleton + optional spinner for CTAs

Shimmer animation:
```
background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)
background-size: 200% 100%
animation: shimmer 1.5s infinite
```

---

## 3. Global Layout & Navigation

### 3.1 App Shell

The app has no persistent top navigation bar for mobile users (patient and ASHA). Navigation is done through back buttons and role-specific dashboards.

Admin role gets a persistent left sidebar on desktop (≥1024px) and a bottom tab bar on mobile.

### 3.2 Mobile-First Approach

All pages are designed mobile-first:
- Max content width: 480px, centered on larger screens
- Full-width on mobile (0 horizontal margin, 16px padding)
- Admin dashboard expands to full desktop layout at ≥1024px

### 3.3 Safe Areas

Respect iOS/Android safe areas:
- Top: env(safe-area-inset-top)
- Bottom: env(safe-area-inset-bottom) + 16px

### 3.4 Page Transition Animation

Between pages, use:
- Fade + slight upward slide: opacity 0→1, translateY 16px→0
- Duration: 300ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Implement via CSS class toggling or Framer Motion

### 3.5 Toast Notification System

Global toast for success/error feedback:
- Position: top-center, 16px from top
- Width: min(400px, 90vw)
- Border radius: 12px
- Padding: 14px 18px
- Auto-dismiss: 4 seconds
- Animation: slide down from top, fade out

Toast variants:
```
Success: background #F0FDF4, border #10B981, icon ✓ green
Error:   background #FEF2F2, border #EF4444, icon ✗ red
Info:    background #EAF2FF, border #2F6BFF, icon ℹ blue
Warning: background #FFFBEB, border #F59E0B, icon ⚠ amber
```

---

## 4. Page 1 — Login

### 4.1 Overview

The Login page is the entry point for all three user roles. It uses the existing dark cinematic theme established in the provided code (dark glassmorphism with floating image tiles). This page intentionally differs from the rest of the app's light healthcare theme to create a dramatic first impression.

### 4.2 Visual Composition

**Background:**
- Dark radial gradient: `radial-gradient(ellipse at 50% 0%, #0d2a2e 0%, #080e12 55%, #06090b 100%)`
- FloatingTiles animation (10 image tiles, floating with sin/cos animation)
- Gradient overlay fading dark at bottom

**Layout:**
- Vertically centered with content pushed toward the bottom 40% of screen
- Hero text above the card
- Card at bottom center

### 4.3 Hero Section

**Logo badge (pill):**
- Icon: 🏥
- Text: "MARGDARSHAK — मार्गदर्शक"
- Style: cyan outline pill, rgba(34,211,238,0.05) background
- Position: centered above headline

**Headline:**
- "Your Health " (white) + "Guide" (cyan gradient text)
- Font: 3.5rem clamp, 800 weight

**Subtext:**
- Dynamic: changes based on selected role
- Default: "Select your role to continue"
- When role selected: "Sign in as [Role Name]"
- Style: monospace, 13px, rgba(255,255,255,0.38)

### 4.4 Role Selection Screen (default state)

Shown when no role is selected yet.

**Section label:**
- "Who are you? / आप कौन हैं?"
- 11px, uppercase, monospace, rgba(255,255,255,0.25)
- Centered, marginBottom 20px

**Three Role Cards (stacked vertically, gap 12px):**

Each card contains:
- Left: Icon circle (44×44px, borderRadius 12px, cyan tint background)
  - Icon: emoji (👤 / 👩‍⚕️ / 👨‍💼), 20px
- Center: Text group
  - Title: 14px, 600 weight, white (→ cyan on hover)
  - Subtitle: 12px, rgba(255,255,255,0.25), regional language
  - Description: 12px, monospace, rgba(255,255,255,0.3)
- Right: Arrow → (15px, transitions right 3px on hover)

Card default state:
```
background: rgba(255,255,255,0.02)
border: 1px solid rgba(255,255,255,0.07)
borderRadius: 14px
padding: 16px 18px
```

Card hover state:
```
background: rgba(34,211,238,0.06)
border: 1px solid rgba(34,211,238,0.3)
```

**Guest Access Text (below cards):**
- "Patient? CONTINUE WITHOUT LOGIN →"
- "Patient?" in rgba(255,255,255,0.18)
- Link in rgba(34,211,238,0.45), monospace, underlined
- onClick: stores guest session, navigates to /user/language

### 4.5 Login Form Screen (role selected state)

**Back button:**
- Top-left, "← BACK"
- 12px monospace, rgba(255,255,255,0.3)
- Hover: rgba(255,255,255,0.6)

**Role badge:**
- Centered, pill shape
- Shows role icon + role title in uppercase
- Same cyan pill style as logo badge

**Error banner:**
- Background rgba(239,68,68,0.08), border rgba(239,68,68,0.25)
- Text: rgba(252,165,165,0.9), 13px
- Prefix: ⚠ symbol
- Appears above form when error exists

**Form fields — by role:**

USER role:
1. Phone Number field
   - Label: "PHONE NUMBER"
   - Prefix: "+91" fixed inside field (left-aligned, slightly muted)
   - Placeholder: "XXXXXXXXXX"
   - Type: tel, maxLength 10

2. Password field
   - Label: "PASSWORD"
   - Type: password with SHOW/HIDE toggle
   - Toggle: right-aligned inside field, monospace 11px

ASHA role:
1. ASHA ID field
   - Label: "ASHA ID"
   - Placeholder: "e.g. ASHA-BED-001"
   - Type: text

2. Phone Number field (same as user)

3. Password field (same as user)

ADMIN role:
1. District Code field
   - Label: "DISTRICT CODE"
   - Placeholder: "e.g. MH-BED-01"
   - Type: text

2. Phone Number field (same as user)

3. Password field (same as user)

**Submit Button:**
- Full width
- Label: "Sign In as [Role Title]"
- Loading state: spinner + "Verifying..."
- Cyan glass gradient style (matching existing code)

**Guest OR divider (user role only):**
- Appears below submit button
- "OR" divider with horizontal lines
- "Continue without login →" ghost button below

**Demo Credentials hint:**
- Small section below form
- Dark glass card, 10px monospace, rgba(255,255,255,0.2)
- Shows demo credentials for selected role

### 4.6 Validation Rules

| Field | Rule |
|---|---|
| Phone | Required, exactly 10 digits, numeric only |
| Password | Required, minimum 6 characters |
| ASHA ID | Required when role = asha, format ASHA-XXX-000 |
| District Code | Required when role = admin, format XX-XXX-00 |

### 4.7 Post-Login Navigation

```
role = "user"  → /user/language
role = "asha"  → /asha/dashboard
role = "admin" → /admin/dashboard
guest          → /user/language (no token stored)
```

Store in localStorage:
- `token`: JWT from API
- `user`: JSON object with id, name, role, language, district, block, asha_id, district_code

---

## 5. Page 2 — Language Selection (User)

### 5.1 Overview

First screen in the patient flow. Shown immediately after login or guest entry. Sets the language for the entire session. All subsequent screens will use the selected language via Google Translate API.

### 5.2 Visual Composition

**Background:** Light (#F8FAFF) with a subtle blue radial blob top-right (opacity 0.08)

**Layout:** Single column, vertically centered, max-width 480px

**Floating 3D decorative element:** 
- Top-right corner: abstract medical cross SVG with blue gradient, slight drop-shadow
- Slight floating animation (translateY -6px to 6px, 4s infinite ease-in-out)

### 5.3 Header Section

**App logo row:**
- Small 🏥 icon + "Margdarshak" in #2F6BFF, 16px, 600 weight
- Centered at top

**Progress indicator:**
- Horizontal pill progress bar
- Step 1 of 5 (language → patient info → symptoms → questions → result)
- Active segment: #2F6BFF filled
- Inactive: #E5E7EB
- Width: 160px, height: 4px, borderRadius: 9999px
- Shows step number below: "Step 1 of 5" in 11px muted

**Page title:**
- English: "Choose Your Language" — H1, #0B1F3A, 700 weight
- Hindi: "अपनी भाषा चुनें" — H2, #6B7280, 600 weight, marginTop 6px

**Subtitle:**
- "We'll communicate with you in your preferred language"
- 14px, #6B7280, centered, max-width 320px

### 5.4 Language Selection Cards

Five cards in a 2-column grid (with English spanning full width at bottom or top):

**Layout:** 2 columns, gap 12px, then English full-width at bottom

**Each card contains:**
- Language name in that language (large, 20px, 700 weight, #0B1F3A)
- Language name in English below (13px, #6B7280)
- Region tag: small pill showing region (e.g. "Maharashtra" for Marathi)

Card specifications:
```
background: #FFFFFF
border: 1.5px solid #E5E7EB
borderRadius: 16px
padding: 24px 20px
textAlign: center
cursor: pointer
transition: all 0.2s ease
```

Hover state:
```
border-color: #2F6BFF
background: #EAF2FF
shadow: Glow Blue
transform: translateY(-2px)
```

Selected state:
```
border-color: #2F6BFF
background: linear-gradient(135deg, rgba(47,107,255,0.08), rgba(110,168,255,0.04))
shadow: Glow Blue
checkmark icon: top-right corner, 20px circle, #2F6BFF background, white ✓
```

**Five languages:**
1. हिंदी / Hindi — "North India"
2. मराठी / Marathi — "Maharashtra"
3. ગુજરાતી / Gujarati — "Gujarat"
4. தமிழ் / Tamil — "Tamil Nadu"
5. English / English — "All Regions" (full width card)

### 5.5 Continue Button

- Appears only after a language is selected
- Animates in: fade + scale from 0.95 to 1
- Primary button style, full width
- Label: "Continue →" (in selected language + English)
- Disabled until selection made

### 5.6 Bottom Note

- Small text: "You can change language anytime"
- 11px, #9CA3AF, centered

---

## 6. Page 3 — Patient Info (User)

### 6.1 Overview

Collects who the patient is, their age, gender, and location. All labels shown in selected language via API translation.

### 6.2 Visual Composition

Same background as Language Select. Progress bar advances to Step 2 of 5.

### 6.3 Header Section

**Back button:** top-left, arrow icon + "Back" in selected language, #6B7280

**Progress bar:** Step 2 of 5

**Page title:**
- "Who needs help?" (translated)
- "यह किसके लिए है?" below

**Subtitle:** "Help us personalize your assessment" (translated)

### 6.4 Patient Type Selector

Label: "This assessment is for:" (translated)

Four option cards in 2×2 grid:

| Card | Icon | English | Translated |
|---|---|---|---|
| Self | 👤 | Myself | मेरे लिए |
| Child | 👶 | My Child (under 12) | मेरे बच्चे के लिए |
| Elderly | 👴 | Elderly Family Member | बुज़ुर्ग के लिए |
| Other | 👥 | Someone Else | किसी और के लिए |

Card selected style: highlighted card style from design system

### 6.5 Age Input

- Shows only after patient type selected
- Label: "Age" (translated) + "उम्र"
- Input type: number
- Placeholder: "Enter age in years"
- Validation: 0–120, required
- For child type: auto-shows "(years)" helper text

### 6.6 Gender Selector

Three pill buttons in a row:
- Male / पुरुष
- Female / महिला
- Other / अन्य

Default: none selected  
Selected: Primary blue fill, white text  
Unselected: white background, gray border

### 6.7 Location Section

Label: "Where are you located?" (translated)

Three cascading dropdowns:
1. District (loads all districts in DB)
2. Block (loads based on selected district)
3. Village (text input, optional)

Each dropdown:
- Standard input style
- Dropdown arrow icon (right side)
- Loading skeleton while fetching options
- "Select District first" placeholder for Block when district not chosen

**OR GPS option:**
- Below dropdowns: "OR Use my current location 📍" link
- Taps to request GPS, auto-fills district/block from coordinates
- Shows "Detecting location..." spinner while active

### 6.8 Continue Button

Full width, primary style. Disabled until patient type + age + gender + district are filled.

---

## 7. Page 4 — Symptom Input (User)

### 7.1 Overview

The core input screen. User describes their symptoms via voice or text. Backend extracts symptoms and returns confirmation.

### 7.2 Visual Composition

Progress bar: Step 3 of 5

**Decorative element:**
- Large subtle waveform SVG in background (very low opacity 0.04)
- Represents voice/sound, reinforces the voice input feature

### 7.3 Page Title

- "What's the problem?" (translated)
- "क्या तकलीफ है?" below
- Subtitle: "Speak or type in your language — we understand" (translated)

### 7.4 Voice Input Section

**Microphone button (primary CTA):**
- Large circular button, 80px diameter
- Center of screen
- Background: Primary Gradient
- Icon: microphone SVG, white, 32px
- Shadow: 0 8px 32px rgba(47,107,255,0.4)
- Label below: "Tap and speak" (translated)
- Sub-label: "बोलकर बताएं" in smaller text

**Recording state:**
- Background changes to Emergency Gradient (red pulsing)
- Animated: ring pulse expanding outward (2 rings, 1s animation)
- Label changes to: "Listening... Tap to stop" (translated)
- Duration counter: "0:03" updating in real time

**Processing state (after recording stops):**
- Spinner inside button
- Label: "Understanding your words..." (translated)

**Web Speech API language mapping:**
```
hi → hi-IN
mr → mr-IN
gu → gu-IN
ta → ta-IN
en → en-IN
```

### 7.5 OR Divider

Horizontal divider with "OR / या" in center
Same style as login page divider

### 7.6 Text Input Section

- Large textarea (4 rows minimum)
- Placeholder (in selected language): "Type your symptoms here..."
- Auto-resizes as user types
- Character count below: "0 / 500"
- Language hint: "You can write in [selected language]"

### 7.7 Symptom Confirmation Card

Appears after backend processes input (voice or text):

**Card style:** Success-tinted (light green border) with a ✓ icon

**Content:**
- "I understood your symptoms as:" (translated)
- List of detected symptoms as blue pills/tags
  - Each pill: symptom name in English + translated name below
  - Example: "Fever / बुखार" — #EAF2FF background, #2F6BFF border
- "Is this correct?" (translated) below the list

**Two action buttons:**
- "Yes, Continue ✓" → primary button → goes to follow-up questions
- "Edit / Add more ✏" → ghost button → clears and re-shows input

### 7.8 Quick Symptom Chips (optional helper)

Below the OR divider, before text input:
- Label: "Common symptoms — tap to add:" (translated)
- Horizontal scrollable row of chips:
  - Fever / बुखार
  - Headache / सिरदर्द
  - Cough / खांसी
  - Stomach Pain / पेट दर्द
  - Vomiting / उल्टी
  - Weakness / कमज़ोरी
  - Chest Pain / सीने में दर्द
  - Breathlessness / साँस की तकलीफ
- Tap chip → adds to text input
- Selected chip: filled blue

---

## 8. Page 5 — Follow-Up Questions (User)

### 8.1 Overview

After symptom extraction, backend returns up to 4 targeted follow-up questions. These are displayed one at a time (conversational style) or all at once (list style). Use list style for hackathon speed.

### 8.2 Visual Composition

Progress bar: Step 4 of 5

**Decorative element:** Small doctor/stethoscope icon illustration top-right

### 8.3 Page Header

- "A few more questions" (translated)
- "कुछ और सवाल" below
- Subtitle: "This helps us give you accurate advice" (translated)

### 8.4 Question Cards

Each question in its own white card (16px border-radius, Shadow SM):

**Question text:**
- 16px, 600 weight, #0B1F3A
- Both English and translated version shown

**Answer input types:**

Boolean (Yes/No):
- Two large pill buttons side by side
- "Yes ✓" and "No ✗"
- Selected: primary blue fill
- Full width, 52px height

Options (multiple choice):
- Vertical stack of option pills
- Each: 52px height, full width
- Left: radio circle indicator
- Text: 15px, #0B1F3A
- Selected: highlighted card style

**Question numbering:**
- Small "Q1 / 4" badge top-right of each card
- #6B7280, 11px, monospace

### 8.5 Progress Feedback

- Below all questions: "X of 4 answered" in 13px muted text
- Continue button enables only when all questions answered

### 8.6 Submit Button

- "Get My Assessment →" (translated)
- Primary button, full width
- Loading state: "Analyzing your symptoms..." + spinner
- This triggers the /triage/assess API call

---

## 9. Page 6 — Triage Result (User)

### 9.1 Overview

The most important screen. Shows RED, YELLOW, or GREEN result with clear action steps, nearest facility, and supporting information. Must be immediately understandable at a glance.

### 9.2 Visual Composition

**Full-page result header (top 35% of screen):**
- Colored background matching triage level:
  - RED: Emergency Gradient (#EF4444 → #FF6B6B)
  - YELLOW: Warning Gradient (#F59E0B → #FCD34D), text #78350F
  - GREEN: Success Gradient (#10B981 → #34D399)
- White text throughout

**Content scrolls below the colored header**

### 9.3 Header Section (Colored Zone)

**Icon:**
- RED: 🚨 emoji, 56px, animated pulse (scale 1→1.1→1, 1s infinite)
- YELLOW: ⚠️ emoji, 56px, static
- GREEN: ✅ emoji, 56px, static

**Primary message (large, white):**
- RED: "THIS IS AN EMERGENCY" (translated, all caps, 24px, 800 weight)
- YELLOW: "Visit a Doctor" (translated, 22px, 700 weight)
- GREEN: "You Can Manage at Home" (translated, 22px, 700 weight)

**Secondary message (smaller, white opacity 0.85):**
- RED: "Call 108 immediately. Do not wait."
- YELLOW: "Within 24 hours"
- GREEN: "Rest and follow the steps below"

All text also shown in selected language below (smaller, opacity 0.8)

### 9.4 Primary Action Button (RED only)

**Call 108 Button:**
- Full width, white background, red text
- 18px, 700 weight
- Phone icon left
- "📞 CALL 108 NOW" — all caps
- Href: tel:108
- Shadow: 0 4px 20px rgba(0,0,0,0.2)
- Animated: subtle pulse (box-shadow pulses)
- 64px height
- Positioned immediately below header in white card

### 9.5 Nearest Facility Card

White card with left accent border (color matches triage level):

**Header row:**
- 🏥 icon + "Nearest Facility" (translated) label
- Right: distance badge ("4.2 km away") in blue pill

**Facility details:**
- Name: 18px, 700 weight, #0B1F3A
- Type: CHC / PHC / District Hospital — 13px, #6B7280
- Hours: ⏰ icon + hours text
- 24hr indicator: 🟢 "Open 24 hours" if applicable

**Map embed:**
- Google Maps iframe, 180px height
- Border radius 12px
- Overflow hidden
- Shows pin at facility location

**Action buttons row (two buttons):**
- "📞 Call" — secondary button, left half
- "🗺️ Directions" — secondary button, right half
- Directions: opens `https://maps.google.com/?q=lat,lng` in new tab

### 9.6 Self-Care Instructions Card (YELLOW & GREEN)

White card:

**Header:** "🏠 Do This at Home" (translated)

**Instructions list:**
- Numbered list (1, 2, 3...)
- Each item: 15px, #374151, line-height 1.6
- Small green checkmark circle prefix
- Both English and translated version for each item

### 9.7 Warning Signs Card (all levels)

Orange-tinted card:

**Header:** "⚠️ Go to Emergency If:" (translated)

**Signs list:**
- Bullet list with orange dot markers
- Each sign: 14px, #92400E
- Both languages shown

### 9.8 Share Button

- "📲 Share on WhatsApp" (translated)
- Full width, WhatsApp green (#25D366) background, white text
- Opens `https://wa.me/?text=` with formatted result text

### 9.9 Reassess Button

- "🔄 Check Again" (translated)
- Ghost button, full width
- Navigates back to /user/language

### 9.10 Follow-Up Notice (YELLOW & GREEN)

Small info card at bottom:
- Icon: 🔔
- Text: "We'll check on you in 48 hours" (translated)
- 13px, #6B7280, centered

---

## 10. Page 7 — Feedback Loop (User)

### 10.1 Overview

Shown 48 hours after a YELLOW or GREEN assessment. Checks outcome. If worse, routes back to symptom checker. This page appears when user re-opens the app and a pending follow-up exists.

### 10.2 Trigger Logic

On app load (/user/language entry), check localStorage for pending follow-up:
```
stored: { assessmentId, followUpDue, triageLevel }
if (followUpDue < now && !feedbackSubmitted) → show FeedbackLoop page first
```

### 10.3 Visual Composition

Background: Light with blue blob accent

**Header illustration:**
- Doctor with clipboard SVG illustration (simple, 2-color)
- Centered, 120px × 120px

### 10.4 Greeting

"Hello! 👋" (translated)
"Two days ago you checked your symptoms." (translated)
"How are you feeling now?" (translated)

Show the previous assessment summary:
- Triage badge (YELLOW/GREEN)
- Main symptom from previous check
- Date of assessment

### 10.5 Outcome Selection

Three large option cards (tap to select):

**Better 😊**
- Green tint
- "Feeling better, thank you"

**Same 😐**
- Yellow tint
- "About the same"

**Worse 😟**
- Red tint
- "Feeling worse"

### 10.6 Visit Question

Shown after outcome selected (except "Worse"):

"Did you visit a doctor or clinic?" (translated)

Two pill buttons: "Yes ✓" / "No ✗"

If Yes: text input appears:
- "What did the doctor say?" (optional, placeholder)

### 10.7 Submit

- Primary button: "Submit Feedback" (translated)
- Calls POST /feedback/:assessmentId

**If outcome = "Worse":**
- After selection, show alert card:
  - Red tint
  - "We're sorry to hear that. Let's check your symptoms again."
  - Button: "Reassess Now →"
  - Navigates to /user/symptom-input

### 10.8 Thank You State

After successful submit:
- Animated checkmark (SVG draw animation, 0.8s)
- "Thank you for letting us know!" (translated)
- "Your feedback helps us improve." (translated)
- "Stay healthy! 💚" (translated)
- Button: "Done" → navigate to /user/language

---

## 11. Page 8 — ASHA Dashboard

### 11.1 Overview

Home screen for ASHA workers after login. Personal hub showing today's activity, pending follow-ups, and navigation to key actions.

### 11.2 Visual Composition

**Background:** White with very subtle blue gradient at top (hero zone)

**Top bar (sticky):**
- Left: 🏥 Margdarshak logo (small)
- Center: "Namaste, [ASHA Name] 👋" — 16px, 600 weight
- Right: Profile avatar circle (initials, #2F6BFF background)

**Hero section (top zone, gradient background):**
- Gradient: linear-gradient(135deg, #0B1F3A, #2F6BFF)
- Height: ~200px
- Shows greeting + today's date + location (block, district)

### 11.3 Today's Stats Row

Four stat cards in 2×2 grid (inside the hero zone, white glassmorphism cards):

**Total Assessed:**
- Large number (primary color)
- "Today" label below
- Icon: clipboard

**🔴 Emergencies:**
- Number in red
- "Referred to 108" label
- Pulsing red dot if > 0

**🟡 Clinic Visits:**
- Number in amber
- "PHC Referrals" label

**🟢 Self Care:**
- Number in green
- "Home Managed" label

Card style: glassmorphism (white/70, blur 12px), borderRadius 16px, padding 16px

### 11.4 Active Outbreak Alert Banner

Shown only if an active outbreak exists in ASHA's block:
- Full-width warning banner
- Background: #FEF3C7, border-left 4px solid #F59E0B
- Icon: 🚨
- Text: "Outbreak Alert in [Block Name] — [Symptom Cluster]"
- "View Details →" link right side
- Not dismissible — stays until admin resolves

### 11.5 Pending Follow-Ups Section

**Section header:** "Follow-Ups Due 🔔" + count badge

If no pending: Empty state with calendar illustration + "No follow-ups today"

If pending: List of compact patient cards (max 3 shown, "View All →" link):

Each card:
- Patient name + age/gender
- Symptom from previous assessment
- Triage badge (RED/YELLOW/GREEN)
- "Due: Today" or "Due: 2 hours" urgency text
- "Follow Up →" button (ghost, right-aligned)

### 11.6 Main Action Buttons

Two large primary action cards (full width):

**Assess New Patient:**
- Background: Primary Gradient
- Icon: ➕ plus circle (white, 28px)
- Title: "Assess New Patient" + "नया मरीज़ जाँचें"
- Subtitle: "Start a new symptom check"
- Right arrow icon
- onClick: navigate to /asha/assess

**My Patient List:**
- Background: White, border #E5E7EB
- Icon: 📋 clipboard (blue, 28px)
- Title: "My Patients" + "मेरे मरीज़"
- Subtitle: "[count] patients in your care"
- Right arrow icon
- onClick: navigate to /asha/patients

### 11.7 Quick Stats Section

Below main actions:

**This Month summary strip:**
- Horizontal scrollable pills
- Total: [N] assessed
- Referred to emergency: [N]
- OPD visits deflected: ~[N]
- "View Full Report →" link at end

### 11.8 Bottom Navigation (ASHA only)

Sticky bottom nav bar:
- 4 tabs: Home | Patients | Assess | Report
- Active tab: primary blue icon + label
- Inactive: gray icon + label
- Height: 64px + safe area bottom

---

## 12. Page 9 — Assess Patient (ASHA)

### 12.1 Overview

ASHA worker's symptom assessment flow. Identical logic to patient user flow but ASHA enters patient details first and the assessment is saved under her account.

### 12.2 Visual Composition

**Top bar:**
- Back arrow + "Assess Patient" title
- Progress indicator: 4 steps (Patient Info → Symptoms → Questions → Result)

### 12.3 Step 1 — Patient Details Form

**Section title:** "Patient Information" + "मरीज़ की जानकारी"

Fields:
1. Patient Name (text, required)
   - Label: "Patient Name / मरीज़ का नाम"
   - Placeholder: "Full name"

2. Age (number, required)
   - Label: "Age / उम्र"
   - Placeholder: "In years"

3. Gender (pill selector: Male / Female / Other)

4. Village (text, optional)
   - Pre-fills with ASHA's own village

5. Contact Phone (tel, optional)
   - Label: "Patient's Phone (for follow-up)"
   - Helper: "For 48hr follow-up reminder"

**"Start Assessment →" button at bottom**

### 12.4 Step 2 — Symptom Input

Identical to User Page 4 (Symptom Input) with one addition:

**Language selector row at top:**
- "Patient's language:" label
- 5 small language pill buttons
- Defaults to ASHA's own language setting
- ASHA can switch if patient speaks different language

### 12.5 Step 3 — Follow-Up Questions

Identical to User Page 5 (Follow-Up Questions)

### 12.6 Step 4 — Result Screen

Same as User Triage Result with additions:

**Top of result: Patient info bar:**
- "[Patient Name], [Age], [Gender]"
- White pill bar at very top of colored header

**Action buttons section:**
Additional buttons below standard result:

RED result:
- "📞 Call 108 Now" (primary, large)
- "📞 Call Patient" (if phone stored) (secondary)
- "💾 Save to My List" (secondary)

YELLOW result:
- "📞 Call PHC" (primary)
- "💾 Save to My List" (secondary)
- "📱 Share with Patient on WhatsApp" (ghost)

GREEN result:
- "💾 Save to My List" (primary)
- "📱 Share Self-Care with Patient" (ghost)

**After tapping Save:**
- Toast: "Patient saved to your list ✓"
- Navigate back to ASHA Dashboard

---

## 13. Page 10 — Patient List (ASHA)

### 13.1 Overview

ASHA's complete patient registry. All patients ever assessed by this ASHA worker. Sorted by urgency and follow-up due date.

### 13.2 Visual Composition

**Top bar:** Back arrow + "My Patients" + "मेरे मरीज़" + count badge

**Search bar:**
- Sticky below top bar
- Placeholder: "Search by name or symptom..."
- Magnifying glass icon left

**Filter tabs:**
- Horizontal scrollable tab row: All | Follow-Up Due | RED | YELLOW | GREEN
- Active tab: #2F6BFF underline + text
- Count badges on each tab

### 13.3 Patient Cards

Each patient in a card:

**Card layout:**
- Left: Colored status dot (6px circle) or triage badge pill
- Center-top: Patient name (16px, 600) + age/gender (13px, muted)
- Center-mid: Primary symptom tag (blue pill)
- Center-bottom: "Assessed [date]" (12px, muted)
- Right: Follow-up status:
  - "Follow Up Due" (amber pill) if due
  - "Completed ✓" (green pill) if done
  - "2 days left" (gray pill) if upcoming

**Tap card:** Expands to show:
- Full symptom list
- Triage result details
- Recommended action
- Follow-up history
- "Do Follow Up →" button if due

**Swipe left (mobile gesture):**
- Shows: "Follow Up" (blue) + "Call" (green) + "Delete" (red) action buttons

### 13.4 Empty State

Illustration: clipboard with empty lines + magnifying glass
Text: "No patients yet. Tap + to assess your first patient."
Button: "Assess New Patient →" (primary)

---

## 14. Page 11 — Follow Up (ASHA)

### 14.1 Overview

ASHA follows up on a specific patient. Logs outcome. Identical in logic to User Feedback Loop but ASHA-specific.

### 14.2 Visual Composition

**Top bar:** Back + "Follow Up: [Patient Name]"

**Patient summary card at top:**
- Name, age, gender
- Previous triage level (badge)
- Previous symptoms
- Assessment date
- "Assessed [N] days ago"

### 14.3 Outcome Question

"How is [Patient Name] feeling today?" (in ASHA's language)

Three large tap cards (same as User Feedback Loop):
- Better 😊
- Same 😐
- Worse 😟

### 14.4 Visit Question

"Did [patient name] visit the facility?"

YES / NO pill buttons

If YES: Dropdown "Which facility?" + "What did doctor say?" text area

### 14.5 Triage Accuracy (hidden auto-calculation)

Backend: If triage was RED and patient is "better" without visiting → flag as possible over-triage
If triage was GREEN and patient is "worse" → flag as possible under-triage

### 14.6 Submit

- "Save Follow-Up" button (primary, full width)
- Toast on success: "Follow-up saved ✓"

**If outcome = "Worse":**
Same escalation flow as user feedback loop — offers reassessment

---

## 15. Page 12 — Monthly Report (ASHA)

### 15.1 Overview

Auto-generated monthly performance report for each ASHA worker.

### 15.2 Visual Composition

**Top bar:** Back + "My Report" + "मेरी रिपोर्ट"

**Month selector:** Left/right arrow buttons + "March 2026" centered

**Report feels like a clean printed document — white background, professional layout**

### 15.3 Summary Hero Card

Gradient card (primary blue):
- "March 2026 — Gevrai Block"
- Large number: "47 Patients Assessed"
- "by Sunita Kamble"

### 15.4 Stat Grid

2×2 grid of white stat cards:

- Total Assessed: large number, clipboard icon
- Emergencies Referred: number, red badge
- OPD Visits Deflected: ~number (estimated), green badge
- Follow-Up Rate: percentage, progress circle

### 15.5 Top Symptoms This Month

**Section:** "Most Reported Symptoms"

Horizontal bar chart (CSS-only, no library):
- Each row: symptom name | bar (% width, blue gradient) | count
- Top 5 symptoms
- Bars animate in on page load (width 0→final, 0.6s, staggered)

### 15.6 Assessment Timeline

Simple line showing assessments per day:
- CSS-only dot-per-day grid
- Color coded by triage level
- Last 30 days shown

### 15.7 Share / Export Section

Two buttons:

**Share with PHC Doctor:**
- WhatsApp green button
- Shares summary text to WhatsApp

**Download Report:**
- Ghost button
- Generates simple PDF (using browser print CSS)

---

## 16. Page 13 — Admin Dashboard

### 16.1 Overview

Master overview for district health officers. Desktop-first layout with left sidebar. Mobile shows bottom tabs.

### 16.2 Layout (Desktop ≥1024px)

**Left Sidebar (240px wide, sticky):**
- Top: Logo + "Margdarshak"
- Below: Admin name + district name
- Navigation items (with icons):
  - 📊 Dashboard (home)
  - 🗺️ Symptom Heatmap
  - 🏥 PHC Monitor
  - 👩‍⚕️ ASHA Tracker
  - 🚨 Outbreak Alerts
  - 📄 Reports
- Bottom: Logout button

Active nav item: Left border 3px #2F6BFF, background #EAF2FF, text #2F6BFF

**Main content area:** 
- Padding: 32px
- Max-width: 1200px

### 16.3 Layout (Mobile <1024px)

**Top bar:** Logo + "Beed District" + notification bell

**Bottom tab bar:** Dashboard | Heatmap | Alerts | Reports

### 16.4 Top Stats Row (4 cards)

Horizontal row of 4 stat cards:

**Total Assessments Today:**
- Large number
- "▲ 12% vs yesterday" trend indicator (green if up, red if down)
- Icon: activity chart

**🔴 Emergency Referrals:**
- Number in red
- Trend indicator
- If > 0: red pulsing dot

**🟡 Clinic Referrals:**
- Number in amber
- Trend indicator

**🟢 Self-Care Guided:**
- Number in green
- "OPD Deflected" subtitle
- Trend indicator

All cards: white, Shadow MD, 16px border-radius, 24px padding

### 16.5 Active Alerts Section

**Section header:** "🚨 Active Alerts" + count badge (red)

If no alerts: empty state — green shield icon + "No active alerts today"

If alerts: Card list (max 3 shown, "View All →"):

Each alert card:
- Red left border (4px)
- Background: #FEF2F2
- Header row: "🔴 OUTBREAK RISK — [Block Name]"
- Body: "[N] fever+rash reports in 48hrs — [N] villages"
- Footer: "First reported: [date]"
- Action buttons: "Investigate →" (primary small) + "Alert PHC" (secondary small) + "Dismiss" (ghost small)

### 16.6 Quick Stats Strip

Horizontal scrollable row of metric pills:
- "📊 847 total this week"
- "🏥 PHC Ashti overloaded"
- "👩‍⚕️ 3 ASHAs inactive"
- "✅ 76% follow-up rate"

Each pill: white card, shadow XS, icon + text

### 16.7 Mini Charts Row

Two side-by-side mini cards:

**Assessments This Week (bar chart):**
- 7 bars (Mon–Sun)
- Color: primary blue
- Height proportional to daily count
- Hover tooltip: date + count

**Triage Distribution (donut chart):**
- Three segments: RED / YELLOW / GREEN
- Center: total count
- Legend below

Charts built with CSS or minimal chart library (Recharts is acceptable)

---

## 17. Page 14 — Symptom Heatmap (Admin)

### 17.1 Overview

Shows which symptoms are concentrating in which blocks/villages. The admin's early-warning tool for outbreak detection.

### 17.2 Visual Composition

**Page header:** "Symptom Heatmap" + "लक्षण का नक्शा"

**Filter bar (sticky):**
- Date range: [Today] [This Week] [This Month] pill toggles
- Block filter: dropdown "All Blocks ▼"
- Symptom filter: dropdown "All Symptoms ▼"
- "Export CSV" button (right-aligned)

### 17.3 Heatmap Table

**Layout:** Table with Block names as rows, Symptom names as columns

Cell value: count of assessments with that symptom in that block

**Cell color coding:**
- 0: white
- 1–5: #EAF2FF (very light blue)
- 6–15: #BFDBFE (light blue)
- 16–30: #60A5FA (medium blue)
- 31+: #1D4ED8 (dark blue) → this block needs attention
- If outbreak threshold met (20+): #EF4444 (red) + "⚠" icon in cell

**Cell click:** Opens drill-down panel (slide from right):
- Block name + symptom
- Breakdown by village (table)
- List of last 5 assessments for this combination
- "View all assessments →" link

### 17.4 Block Summary Cards

Below the table: row of block cards sorted by total cases:

Each card:
- Block name
- Top symptom with count
- Color-coded urgency ring around the card edge

### 17.5 Trend Line

Below block cards:
- "District Symptom Trend — Last 7 Days"
- Line chart (Recharts): one line per top-3 symptom
- X-axis: days, Y-axis: case count
- Legend with color dots

---

## 18. Page 15 — PHC Monitor (Admin)

### 18.1 Overview

Real-time load monitoring for all PHCs and CHCs in the district. Admin can see which facilities are overloaded and take action.

### 18.2 Visual Composition

**Page header:** "PHC Load Monitor" + last updated timestamp + refresh button

### 18.3 Facility Status Table

**Columns:**
- Facility Name
- Type (PHC / CHC / District Hospital)
- Block
- Referrals Today
- Status indicator
- Action

**Status indicators:**
- 🟢 Normal (< 50 referrals): green pill
- 🟡 Moderate (50–100): amber pill
- 🔴 Overloaded (100+): red pill + "!" icon

**Row hover:** Highlights row, shows action buttons

**Row click:** Expands accordion below the row showing:
- Symptom breakdown (bar chart of top 5 symptoms being referred there)
- Peak time of day (mini hourly bar chart)
- ASHA workers sending to this PHC (list)
- "📞 Call Medical Officer" button

### 18.4 Overload Alert Section

If any PHC is overloaded:
- Yellow warning banner at top:
  "PHC Ashti is receiving 340% above average referrals today"
  "[Call PHC Ashti] [Redirect Referrals]"

### 18.5 Capacity Overview

Right sidebar card (desktop) or section (mobile):
- District total: "4 PHCs, 2 CHCs, 1 District Hospital"
- Average load: X referrals/day/PHC
- Busiest facility: [name]
- Quietest facility: [name]

---

## 19. Page 16 — ASHA Tracker (Admin)

### 19.1 Overview

Activity monitoring for all ASHA workers in the district. Admin can see who is active and who needs support.

### 19.2 Visual Composition

**Page header:** "ASHA Worker Activity" + "आशा कार्यकर्ता गतिविधि"

**Summary bar:**
- Total ASHAs: [N]
- Active this week: [N] (green)
- Inactive this week: [N] (amber)
- Average assessments/week: [N]

### 19.3 ASHA List Table

**Columns:**
- Name
- Block / Village
- Assessments (this week)
- Assessments (this month)
- Follow-up Rate (%)
- Last Active (date)
- Status

**Status badges:**
- 🟢 Active: assessed in last 3 days
- 🟡 Low Activity: 1–2 assessments this week
- 🔴 Inactive: no assessments this week

**Sort:** Clickable column headers, default sort by assessments (high→low)

**Search:** Search by name or block

**Row click:** ASHA detail panel (slide from right):
- Photo/avatar circle (initials)
- Name, ASHA ID, block, village, phone
- This month's stats (mini stat cards)
- Top 5 symptoms assessed
- Recent patients list (last 5)
- "📞 Call ASHA" button
- "Send Reminder" button (shows toast confirmation)

### 19.4 Recognition Section

Below table:

**Top Performers This Month:**
Three cards (gold/silver/bronze style):
- Rank: 🥇🥈🥉
- ASHA name + block
- Assessment count
- "Star Performer" badge for #1

---

## 20. Page 17 — Outbreak Alerts (Admin)

### 20.1 Overview

Active outbreak alert management. Admin views, acknowledges, takes action, and resolves alerts. Auto-triggered when 20+ cases of same symptom cluster appear in same block within 72 hours.

### 20.2 Visual Composition

**Page header:** "Outbreak Alerts" + "प्रकोप अलर्ट"

**Stats row:**
- Active: [N] (red badge)
- Investigating: [N] (amber badge)
- Resolved this month: [N] (green badge)
- False Positives: [N] (gray badge)

### 20.3 Alert Configuration

**Top-right card:**
- "Alert Threshold Settings"
- Input: trigger when [20] cases (editable)
- Input: from same block within [72] hours (editable)
- "Save Settings" button
- Note: "Current settings trigger [X] alerts/month on average"

### 20.4 Active Alerts List

Each alert card (prominent, full width):

**Card structure:**

Header row:
- Left: Severity badge (HIGH / MEDIUM / CRITICAL)
- Center: "GEVRAI BLOCK — FEVER + RASH"
- Right: "18 cases | 6 villages | Since 19 Mar"

Body:
- Symptom cluster pills: [fever 🔴] [rash 🟠]
- Case count with trend: "18 cases ↑ (+4 in last 6hrs)"
- Affected villages: "Gevrai, Pimpalgaon, Wadgaon, ..."
- Map thumbnail (small Google Maps embed showing affected area)

Actions checklist (tracks what has been done):
- ✅ PHC Gevrai notified (checked, with timestamp)
- ⬜ Rapid Response Team deployed (unchecked)
- ⬜ Lab samples ordered (unchecked)
- ⬜ CMO escalated (unchecked)

Action buttons row:
- "Deploy RRT" (primary)
- "Order Lab Tests" (secondary)
- "Escalate to CMO" (secondary)
- "Mark Resolved" (ghost, green text)

**Resolved alerts:** Collapsed section at bottom with "View Resolved (3) ▾"

### 20.5 Alert Detail Modal

Clicking an alert opens a full-screen modal (or page on mobile):

- Full case list with timestamps
- ASHA workers who reported cases
- Timeline chart (cases over 72hrs)
- All action history with timestamps
- Free-text admin notes field
- Status dropdown: ACTIVE / INVESTIGATING / RESOLVED / FALSE_POSITIVE

---

## 21. Page 18 — Reports (Admin)

### 21.1 Overview

Auto-generated reports for sharing with CMO and state health department. One-click PDF generation.

### 21.2 Visual Composition

**Page header:** "Reports & Export" + "रिपोर्ट"

### 21.3 Pre-Built Reports Section

**Section label:** "Auto-Generated Reports"

Grid of report cards (2 columns):

Each card:
- Icon (chart type illustration)
- Report name
- Description (one line)
- "Last generated: [date]"
- "📄 Download PDF" button (primary)
- "👁 Preview" button (ghost)

Reports available:
1. Weekly District Summary
   - Total assessments, triage distribution, top symptoms, facility load
2. Monthly CMO Report
   - Comprehensive monthly metrics for Chief Medical Officer
3. ASHA Performance Report
   - Ranking and activity metrics for all ASHA workers
4. PHC Load Analysis
   - Referral distribution and overload incidents
5. Outbreak History Log
   - All alerts with resolutions and outcomes

### 21.4 Custom Report Builder

**Section label:** "Custom Report"

Fields:
- Date Range: from/to date pickers
- Block filter: multi-select dropdown
- Symptom filter: multi-select dropdown
- Include sections: checkbox group

"Generate Report" primary button

Loading state: progress bar (0→100%) with "Compiling data..." text

### 21.5 Export Options

Below reports section:
- "Export All Data as CSV" — ghost button
- "Schedule Weekly Email Report" — ghost button (shows "coming soon" tooltip)

---

## 22. Reusable Components

### 22.1 VoiceInput.jsx

Props: `lang` (language code), `onResult` (callback with text), `disabled`

States: idle | recording | processing | error

Visual: Circular button that transforms across states
- Idle: microphone icon, primary gradient
- Recording: red pulsing animation, stop icon
- Processing: spinner, muted
- Error: warning icon, error tint

Uses Web Speech API internally. Language code mapped to BCP-47:
```
hi → hi-IN, mr → mr-IN, gu → gu-IN, ta → ta-IN, en → en-IN
```

### 22.2 TriageResultCard.jsx

Props: `level` (RED/YELLOW/GREEN), `reason`, `action`, `selfCare[]`, `warningSigns[]`

Full self-contained result display. Used in both User and ASHA flows.

### 22.3 FacilityCard.jsx

Props: `facility` (object from API), `triageLevel`, `showMap` (boolean)

Displays: name, type, distance, phone, hours, map embed, directions link

Map embed: `<iframe src="https://maps.google.com/maps?q={lat},{lng}&output=embed" />`

Directions URL: `https://maps.google.com/?q={lat},{lng}`

### 22.4 LanguageWrapper.jsx

HOC (Higher Order Component) that wraps pages in the patient flow.

Provides: auto-translation of all child text nodes via Translate API

In practice for hackathon: provides translation function `t(text)` via context that calls API lazily and caches results in sessionStorage.

### 22.5 ProtectedRoute.jsx

Props: `allowedRoles[]`

Checks localStorage for `user.role`

If role not in allowedRoles → redirect to /login

### 22.6 OutbreakBadge.jsx

Props: `count`, `block`

Compact red alert badge: "🚨 Outbreak Alert in [Block]"
Animated: slight pulse on background

### 22.7 SkeletonCard.jsx

Props: `lines` (number of skeleton lines), `height`

Renders shimmer skeleton. Used while API calls resolve.

### 22.8 ProgressBar.jsx

Props: `currentStep`, `totalSteps`

Used in patient flow. Horizontal segmented bar.

---

## 23. Context & State Management

### 23.1 AuthContext

```
Stores:
  user: { id, name, role, phone, language, village, block, district, 
          asha_id, district_code, guest }
  token: string
  isAuthenticated: boolean

Methods:
  login(userData, token): void
  logout(): void → clears localStorage, navigates to /login
  updateLanguage(lang): void
```

### 23.2 LanguageContext

```
Stores:
  selectedLanguage: string (hi / mr / gu / ta / en)
  setLanguage(lang): void
  translate(text): Promise<string> → calls Google Translate API
  translateBatch(texts[]): Promise<string[]>
  cache: Map<string, string> → sessionStorage backed translation cache
```

### 23.3 AssessmentContext (patient flow only)

```
Stores:
  patientType: string
  patientAge: number
  patientGender: string
  village: string
  block: string
  district: string
  rawSymptomText: string
  detectedSymptoms: string[]
  followUpAnswers: object
  triageResult: object
  assessmentId: string

Methods:
  reset(): clears all state → called after result shown
```

---

## 24. API Integration Layer

### 24.1 Base Configuration (utils/api.js)

```
Base URL: import.meta.env.VITE_API_URL (e.g. http://localhost:8000)
Default headers: Content-Type: application/json
Auth header: Authorization: Bearer [token from localStorage]
Timeout: 15 seconds
```

### 24.2 API Functions

All API calls are async functions exported from utils/api.js:

**Auth:**
- `loginUser({ phone, password, role, asha_id, district_code })`
- `getMe()`

**Triage:**
- `extractSymptoms({ text, language, age, gender, village, block, district })`
- `runAssessment({ symptoms, answers, age, gender, village, block, district, assessed_by, patient_name })`

**Facilities:**
- `getNearestFacility({ lat, lng, triage_level, district })`

**Feedback:**
- `submitFeedback(assessmentId, { visited_facility, doctor_diagnosis, outcome })`
- `getPendingFollowUp(userId)`

**Patients (ASHA):**
- `getPatientsByAsha(ashaId)`
- `getFollowUpsDue(ashaId)`

**Admin:**
- `getAdminSummary(district)`
- `getHeatmapData(district, dateRange, block)`
- `getPHCLoad(district)`
- `getAshaActivity(district)`
- `getOutbreakAlerts(district)`
- `updateOutbreakAlert(alertId, { status, actions_taken })`
- `getReportData(district, dateRange)`

### 24.3 Error Handling

All API calls wrapped in try/catch. Errors show toast notification. 401 errors trigger logout. Network errors show "Check your connection" message.

### 24.4 Translate API (utils/translate.js)

```
Function: translateText(text, targetLang)
  → POST to Google Translate API
  → Cache result in sessionStorage with key: "${text}__${targetLang}"
  → Return translated string

Function: detectLanguage(text)
  → POST to Google Translate detect endpoint
  → Return detected language code

Function: translateBatch(texts[], targetLang)
  → Single API call with array of texts
  → Returns array of translated strings
  → Cache all results
```

---

## 25. Routing Architecture

### 25.1 Route Map

```
/                        → redirect to /login
/login                   → Login.jsx (public)

/user/language           → LanguageSelect.jsx (public or user role)
/user/patient-info       → PatientInfo.jsx
/user/symptoms           → SymptomInput.jsx
/user/questions          → FollowUpQuestions.jsx
/user/result             → TriageResult.jsx
/user/feedback           → FeedbackLoop.jsx

/asha/dashboard          → AshaDashboard.jsx (asha role only)
/asha/assess             → AssessPatient.jsx
/asha/patients           → PatientList.jsx
/asha/follow-up/:id      → FollowUp.jsx
/asha/report             → MonthlyReport.jsx

/admin/dashboard         → AdminDashboard.jsx (admin role only)
/admin/heatmap           → SymptomHeatmap.jsx
/admin/phc               → PHCMonitor.jsx
/admin/asha-tracker      → AshaTracker.jsx
/admin/outbreaks         → OutbreakAlerts.jsx
/admin/reports           → Reports.jsx
```

### 25.2 Route Guards

- `/user/*` routes: accessible to all (guest session or user role)
- `/asha/*` routes: ProtectedRoute with allowedRoles=["asha"]
- `/admin/*` routes: ProtectedRoute with allowedRoles=["admin"]

### 25.3 State Passing Between Routes

Patient flow passes state via React Router `state` object:
```
navigate('/user/questions', { state: { symptoms, detectedSymptoms, language } })
navigate('/user/result', { state: { triageResult, facility, assessmentId, lang } })
```

ASHA assess flow uses AssessmentContext to persist across steps.

---

## 26. Accessibility & Performance

### 26.1 Accessibility Requirements

- All interactive elements: minimum 44px tap target
- Contrast ratio: minimum 4.5:1 for body text, 3:1 for large text
- All images: meaningful alt text or empty alt for decorative
- Form fields: proper label associations (htmlFor)
- Error messages: aria-live="polite" for dynamic errors
- Focus visible: custom focus ring (2px #2F6BFF outline, 2px offset)
- Color: never the only indicator of status (always pair with text/icon)

### 26.2 Performance Requirements

- First Contentful Paint: < 1.5s on 4G
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Images: lazy loading, WebP format preferred
- API calls: debounced where appropriate (search: 300ms)
- Translation results: cached in sessionStorage (never re-translated)
- Map iframe: lazy loaded (IntersectionObserver)

### 26.3 Offline Handling

- Service Worker: cache static assets
- Offline banner: "No connection — some features unavailable"
- Form data: save to localStorage if submit fails due to network
- Retry on reconnect: auto-retry failed API calls once connection restored

---

## 27. Responsive Behavior

### 27.1 Breakpoints

```
Mobile:  < 640px  (primary target)
Tablet:  640px – 1023px
Desktop: ≥ 1024px (admin dashboard expands here)
```

### 27.2 Mobile Adaptations

- Stacked layouts replace side-by-side
- Full-width buttons
- Bottom tab bar for ASHA (replaces sidebar nav)
- Smaller font sizes (H1: 1.75rem instead of 2.5rem)
- Reduced padding (16px instead of 32px)

### 27.3 Admin Desktop Layout

At ≥1024px, Admin pages get:
- Fixed left sidebar (240px)
- Main content area (remaining width)
- Stats grid becomes 4-column row
- Table columns all visible (no horizontal scroll)
- Side panels slide in from right (instead of bottom sheets)

---

## 28. Animation & Motion System

### 28.1 Page Entry Animation

Every page: fade in + translateY(16px → 0)
Duration: 300ms, easing: cubic-bezier(0.16, 1, 0.3, 1)
Elements stagger: 60ms delay between each section

### 28.2 Component Animations

**Triage result reveal:**
- Header slides down from top: 400ms
- Result card slides up from bottom: 400ms, 100ms delay
- Facility card fades in: 300ms, 200ms delay
- Self-care items stagger in: 150ms each

**Microphone button:**
- Recording rings: scale 1→1.5, opacity 1→0, 1s infinite, 0.3s stagger between rings

**Emergency Call button:**
- Box-shadow pulse: 0 0 0 0 rgba(239,68,68,0.4) → 0 0 0 12px transparent
- 1.5s infinite

**Role cards (login):**
- Initial: translateY(20px), opacity 0
- On mount: stagger in (100ms between each card)

**Stats numbers (admin):**
- Count up animation from 0 to final value
- Duration: 800ms, easing: easeOut

**Skeleton shimmer:**
- Background position: 200% → -200%
- Duration: 1.5s, infinite

### 28.3 Micro-Interactions

- Button hover: translateY(-2px), 150ms
- Card hover: translateY(-4px), shadow increase, 200ms
- Input focus: border color transition, shadow appear, 200ms
- Tab switch: sliding indicator, 300ms cubic-bezier
- Toast appearance: translateY(-100% → 0), 300ms
- Toast dismiss: opacity 1→0, 200ms

### 28.4 Floating Background Animations

Page background blobs:
```
@keyframes float-blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(20px, -20px) scale(1.05); }
  66%       { transform: translate(-10px, 10px) scale(0.97); }
}
Duration: 12s, infinite, ease-in-out
```

Decorative medical icons:
```
@keyframes float-icon {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
Duration: 4s, infinite, ease-in-out
```

---

*End of Margdarshak Frontend PRD v1.0*  
*This document covers all 18 pages, the complete design system, all reusable components, routing, state management, API integration, accessibility, performance, responsive behavior, and animation system required to build the complete Margdarshak frontend.*

Design a minimal, modern chatbot interface for a web application.

Requirements:
- Clean, aesthetic UI with lots of whitespace
- Neutral color palette (white, soft gray, black, subtle accent color)
- Smooth rounded corners, subtle shadows (not heavy)
- Professional and human-designed feel (avoid AI-generated look)
- Layout should feel like a real SaaS product, not a template
- Chat bubbles should be simple and elegant (like WhatsApp or iMessage but more minimal)
- Include:
  - Chat area
  - Input box with send button
  - Typing indicator
  - Timestamp styling
- Font: modern sans-serif (like Inter or SF Pro)
- Subtle micro-interactions (hover, focus states)

Important:
Avoid flashy gradients, avoid overly futuristic or neon UI, avoid clutter.
Make it feel like a real product used daily.

Make the design feel handcrafted and realistic, like designed by a professional UI/UX designer.

Avoid:
- Overuse of gradients
- Random color combinations
- Perfect symmetry everywhere
- Overly generic components

Add:
- Slight imperfections in spacing
- Natural alignment
- Realistic padding/margin choices
- Subtle hierarchy in typography


Create a chatbot UI that looks like a real customer support chat.

Features:
- Left aligned bot messages, right aligned user messages
- Minimal message bubbles (no bright colors)
- Soft background contrast between chat area and page
- Sticky input bar at bottom
- Placeholder text: "Type your message..."
- Send button icon (simple, minimal)
- Scrollable chat with smooth behavior
- Optional avatar circles (very subtle)

Make it feel like:
- Notion AI
- ChatGPT
- Slack minimal theme