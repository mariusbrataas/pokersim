import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.scss';
import { joinStyles } from './joinStyles';

export function Modal({
  children,
  onClose,
  className,
  backdrop: backdropParam,
  noPadding,
  drawerOnMobile,
  noBlur,
  noBackdrop
}: {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  backdrop?: string;
  noPadding?: boolean;
  drawerOnMobile?: boolean;
  noBlur?: boolean;
  noBackdrop?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const [showDrawer, setShowDrawer] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowDrawer(visible);
    }, 50);
    return () => {
      clearTimeout(timeout);
    };
  }, [visible]);

  const handleClose =
    onClose &&
    (() => {
      setVisible(false);
      setTimeout(() => {
        onClose();
      }, 300);
    });

  const backdrop = useMemo(() => {
    if (backdropParam) return backdropParam;
    return `linear-gradient(151deg, rgba(176, 57, 98, 0.5) 0%, rgba(110, 54, 176, 0.5) 50%, rgba(225, 103, 191, 0.5) 100%)`;
  }, [backdropParam]);

  const [cardElem, setCardElem] = useState<HTMLDivElement | undefined>();

  useEffect(() => {
    if (cardElem) {
      const elem = cardElem.parentElement!;

      const passive = { passive: false };

      const listener = (e: WheelEvent | TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };
      elem.addEventListener('wheel', listener, passive);
      elem.addEventListener('touchmove', listener, passive);

      const cardListener = (e: WheelEvent | TouchEvent) => {
        e.stopPropagation();
        // e.preventDefault();
      };
      cardElem.addEventListener('wheel', cardListener, passive);
      cardElem.addEventListener('touchmove', cardListener, passive);
      return () => {
        elem.removeEventListener('wheel', listener);
        elem.removeEventListener('touchmove', listener);
        cardElem.removeEventListener('wheel', cardListener);
        cardElem.removeEventListener('touchmove', listener);
      };
    } else {
      console.log('Could not add listeners');
    }
  }, [cardElem]);

  useEffect(() => {
    if (!cardElem) return;

    const doUpdate = (event: Event) => {
      const target = event.target as VisualViewport;
      cardElem.style.top = `${target.offsetTop + target.height}px`;
    };
    window.visualViewport?.addEventListener('scroll', doUpdate);
    window.visualViewport?.addEventListener('resize', doUpdate);
    return () => {
      window.visualViewport?.removeEventListener('scroll', doUpdate);
      window.visualViewport?.removeEventListener('resize', doUpdate);
    };
  }, [cardElem]);

  const card = (
    <div
      className={joinStyles(
        styles.Card,
        showDrawer && styles.showDrawer,
        noPadding && styles.NoPadding,
        drawerOnMobile && styles.drawerOnMobile,
        className
      )}
      ref={r => {
        setCardElem(r || undefined);
      }}
      onClick={e => e.stopPropagation()}
    >
      {children}
      {noBackdrop ? (
        <div
          className={styles.DrawerClose}
          onClick={e => {
            e.stopPropagation();
            handleClose?.();
          }}
        ></div>
      ) : undefined}
    </div>
  );

  return (
    <ModalPortal>
      {noBackdrop ? (
        <>{card}</>
      ) : (
        <div
          className={joinStyles(
            styles.Modal,
            visible && styles.visible,
            noBlur && styles.noBlur,
            'noBodyScroll'
          )}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            handleClose?.();
          }}
          style={backdrop ? { background: backdrop } : undefined}
        >
          {card}
          {/* {handleClose ? (
            <div
              className={styles.Close}
              onClick={e => {
                e.stopPropagation();
                handleClose?.();
              }}
            ></div>
          ) : undefined} */}
        </div>
      )}
    </ModalPortal>
  );
}

Modal.Row = ({ children }: PropsWithChildren) => {
  return <div className={styles.row}>{children}</div>;
};

Modal.Separator = () => (
  <div className={styles.separator}>
    <span />
  </div>
);

function ModalPortal({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => setMounted(false);
  }, []);

  return mounted
    ? ReactDOM.createPortal(
        children,
        document.getElementById('modals-container')!
      )
    : null;
}
