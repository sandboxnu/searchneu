"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Modal({
  setOpen,
  children,
}: {
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => {
      document.body.style.overflow = "unset";
      clearTimeout(timer);
    };
  }, []);

  const close = () => {
    setIsVisible(false);
    setTimeout(() => {
      setOpen(false);
    }, 300);
  };

  return (
    <>
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isVisible ? "opacity-25" : "opacity-0"
        }`}
      />

      <div
        className={`fixed right-6 bottom-6 z-50 w-96 transition-transform duration-300 ease-out ${
          isVisible ? "translate-x-0" : "translate-x-[calc(100%+24px)]"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="flex w-full justify-end">
            <button
              onClick={close}
              className="text-md h-3 p-0 text-gray-500 transition-colors hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
