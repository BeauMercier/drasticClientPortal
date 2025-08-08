# Theme & Styling Guide

This document outlines the theming and styling architecture of the application, including the use of Tailwind CSS, global styles, and specific override strategies.

## 1. Core Technologies

- **Tailwind CSS:** The primary framework for utility-first styling.
- **CSS Variables:** Used for defining core theme colors (background, foreground, etc.) for both light and dark modes.
- **`globals.css`:** The central stylesheet for base styles, global overrides, and custom utility classes.

## 2. Theming Strategy

The application supports both light and dark modes, controlled by the `.dark` class on the `<html>` element.

- **Light Mode (Default):** Styles are applied directly without a specific class.
- **Dark Mode:** Styles are applied using Tailwind's `dark:` variants (e.g., `dark:bg-gray-800`).
- **Default Theme:** The app defaults to dark via `ThemeProvider` (`defaultTheme="dark"`).
- **Local Dark Containers:** Certain pages (e.g., `/client/new-dashboard` and `/client/my-profile-v2`) intentionally wrap their content in a local `div.dark` container to normalize styles and shield against aggressive global overrides.

## 3. Global Styles & Overrides (`globals.css`)

The `globals.css` file contains several important sections:

### 3.1. Base Styles & CSS Variables

This section defines the root colors for light and dark themes using CSS variables.

```css
/* :root { ... } */
/* .dark { ... } */
/* .light { ... } */
```

### 3.2. Aggressive Global Overrides

**Warning:** This file contains several overly aggressive global style rules that use `!important`. These were likely implemented to solve specific styling issues but can cause widespread side effects.

**Example Problematic Rule:**

```css
.dark .bg-white {
  background-color: #000000 !important;
}
```

This rule forces any element with the `.bg-white` class to have a black background in dark mode, which can override more specific component-level styles.

### 3.3. Surgical Override Utility Classes

To combat the issues caused by the aggressive global overrides, we have adopted a strategy of creating highly specific, "surgical" utility classes for components that need to win the specificity war.

**Example: The `force-unread-bg` Class**

This class was created to fix an issue where unread notifications were unreadable in dark mode due to the global styles.

- **File:** `src/styles/globals.css`
- **Rule:**
  ```css
  .dark .force-unread-bg {
    background-color: rgb(30 64 175) !important; /* tailwind blue-800 */
    color: rgb(239 246 255) !important;          /* tailwind blue-50  */
  }
  ```
- **Usage:** This class is applied directly to the unread notification component in `NotificationsMenu.tsx` to ensure it always has the correct high-contrast background and text color in dark mode.

**Guideline:** When a component's dark mode styles are being incorrectly overridden by a global rule, the preferred solution is to create a new, targeted utility class like `.force-unread-bg` rather than modifying the broad global rules. This prevents unintended side effects across the application. 

## 4. Error UI & Theme Context

- The App Router global error component (`src/app/global-error.tsx`) renders outside normal layouts. It uses inline styles to guarantee high-contrast appearance independent of theme state.
- Page-level `div.dark` containers do not affect the global error UI; it is intentionally self-styled for reliability.