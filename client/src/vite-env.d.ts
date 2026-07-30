/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute backend API URL in production (e.g. https://financetrack-api.onrender.com). Empty in dev, where the Vite proxy is used instead. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
