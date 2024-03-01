import React, { useCallback, useEffect, useState } from 'react';
import { UserInfo } from '../components/types';
import Cookies from 'universal-cookie';
import axios from 'axios';

/**
 * gets a logged in user's information if they're logged in.
 * @returns a list of [UserInfo: UserInfo, isLoading (boolean: representing if the data is still being fetched)]
 */

const useUserInfo = (): [UserInfo | null, boolean, () => void] => {
  const [cookies, setCookies] = useState(new Cookies());
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(true);

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

  return [userInfo, isUserInfoLoading, fetchUserInfo];
};

export default useUserInfo;
