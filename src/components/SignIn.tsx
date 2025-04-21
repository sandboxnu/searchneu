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
import { Chairsky } from "./icons/Chairsky";
import { InputOTP, InputOTPSlot, InputOTPGroup } from "./ui/input-otp";
import { type Dispatch, type SetStateAction, useState } from "react";
import { isPossiblePhoneNumber, type Value } from "react-phone-number-input";

export function SignIn(props: { oneMoreStep?: boolean; closeFn: () => void }) {
  const [page, setPage] = useState(Boolean(props?.oneMoreStep) ? 0 : 1);

  const [phoneNumber, setPhoneNumber] = useState("");

  return (
    <Dialog onOpenChange={(e) => props.closeFn()} defaultOpen={true}>
      {page === 0 && <OneMoreStep next={() => setPage(1)} />}
      {page === 1 && (
        <PhoneNumberPage
          next={() => setPage(2)}
          setPhoneNumber={setPhoneNumber}
        />
      )}
      {page === 2 && (
        <PhoneVerification
          next={() => console.log(1)}
          phoneNumber={phoneNumber}
        />
      )}
    </Dialog>
  );
}

function PhoneVerification(props: { next: () => void; phoneNumber: string }) {
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
        <InputOTP maxLength={6} className="">
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
      <DialogFooter className="">
        <Button type="submit" className="w-full" onClick={() => props.next()}>
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
  const [invalidCode, setInvalidCode] = useState(false);

  function onChange(e: Value) {
    setNumber(e);
    props.setPhoneNumber(e);
  }

  function onClick() {
    // isValidPhoneNumber is *not* used b/c number spaces change, which can cause the
    // formally mentioned method to throw errors if the libs are not updated
    if (isPossiblePhoneNumber(number)) {
      props.next();
    }
    setInvalidCode(true);
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
          value={number}
          placeholder="(123) 456-7890"
          defaultCountry="US"
          className="text-foreground h-12 w-full text-lg"
        />
        {invalidCode && (
          <p className="text-xs font-semibold text-red-400">
            Invalid phone number
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full" onClick={onClick}>
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
        <Chairsky className="w-32" />
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full" onClick={() => props.next()}>
          Sign In
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
