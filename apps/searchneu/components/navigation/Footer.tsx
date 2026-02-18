"use client";

import Link from "next/link";
import { Neu } from "../icons/Neu";
import { Logo } from "../icons/logo";
import { Footskie } from "../icons/Footskie";

export function LinkColumn({
  name,
  labels,
}: {
  name: string;
  labels: [string, string][];
}) {
  return (
    <div className="mr-5 mb-6 ml-15 flex w-fit flex-1 flex-col items-start gap-2 md:ml-0 xl:w-45">
      <p className="text-neu5 text-xs font-bold uppercase">{name}</p>
      {labels.map(([label, href], index) => (
        <Link
          key={index}
          href={href}
          className="text-neu8 hover:text-neu8/80 z-10 text-base"
          target="_blank"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-neu1 relative flex flex-col justify-between gap-20 overflow-hidden pt-5 md:flex-row xl:h-[312px]">
      <div className="flex flex-col">
        <div className="h-78">
          <Footskie className="absolute -left-16 w-auto" />
          <Logo className="absolute top-15 left-15 h-7 w-auto" />
          <div className="h-78 w-[200px]"></div>
        </div>
        <div className="absolute right-30 bottom-10 left-15 flex flex-col items-center items-start justify-between gap-4 text-sm md:top-67.5 lg:flex-row">
          <div className="flex flex-col gap-1 xl:flex-row">
            <p className="text-neu6">
              2025 SearchNEU. Made with{" "}
              <span
                className="cursor-pointer"
                onMouseOver={async () => {
                  const d = document.getElementById("footer-heart");
                  if (!d) return;
                  const hearts = [
                    "❤️",
                    "🧡",
                    "💛",
                    "💚",
                    "💙",
                    "💜",
                    "🤎",
                    "🖤",
                  ];
                  let currentIndex = 0;

                  const cycleColors = () => {
                    if (currentIndex < hearts.length) {
                      d.textContent = hearts[currentIndex];
                      currentIndex++;
                      setTimeout(cycleColors, 100);
                    } else {
                      d.textContent = "❤️";
                    }
                  };

                  cycleColors();
                }}
                id="footer-heart"
              >
                ❤️
              </span>{" "}
              by UX Designers and Developers of{" "}
              <a
                href="https://www.sandboxnu.com/"
                className="hover:text-neu6/80 underline"
              >
                Sandbox
              </a>{" "}
              in Boston, MA.
            </p>
          </div>
          <div className="text-neu6 flex flex-col gap-2 md:flex-row md:gap-6">
            <div>
              <a href="/terms" className="hover:text-neu6/80">
                Terms & Conditions
              </a>
            </div>
            <div>
              <a href="/privacy" className="hover:text-neu6/80">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col md:flex-row md:justify-end">
        <div className="absolute top-32 flex w-full flex-col md:static md:flex-row md:justify-end md:pt-10 xl:w-auto">
          <LinkColumn
            name="Product"
            labels={[
              ["Home", "/"],
              ["Catalog", "/catalog"],
              ["Rooms", "/rooms"],
            ]}
          />
          <LinkColumn
            name="Resources"
            labels={[
              ["Changelog", "/changelog"],
              ["FAQ", "/faq"],
            ]}
          />
        </div>
        <div className="absolute top-32 left-40 flex w-full flex-col md:static md:flex-row md:justify-end md:pt-10 xl:w-auto">
          <LinkColumn
            name="Development"
            labels={[
              ["Documentation", "/docs"],
              ["Github", "https://github.com/sandboxnu/searchneu"],
            ]}
          />
          <LinkColumn
            name="Affiliations"
            labels={[
              ["Sandbox", "https://www.sandboxnu.com/"],
              ["GraduateNU", "https://graduatenu.com/"],
              ["Cooper", "https://coopernu.com/"],
            ]}
          />
        </div>
      </div>
      <div className="xs:visible h-10 w-[200px] md:hidden"></div>
    </footer>
  );
}
