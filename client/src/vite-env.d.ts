/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolútna URL backend API v produkcii (napr. https://financetrack-api.onrender.com). Prázdne v deve, kde sa použije Vite proxy. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
