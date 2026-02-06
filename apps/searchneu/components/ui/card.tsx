interface CardProps {
    img: string;
    title: string;
    description: string;
}

function Card({ img, title, description}: CardProps) {
  const firstWord = title.split(' ')[0];
  const restOfTitle = title.split(' ').slice(1).join(' ');
  return (
    
    <div className="card group relative z-10 overflow-hidden bg-[#FFFFFF] border-[#F1F2F2] border-[1px] hover:shadow-md" style={{width: '434px', height: '312px', borderRadius: '8px'}}>
        <div className="absolute top-0 -translate-y-1/3 h-[436px] w-[436px] group-hover:bg-[#FAD7DA] group-hover:opacity-60 blur-[80px] rounded-full" />
        <img src={img} className="card-img relative pl-2 pt-2 rounded-[4px]" />
        <div className="card-container relative" style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px'}}>
          <h4 className="card-title text-[20px] text-[#E63946] pb-3 pl-1 font-semibold" >{firstWord} <span className="text-[#333333]">{restOfTitle}</span></h4>
          <p className="card-description whitespace-normal text-[14px] text-[#858585] pl-1 pr-3">{description}</p>
        </div>
    </div>
  );
}

export { Card };
