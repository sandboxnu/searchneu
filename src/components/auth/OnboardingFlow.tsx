"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PhoneInput } from "../ui/phone-input";
import { InputOTP, InputOTPSlot, InputOTPGroup } from "../ui/input-otp";
import { SquareDashed, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import {
  grantConsentAction,
  startPhoneVerificationAction,
  verifyPhoneAction,
} from "@/lib/auth/onboarding-actions";

export function OnboardingFlow({ redirectUri }: { redirectUri: string }) {
  const [page, setPage] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();

  function abortOnboarding() {
    router.push(redirectUri);
  }

  return (
    <AlertDialog defaultOpen={true}>
      <AlertDialogContent className="sm:max-w-[425px]">
        {page === 0 && (
          <StartPage next={() => setPage(1)} abort={abortOnboarding} />
        )}
        {page === 1 && (
          <ConsentPage next={() => setPage(2)} abort={abortOnboarding} />
        )}
        {page === 2 && (
          <PhoneNumberPage
            next={() => setPage(3)}
            abort={abortOnboarding}
            value={phoneNumber}
            onChange={setPhoneNumber}
          />
        )}
        {page === 3 && (
          <OTPPage
            next={() => setPage(4)}
            abort={abortOnboarding}
            phoneNumber={phoneNumber}
          />
        )}
        {page === 4 && <SuccessPage next={() => router.push(redirectUri)} />}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StartPage({ next, abort }: { next: () => void; abort: () => void }) {
  return (
    <>
      <AlertDialogHeader className="flex w-full items-center">
        <AlertDialogTitle>Link Phone Number</AlertDialogTitle>
        <AlertDialogDescription className="text-center">
          Link your phone number to receive seat tracking notifications. This
          can be done later.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex w-full items-center justify-center py-4">
        <SquareDashed className="text-neu size-32" />
      </div>
      <AlertDialogFooter>
        <div className="flex w-full flex-col gap-1">
          <Button type="submit" className="w-full" onClick={next}>
            Continue
          </Button>
          <Button
            type="submit"
            variant="ghost"
            className="w-full"
            onClick={abort}
          >
            Skip
          </Button>
        </div>
      </AlertDialogFooter>
    </>
  );
}

function ConsentPage({ next, abort }: { next: () => void; abort: () => void }) {
  // TODO: finsh legal boilerplate

  const [isPending, startTransition] = useTransition();
  function onSubmit() {
    startTransition(async () => {
      const res = await grantConsentAction();
      if (!res.ok) {
        return;
      }

      next();
    });
  }

  return (
    <>
      <AlertDialogHeader className="flex w-full items-center">
        <AlertDialogTitle>Legal</AlertDialogTitle>
        <AlertDialogDescription className="text-center">
          By continuing you agree to the SMS Policies in the{" "}
          <Link href="/terms" className="text-b2 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-b2 underline">
            Privacy Policy
          </Link>{" "}
          and give explicit consent to receive SMS messages. Msg and data rates
          may apply. Msg frequency varies.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <div className="flex w-full flex-col gap-1">
          <Button
            type="submit"
            className="w-full"
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            Continue
          </Button>
          <Button
            type="submit"
            variant="ghost"
            className="w-full"
            onClick={abort}
          >
            Cancel
          </Button>
        </div>
      </AlertDialogFooter>
    </>
  );
}

function PhoneNumberPage({
  next,
  abort,
  value,
  onChange,
}: {
  next: () => void;
  abort: () => void;
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
}) {
  const [errorMsg, setErrorMsg] = useState("");

  const [isPending, startTransition] = useTransition();
  function onSubmit() {
    startTransition(async () => {
      // isValidPhoneNumber is *not* used b/c number spaces change, which can cause the
      //  aforementioned method to throw errors if the libs are not updated
      if (!isPossiblePhoneNumber(value)) {
        setErrorMsg("Invalid phone number");
        return;
      }

      const res = await startPhoneVerificationAction(value);

      if (!res.ok) {
        setErrorMsg(res?.msg ?? "");
        return;
      }

      next();
    });
  }

  return (
    <>
      <AlertDialogHeader className="flex w-full items-center">
        <AlertDialogTitle>Sign In</AlertDialogTitle>
        <AlertDialogDescription className="text-center">
          Your phone number will be used for class notifications and nothing
          else.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex flex-col items-center justify-center pb-4">
        <PhoneInput
          id="phone"
          aria-label="phone input"
          onChange={onChange}
          onKeyDown={(e) => e.code === "Enter" && onSubmit()}
          value={value}
          placeholder="(123) 456-7890"
          defaultCountry="US"
          className="text-foreground h-12 w-full text-lg"
        />
        {errorMsg && (
          <p className="text-xs font-semibold text-red-400">{errorMsg}</p>
        )}
      </div>
      <AlertDialogFooter>
        <div className="flex w-full flex-col gap-1">
          <Button
            type="submit"
            className="w-full"
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            Continue
          </Button>
          <Button
            type="submit"
            variant="ghost"
            className="w-full"
            onClick={abort}
          >
            Cancel
          </Button>
        </div>
      </AlertDialogFooter>
    </>
  );
}

function OTPPage({
  next,
  abort,
  phoneNumber,
}: {
  next: () => void;
  abort: () => void;
  phoneNumber: string;
}) {
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [isPending, startTransition] = useTransition();
  function onSubmit() {
    startTransition(async () => {
      if (code.length !== 6) {
        setErrorMsg("Code is formatted poorly");
        return;
      }

      const res = await verifyPhoneAction(phoneNumber, code);

      if (!res.ok) {
        console.log(res.status);
        setErrorMsg("Invalid code");
        return;
      }

      next();
    });
  }

  return (
    <>
      <AlertDialogHeader className="flex w-full items-center">
        <AlertDialogTitle>Sign In</AlertDialogTitle>
        <AlertDialogDescription className="text-center">
          Enter the code sent to {phoneNumber}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          className=""
          value={code}
          onChange={(e) => setCode(e)}
          onKeyDown={(e) => e.code === "Enter" && onSubmit()}
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
      <AlertDialogFooter>
        <div className="flex w-full flex-col gap-1">
          <Button
            type="submit"
            className="w-full"
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            Continue
          </Button>
          <Button
            type="submit"
            variant="ghost"
            className="w-full"
            onClick={abort}
          >
            Cancel
          </Button>
        </div>
      </AlertDialogFooter>
    </>
  );
}

function SuccessPage({ next }: { next: () => void }) {
  return (
    <>
      <AlertDialogHeader className="flex w-full items-center">
        <AlertDialogTitle>Phone Number Verification Success</AlertDialogTitle>
        <AlertDialogDescription className="text-center">
          Your phone number is successfully verified!
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex w-full items-center justify-center py-4">
        <SquareDashed className="text-neu size-32" />
      </div>
      <AlertDialogFooter>
        <Button type="submit" className="w-full" onClick={next}>
          Finish
        </Button>
      </AlertDialogFooter>
    </>
  );
}
