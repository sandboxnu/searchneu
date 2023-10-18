import React, { useEffect, useState } from 'react';
import { UserInfo } from '../components/types';
import Cookies from 'universal-cookie';
import axios from 'axios';

const useUserInfo = (): [UserInfo | null, boolean] => {
  const cookies = new Cookies();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = cookies.get('SearchNEU JWT');
    if (token) {
      console.log('Token: ' + token);
      axios
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
  }, []);

  return [userInfo, isLoading];
};

export default useUserInfo;
