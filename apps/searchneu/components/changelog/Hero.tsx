export function ChangelogHero() {
  const numberOfCircles = 30;
  const circleSize = 400;

  return (
    <div
      className="text-neu1 relative my-6 mb-16 flex items-center justify-center overflow-hidden rounded-xl px-6 text-center"
      style={{
        background: "radial-gradient(circle, #CF333F 0%, #F08890 150%)",
        height: "288px",
      }}
    >
      {/* Background circles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: numberOfCircles }, (_, index) => {
          // Calculate spacing so circles are evenly distributed and overlap naturally
          const totalWidth = 120;
          const startPosition = -10; // Make first circle start further left
          const leftPosition =
            startPosition + (index / (numberOfCircles - 1)) * totalWidth;

          return (
            <div
              key={index}
              className="absolute top-1/2 rounded-full"
              style={{
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                left: `${leftPosition}%`,
                transform: `translateX(-50%) translateY(-50%)`,
                background: `linear-gradient(to right, rgba(255,255,255,0.0), rgba(255,255,255,0.04))`,
                zIndex: Math.max(1, numberOfCircles - index),
              }}
            />
          );
        })}
      </div>

      <div
        className="relative mx-auto max-w-4xl"
        style={{ zIndex: numberOfCircles + 10 }}
      >
        <p className="mb-2 text-base font-bold tracking-wider uppercase opacity-90">
          CHANGELOG
        </p>
        <h1 className="mb-4 text-4xl font-bold">
          See what&apos;s new with SearchNEU
        </h1>
        <p className="mx-auto max-w-2xl font-medium opacity-90">
          What&apos;s new with you? Our amazing team at Sandbox is always adding
          features and improvements, so stay up to date with all of our updates
          here.
        </p>
      </div>
    </div>
  );
}
