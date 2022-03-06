import React, { ReactElement, useState } from 'react';
import { GetClassPageInfoQuery } from '../../../generated/graphql';
import IconCollapseExpand from '../../icons/IconCollapseExpand';

export type MobileClassInfoExpandableProps = {
  classPageInfo: GetClassPageInfoQuery;
  title: string;
};

export default function MobileClassInfoExpandable({
  classPageInfo,
  title,
}: MobileClassInfoExpandableProps): ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mobileClassInfoExpandable">
      <div
        className={"mobileClassInfoExpandable__header" + (expanded ? "--expanded" : "")}
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
      >
        <IconCollapseExpand width="6" height="11" className="carrot" />
        <u>{title}</u>
      </div>
    </div>
  );
}
