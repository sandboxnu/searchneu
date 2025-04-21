"use client";
import { SignIn } from "./SignIn";
import { Button } from "./ui/button";
import { useState } from "react";

export function Avatar(props: {}) {
  const [showSI, setShowSI] = useState(false);

  if (!showSI) {
    return (
      <Button className="font-bold" onClick={() => setShowSI(!showSI)}>
        Sign In
      </Button>
    );
  }

  return (
    <>
      <Button className="font-bold" onClick={() => setShowSI(!showSI)}>
        Sign In
      </Button>
      <SignIn closeFn={() => setShowSI(false)} />
    </>
  );
}
