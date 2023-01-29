import { ReactElement, useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import axios from 'axios';
import { useRouter } from 'next/router';

const cookies = new Cookies();

export default function SubscrptionsPage(): ReactElement {
  const [userInfo, setUserInfo] = useState(null);
  
  const router = useRouter();
  
  useEffect(() => {
    const token = cookies.get('SearchNEU JWT');

    if (!token) {
      router.push('/');
    }
    else {
      axios.get(
        `${process.env.NEXT_PUBLIC_NOTIFS_ENDPOINT}/user/subscriptions/${token}`
      )
      .then(({ data }) => {
        setUserInfo({ token, ...data });
      });
    }
  }, []);
  
  return (
    <div >
      <div > subscriptions???? </div>
      {/* <div> userInfo </div> */}
    </div>
  );
}
