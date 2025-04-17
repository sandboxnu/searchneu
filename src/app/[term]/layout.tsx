import { ReactNode } from "react";

export default async function Layout(props: {
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="grid w-full grid-cols-2">
      <div className="">{props.children}</div>
      <div className="h-full overflow-scroll">{props.aside}</div>
    </div>
  );
}
