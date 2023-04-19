import React, { ReactElement } from 'react';
import IconCollapseExpand from '../../icons/IconCollapseExpand';
import Colors from '../../../styles/_exports.module.scss';

interface MobileCollapsableDetailProps {
  title: string;
  expand: boolean;
  setExpand: (b: boolean) => void;
  renderChildren: () => JSX.Element | JSX.Element[];
}

function MobileCollapsableDetail({
  title,
  expand,
  setExpand,
  renderChildren,
}: MobileCollapsableDetailProps): ReactElement {
  return (
    <div
      className="MobileSearchResult__panel--collapsableContainer"
      role="button"
      tabIndex={0}
      onClick={() => setExpand(!expand)}
    >
      <div className="MobileSearchResult__panel--collapsableTitle">
        <IconCollapseExpand
          width="6"
          height="12"
          fill={Colors.black}
          className={expand ? 'MobileSearchResult__panel--rotatedIcon' : ''}
        />
        <span>{title}</span>
      </div>
      {expand && <div>{renderChildren()}</div>}
    </div>
  );
}

export default MobileCollapsableDetail;
