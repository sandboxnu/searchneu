import { ReactElement } from 'react';
import React, { useState } from 'react';
import { ClassCardWrapper } from './ClassCard';
import { useRouter } from 'next/router';
import Circular from '../icons/circular.svg';
import CryingHusky from '../icons/crying-husky.svg';
import HappyHusky from '../icons/happy-husky.svg';

type EmptyCardProps = {
  termYear: number;
  termId: string;
};

export const EmptyCard = ({
  termYear,
  termId,
}: EmptyCardProps): ReactElement => {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <>
      <div className="Results_Container">
        <div className="Results_MainWrapper">
          <div className="Results_Main">
            <div className="Results_Main__EmptyCard">
              <div className="Results_Main_EmptyCard_Header">
                <div className="Results_Main__EmptyCard_Header_Spacer">
                  <div className="Results_Main__EmptyCard_Header_Title">
                    <b>
                      {termId} {termYear} Notifications
                    </b>
                  </div>
                </div>
                {isHovering ? (
                  <div className="Happy_Husky_SVG">
                    <HappyHusky />
                  </div>
                ) : (
                  <div className="Crying_Husky_SVG">
                    <CryingHusky />
                  </div>
                )}
              </div>
              <ClassCardWrapper
                headerLeft={
                  <div className="Results_Main__EmptyCard_Text">
                    <div className="Results_Main__EmptyCard_Text_Title">
                      <b>You currently have no notifications. Hoosky sad :(</b>
                    </div>
                    <div className="Results_Main__EmptyCard_Text_Body">
                      Be the first to know when new classes and sections drop!
                    </div>
                  </div>
                }
                headerRight={
                  <div
                    className="Results_Main__EmptyCard_Divider"
                    onClick={() => {
                      router.push('/NEU/');
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <button className="Results_Main__EmptyCard_Button">
                      <Circular />
                      <b>Search for classes</b>
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
