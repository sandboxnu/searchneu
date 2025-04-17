import { type ReactNode } from "react";

export default async function Layout(props: {
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="grid h-full w-full grid-cols-5">
      <div className="col-span-2">{props.children}</div>
      <div className="col-span-3">{props.aside}</div>
    </div>
  );
}
