import { type ReactNode } from "react";

export default function Layout(props: { children: ReactNode }) {
  return <div className="prose max-w-full p-4">{props.children}</div>;
}
