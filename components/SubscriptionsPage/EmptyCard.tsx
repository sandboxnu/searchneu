import { ReactElement } from 'react';
import { ClassCardWrapper } from './ClassCard';
import { useRouter } from 'next/router';

export const EmptyCard = (): ReactElement => {
  const router = useRouter();

  return (
    <>
      <div className="Results_Container">
        <div className="Results_MainWrapper">
          <div className="Results_Main">
            <div className="Results_Main__EmptyCard">
              <ClassCardWrapper
                headerLeft={
                  <div className="">
                    <b className="Results_Main__EmptyCard_Title">
                      You currently have no notifications. Hoosky sad :(
                    </b>
                    <p>
                      Be the first to know when new classes and sections drop!
                    </p>
                  </div>
                }
                headerRight={
                  <div
                    onClick={() => {
                      router.push('NEU');
                    }}
                  >
                    <button>Search for classes</button>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
