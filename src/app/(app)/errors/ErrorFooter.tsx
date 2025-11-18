import data from "./pages/pages.json"
import PageTile from "./pages/PageTile"

export default function ErrorFooter() {
    return (
      <>
        <p className="pt-[10px] text-[20px] text-black">Looking for something specific?</p>
        <div className="pt-[10px] flex flex-row gap-[8px]" style={{height: "184px"}}>
          {data.pages.map((page) => (<PageTile key={page.title} page={page} />))}
        </div>
      </>
    )
}