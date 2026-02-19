import Image from "next/image";

function HowToCard({
  img,
  title,
  description,
}: {
  img: string;
  title: string;
  description: string;
}) {
  const firstWord = title.split(" ")[0];
  const restOfTitle = title.split(" ").slice(1).join(" ");
  return (
    <div className="group bg-background border-neu2 relative z-10 h-[312px] w-[434px] p-2 pb-6 overflow-hidden rounded-lg border hover:shadow-[0px_4px_8px_2px_#a6a6a61f]">
      <div className="absolute top-0 h-[436px] w-[436px] -translate-y-1/3 rounded-full blur-[80px] group-hover:bg-[#FAD7DA] group-hover:opacity-60" />
      <Image src={img} width={700} height={700} alt="how to image" className="relative pb-6 rounded-lg"/>
      <div className="card-container relative px-4">
        <h4 className="card-title text-r5 pl-1 pb-4 text-[20px] font-semibold">
          {firstWord} <span className="text-neu8">{restOfTitle}</span>
        </h4>
        <p className="card-description pr-3 pl-1 text-[14px] whitespace-normal text-[#858585]">
          {description}
        </p>
      </div>
    </div>
  );
}

export { HowToCard };
