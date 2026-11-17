/* global __KOSTKU_APP_VERSION__, __KOSTKU_BUILD_DATE__, __KOSTKU_BUILD_NUMBER__ */
// KostKu Version Configuration — Single Source of Truth from public/version.json (injected by vite.config.js)
export const APP_VERSION = typeof __KOSTKU_APP_VERSION__ !== 'undefined' ? __KOSTKU_APP_VERSION__ : '1.6.4';
export const APP_BUILD_DATE = typeof __KOSTKU_BUILD_DATE__ !== 'undefined' ? __KOSTKU_BUILD_DATE__ : '2026-11-17';
export const APP_BUILD_NUMBER = typeof __KOSTKU_BUILD_NUMBER__ !== 'undefined' ? Number(__KOSTKU_BUILD_NUMBER__) : 169;

// Official Google OAuth 2.0 & Google Identity Services Client ID
export const DEFAULT_GOOGLE_CLIENT_ID = '416599367292-3h9001mfd1dk7shnqo3fgpjs47s7oofe.apps.googleusercontent.com';
