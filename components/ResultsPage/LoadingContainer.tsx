/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { ReactElement, useEffect, useState } from 'react';
import FadeLoader from 'react-spinners/FadeLoader';
import Colors from '../../styles/_exports.module.scss';

/**
 * Page that displays while results aren't ready
 */
export default function LoadingContainer(): ReactElement {
  const [doAnimation, setDoAnimation] = useState(true);
  const halfSecond = 500;

  useEffect(() => {
    const timer = setTimeout(() => setDoAnimation(false), halfSecond);
    return () => clearTimeout(timer);
  }, []);

  return doAnimation ? (
    <div style={{ visibility: 'hidden' }} />
  ) : (
    <div className="loader">
      <FadeLoader color={Colors.neu_red} />
    </div>
  );
}
