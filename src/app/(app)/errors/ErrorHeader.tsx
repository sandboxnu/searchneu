export default function ErrorHeader() {
  return (
    <div className="p-[24px] h-screen">
      <div className="bg-neu1 text-center h-full flex flex-col items-center justify-center relative">
        <p className="text-[248px] text-neu3 font-extrabold">500</p>
        <p className="py-[13px] text-[32px] text-neu5 font-semibold">server is down</p>
        <p className="text-[20px] text-neu5">cooked...</p>
        <img 
          src="/images/errors/500.png" 
          alt="fallen husky"
          className="absolute right-19/64 bottom-1/30 w-[370px]"
        />
      </div>
    </div>
  )
}