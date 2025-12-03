"use client";

import Link from "next/link";
import { Neu } from "../icons/Neu";
import { Logo } from "../icons/logo"

type Prop = {
  name: string;
  labels: [string, string][];
}

export function Helper(prop: Prop) {
  return <div className="flex flex-col ml-15 gap-2 w-45 mb-6 items-start xl:ml-0">
    <p className="font-bold text-neu5 uppercase">{prop.name}</p>
   {prop.labels.map(([label, href], index) => (
        <Link
          key={index}
          href={href}
          className="text-lg text-neu8 hover:text-neu8/80 z-10"
        >
          {label}
        </Link>
      ))}
          </div>

}

export function Footer() {
  return (
    <footer className="relative flex flex-col xl:flex-row xl:h-[312px] justify-between gap-39 pt-5 bg-neu1 overflow-hidden">
      <div className="flex flex-col">
        <div className="h-78">
          <Neu className="absolute h-110 w-auto -left-20" />
          <Logo className="absolute top-19 left-15 h-7 w-auto"/>
        </div>
        <div className="flex flex-col gap-6 xl:flex-row items-start xl:items-center justify-between absolute left-15 top-70 right-30 text-sm">
            <div className="flex gap-1 flex-col xl:flex-row">
              <p className="text-neu5">2025 SearchNEU.</p>
              <p className="text-neu7">
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
                  className="underline text-neu5 hover:text-neu5/80"
                >
                  Sandbox
                </a>
                {" "} in Boston, MA.
              </p>
            </div>
            <div className="flex flex-col text-neu6 xl:flex-row gap-6">
              <div><a href="/terms" className="hover:text-neu6/80">Terms & Conditions</a></div>
              <div><a href="/privacy" className="hover:text-neu6/80">Privacy Policy</a></div>
            </div>
          </div>
      </div>
      <div className="flex flex-col xl:flex-row justify-end xl:pt-14 mr-12 gap-6">
          <Helper name="Product"
                    labels={[
                      ["Home", "/"],
                      ["Catalog", "/catalog"],
                      ["Rooms", "/rooms"],
                    ]}/>
          <Helper name="Resources"
                    labels={[
                      ["Changelog", "/changelog"],
                      ["FAQ", "/faq"],
                    ]}/>
          <Helper name="Development"
                    labels={[
                      ["Documentation", "/docs"],
                      ["Github", "https://github.com/sandboxnu/searchneu"],
                    ]}/>
          <Helper name="Affiliations"
                    labels={[
                      ["Sandbox", "https://www.sandboxnu.com/"],
                      ["GraduateNU", "https://www.sandboxnu.com/"],
                      ["Cooper", "https://www.sandboxnu.com/"],
                    ]}/>
      </div>
    </footer>
  );
}
