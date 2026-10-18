import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FeedbackLink } from "@/components/feedback/FeedbackLink";

/**
 * Renders the FAQ accordion list, displaying each question/answer pair
 * as a collapsible accordion item. Supports multiple items open at once.
 */
export function FaqAccordionSection() {
  return (
    <Accordion multiple className="pl-4">
      {FaqData.map((faq, id) => (
        <AccordionItem key={id} value={String(id)}>
          <AccordionTrigger>{faq.title}</AccordionTrigger>
          <AccordionContent>{faq.description}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const FaqData = [
  {
    title: "What is SearchNEU?",
    description:
      "SearchNEU is a search engine built for easier navigation of class and professor information to help students with course registration. Users can search for and explore all class offerings within a semester, all faculty of the University, sections for each class, and other important information. Additionally, SearchNEU allows students to subscribe to notifications for a class with no remaining seats, to get notified when an opening appears in the class.",
  },
  {
    title:
      "Is there a limit on the number of notifications I could subscribe to?",
    description:
      "Each user is limited to 12 subscriptions per semester. We recommend users unsubscribe from courses they no longer need to clear up space for different subscriptions.",
  },
  {
    title: "How can I plan and track courses I have taken/want to take?",
    description:
      "Use GraduateNU! GraduateNU is a Sandbox project that helps students Navigate the Northeastern graduation requirements and create a personalized plan of study.",
  },
  {
    title: "When will next semester's classes become available?",
    description:
      "SearchNEU is updated with the next semester's classes typically within 3 days of course information being released by Northeastern University.",
  },
  {
    title: "How do I ask a question/report an issue?",
    description: (
      <>
        Please share your thoughts using the{" "}
        <FeedbackLink>Search NEU Contact Form</FeedbackLink>.
      </>
    ),
  },
  {
    title: "Where does SearchNEU get its data?",
    description: (
      <>
        All of our course data is public information we scrape from
        Northeastern, so you can access any info with a quick search on
        searchneu.com. For more information, refer to our developer
        documentation{" "}
        <a
          href="https://docs.searchneu.com/#/"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        .
      </>
    ),
  },
  {
    title: "Who currently works on / maintains SearchNEU?",
    description: (
      <>
        SearchNEU is now developed and maintained by Sandbox. View our current
        team of developers and designers{" "}
        <a
          href="https://github.com/sandboxnu/searchneu?tab=readme-ov-file#contributors"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        .
      </>
    ),
  },
  {
    title: "What's next for SearchNEU?",
    description: (
      <>
        We are always looking for ways to enhance the experience of using
        SearchNEU. Right now, we are exploring new features and potential
        integrations between SearchNEU and GraduateNU. We would love to hear your
        ideas—share your suggestions with us through the{" "}
        <FeedbackLink>Search NEU Contact Form</FeedbackLink>!
      </>
    ),
  },
];
