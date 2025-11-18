export default function ErrorHeader({ statusCode }: { statusCode: number }) {
    return (
        <div 
          className="bg-neu1 text-center relative" 
          style={{height: "600px"}}>
          <img src="/images/errors/lanyard.png" className="w-[280px] h-[600px] absolute -top-[112px] left-1/2 -translate-x-[130px] z-10" />
          <p className="text-[248px] text-black font-semibold opacity-8 absolute top-5/12 left-1/2 -translate-x-1/2 -translate-y-1/2">{statusCode}</p>
          <div className="absolute bottom-0 left-0 right-0 pb-[42px]">
            <p className="pt-[74.88px] text-[32px] text-neu5 font-semibold">Bad fetch, page not found</p>
            <p className="pt-[5px] text-[20px] text-neu5">We searched everywhere... even under the couch</p>
          </div>
        </div>
    )
}