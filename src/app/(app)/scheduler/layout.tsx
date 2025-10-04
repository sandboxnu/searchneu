import { Header } from "@/components/navigation/Header";
import { schedulerFlag } from "@/lib/flags";
import { notFound } from "next/navigation";

export default async function Page({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schedulerPage = await schedulerFlag();

  if (!schedulerPage) {
    notFound();
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
}
