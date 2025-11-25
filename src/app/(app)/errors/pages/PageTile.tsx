import { Album, BookOpenText, House, Shovel } from "lucide-react";

export interface Page {
  title: string;
  image: string;
  symbol: string;
  link: string;
}

export default function PageTile({page}: {page: Page}) {
  return (
    <a key={page.title} href={page.link} className="group">
      <div className="w-[330px] h-[184px] rounded-lg border-[2px] border-neu3 group-hover:border-[#FAD7DA] overflow-hidden relative">
        <img src={page.image} alt={page.title}/>
        <div className="absolute bottom-0 left-0 bg-neu1 group-hover:bg-[#FFEBED] flex w-half items-center gap-2 rounded-full border-1 px-4 py-2 text-sm">
          {getIconComponent(page.symbol, "group-hover:text-[#CF333F]")}
          <p className="group-hover:text-[#CF333F] text-[18px] font-semibold">{page.title}</p>
        </div>
     </div>
    </a>
  )
}

function getIconComponent(symbol: string, className: string) {
  switch (symbol) {
    case "album":
      return <Album className={className} />;
    case "house":
      return <House className={className} />;
    case "book-open-text":
      return <BookOpenText className={className} />;
    default:
      return <Shovel className={className} />;
  }
}