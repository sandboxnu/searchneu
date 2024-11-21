import React, { useState, useEffect, useContext, ReactElement } from 'react';
import { fetchTermInfo, TermInfo } from '../components/terms';
import { Campus } from '../components/types';
import PropTypes from 'prop-types';

const emptyTermInfos: Record<Campus, TermInfo[]> = {
  [Campus.NEU]: [],
  [Campus.CPS]: [],
  [Campus.LAW]: [],
};

const emptyTermInfosWithError = {
  error: null,
  termInfos: emptyTermInfos,
};

const termInfoReactContext = React.createContext(emptyTermInfosWithError);

export const TermInfoProvider = ({ children }): ReactElement => {
  const [termInfos, setTermInfos] = useState(emptyTermInfosWithError);

  useEffect(() => {
    fetchTermInfo().then((result) => setTermInfos(result));
  }, []);

  const { Provider } = termInfoReactContext;
  return <Provider value={termInfos}>{children}</Provider>;
};

TermInfoProvider.propTypes = {
  children: PropTypes.any,
};

const GetTermInfosWithError = (): {
  error: Error;
  termInfos: Record<Campus, TermInfo[]>;
} => useContext(termInfoReactContext);
export default GetTermInfosWithError;
