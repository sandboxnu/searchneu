/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import { GetStaticPathsResult, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { ReactElement, useEffect, useState } from 'react';
import Footer from '../../components/Footer';
import { fetchTermInfo } from '../../components/terms';
import HomeSearch from '../../components/HomePage/HomeSearch';
import ExploratorySearchButton from '../../components/HomePage/ExploratorySearchButton';
import Boston from '../../components/icons/boston.svg';
import Husky from '../../components/icons/Husky';
import Logo from '../../components/icons/Logo';
import LoadingContainer from '../../components/ResultsPage/LoadingContainer';
import { Campus } from '../../components/types';
import TestimonialModal from '../../components/Testimonial/TestimonialModal';
import getTermInfosWithError from '../../utils/TermInfoProvider';
import { DropdownMenuWrapper } from '../../components/Header';
import useUserInfo from '../../utils/useUserInfo';
import AlertBanner, {
  AlertBannerData,
} from '../../components/common/AlertBanner';
import GraduateLogo from '../../components/icons/GraduateLogo';
import Cookies from 'universal-cookie';
import TestimonialToast from '../../components/Testimonial/TestimonialToast';
import macros from '../../components/macros';

const grad_banner_data: AlertBannerData = {
  text: 'has just released!',
  alertLevel: 'info',
  link: 'https://www.graduatenu.com/',
  linkText: 'Try it out now!',
  logo: GraduateLogo,
};

export default function Home(): ReactElement {
  const router = useRouter();

  const campus = (router.query.campus as Campus) || Campus.NEU;
  const termInfosWithError = getTermInfosWithError();
  const termInfosError = termInfosWithError.error;
  const termInfos = termInfosWithError.termInfos;
  const LATEST_TERM =
    termInfos[campus].length > 0 ? termInfos[campus][0]['value'] : '';
  const termId = (router.query.termId as string) || LATEST_TERM;

  const { userInfo, fetchUserInfo, onSignIn, onSignOut } = useUserInfo();

  const [showHelpModal, setShowHelpModal] = useState(false);

  const fetchFeedbackToken = async (): Promise<void> => {
    const cookies = new Cookies();
    const existingToken = cookies.get('FeedbackModal JWT');
    if (!existingToken) {
      setShowHelpModal(true);
      const newtoken = 'alreadyShowedModal';
      cookies.set('FeedbackModal JWT', newtoken, { path: '/' });
    }
  };

  useEffect(() => {
    fetchFeedbackToken();
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (termInfosError) {
      console.log("We've encountered an error: " + termInfosError);
      router.push('/error');
    }
  }, [router, termInfosError]);

  return (
    <>
      <div>
        <div className="alertBannerContainer">
          <AlertBanner key={'grad_banner'} alertBannerData={grad_banner_data} />
        </div>
        <div className={'home-container'}>
          {/*TODO: remove when notification is fixed */}
          <Head>
            <title>Search NEU - {campus} </title>
          </Head>
          <a
            href="https://www.sandboxnu.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="sandboxLogoContainer"
          >
            <Image
              src="/images/sandbox-logo.png"
              alt="sandbox logo"
              width={47}
              height={61}
            />
          </a>
          <div className="signInButtonContainer">
            <DropdownMenuWrapper
              splashPage={true}
              userInfo={userInfo}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
            />
          </div>

          <TestimonialModal
            visible={showHelpModal}
            onCancel={() => setShowHelpModal(false)}
          />

          <div>
            <div // TODO: Take this out and restyle this monstrosity from scratch
              className="ui center spacing aligned icon header topHeader"
            >
              <div className="centerTextContainer">
                <Logo className="logo" aria-label="logo" campus={campus} />
                {termInfos[campus].length == 0 ? (
                  <LoadingContainer />
                ) : (
                  <HomeSearch termId={termId} campus={campus} />
                )}
                <ExploratorySearchButton termId={termId} campus={campus} />
              </div>
              <Husky className="husky" campus={campus} aria-label="husky" />
              <div className="bostonContainer">
                <Boston className="boston" aria-label="logo" />
              </div>
              {!macros.isMobile && (
                <TestimonialToast position={'toast-bottom-left'} />
              )}
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}

// Tells Next what to statically optimize
export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const result: GetStaticPathsResult = { paths: [], fallback: false };
  const termInfosWithError = await fetchTermInfo();
  const termInfos = termInfosWithError.termInfos;

  for (const campus of Object.values(Campus)) {
    for (const termId of termInfos[campus]) {
      result.paths.push({
        params: { campus, termId: termId.value as string },
      });
    }
  }
  return result;
}

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};
