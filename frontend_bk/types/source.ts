export interface Source {
  id: string;
  title: string;
  type: "audio" | "pdf" | "transcript";
  duration?: string;
  path: string;
  file?: File;
} 