export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 pr-6">
      <div className="w-22.5 shrink-0 py-1">
        <span className="text-neu4 text-[10px] font-bold">{label}</span>
      </div>
      <span className="text-neu8 text-xs">{value}</span>
    </div>
  );
}
