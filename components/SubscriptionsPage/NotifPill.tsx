type NotifPillProps = {
  active: boolean;
  CRN: string;
};

const NotifPill = (props: NotifPillProps) => {
  return (
    <div className="NotifPill">
      <div
        className={props.active ? 'NotifPill__active' : 'NotifPill__inactive'}
      ></div>
      <div className="NotifPill__CRN">{props.CRN}</div>
    </div>
  );
};

export default NotifPill;
