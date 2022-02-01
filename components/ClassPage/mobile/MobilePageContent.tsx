import React, { ReactElement } from 'react';
import { useRouter } from 'next/router';

export default function MobilePageContent(): ReactElement {
  const router = useRouter();
  return (
    <div>
      Hello
      <div className="backToResults" onClick={() => router.back()}>
        Back to Search Results
      </div>
    </div>
  );
}
