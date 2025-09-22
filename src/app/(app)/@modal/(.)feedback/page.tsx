import { Dialog } from "@/components/ui/dialog";
import FeedbackForm from "@/components/feedbackPage/FeedbackForm";
import { Modal } from "@/components/feedbackPage/Modal";

export default function Page() {
  return (
    <Modal>
      {" "}
      <FeedbackForm />{" "}
    </Modal>
  );
}
