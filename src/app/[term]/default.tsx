import Page from "./page";

export default function Default(props: {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <Page params={props.params} searchParams={props.searchParams} />;
}
