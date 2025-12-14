import { Search } from "@/components/home/Search";
import { FourOFourskie } from "@/components/icons/FourOFourskie";
import {
  BellIcon,
  BookmarkIcon,
  DoorOpenIcon,
  MessageCircleCodeIcon,
  PlaneLandingIcon,
  ShovelIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-screen flex-col overflow-clip p-4 md:p-12">
      <div className="bg-neu1 relative -mb-2 flex flex-col items-center gap-3 rounded-xl pt-0 text-center md:pt-6">
        <FourOFourskie className="w-[320px] md:w-auto" />
        <h3 className="text-[32px] font-semibold md:text-[50px]">
          Bad fetch, page not found
        </h3>
        <h4 className="pb-32 text-lg md:text-[24px]">
          We searched everywhere, even under the couch
        </h4>

        <div className="absolute -bottom-5 w-full md:w-auto lg:-bottom-8">
          <Search />
        </div>
      </div>
      <div className="flex h-full w-full flex-wrap gap-2 pt-24">
        <Link
          href="/catalog"
          className="group hover:border-r1 relative h-[178px] min-w-72 flex-1 overflow-clip rounded-[12px] border border-transparent"
        >
          <Image
            src="/images/changelog/Changelog_Image_1.png"
            alt="image1"
            width={1470}
            height={546}
            className="bg-neu h-full w-full bg-blend-color brightness-90 group-hover:brightness-100"
          />
          <div className="bg-r1 absolute inset-0 opacity-0 group-hover:opacity-50" />
          <div className="bg-neu1 group-hover:bg-neu group-hover:text-neu1 absolute bottom-2 left-2 z-10 flex items-center gap-2 rounded-full px-4 py-2 text-[18px] font-semibold">
            <BookmarkIcon className="size-4" />
            Catalog
          </div>
        </Link>
        <Link
          href="/rooms"
          className="group hover:border-r1 relative h-[178px] min-w-72 flex-1 overflow-clip rounded-[12px] border border-transparent"
        >
          <Image
            src="/images/changelog/Changelog_Image_2.png"
            alt="image1"
            width={1470}
            height={546}
            className="bg-neu h-full w-full bg-blend-color brightness-90 group-hover:brightness-100"
          />
          <div className="bg-r1 absolute inset-0 opacity-0 group-hover:opacity-50" />
          <div className="bg-neu1 group-hover:bg-neu group-hover:text-neu1 absolute bottom-2 left-2 z-10 flex items-center gap-2 rounded-full px-4 py-2 text-[18px] font-semibold">
            <DoorOpenIcon className="size-4" />
            Rooms
          </div>
        </Link>
        <Link
          href="/"
          className="group hover:border-r1 relative h-[178px] min-w-72 flex-1 overflow-clip rounded-[12px] border border-transparent"
        >
          <Image
            src="/images/changelog/Changelog_Image_3.png"
            alt="image1"
            width={1470}
            height={546}
            className="bg-neu h-full w-full bg-blend-color brightness-90 group-hover:brightness-100"
          />
          <div className="bg-r1 absolute inset-0 opacity-0 group-hover:opacity-50" />
          <div className="bg-neu1 group-hover:bg-neu group-hover:text-neu1 absolute bottom-2 left-2 z-10 flex items-center gap-2 rounded-full px-4 py-2 text-[18px] font-semibold">
            <BellIcon className="size-4" />
            Trackers
          </div>
        </Link>
        <div className="flex min-w-72 flex-1 flex-col gap-2">
          <Link
            href="/"
            className="bg-neu1 hover:border-r1 group hover:text-neu hover:bg-r1/8 flex w-full flex-1 items-center gap-2 rounded-[12px] border border-transparent px-4 py-4"
          >
            <PlaneLandingIcon className="size-4" />
            <p className="font-semibold">Landing</p>
          </Link>
          <Link
            href="/changelog"
            className="bg-neu1 hover:border-r1 group hover:text-neu hover:bg-r1/8 flex w-full flex-1 items-center gap-2 rounded-[12px] border border-transparent px-4 py-4"
          >
            <MessageCircleCodeIcon className="size-4" />
            <p className="font-semibold">Changelog</p>
          </Link>
          <Link
            href="https://sandboxnu.com"
            className="bg-neu1 hover:border-r1 group hover:text-neu hover:bg-r1/8 flex w-full flex-1 items-center gap-2 rounded-[12px] border border-transparent px-4 py-4"
          >
            <ShovelIcon className="size-4" />
            <p className="font-semibold">Sandbox</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
