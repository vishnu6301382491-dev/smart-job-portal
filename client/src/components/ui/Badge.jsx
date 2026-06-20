const badgeStyles = {
  neutral: "bg-white/10 text-slate-200",
  success: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  danger: "bg-rose-500/15 text-rose-300",
  info: "bg-cyan-500/15 text-cyan-300",
};

export const Badge = ({ variant = "neutral", className = "", ...props }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[variant]} ${className}`}
      {...props}
    />
  );
};

