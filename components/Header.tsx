import { merge } from 'lodash';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BooleanParam, useQueryParam, useQueryParams } from 'use-query-params';
import Exit from '../components/icons/exit.svg';
import FilterButton from '../components/icons/FilterButton.svg';
import Logo from '../components/icons/Logo';
import { default as macros } from '../components/macros';
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
import getTermInfosWithError from '../utils/TermInfoProvider';
import IconUser from './icons/IconUser';
import SignUpModal from './notifications/modal/SignUpModal';
import MobileSearchOverlay from './ResultsPage/MobileSearchOverlay';
import NotifSignUpButton from './ResultsPage/Results/NotifSignUpButton';
import { getRoundedTerm } from './terms';

const isWindow = typeof window !== 'undefined';
export const termAndCampusToURL = (
  t: string,
  newCampus: string,
  query: string
): string => {
  return `/${newCampus}/${t}/search/${encodeURIComponent(query)}${
    isWindow && window.location.search
  }`;
};

type HeaderProps = {
  title: string;
  campus: string | null;
  termId: string | null;
  searchData: SearchResult | null;
  userInfo: UserInfo | null;
  onSignIn: (token: string) => void;
  onSignOut: () => void;
};

type DropdownMenuWrapperProps = {
  userInfo: UserInfo | null;
  onSignOut: () => void;
  onSignIn: (token: string) => void;
};

export const DropdownMenuWrapper = ({
  userInfo,
  onSignOut,
  onSignIn,
}: DropdownMenuWrapperProps): ReactElement => {
  const [showModal, setShowModal] = useState(false);
  // const showMenuDropdown = useRef(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const [userLoggedOut, setUserLoggedOut] = useState(false);

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

  const NotificationsButton = (): ReactElement => (
    <Link href="/subscriptions">
      <a className="notificationsButton">Notifications</a>
    </Link>
  );

  const DropDownMenu = useMemo(() => {
    const toggleMenuDropdown = (): void => {
      setShowMenuDropdown(!showMenuDropdown);
    };

    const MemoizedDropDownMenu = (): ReactElement => (
      <div className="user-menu">
        <div className={'user-menu__icon-wrapper'}>
          <>
            {/* {userInfo && !macros.isMobile && (
              <button
                onClick={() => router.push('/subscriptions')}
                className="user-menu__button"
              >
                Notifications
              </button>
            )} */}
            {/* Still need to create FAQ page */}
            {/* <button>FAQ</button> */}
          </>
          <div
            className="user-menu__icon"
            ref={dropdownRef}
            onClick={toggleMenuDropdown}
          >
            <IconUser />
          </div>
        </div>

        {showMenuDropdown && (
          <div
            ref={dropdownRef}
            onClick={() => {
              onSignOut(), setUserLoggedOut(true);
            }}
            className="user-menu__dropdown"
          >
            <span className="user-menu__item">
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

    MemoizedDropDownMenu.displayName = 'DropDownMenu';

    return MemoizedDropDownMenu;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenuDropdown, userInfo?.token]);

  return (
    <>
      {userInfo && !userLoggedOut ? (
        <div className="header-items">
          <NotificationsButton />
          <DropDownMenu />
        </div>
      ) : (
        <>
          <NotifSignUpButton onNotifSignUp={onNotifSignUp} />
          <SignUpModal
            visible={showModal}
            onCancel={() => setShowModal(false)}
            onSignIn={(token: string) => {
              onSignIn(token);
              setUserLoggedOut(false);
            }}
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
  title,
  campus,
  termId,
  searchData,
  userInfo,
  onSignIn,
  onSignOut,
}: HeaderProps): ReactElement {
  const atTop = useAtTop();

  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);

  const router = useRouter();
  const query = (router.query.query as string) || '';

  const termInfos = getTermInfosWithError().termInfos;

  const termAndCampusToURLCallback = useCallback(
    (t: string, newCampus: string) => {
      return termAndCampusToURL(t, newCampus, query);
    },
    [query]
  );

  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const filters: FilterSelection = merge({}, DEFAULT_FILTER_SELECTION, qParams);

  const setSearchQuery = (q: string): void => {
    router.push(
      `/${campus}/${termId}/search/${encodeURIComponent(q)}${
        window.location.search
      }`
    );
  };

  let backlink = '/';

  if (campus != null && termId != null) {
    backlink += `${campus}/${termId}/`;
  }

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
        <Link href={backlink}>
          <a className="Results__Logo--wrapper">
            <Logo
              className="Results__Logo"
              aria-label="logo"
              campus={!campus ? Campus.NEU : (campus as Campus)}
            />
          </a>
        </Link>
        <div className="Results__spacer" />
        {macros.isMobile && searchData && (
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
        {!macros.isMobile && searchData && (
          <div className="Results__searchwrapper">
            <SearchBar
              onSearch={setSearchQuery}
              query={query}
              buttonColor={campusToColor[campus]}
            />
          </div>
        )}
        {macros.isMobile && searchData && (
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
        )}
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
