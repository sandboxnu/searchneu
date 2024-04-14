import Colors from '../../styles/_exports.module.scss';

type ToggleOnProps = {
  onClick: () => void;
};

const ToggleOn = (props: ToggleOnProps) => (
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
    <rect x="0.5" width="45" height="26" rx="13" fill="#E63946" />
    <path
      d="M43.5 13C43.5 19.0751 38.5751 24 32.5 24C26.4249 24 21.5 19.0751 21.5 13C21.5 6.92487 26.4249 2 32.5 2C38.5751 2 43.5 6.92487 43.5 13Z"
      fill="white"
    />
  </svg>
);

export default ToggleOn;
