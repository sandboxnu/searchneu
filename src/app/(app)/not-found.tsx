"use client";
import NotFoundHeader from "./errors/NotFoundHeader";
import NotFoundFooter from "./errors/NotFoundFooter";

export default function NotFound() {
  return (
    <div className="px-[48px] pt-[43px] pb-[48px]">
      <NotFoundHeader />
      <NotFoundFooter />
    </div>
  );
}
