"use client";

import type { ReactNode } from "react";
import { AuthUserProvider } from "@/src/hooks/useAuthUser";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthUserProvider>{children}</AuthUserProvider>;
}
