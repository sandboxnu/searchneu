import { ReactNode, Suspense } from "react";

export default async function Layout(props: {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  children: ReactNode;
  c: ReactNode;
}) {
  return (
    <div className="grid grid-cols-2">
      {props.children}
      {props.c}
    </div>
  );
}
