interface ImportMetaEnv {
  VITE_PROFILE_API_BASE_URL: string;
  VITE_ENV: string;
}

declare namespace NodeJS {
  interface ProcessEnv extends ImportMetaEnv {}
}

declare module '*.png' {
  const src: string;
  export default src;
}
