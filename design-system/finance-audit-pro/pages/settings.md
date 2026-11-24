# Page Override: Settings

> **OVERRIDES:** This file overrides `design-system/finance-audit-pro/MASTER.md` for the Settings page only.
> All rules not explicitly listed here fall back to Master.
> 
> **User instruction:** Create page overrides for collections, reports, settings pages per most recent explicit request.

---

**Page:** Settings (`/settings`)  
**Component:** `src/app/settings/settings.component.ts`  
**Route:** `/settings`  
**Layout:** Navigation tabs → Profile, Security, Preferences sections

---

## Page-Specific Token Overrides

| Token | Master Value | Settings Value | Reason |
|-------|--------------|----------------|--------|
| Container max-width | none (full) | `max-w-2xl` (640px) | Settings form needs focused width for readability |
| Section gap | `--glass-space-xl` (32px) | `space-y-6` (24px) | Form rhythm compact for preference toggles |
| Input height | default | `h-12` (24px) | Form inputs need taller height for touch targets |
| Label margin-bottom | default | `mb-2` (8px) | Compact form layout |

---

## Component Composition

### Settings Navigation (Lines 1–20)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Tabs | `<glass-tabs>` | `variant="line"`, `activeId="profile"` |
| Tab 1: Profile | `<glass-tab-item>` | `id="profile"`, `label="Profile"` |
| Tab 2: Security | `<glass-tab-item>` | `id="security"`, `label="Security"` |
| Tab 3: Preferences | `<glass-tab-item>` | `id="preferences"`, `label="Preferences"` |

### Profile Section (Lines 23–80)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| User avatar | `<img>` or `<glass-avatar>` | `class="w-16 h-16"`, `alt="User initials"` |
| Display name | `<input>` with `glassInput` | `placeholder="Display name"`, `value=userName` |
| Email | `<input>` with `glassInput` | `type="email"`, `placeholder="user@example.com"`, `disabled` |
| Save changes | `<glass-button>` | `variant="filled"`, `size="md"`, `label="Save Changes"` |

### Security Section (Lines 83–140)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Current password | `<input>` with `glassInput` | `type="password"`, `placeholder="Current password"` |
| New password | `<input>` with `glassInput` | `type="password"`, `placeholder="New password"` |
| Confirm password | `<input>` with `glassInput` | `type="password"`, `placeholder="Confirm new password"` |
| Change password | `<glass-button>` | `variant="danger"`, `size="md"`, `label="Change Password"` |
| Two-factor status | `<glass-badge>` variant=`subtle` | Shows 2FA status |
| Enable 2FA | `<glass-button>` | `variant="accent"`, `size="sm"`, `label="Enable Two-Factor"` |

### Preferences Section (Lines 143–200)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Reduced motion toggle | `<label>` with `glass-input` wrapper | `class="flex items-center pt-2"` |
| Dark/light mode toggle | `<label>` with `glass-input` wrapper | `class="flex items-center pt-2"` |
| Notification preferences | `<select>` with `glassInput` | `class="w-full"` |
| Save preferences | `<glass-button>` | `variant="filled"`, `size="md"`, `label="Save Preferences"` |

---

## Data Flow

```
SettingsComponent
  ├─ activeTab = signal<'profile' | 'security' | 'preferences'>('profile')
  ├─ user = signal<UserProfile> | null>(authService.user())
  ├─ formValues = computed from form state
  ├─ onTabChange(tabId) → switch between profile/security/preferences
  ├─ onSaveProfile() → patch user profile via Supabase
  ├─ onChangePassword() → update password (current → new)
  └─ onSavePreferences() → save notification/theme preferences
```

**Service Contract (`SettingsService`):**
- `getProfile()`: Returns `{ displayName, email, theme, notifications }`
- `updateProfile(profileData)`: Updates display name and settings via Supabase
- `changePassword(currentPassword, newPassword)`: Changes user password
- `toggleTwoFactor()`: Enables/disables 2FA
- `savePreferences(preferences)`: Saves notification and theme preferences

---

## Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| 375px (mobile) | Stack: form inputs vertically, tabs full-width, save buttons below form |
| 768px (tablet) | Two-column: left side form, right side summary (if applicable) |
| 1024px+ | Full form width, tabs always visible, compact layout |
| 1440px+ | `max-w-2xl` centered, generous spacing between sections |

**Container queries:** Not yet used — page uses viewport media queries. Future: migrate form inputs to `@container` for true component-level responsiveness.

---

## Accessibility Notes

| Feature | Implementation |
|---------|----------------|
| Form labels | All inputs have associated `<label>` elements; `glassInput` directive adds visual styling |
| Password fields | `aria-describedby` for password strength requirements |
| Toggle switches | `role="switch"`, `aria-checked` state properly set |
| Save buttons | `aria-label="Save profile changes"`, `aria-label="Change password"`, `aria-label="Save preferences"` |
| Reduced motion | All transitions respect `prefers-reduced-motion` via global token |

---

## Anti-Patterns Specific to Settings

- ❌ Do not allow empty display name — require at least 2 characters
- ❌ Do not skip password confirmation — must match new password field
- ❌ Do not change email without verification — send confirmation email
- ❌ Do not store plain-text passwords — always hash via Supabase Auth
- ❌ Do not reset 2FA settings without user confirmation (modal dialog)

---

## Future Enhancements (Tracked)

- [ ] Add profile picture upload with preview
- [ ] Add API key management for integrations
- [ ] Add session activity log (show active logins)
- [ ] Add export of user data (GDPR compliance)
- [ ] Add password strength meter with visual feedback
- [ ] Add recovery email validation

---

## Related Files

- `src/app/settings/settings.component.ts` — Settings component logic
- `src/app/settings/settings.component.html` — Settings component template
- `src/app/design-system/components/glass-input.directive.js` — Input directive
- `src/app/design-system/components/glass-button.component.ts` — Action buttons
- `src/app/design-system/components/glass-badge.component.ts` — Status badges
- `src/app/design-system/components/glass-avatar.component.ts` — Avatar component