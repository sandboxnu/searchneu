import { ReactNode } from "react";
import { DialogWrapper } from "./dialogWrapper";

export default async function Layout(props: {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  children: ReactNode;
  c: ReactNode;
}) {
  return (
    <div className="w-full">
      <DialogWrapper>{props.c}</DialogWrapper>
      <div className="">{props.children}</div>
    </div>
  );
}
