"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { PhoneInput } from "./ui/phone-input";
import { Chairskie } from "./icons/Chairskie";
import { InputOTP, InputOTPSlot, InputOTPGroup } from "./ui/input-otp";
import { type Dispatch, type SetStateAction, useState } from "react";
import { isPossiblePhoneNumber, type Value } from "react-phone-number-input";
import {
  checkVerificationCode,
  sendVerificationText,
} from "@/lib/actions/signIn";
import { Magoskie } from "./icons/Magoskie";
import { authClient } from "@/lib/auth-client";

export function SignIn(props: { oneMoreStep?: boolean; closeFn: () => void }) {
  const [page, setPage] = useState(Boolean(props?.oneMoreStep) ? 0 : 1);
  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <Dialog onOpenChange={() => props.closeFn()} defaultOpen={true}>
      {page === 0 && <OneMoreStep next={() => setPage(1)} />}
      {page === 1 && <SocialSignIn next={() => setPage(2)} />}
      {page === 2 && <Onboarding next={() => setPage(3)} />}
      {page === 3 && (
        <PhoneNumberPage
          next={() => setPage(4)}
          setPhoneNumber={setPhoneNumber}
        />
      )}
      {page === 4 && (
        <PhoneVerification next={() => setPage(5)} phoneNumber={phoneNumber} />
      )}
      {page === 5 && <Onboarding next={() => props.closeFn()} />}
    </Dialog>
  );
}

function SocialSignIn(props: { next: () => void }) {
  async function signIn() {
    await authClient.signIn.social({
      provider: "github",
    });

    props.next();
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader className="flex w-full items-center">
        <DialogTitle>SignIn</DialogTitle>
        <DialogDescription className="text-center">
          blah blah blah
        </DialogDescription>
      </DialogHeader>
      {/* <div className="flex w-full items-center justify-center py-4"> */}
      {/*   <Magoskie className="w-32" /> */}
      {/* </div> */}
      <DialogFooter>
        <Button type="submit" className="w-full" onClick={() => signIn()}>
          Sign In
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Onboarding(props: { next: () => void }) {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader className="flex w-full items-center">
        <DialogTitle>Legal</DialogTitle>
        {/* <DialogDescription className="text-center"> */}
        {/*   By continuing you agree to the Terms of Service and Privacy Policy; */}
        {/*   additionally, you agree to receive recurring automated text messages */}
        {/*   from us at your cell number when suscribing to seat notifications. */}
        {/*   Consent is a requirement for seat notifications. Msg frequency varies; */}
        {/*   msg and data rates may apply. */}
        {/* </DialogDescription> */}
        <DialogDescription className="text-center">
          By continuing you agree to the Terms of Service and Privacy Policy.
          Consent to automated messages is a requirement for seat notifications.
          Msg frequency varies. Msg and data rates may apply.
        </DialogDescription>
      </DialogHeader>
      <div className="flex w-full items-center justify-center py-4">
        <Magoskie className="w-32" />
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full" onClick={() => props.next()}>
          Continue
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PhoneVerification(props: { next: () => void; phoneNumber: string }) {
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function verifyCode() {
    if (code.length !== 6) {
      setErrorMsg("Code is formatted poorly");
      return;
    }

    const status = await checkVerificationCode(props.phoneNumber, code);
    if (status.status !== "approved" || !status.uid) {
      setErrorMsg("Invalid code");
      return;
    }

    props.next();
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader className="flex w-full items-center">
        <DialogTitle>Verify Phone Number</DialogTitle>
        <DialogDescription className="text-center">
          Enter the code sent to {props.phoneNumber}
          {/* <Button className="px-1 py-0.5" variant="ghost"> */}
          {/*   Resend Code */}
          {/* </Button> */}
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          className=""
          value={code}
          onChange={(e) => setCode(e)}
          onKeyDown={(e) => e.code === "Enter" && verifyCode()}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
          </InputOTPGroup>
        </InputOTP>
      </div>
      {errorMsg && (
        <p className="text-xs font-semibold text-red-400">{errorMsg}</p>
      )}
      <DialogFooter className="">
        <Button type="submit" className="w-full" onClick={() => verifyCode()}>
          Verify Code
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PhoneNumberPage(props: {
  next: () => void;
  setPhoneNumber: Dispatch<SetStateAction<string>>;
}) {
  const [number, setNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function onChange(e: Value) {
    setNumber(e);
    props.setPhoneNumber(e);
  }

  async function sendCode() {
    // isValidPhoneNumber is *not* used b/c number spaces change, which can cause the
    // formally mentioned method to throw errors if the libs are not updated
    if (!isPossiblePhoneNumber(number)) {
      setErrorMsg("Invalid phone number");
      return;
    }

    const a = await sendVerificationText(number);
    if (a.statusCode !== 200) {
      setErrorMsg(a.message);
      return;
    }

    props.next();
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader className="flex w-full items-center">
        <DialogTitle>Sign In</DialogTitle>
        <DialogDescription className="text-center">
          Your phone number will be used for class notifications and nothing
          else.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center pb-4">
        <PhoneInput
          id="phone"
          aria-label="phone input"
          onChange={onChange}
          onKeyDown={(e) => e.code === "Enter" && sendCode()}
          value={number}
          placeholder="(123) 456-7890"
          defaultCountry="US"
          className="text-foreground h-12 w-full text-lg"
        />
        {errorMsg && (
          <p className="text-xs font-semibold text-red-400">{errorMsg}</p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full" onClick={sendCode}>
          Send Code
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function OneMoreStep(props: { next: () => void }) {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader className="flex w-full items-center">
        <DialogTitle>One More Step</DialogTitle>
        <DialogDescription className="text-center">
          Sign in with your phone number to be the first to know when seats open
          up.
        </DialogDescription>
      </DialogHeader>
      <div className="flex w-full items-center justify-center py-4">
        <Chairskie className="w-32" />
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full" onClick={() => props.next()}>
          Sign In
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
