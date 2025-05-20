"use client";
import { SignIn } from "../SignIn";
import { Button } from "../ui/button";
import { useState } from "react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "../ui/dropdown-menu";
// import { Avatar, AvatarFallback } from "../ui/avatar";
// import Link from "next/link";
// import { Iconskie } from "../icons/Iconskie";
// import { Skeleton } from "../ui/skeleton";

export function UserIcon() {
  const [showSI, setShowSI] = useState(false);

  // if (user.isPending) {
  //   return <Skeleton className="size-4 rounded-full" />;
  // }
  //
  // if (user.data) {
  //   return <UserMenu />;
  // }

  return (
    <>
      <Button className="font-bold" onClick={() => setShowSI(!showSI)}>
        Sign In
      </Button>
      {showSI && <SignIn closeFn={() => setShowSI(false)} />}
    </>
  );
}

// function UserMenu() {
//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" className="relative size-10 rounded-full">
//           <Avatar className="size-10">
//             <AvatarFallback>
//               <Iconskie className="size-full" />
//             </AvatarFallback>
//           </Avatar>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent>
//         <DropdownMenuLabel>My Account</DropdownMenuLabel>
//         <DropdownMenuSeparator />
//         <DropdownMenuItem asChild>
//           <Link href="/">Subscriptions</Link>
//         </DropdownMenuItem>
//         <DropdownMenuItem
//           // onClick={() => authClient.signOut()}
//           variant="destructive"
//         >
//           Sign Out
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
