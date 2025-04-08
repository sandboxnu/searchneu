import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  children: ReactNode;
  c: ReactNode;
}) {
  return (
    <div className="grid grid-cols-8">
      <div className="col-span-3">{props.children}</div>
      <div className="col-span-5">{props.c}</div>
    </div>
  );
}
