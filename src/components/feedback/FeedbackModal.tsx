import FeedbackForm from "./FeedbackForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function FeedbackModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-r4 fixed right-0 bottom-56 z-10 flex origin-bottom-right -rotate-90 flex-col rounded-t-sm px-4 py-1 text-xs text-white uppercase">
          Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="lg:slide-in-from-right lg:slide-out-to-right lg:data-[state=closed]:zoom-out-100 lg:data-[state=open]:zoom-in-100 fixed h-[664px] w-[363px] border-none lg:top-auto lg:right-6 lg:bottom-[18px] lg:left-auto lg:translate-x-0 lg:translate-y-0">
        <DialogTitle className="hidden">Feedback</DialogTitle>
        <FeedbackForm />
      </DialogContent>
    </Dialog>
  );
}
