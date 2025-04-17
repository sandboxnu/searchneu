import Page from "./page";

export default function Default(props: {
  params: Promise<{ term: string; course: string }>;
}) {
  console.log("default");
  return <Page params={props.params} />;
}
