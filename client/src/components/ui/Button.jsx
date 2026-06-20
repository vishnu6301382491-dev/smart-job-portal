const buttonStyles = {
  primary:
    "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-glow",
  secondary:
    "bg-[var(--surface-soft)] text-[var(--page-text)] hover:bg-[var(--surface-strong)] border border-[var(--border-color)]",
  ghost:
    "bg-transparent text-[var(--page-text-soft)] hover:bg-[var(--surface-soft)] border border-transparent",
  danger:
    "bg-rose-500 text-white hover:bg-rose-400",
};

export const Button = ({ as: Component = "button", variant = "primary", className = "", ...props }) => {
  return (
    <Component
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
};
