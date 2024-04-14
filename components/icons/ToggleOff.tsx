import Colors from '../../styles/_exports.module.scss';

type ToggleOffProps = {
  onClick: () => void;
};

const ToggleOff = (props: ToggleOffProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="46"
    height="26"
    viewBox="0 0 46 26"
    fill="none"
    onClick={() => {
      props.onClick();
    }}
  >
    <rect x="0.5" width="45" height="26" rx="13" fill="#D7D9DC" />
    <circle cx="13.5" cy="13" r="11" fill="white" />
  </svg>
);

export default ToggleOff;
