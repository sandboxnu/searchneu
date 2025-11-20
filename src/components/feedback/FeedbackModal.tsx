import FeedbackForm from "./FeedbackForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function FeedbackModal({children}: {children?: React.ReactNode}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
        <button className="bg-r4 fixed right-0 bottom-56 z-10 flex origin-bottom-right rotate-[-90deg] flex-col rounded-t-sm px-4 py-1 text-xs text-white uppercase">
          Feedback
        </button>
      )}
      </DialogTrigger>
      <DialogContent className="lg:slide-in-from-right lg:slide-out-to-right lg:data-[state=closed]:zoom-out-100 lg:data-[state=open]:zoom-in-100 fixed lg:top-auto lg:right-2 lg:bottom-2 lg:left-auto lg:max-w-[320px] lg:translate-x-[0] lg:translate-y-[0]">
        <DialogTitle className="hidden">Feedback</DialogTitle>
        <FeedbackForm />
      </DialogContent>
    </Dialog>
  );
}
