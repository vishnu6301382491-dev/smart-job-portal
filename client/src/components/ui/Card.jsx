export const Card = ({ className = "", ...props }) => {
  return <div className={`glass-panel rounded-2xl p-6 ${className}`} {...props} />;
};

