import type { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return <main className="app-stage"><div className="mobile-app">{children}</div></main>;
}
