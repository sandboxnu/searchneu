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
    <div className="bg-background h-[312px] w-[434px] overflow-hidden rounded-[8px] border">
      <Image src={img} width={700} height={700} alt="how to image" />
      <div className="card-container px-4 pl-4">
        <h4 className="card-title text-r5 pb-3 pl-1 text-[20px] font-semibold">
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
