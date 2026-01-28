import Image from "next/image";

export interface CardProps {
  img: string;
  title: string;
  description: string;
}

function HowToCard({ img, title, description }: CardProps) {
  const firstWord = title.split(" ")[0];
  const restOfTitle = title.split(" ").slice(1).join(" ");
  return (
    <div
      className="card border-[1px] border-[#F1F2F2] bg-[#FFFFFF]"
      style={{
        width: "434px",
        height: "312px",
        borderRadius: "8px",
        boxShadow: "0px 4px 8px 2px #A6A6A61F",
      }}
    >
      <Image src={img} width={500} height={500} alt="how to image" />
      {/* <img src={img} className="card-img" /> */}
      <div
        className="card-container"
        style={{
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingTop: "16px",
        }}
      >
        <h4 className="card-title pb-3 pl-1 text-[20px] font-semibold text-[#E63946]">
          {firstWord} <span className="text-[#333333]">{restOfTitle}</span>
        </h4>
        <p className="card-description pr-3 pl-1 text-[14px] whitespace-normal text-[#858585]">
          {description}
        </p>
      </div>
    </div>
  );
}

export { HowToCard };
