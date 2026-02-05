"use client";

import Link from "next/link";
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
    <div className="mb-6 ml-15 flex w-45 flex-col items-start gap-2 xl:ml-0">
      <p className="text-neu5 font-bold uppercase">{name}</p>
      {labels.map(([label, href], index) => (
        <Link
          key={index}
          href={href}
          className="text-neu8 hover:text-neu8/80 z-10 text-lg"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-neu1 relative flex flex-col justify-between gap-39 overflow-hidden pt-5 xl:h-[312px] xl:flex-row">
      <div className="flex flex-col">
        <div className="h-78">
          <Footskie className="absolute -left-16 w-auto" />
          <Logo className="absolute top-19 left-15 h-7 w-auto" />
        </div>
        <div className="absolute top-67.5 right-30 left-15 flex flex-col items-start justify-between gap-6 text-sm xl:flex-row xl:items-center">
          <div className="flex flex-col gap-1 xl:flex-row">
            <p className="text-neu5">© 2025 SearchNEU.</p>
            <p className="text-neu7">
              Made with{" "}
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
                className="text-neu5 hover:text-neu5/80 underline"
              >
                Sandbox
              </a>{" "}
              in Boston, MA.
            </p>
          </div>
          <div className="text-neu6 flex flex-col gap-6 xl:flex-row">
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
      <div className="mr-12 flex flex-col justify-end gap-6 xl:flex-row xl:pt-14">
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
            ["GraduateNU", "https://www.sandboxnu.com/"],
            ["Cooper", "https://www.sandboxnu.com/"],
          ]}
        />
      </div>
    </footer>
  );
}
