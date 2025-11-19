"use client";
import NotFound from "./errors/ErrorHeader";
import ErrorFooter from "./errors/ErrorFooter";

export default function Error() {
  return (
    <div className="px-[48px] pt-[43px] pb-[48px]">
      <NotFound statusCode={500} />
      <ErrorFooter />
    </div>
  );
}
