import { merge } from 'lodash';
import Head from 'next/head';
import Link from 'next/link';
import { NextRouter } from 'next/router';
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BooleanParam, useQueryParam, useQueryParams } from 'use-query-params';
import { getRoundedTerm } from './terms';
import FilterButton from '../components/icons/FilterButton.svg';
import Logo from '../components/icons/Logo';
import macros from '../components/macros';
import {
  DEFAULT_FILTER_SELECTION,
  FilterSelection,
  QUERY_PARAM_ENCODERS,
} from '../components/ResultsPage/filters';
import SearchBar from '../components/ResultsPage/SearchBar';
import SearchDropdown from '../components/ResultsPage/SearchDropdown';
import useAtTop from '../components/ResultsPage/useAtTop';
import {
  Campus,
  EMPTY_FILTER_OPTIONS,
  SearchResult,
  UserInfo,
} from '../components/types';
import { campusToColor } from '../utils/campusToColor';
import MobileSearchOverlay from './ResultsPage/MobileSearchOverlay';
import getTermInfosWithError from '../utils/TermInfoProvider';
import IconUser from './icons/IconUser';
import SignUpModal from './notifications/modal/SignUpModal';
import NotifSignUpButton from './ResultsPage/Results/NotifSignUpButton';
import Exit from '../components/icons/exit.svg';

type HeaderProps = {
  router: NextRouter;
  title: string;
  searchData: SearchResult;
  termAndCampusToURL: (t: string, newCampus: string, query: string) => string;
  userInfo: UserInfo | null;
  onSignOut: () => void;
  onSignIn: (token: string) => void;
};

type DropdownMenuWrapperProps = {
  splashPage?: boolean;
  userInfo: UserInfo | null;
  onSignOut: () => void;
  onSignIn: (token: string) => void;
};

export const DropdownMenuWrapper = ({
  splashPage = false,
  userInfo,
  onSignOut,
  onSignIn,
}: DropdownMenuWrapperProps): ReactElement => {
  const [showModal, setShowModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleCloseDropdown = (event: Event): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleCloseDropdown);

    return () => {
      document.removeEventListener('mousedown', handleCloseDropdown);
    };
  }, []);

  const onNotifSignUp = (): void => {
    setShowModal(true);
  };

  const toggleMenuDropdown = (): void => {
    setShowMenuDropdown(!showMenuDropdown);
  };

  // Commented out until subscription page is finalized
  // const subscriptionPage = (): void => {
  //   router.push('/subscriptions');
  // };

  const DropDownMenu = (): ReactElement => {
    return (
      <div className="user-menu">
        <div
          ref={dropdownRef}
          className={
            splashPage ? 'user-menu__splash-page' : 'user-menu__icon-wrapper'
          }
          onClick={toggleMenuDropdown}
        >
          {splashPage && <>Logged In</>}
          <IconUser className="user-menu__icon" />
        </div>

        {showMenuDropdown && (
          <div ref={dropdownRef} className="user-menu__dropdown">
            <span className="user-menu__item" onClick={onSignOut}>
              <Exit style={{ marginRight: '8px' }} />
              <div className="user-menu__item--text-container">
                <span className="user-menu__item--text">Sign out</span>
                <span className="user-menu__item--phone-number">
                  {userInfo.phoneNumber}
                </span>
              </div>
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {userInfo ? (
        <DropDownMenu />
      ) : (
        <>
          <NotifSignUpButton onNotifSignUp={onNotifSignUp} />
          <SignUpModal
            visible={showModal}
            onCancel={() => setShowModal(false)}
            onSignIn={onSignIn}
            onSuccess={() => {
              setShowModal(false);
              setShowMenuDropdown(false);
            }}
          />
        </>
      )}
    </>
  );
};

export default function Header({
  router,
  title,
  searchData,
  termAndCampusToURL,
  userInfo,
  onSignOut,
  onSignIn,
}: HeaderProps): ReactElement {
  const atTop = useAtTop();
  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);

  const query = (router.query.query as string) || '';
  const termId = router.query.termId as string;
  const campus = router.query.campus as string;

  // Get the TermInfo dict from the app context
  const termInfos = getTermInfosWithError().termInfos;

  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const filters: FilterSelection = merge({}, DEFAULT_FILTER_SELECTION, qParams);

  const setSearchQuery = (q: string): void => {
    router.push(
      `/${campus}/${termId}/search/${encodeURIComponent(q)}${
        window.location.search
      }`
    );
  };

  const termAndCampusToURLCallback = useCallback(
    (t: string, newCampus: string) => {
      return termAndCampusToURL(t, newCampus, query);
    },
    [query, termAndCampusToURL]
  );

  if (!termId || !campus) return null;
  if (showOverlay && macros.isMobile) {
    return (
      <MobileSearchOverlay
        filterSelection={filters}
        filterOptions={searchData?.filterOptions || EMPTY_FILTER_OPTIONS()}
        setFilterPills={setQParams}
        onExecute={() => setShowOverlay(false)}
      />
    );
  }
  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      <div className={`Results_Header ${atTop ? 'Results_Header-top' : ''}`}>
        <Link href={`/${campus}/${termId}`}>
          <a className="Results__Logo--wrapper">
            <Logo
              className="Results__Logo"
              aria-label="logo"
              campus={campus as Campus}
            />
          </a>
        </Link>
        <div className="Results__spacer" />
        {macros.isMobile && (
          <div className="Results__mobileSearchFilterWrapper">
            <FilterButton
              className="Results__filterButton"
              aria-label="filter-button"
              onClick={() => {
                if (macros.isMobile) {
                  setShowOverlay(true);
                }
              }}
            />
            <div className="Results__searchwrapper">
              <SearchBar
                onSearch={setSearchQuery}
                query={query}
                buttonColor={campusToColor[campus]}
              />
            </div>
            <DropdownMenuWrapper
              onSignIn={onSignIn}
              onSignOut={onSignOut}
              userInfo={userInfo}
            />
          </div>
        )}
        {!macros.isMobile && (
          <div className="Results__searchwrapper">
            <SearchBar
              onSearch={setSearchQuery}
              query={query}
              buttonColor={campusToColor[campus]}
            />
          </div>
        )}
        <div className="Breadcrumb_Container">
          <div className="Breadcrumb_Container__dropDownContainer">
            <SearchDropdown
              options={Object.keys(Campus).map((c: Campus) => ({
                text: c,
                value: c,
                link: termAndCampusToURLCallback(
                  getRoundedTerm(termInfos, c, termId),
                  c
                ),
              }))}
              value={campus}
              className="searchDropdown"
              compact={false}
            />
          </div>
          <span className="Breadcrumb_Container__slash">/</span>
          <div className="Breadcrumb_Container__dropDownContainer">
            <SearchDropdown
              options={termInfos[campus].map((terminfo) => ({
                text: terminfo.text,
                value: terminfo.value,
                link: termAndCampusToURLCallback(terminfo.value, campus),
              }))}
              value={termId}
              className="searchDropdown"
              compact={false}
              key={campus}
            />
          </div>
        </div>
        {!macros.isMobile && (
          <DropdownMenuWrapper
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            userInfo={userInfo}
          />
        )}
      </div>
    </div>
  );
}
