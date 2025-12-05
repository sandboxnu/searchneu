export function TimelineDot() {
  return (
    <div className="absolute h-4 w-4 -translate-x-[30px] translate-y-[1px] transform rounded-full border-4 border-[#FAD7DA] bg-[#E63946]" />
  );
}

export function Timeline() {
  return (
    <div
      className="bg-neu3 absolute top-5 left-1/2 h-full w-0.5 -translate-x-[292px] transform"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, #d1d5db 0px, #d1d5db 4px, #f3f4f6 4px, #f3f4f6 8px)",
      }}
    />
  );
}
