declare module 'xlsx' {
  export const utils: any;
  export const read: any;
  export const write: any;
  export const writeFile: any;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
