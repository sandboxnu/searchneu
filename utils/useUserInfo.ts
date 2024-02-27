import { useEffect, useState } from 'react';
import { UserInfo } from '../components/types';
import Cookies from 'universal-cookie';
import axios from 'axios';

type useUserInfoReturn = {
  userInfo: UserInfo | null;
  isUserInfoLoading: boolean;
  fetchUserInfo: () => void;
  onSignOut: () => void;
  onSignIn: (token: string) => void;
};

// Custom hook to maintain all userInfo related utility functions
const useUserInfo = (): useUserInfoReturn => {
  const [cookies, setCookies] = useState(new Cookies());
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(true);

  const onSignOut = (): void => {
    cookies.remove('SearchNEU JWT', { path: '/' });
    setUserInfo(null);
  };

  const onSignIn = (token: string): void => {
    cookies.set('SearchNEU JWT', token, { path: '/' });
    fetchUserInfo();
  };

  const fetchUserInfo = async (): Promise<void> => {
    const token = cookies.get('SearchNEU JWT');
    if (token) {
      await axios
        .get(
          `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions/${token}`
        )
        .then(({ data }) => {
          setUserInfo({ token, ...data });
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      await fetchUserInfo();
      setIsUserInfoLoading(false);
    };
    fetchData();
  }, [cookies]);

  return { userInfo, isUserInfoLoading, fetchUserInfo, onSignOut, onSignIn };
};

export default useUserInfo;
