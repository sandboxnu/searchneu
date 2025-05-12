"use client";
import { City } from "@/components/icons/city";
import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function Onboarding() {
  const [agree, setAgree] = useState(false);
  return (
    <div className="relative flex h-full min-h-[500px] w-full flex-col justify-center">
      <div className="sunset absolute top-0 -z-20 h-full w-full"></div>
      <City className="absolute bottom-0 -z-10 min-h-48 max-w-screen" />
      <div className="ml-[10%] w-[80%] max-w-[800px] space-y-2">
        <Logo className="w-2/3 max-w-[450px] min-w-[220px]" />
        <h2>
          By clicking the checkbox below, you are agreeing to our terms and
          conditions.
        </h2>
        <form
          action={() => {
            redirect("/");
          }}
        >
          <input
            type="checkbox"
            checked={agree}
            onChange={() => {
              setAgree(!agree);
            }}
          ></input>
          <br></br>
          <Button disabled={!agree}>Continue</Button>
        </form>
      </div>
    </div>
  );
}
