import { type ReactNode } from "react";

export default async function Layout(props: {
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="grid h-full w-full grid-cols-12">
      <div className="col-span-5">{props.children}</div>
      <div className="col-span-7">{props.aside}</div>
    </div>
  );
}
