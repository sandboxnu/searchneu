import { useState } from 'react';
import ToggleOn from '../icons/ToggleOn';
import ToggleOff from '../icons/ToggleOff';

type ToggleProps = {
  active: boolean;
  onClick: () => void;
};

const Toggle = (props: ToggleProps) => {
  const [active, setActive] = useState(props.active);

  const toggleActive = () => {
    setActive(!active);
    props.onClick();
  };

  return active ? (
    <ToggleOn onClick={toggleActive} />
  ) : (
    <ToggleOff onClick={toggleActive} />
  );
};

export default Toggle;
