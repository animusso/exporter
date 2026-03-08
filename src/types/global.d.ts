declare namespace chrome {
  export const webRequest: typeof import('chrome').webRequest;
  export const storage: typeof import('chrome').storage;
  export const runtime: typeof import('chrome').runtime;
  export const downloads: typeof import('chrome').downloads;
  export const tabs: typeof import('chrome').tabs;
}
