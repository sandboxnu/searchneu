import React, { useEffect, useState } from 'react';
import { UserInfo } from '../components/types';
import Cookies from 'universal-cookie';
import axios from 'axios';

/**
 * gets a logged in user's information if they're logged in.
 * @returns a list of [UserInfo: UserInfo, isLoading (boolean: representing if the data is still being fetched)]
 */

const useUserInfo = (): [UserInfo | null, boolean] => {
  const [cookies, setCookies] = useState(new Cookies());
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
      setIsLoading(false);
    };
    fetchData();
  }, [cookies]);

  return [userInfo, isLoading];
};

export default useUserInfo;
