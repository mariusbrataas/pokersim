import { PropsWithChildren, useEffect, useRef } from 'react';
import styles from './Drawer.module.scss';
import { addWindowListener } from './addWindowListener';

export function Drawer({
  children,
  maxHeight = '40vh',
  onClose
}: PropsWithChildren<{ maxHeight?: `${number}vh`; onClose?: () => void }>) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const drawerElem = innerRef.current;
    if (!drawerElem) return;

    const updateSize = () =>
      (drawerElem.parentElement!.style.minHeight = `min(${maxHeight}, ${drawerElem.scrollHeight}px)`);
    const observer = new MutationObserver(updateSize);
    observer.observe(drawerElem, {
      subtree: true,
      childList: true,
      attributes: true
    });

    updateSize();

    let timeout: NodeJS.Timeout | undefined;
    const removeWindowListener = addWindowListener('orientationchange', () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateSize, 500);
    });

    return () => {
      observer.disconnect();
      removeWindowListener();
      clearTimeout(timeout);
    };
  }, [innerRef]);

  return (
    <div className={styles.outer} onClick={event => event.stopPropagation()}>
      <div className={styles.inner} ref={innerRef}>
        {children}
      </div>
      {onClose ? (
        <div className={styles.close} onClick={onClose}></div>
      ) : undefined}
    </div>
  );
}
