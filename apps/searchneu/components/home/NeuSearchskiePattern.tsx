import { Neu } from "../icons/Neu";

export function NeuSearchskiePattern({ count }: { count: number }) {
  return (
    <div className="bg-neu2 pointer-events-none absolute inset-0 -z-1 overflow-hidden">
      <div
        className="absolute inset-0 grid"
        style={{
          backgroundImage: "none",
          maskImage: "none",
          WebkitMaskImage: "none",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 130px)",
          gridAutoRows: "130px",
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        {Array.from({ length: count }, (_, index) => {
          // const row = Math.floor(index / 16);
          // const staggerOffset = (row % 2) * 25;
          return (
            <Neu
              key={index}
              className="mx-auto size-[120px] object-contain opacity-50"
              // style={{
              //   transform: `translateX(${staggerOffset}px)`,
              // }}
            />
          );
        })}
      </div>
    </div>
  );
}
