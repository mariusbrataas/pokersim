import { useState } from 'react';
import styles from './Tabs.module.scss';
import { joinStyles } from './joinStyles';

export function Tabs<T extends Record<string, React.ReactNode>>({
  tabs,
  defaultTab,
  title
}: {
  tabs: T;
  defaultTab?: keyof T;
  title?: string;
}) {
  const [selected, setSelected] = useState(
    defaultTab || (() => Object.keys(tabs)[0])
  );

  const children = tabs[selected];

  return (
    <div className={styles.tabs}>
      <div className={styles.tabsBar}>
        {title ? <label>{title}</label> : undefined}
        <div className={styles.tabsContainer}>
          {Object.keys(tabs).map(key => (
            <button
              key={`tab_${key}`}
              className={joinStyles(
                styles.tab,
                key === selected && styles.selectedTab
              )}
              onClick={event => {
                // event.stopPropagation();
                (event.target as HTMLElement).scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'nearest'
                });
                setSelected(key);
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
