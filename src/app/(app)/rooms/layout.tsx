import { Header } from "@/components/navigation/Header";
import { roomsFlag } from "@/lib/flags";
import { notFound } from "next/navigation";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const roomsPage = await roomsFlag();

  if (!roomsPage) {
    notFound();
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
}
