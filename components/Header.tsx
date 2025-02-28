import { merge } from 'lodash';
import Head from 'next/head';
import Link from 'next/link';
import router, { useRouter } from 'next/router';
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
import { MobileSearchBar } from '../components/ResultsPage/SearchBar';

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

type MobileHeaderProps = {
  searchData: SearchResult | null;
  campus: string | null;
  termId: string | null;
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
  const router = useRouter();
  const query = (router.query.query as string) || '';
  let backlink = '/';
  if (campus && termId) {
    backlink += `${campus}/${termId}/`;
  }

  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      {macros.isMobile ? (
        <MobileHeader
          searchData={searchData}
          campus={campus}
          termId={termId}
          userInfo={userInfo}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
        />
      ) : (
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
          {searchData && (
            <div className="Results__searchwrapper">
              <SearchBar
                onSearch={(q) =>
                  router.push(
                    `/${campus}/${termId}/search/${encodeURIComponent(q)}${
                      window.location.search
                    }`
                  )
                }
                query={query}
                buttonColor={campusToColor[campus]}
              />
            </div>
          )}
          <DropdownMenuWrapper
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            userInfo={userInfo}
          />
        </div>
      )}
    </div>
  );
}

function MobileHeader({
  searchData,
  campus,
  termId,
  userInfo,
  onSignIn,
  onSignOut,
}: MobileHeaderProps): ReactElement {
  const [showOverlay, setShowOverlay] = useQueryParam('overlay', BooleanParam);
  const [qParams, setQParams] = useQueryParams(QUERY_PARAM_ENCODERS);
  const filters: FilterSelection = merge({}, DEFAULT_FILTER_SELECTION, qParams);
  const router = useRouter();
  const query = (router.query.query as string) || '';
  const termInfosWithError = getTermInfosWithError();
  const termInfos = termInfosWithError.termInfos;
  const termAndCampusToURLCallback = useCallback(
    (t: string, newCampus: string) => {
      return termAndCampusToURL(t, newCampus, query);
    },
    [query]
  );

  if (showOverlay) {
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
    <div className="MobileHeader">
      <div className="MobileHeader--top">
        <Link href={'/'}>
          <a className="MobileHeader--logowrapper">
            <Logo
              className="MobileHeader--logo"
              aria-label="logo"
              campus={!campus ? Campus.NEU : (campus as Campus)}
            />
          </a>
        </Link>
        <DropdownMenuWrapper
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          userInfo={userInfo}
        />
      </div>

      <div className="MobileHeader--SearchBar">
        <MobileSearchBar
          onSearch={(q) =>
            router.push(
              `/${campus}/${termId}/search/${encodeURIComponent(q)}${
                window.location.search
              }`
            )
          }
          query={query}
        />
      </div>

      <div className="MobileHeader__bottom">
        <div className="MobileHeader__bottom--SemesterDropdown"></div>
        Mobile Dropdown
        <div className="MobileHeader__bottom--ResultData">
          <span className="MobileHeader__bottom--ResultData-Filters">
            {' '}
            {} X Filters{' '}
          </span>
          |{searchData ? searchData.results.length : 0} Results
        </div>
      </div>
    </div>
  );
}
