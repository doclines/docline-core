import React, { useState } from 'react';

export function Tip({ children }) {
  return <div className="callout callout-tip">{children}</div>;
}

export function Note({ children }) {
  return <div className="callout callout-note">{children}</div>;
}

export function Warning({ children }) {
  return <div className="callout callout-warning">{children}</div>;
}

export function CardGroup({ cols = 2, children }) {
  return (
    <div className="card-group" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  );
}

export function Card({ title, icon, href, children }) {
  const content = (
    <div className="card">
      <h3>{icon && <span style={{ marginRight: 8 }}>{icon}</span>}{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );

  if (href) {
    return <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</a>;
  }
  return content;
}

export function Steps({ children }) {
  return <div className="steps">{children}</div>;
}

export function Step({ title, children }) {
  return (
    <div className="step">
      {title && <h4>{title}</h4>}
      {children}
    </div>
  );
}

export function Tabs({ children }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabs = React.Children.toArray(children);

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={`tab-button ${i === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            {tab.props.label || tab.props.title || `Tab ${i + 1}`}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs[activeIndex]}
      </div>
    </div>
  );
}

export function Tab({ children }) {
  return <div>{children}</div>;
}

export function CodeGroup({ children }) {
  return <Tabs>{children}</Tabs>;
}

export function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onClick={(e) => { e.preventDefault(); setOpen(!open); }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
        {title}
      </summary>
      {open && <div onClick={(e) => e.stopPropagation()}>{children}</div>}
    </details>
  );
}

export function Frame({ children, caption }) {
  return (
    <figure style={{ margin: '16px 0' }}>
      {children}
      {caption && (
        <figcaption style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: 8 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
