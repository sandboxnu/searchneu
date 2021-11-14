import { AppProps } from 'next/app';
import Head from 'next/head';
import React, { ReactElement } from 'react';
import 'semantic-ui-css/semantic.min.css';
import '../styles/base.scss';
import { useGoogleAnalyticsOnPageChange } from '../utils/gtag';
import { QueryParamProvider } from '../utils/QueryParamProvider';
import { TermInfoProvider } from '../utils/TermInfoProvider';

// TODO: Split CSS per page so we don't import all css in every page

function MyApp({ Component, pageProps }: AppProps): ReactElement {
  useGoogleAnalyticsOnPageChange();

  return (
    <>
      <Head>
        <meta name="description" content="Search for Northeastern" />
        <meta name="author" content="Sandbox" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <QueryParamProvider>
        <TermInfoProvider>
          <Component {...pageProps} />
        </TermInfoProvider>
      </QueryParamProvider>
    </>
  );
}

export default MyApp;
