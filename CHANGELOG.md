# Changelog

## [2025-12-21] - Customizable Grid/List View Mode

### Added
- **ViewControls Component**: New dropdown menu for view customization
  - 3 display modes: Grid (default), Compact, Detailed
  - 6 size presets: From "Very Large" (2 per row) to "Very Small" (8 per row)
  - Visual icons for each size preset
- **useViewPreferences Hook**: Custom hook for persistent preferences
  - Automatic localStorage sync for view mode and grid size
  - Loads user preferences on mount
  - Returns setters for easy state management
- **AlbumCard View Modes**:
  - **Grid Mode** (default): Standard display with full overlay on hover
  - **Compact Mode**: Minimal overlay with just title and artist (centered)
  - **Detailed Mode**: Full overlay with additional metadata (country, genre)
- **Preference Persistence**: User choices saved in localStorage and restored on next visit

### Changed
- **App.jsx**:
  - Replaced `albumsPerRow` state with `useViewPreferences` hook
  - Removed manual resize handler (no longer needed)
  - Integrated ViewControls component in filters section
  - Pass viewMode prop to all AlbumCard instances
- **AlbumCard.jsx**:
  - Added `viewMode` prop with default value 'grid'
  - Adaptive overlay rendering based on mode
  - Updated memo comparison to include viewMode
  - Compact mode: minimal padding and centered content
  - Detailed mode: extra metadata display (country, genre)

### Technical Details
- **Storage Key**: `disco2000_view_preferences`
- **Default Preferences**: `{ viewMode: 'grid', gridSize: 5 }`
- **Size Presets**: 2, 3, 4, 5, 6, 8 columns (optimized for various screen sizes)
- **View Modes**: 'grid', 'compact', 'detailed'
- **Components**: 
  - `src/components/ViewControls.jsx` (dropdown menu)
  - `src/utils/useViewPreferences.js` (persistence hook)

### User Benefits
- Personalized browsing experience
- Adjustable density for different screen sizes and preferences
- Quick access to more/less information per album
- Settings persist across sessions

---

## [2025-12-20] - Session Management & Refresh Token

### Added
- **Session Status Badge**: Displays remaining session time with color-coded warnings (green > 10min, yellow 5-10min, red < 5min)
- **Automatic Token Refresh**: Pre-refresh mechanism that refreshes tokens 5 minutes before expiration
- **Silent Token Refresh**: Automatic refresh on window focus and visibility change to handle inactivity
- **Refresh Token Support**: Full implementation of OAuth2 refresh token flow
  - `performRefresh()` in `authFetch.js` handles automatic token refresh
  - Fallback to silent re-login if refresh token unavailable
  - Token rotation support (receives new refresh_token from server)
- **Session Management**: 
  - SessionStorage + cookie dual storage for token persistence
  - Automatic JWT validation on app mount and visibility change
  - No more forced redirects on expiration (prevents loops)
  - Custom events for JWT updates across components

### Changed
- **authFetch.js**: 
  - Enhanced with automatic 401/403 interception
  - Single-flight refresh promise to prevent race conditions
  - Silent re-login fallback when refresh token unavailable
  - Clean logging in dev mode
- **GoogleAuthButton.jsx**: 
  - Extracts and stores refresh_token from login response
  - Tries modern `/api/users/auth` endpoint first, fallback to legacy `/api/users/token`
  - Supports multiple refresh token field names (refresh_token, refresh, refreshToken)
- **App.jsx**:
  - Added pre-refresh timer (checks every 60s)
  - Added focus/visibility event handlers for refresh
  - Token sync effect from cookies to state
  - Graceful session expiration handling without loops

### Technical Details
- **Access Token**: 1 hour expiration, stored in sessionStorage + cookie 'jwt'
- **Refresh Token**: 30 days expiration, stored in sessionStorage + cookie 'refresh_token'
- **Refresh Endpoint**: `POST /api/users/refresh` with JSON body `{refresh_token: "..."}`
- **Dev Mode**: Enhanced logging with `[AUTH]` prefix for easy debugging
- **Production**: All debug logs disabled (using `import.meta.env.DEV` checks)

### Notes
- Backend must return `refresh_token` in login response for optimal operation
- If refresh_token absent, app uses fallback silent re-login (functional but makes extra requests)
- Session can now last up to 30 days without re-authentication (with proper backend support)
