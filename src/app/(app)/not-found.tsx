"use client";
import NotFound from "./errors/ErrorHeader";
import ErrorFooter from "./errors/ErrorFooter";

export default function Error() {
  return (
    <div className="pt-[43px] pb-[48px] px-[48px]">
      <NotFound statusCode={404} />
      <ErrorFooter />
    </div>
  );
}
