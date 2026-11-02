// Generic Android / iPhone frames showing an original sample business app.
// Text sizes use container units, so a phone scales cleanly with its width.
// These are illustrative mockups only - not published apps.

function StatusBar({ variant }) {
  return (
    <div className="ph-status">
      <span>9:41</span>
      {variant === 'ios' ? <span className="ph-island" /> : <span className="ph-punch" />}
      <span className="ph-signal">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

// Android: field-service job list.
function AndroidScreen() {
  return (
    <>
      <div className="ph-appbar">
        <span className="ph-avatar" />
        <div>
          <b>Field Jobs</b>
          <small>Sample business app</small>
        </div>
      </div>
      <div className="ph-kpis">
        <span>
          <b>8</b>Today
        </span>
        <span>
          <b>5</b>Done
        </span>
        <span>
          <b>3</b>Open
        </span>
      </div>
      <div className="ph-list">
        {[
          ['Install check', 'done'],
          ['Site survey', 'done'],
          ['Repair visit', 'open'],
          ['Handover', 'open'],
        ].map(([t, s]) => (
          <span key={t} className="ph-row">
            <i className={`ph-dot ph-dot--${s}`} />
            {t}
            <em>{s === 'done' ? 'Done' : 'Open'}</em>
          </span>
        ))}
      </div>
      <div className="ph-fab">+</div>
      <div className="ph-nav">
        <i className="on" />
        <i />
        <i />
        <i />
      </div>
    </>
  );
}

// iOS: customer ordering / tracking.
function IosScreen() {
  return (
    <>
      <div className="ph-greet">
        <small>Good morning</small>
        <b>Your orders</b>
      </div>
      <div className="ph-hero-card">
        <small>Next delivery</small>
        <b>Today, 2:30 PM</b>
        <span className="ph-progress">
          <i />
        </span>
      </div>
      <div className="ph-list">
        {[
          ['Order #1042', 'On the way'],
          ['Order #1038', 'Delivered'],
          ['Order #1031', 'Delivered'],
        ].map(([t, s]) => (
          <span key={t} className="ph-row">
            <i className={`ph-dot ph-dot--${s === 'Delivered' ? 'done' : 'open'}`} />
            {t}
            <em>{s}</em>
          </span>
        ))}
      </div>
      <div className="ph-btn">Book again</div>
      <div className="ph-tabs">
        <i className="on" />
        <i />
        <i />
        <i />
      </div>
    </>
  );
}

// Decorative: callers describe the mockup in a caption or label, so it is hidden from screen readers.
export default function Phone({ variant = 'android', className = '' }) {
  return (
    <div className={`phone phone--${variant} ${className}`} aria-hidden="true">
      <div className="phone__screen">
        <StatusBar variant={variant} />
        {variant === 'ios' ? <IosScreen /> : <AndroidScreen />}
      </div>
    </div>
  );
}
