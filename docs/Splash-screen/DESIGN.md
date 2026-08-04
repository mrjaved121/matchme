---
name: Warm Humanist
colors:
  surface: '#fcf8ff'
  surface-dim: '#dad7f3'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecff'
  surface-container-high: '#e8e5ff'
  surface-container-highest: '#e2e0fc'
  on-surface: '#1a1a2e'
  on-surface-variant: '#5a4040'
  inverse-surface: '#2f2e43'
  inverse-on-surface: '#f2efff'
  outline: '#8e706f'
  outline-variant: '#e2bebd'
  surface-tint: '#b62135'
  primary: '#b62135'
  on-primary: '#ffffff'
  primary-container: '#ff5864'
  on-primary-container: '#5f0012'
  inverse-primary: '#ffb3b3'
  secondary: '#675b60'
  on-secondary: '#ffffff'
  secondary-container: '#efdee4'
  on-secondary-container: '#6d6166'
  tertiary: '#0060a8'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f96f7'
  on-tertiary-container: '#002d53'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#ffb3b3'
  on-primary-fixed: '#400009'
  on-primary-fixed-variant: '#920021'
  secondary-fixed: '#efdee4'
  secondary-fixed-dim: '#d2c2c8'
  on-secondary-fixed: '#22191d'
  on-secondary-fixed-variant: '#4f4449'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a1c9ff'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#004880'
  background: '#fcf8ff'
  on-background: '#1a1a2e'
  surface-variant: '#e2e0fc'
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The design system is centered on the concept of "Kind Connection." It prioritizes warmth, safety, and human approachability to reduce the anxiety often associated with digital dating. The aesthetic combines **Minimalism** with **Modern Corporate** reliability, utilizing heavy whitespace and soft, organic shapes to create an inviting atmosphere.

The emotional response should be one of optimism and trust. This is achieved through a "Soft-Tech" approach: clean, functional interfaces softened by high-radius corners and a warm color palette. The UI stays out of the way of the photography, acting as a supportive frame rather than a distraction.

## Colors

The palette is anchored by **Spark Coral**, a vibrant but warm red-pink that signifies energy and romance without being aggressive. This color is reserved for primary actions, active navigation states, and brand-critical moments.

- **Primary:** Spark Coral (#FF5864) for high-intent actions.
- **Surfaces:** A hierarchy of Soft Pink (#FBEAF0) for secondary containers, pure White (#FFFFFF) for main cards, and Light Grey (#F7F7FA) for background depth.
- **Typography:** Charcoal (#1A1A2E) ensures high readability and a grounded feel, while Muted Grey (#6B6B7B) is used for secondary metadata.
- **System:** Verified Blue (#3B9EFF) is used exclusively for trust indicators (identity verification), and Success Green (#2ECC71) for positive feedback loops like successful matches.

## Typography

This design system uses **Inter** for its exceptional legibility and neutral, modern character. The typographic hierarchy is high-contrast, featuring bold, tight-set headlines that feel "loud and friendly" paired with generous, well-spaced body text for readability in bios and messages.

Headlines should use a slight negative letter-spacing to feel more cohesive. For mobile views, display and large headlines should scale down to prevent awkward word breaks, while maintaining their heavy weight to preserve brand personality.

## Layout & Spacing

The layout follows a **fluid grid** model optimized for mobile-first interaction. A standard 4-column grid is used for mobile, expanding to 12 columns for tablet and desktop views. 

Spacing is governed by a 4px baseline shift, but primarily relies on "Generous Breathability." Margins are kept wide (20px minimum on mobile) to ensure content doesn't feel cramped. Vertical rhythm should prioritize large gaps (24px-32px) between major sections to emphasize a calm, unhurried user experience.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**. 

1. **Surface Level:** The main background is the Light Grey surface (#F7F7FA).
2. **Raised Level:** Primary content (like profile cards) sits on White (#FFFFFF) surfaces with a very soft, diffused shadow (0px 8px 24px, 4% opacity Charcoal).
3. **Interactive Level:** Active elements like Floating Action Buttons (FABs) use a slightly more pronounced shadow (0px 12px 32px, 8% opacity Spark Coral) to signify "pressability."

Avoid harsh borders. Use the Hairline Border (#ECECF2) only for separating list items or input fields where tonal difference isn't sufficient.

## Shapes

The shape language is defined by **Large Radii** and **Pill Shapes**. 

- **Cards & Containers:** Use a 24px radius (`rounded-xl` equivalent) to evoke a soft, friendly feel.
- **Buttons:** Primary and secondary buttons are always fully pill-shaped (500px radius) to maximize the "friendly" aesthetic.
- **Media:** Profile photos should use the same 24px radius as cards. Never use sharp 90-degree angles for user-facing content.
- **Inputs:** Text fields use a 16px radius to balance space efficiency with the overall soft theme.

## Components

### Buttons
- **Primary:** Full-width pill-shaped. Background is either solid Spark Coral or a vertical gradient from #FF5864 to #FF7A84. Label is White, Bold.
- **Secondary:** Pill-shaped. Background is Soft Pink (#FBEAF0) with Spark Coral text.

### Cards
- **Swipe Cards:** 24px corner radius. Image-to-edge layout with a subtle dark-to-transparent gradient overlay at the bottom to ensure white text metadata (Name, Age) is legible.

### Chips
- **Interests:** Pill-shaped, Light Grey (#F7F7FA) background with Charcoal (#1A1A2E) text. When selected, they transition to Spark Coral background with White text.

### Navigation
- **Bottom Tab Bar:** Solid White background with a subtle top hairline border. Active icons use Spark Coral; inactive icons use Muted Grey (#6B6B7B). Use rounded, 2px stroke weight icons.

### Floating Action Buttons (FAB)
- Circular buttons for "Like" or "Pass" actions. Use high-contrast colors (Coral for Like, White for Pass) with the standard ambient shadow to float above the card stack.

### Input Fields
- Filled style using Light Grey (#F7F7FA) with 16px corners. No border unless focused, at which point a 2px Spark Coral border is applied.