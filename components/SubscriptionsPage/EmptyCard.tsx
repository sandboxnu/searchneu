import { ReactElement } from 'react';
import React, { useState } from 'react';
import { ClassCardWrapper } from './ClassCard';
import { useRouter } from 'next/router';
import Circular from '../icons/circular.svg';
import CryingHusky from '../icons/crying-husky.svg';
import HappyHusky from '../icons/happy-husky.svg';
import getTermInfosWithError from '../../utils/TermInfoProvider';
import { getTermName } from '../terms';

export const EmptyCard = (): ReactElement => {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  const termInfos = getTermInfosWithError().termInfos;
  const termId = router.query.termId as string;
  const termName = getTermName(termInfos, termId);

  return (
    <>
      <div className="Empty_Container">
        <div className="Empty_MainWrapper">
          <div className="Empty_Main">
            <div className="Empty_Main__EmptyCard">
              <div className="Empty_Main_EmptyCard_Header">
                <div className="Empty_Main__EmptyCard_Header_Spacer">
                  <div className="Empty_Main__EmptyCard_Header_Title">
                    <b>{termName} Notifications</b>
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
                  <div className="Empty_Main__EmptyCard_Text">
                    <div className="Empty_Main__EmptyCard_Text_Title">
                      <b>You currently have no notifications. Hoosky sad :(</b>
                    </div>
                    <div className="Empty_Main__EmptyCard_Text_Body">
                      Be the first to know when new classes and sections drop!
                    </div>
                  </div>
                }
                headerRight={
                  <div
                    className="Empty_Main__EmptyCard_Divider"
                    onClick={() => {
                      router.push('/NEU/');
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <button className="Empty_Main__EmptyCard_Button">
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
