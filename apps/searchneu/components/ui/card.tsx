import { StaticImageData } from "next/image";

interface CardProps {
    img: string;
    title: string;
    description: string;
}

function Card({ img, title, description}: CardProps) {
  return (
    <div className="card bg-white" style={{width: '434px', height: '312px', borderRadius: '8px', boxShadow: '0px 4px 8px 2px #A6A6A61F'}}>
      <img src={img} className="card-img" />
      <div className="card-container" style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px'}}>
        <h4 className="card-title text-[20px] text-[#333333]">{title}</h4>
        <p className="card-description whitespace-normal text-[14px] text-[#858585]">{description}</p>
        </div>
    </div>
  );
}

export { Card };
