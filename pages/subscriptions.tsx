import { ReactElement, useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import axios from 'axios';
import { useRouter } from 'next/router';
import { UserInfo } from '../components/types';

const cookies = new Cookies();

export default function SubscrptionsPage(): ReactElement {
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [subscriptions, setSubs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = cookies.get('SearchNEU JWT');

    if (!token) {
      router.push('/');
    } else {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions/${token}`
        )
        .then(({ data }) => {
          setUserInfo({ token, ...data });
        });
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      const subElements = [];
      for (let i = 0; i < userInfo.sectionIds.length; i++) {
        subElements.push(<div key={i}>{userInfo.sectionIds[i]}</div>);
      }
      for (let i = 0; i < userInfo.courseIds.length; i++) {
        subElements.push(
          <div key={i + userInfo.sectionIds.length}>
            {userInfo.courseIds[i]}
          </div>
        );
      }
      setSubs(subElements);
    }
  }, [userInfo]);

  return (
    <div>
      <div>{subscriptions}</div>
    </div>
  );
}
