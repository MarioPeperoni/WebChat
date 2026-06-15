import './OnlineCount.css';

type NetLinkStatus = 'idle' | 'establishing' | 'active';

interface OnlineCountProps {
  count: number;
  status: NetLinkStatus;
}

const OnlineCount = ({ count, status }: OnlineCountProps) => {
  return (
    <div className="status-bar">
      <span className="status-cell">
        {status === 'idle' && (
          <>
            <span className="status-icon status-icon-idle">○</span> Net Link: Idle
          </>
        )}
        {status === 'establishing' && (
          <>
            <span className="status-spinner" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
            Net Link: Establishing
            <span className="status-dots" aria-hidden="true" />
          </>
        )}
        {status === 'active' && (
          <>
            <span className="status-icon status-icon-active">✓</span> Net Link: Active
          </>
        )}
      </span>
      <span className="status-cell">
        <span className="online-number">{count}</span>users on-line
      </span>
    </div>
  );
};

export default OnlineCount;
