export interface Page {
  title: string;
  image: string;
  symbol: string;
  link: string;
}

export default function PageTile({page}: {page: Page}) {
  return (
    <a key={page.title} href={page.link}>
      <div className="w-[330px] h-[184px] rounded-lg border border-neu3 overflow-hidden relative">
        <img src={page.image} alt={page.title}/>
        <div className="absolute bottom-0 left-0">
          <p>{page.title}</p>
        </div>
     </div>
    </a>
  )
}