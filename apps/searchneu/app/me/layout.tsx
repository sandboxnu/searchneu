import { Suspense } from "react";

export default function Layout({ children }: LayoutProps<"/me">) {
  return <Suspense>{children}</Suspense>;
}
