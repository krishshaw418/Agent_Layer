"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "!border !border-white/10 !bg-slate-950/90 !text-slate-50"
        }
      }}
    />
  );
}

