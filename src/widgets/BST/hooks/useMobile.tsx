import React from 'react';
import { throttle } from 'lodash';

const useMobile = () => {
  const [width, setWidth] = React.useState(Infinity);

  React.useEffect(() => {
    function handler() {
      setWidth(window.innerWidth);
    }

    setWidth(window.innerWidth);

    const throttledHandler = throttle(handler, 500);

    window.addEventListener('resize', throttledHandler);

    return () => {
      window.removeEventListener('resize', throttledHandler);
    };
  }, []);

  return width < 1200;
};

export default useMobile;
