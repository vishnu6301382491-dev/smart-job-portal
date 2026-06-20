export const Input = ({ label, className = "", ...props }) => {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-[var(--page-text-soft)]">{label}</span> : null}
      <input
        className={`w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--page-text)] outline-none placeholder:text-[var(--page-text-muted)] focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 ${className}`}
        {...props}
      />
    </label>
  );
};
