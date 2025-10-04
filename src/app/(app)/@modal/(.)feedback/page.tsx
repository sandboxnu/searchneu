import { Dialog } from "@/components/ui/dialog";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { Modal } from "@/components/feedback/Modal";

export default function Page() {
  return (
    <Modal>
      <FeedbackForm />{" "}
    </Modal>
  );
}
