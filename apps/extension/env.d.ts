/// <reference types="wxt/browser" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_CLERK_SYNC_HOST: string;
  readonly VITE_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare function defineBackground(fn: () => void): void;
