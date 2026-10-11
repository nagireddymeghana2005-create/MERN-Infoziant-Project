import React from 'react';

const SkeletonShape = ({ className = '' }) => (
  <span className={`loading-skeleton-shape ${className}`} aria-hidden="true" />
);

const LoadingSkeleton = ({ variant = 'appointment', count = 3, label = 'Loading content' }) => {
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <div className={`loading-skeleton-list loading-skeleton-list--${variant}`} role="status" aria-label={label}>
      {variant === 'table' && (
        <div className="loading-skeleton-table-row loading-skeleton-table-header" aria-hidden="true">
          {Array.from({ length: 5 }, (_, cell) => (
            <SkeletonShape className="loading-skeleton-line" key={cell} />
          ))}
        </div>
      )}
      {items.map((item) => {
        if (variant === 'stat') {
          return (
            <div className="loading-skeleton-stat" key={item}>
              <SkeletonShape className="loading-skeleton-icon" />
              <div className="loading-skeleton-copy">
                <SkeletonShape className="loading-skeleton-line loading-skeleton-line--short" />
                <SkeletonShape className="loading-skeleton-line loading-skeleton-line--value" />
              </div>
            </div>
          );
        }

        if (variant === 'table') {
          return (
            <div className="loading-skeleton-table-row" key={item}>
              {Array.from({ length: 5 }, (_, cell) => (
                <SkeletonShape
                  className={`loading-skeleton-line ${cell === 0 ? 'loading-skeleton-line--wide' : ''}`}
                  key={cell}
                />
              ))}
            </div>
          );
        }

        if (variant === 'doctor') {
          return (
            <article className="loading-skeleton-card loading-skeleton-doctor" key={item}>
              <SkeletonShape className="loading-skeleton-avatar" />
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--title" />
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--medium" />
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--short" />
              <SkeletonShape className="loading-skeleton-button" />
            </article>
          );
        }

        if (variant === 'specialty') {
          return (
            <article className="loading-skeleton-card loading-skeleton-specialty" key={item}>
              <SkeletonShape className="loading-skeleton-icon" />
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--title" />
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--medium" />
              <SkeletonShape className="loading-skeleton-line" />
            </article>
          );
        }

        if (variant === 'calendar') {
          return (
            <div className="loading-skeleton-calendar-day" key={item}>
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--title" />
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--short" />
              <SkeletonShape className="loading-skeleton-calendar-event" />
              <SkeletonShape className="loading-skeleton-calendar-event" />
            </div>
          );
        }

        if (variant === 'status') {
          return (
            <article className="loading-skeleton-card loading-skeleton-status" key={item}>
              <div className="loading-skeleton-appointment-heading">
                <SkeletonShape className="loading-skeleton-line loading-skeleton-line--title" />
                <SkeletonShape className="loading-skeleton-badge" />
              </div>
              {Array.from({ length: 5 }, (_, row) => (
                <SkeletonShape
                  className={`loading-skeleton-line ${row % 2 === 0 ? 'loading-skeleton-line--medium' : ''}`}
                  key={row}
                />
              ))}
              <SkeletonShape className="loading-skeleton-button" />
            </article>
          );
        }

        return (
          <article className="loading-skeleton-card loading-skeleton-appointment" key={item}>
            <div className="loading-skeleton-appointment-heading">
              <SkeletonShape className="loading-skeleton-line loading-skeleton-line--title" />
              <SkeletonShape className="loading-skeleton-badge" />
            </div>
            <SkeletonShape className="loading-skeleton-line loading-skeleton-line--medium" />
            <SkeletonShape className="loading-skeleton-line" />
          </article>
        );
      })}
    </div>
  );
};

export default LoadingSkeleton;
