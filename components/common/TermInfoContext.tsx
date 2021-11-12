import React, { useState, useEffect } from 'react';
import { fetchTermInfo, TermInfo } from '../../components/terms';
import { Campus } from '../../components/types';
import PropTypes from 'prop-types';

const emptyTermInfos: { [key: string]: TermInfo[] } = Object.values(
  Campus
).reduce((acc, curr) => {
  acc[curr] = [];
  return acc;
}, {});

export const termsContext = React.createContext(emptyTermInfos);

export const TermInfoProvider = ({ children }) => {
  const [termInfos, setTermInfos] = useState(emptyTermInfos);

  useEffect(() => {
    fetchTermInfo().then((result) => setTermInfos(result));
  }, []);

  const { Provider } = termsContext;
  return <Provider value={termInfos}>{children}</Provider>;
};

TermInfoProvider.propTypes = {
  children: PropTypes.node,
};
