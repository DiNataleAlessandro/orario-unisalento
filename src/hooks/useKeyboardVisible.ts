import { useState, useEffect } from 'react';

export function useKeyboardVisible() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const onFocus = () => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        setKeyboardVisible(true);
      }
    };

    const onBlur = () => {
      setKeyboardVisible(false);
    };

    // Use focusin and focusout for better event delegation
    window.addEventListener('focusin', onFocus);
    window.addEventListener('focusout', onBlur);

    return () => {
      window.removeEventListener('focusin', onFocus);
      window.removeEventListener('focusout', onBlur);
    };
  }, []);

  return isKeyboardVisible;
}
