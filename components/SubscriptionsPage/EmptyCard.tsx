import { ReactElement } from 'react';
import { ClassCardWrapper } from './ClassCard';
import { useRouter } from 'next/router';
import Circular from '../icons/circular.svg';

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
                  <div className="Results_Main__EmptyCard_Text">
                    <p>
                      <div className="Results_Main__EmptyCard_Text_Title">
                        <b>
                          You currently have no notifications. Hoosky sad :(
                        </b>
                      </div>
                      Be the first to know when new classes and sections drop!
                    </p>
                  </div>
                }
                headerRight={
                  <div
                    className="Results_Main__EmptyCard_Divider"
                    onClick={() => {
                      router.push('NEU');
                    }}
                  >
                    <button>
                      <div className="Results_Main__EmptyCard_Button">
                        <Circular />
                        Search for classes
                      </div>
                    </button>
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
