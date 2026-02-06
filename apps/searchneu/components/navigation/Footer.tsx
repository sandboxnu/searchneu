"use client";

import Link from "next/link";
import { Neu } from "../icons/Neu";
import { Logo } from "../icons/logo"
import { Footskie } from "../icons/Footskie";

export function LinkColumn({name, labels}: {name: string, labels: [string, string][]}) {
  return <div className="flex flex-col gap-2 flex-1 xl:w-45 w-fit mb-6 items-start ml-15 md:ml-0 mr-5">
    <p className="font-bold text-neu5 text-xs uppercase">{name}</p>
   {labels.map(([label, href], index) => (
        <Link
          key={index}
          href={href}
          className="text-base text-neu8 hover:text-neu8/80 z-10"
          target="_blank"
        >
          {label}
        </Link>
      ))}
          </div>

}

export function Footer() {
  return (
    <footer className="relative flex flex-col md:flex-row xl:h-[312px] justify-between gap-20 pt-5 bg-neu1 overflow-hidden">
      <div className="flex flex-col">
        <div className="h-78">
          <Footskie className="absolute w-auto -left-16" />
          <Logo className="absolute top-15 left-15 h-7 w-auto"/>
          <div className="h-78 w-[200px]"></div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row items-start items-center justify-between absolute left-15 bottom-10 md:top-67.5 right-30 text-sm">
            <div className="flex gap-1 flex-col xl:flex-row">
              <p className="text-neu6">
                2025 SearchNEU.
                Made with {" "}
                <span
                  className="cursor-pointer"
                  onMouseOver={async () => {
                    const d = document.getElementById("footer-heart");
                    if (!d) return;
                    const hearts = ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤"];
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
                by UX Designers and Developers of {" "}
                <a
                  href="https://www.sandboxnu.com/"
                  className="underline hover:text-neu6/80"
                >
                  Sandbox
                </a>
                {" "} in Boston, MA.
              </p>
            </div>
            <div className="flex flex-col text-neu6 md:flex-row gap-2 md:gap-6">
              <div><a href="/terms" className="hover:text-neu6/80">Terms & Conditions</a></div>
              <div><a href="/privacy" className="hover:text-neu6/80">Privacy Policy</a></div>
            </div>
          </div>
      </div>
      <div className="flex flex-col md:flex-row md:justify-end w-full">
        <div className="flex flex-col absolute md:static md:flex-row md:justify-end md:pt-10 w-full xl:w-auto top-32">
          <LinkColumn name="Product"
                    labels={[
                      ["Home", "/"],
                      ["Catalog", "/catalog"],
                      ["Rooms", "/rooms"],
                    ]}/>
          <LinkColumn name="Resources"
                    labels={[
                      ["Changelog", "/changelog"],
                      ["FAQ", "/faq"],
                    ]}/>
        </div>
        <div className="flex flex-col absolute md:static md:flex-row md:justify-end md:pt-10 w-full xl:w-auto top-32 left-40">
           <LinkColumn name="Development"
                    labels={[
                      ["Documentation", "/docs"],
                      ["Github", "https://github.com/sandboxnu/searchneu"],
                    ]}/>
          <LinkColumn name="Affiliations"
                    labels={[
                      ["Sandbox", "https://www.sandboxnu.com/"],
                      ["GraduateNU", "https://graduatenu.com/"],
                      ["Cooper", "https://coopernu.com/"],
                    ]}/>
        </div>
      </div>
      <div className="xs:visible md:hidden h-10 w-[200px]"></div>
    </footer>
  );
}
