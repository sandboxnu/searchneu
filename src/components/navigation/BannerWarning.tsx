export function BannerWarning() {
  return (
    <div className="bg-red text-neu1 -mt-4 mb-4 flex w-full flex-col items-center justify-center gap-2 px-4 py-2 md:flex-row">
      <h3 className="text-lg font-bold">Notification Outage</h3>
      <p className="text-center md:text-left">
        Due to changes in Banner by the University, we are unable to send any
        seat tracking notifications. We are working to solve this issue.
      </p>
    </div>
  );
}
