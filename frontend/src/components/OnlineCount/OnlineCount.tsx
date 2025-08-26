import './OnlineCount.css';

interface OnlineCountProps {
  count: number;
}

const OnlineCount = ({ count }: OnlineCountProps) => {
  return (
    <div className="online-count">
      <span className="online-number">{count}</span> <span>users on-line</span>
    </div>
  );
};

export default OnlineCount;
