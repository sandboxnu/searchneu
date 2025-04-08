export default function Loading() {
  return (
    <div className="py-2 px-4 flex-col gap-4 flex h-full bg-secondary">
      <span className="bg-foreground/40 rounded w-96 h-8 animate-pulse"></span>
    </div>
  );
}
