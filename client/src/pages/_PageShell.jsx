import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";

const PageShell = ({ title, description, actions = [], children }) => {
  return (
    <div className="page-shell space-y-8">
      <section className="max-w-4xl">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Smart Job Portal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--page-text)] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--page-text-soft)] sm:text-base">{description}</p>

        {actions.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action) =>
              action.href ? (
                action.href.startsWith("#") || /^https?:\/\//i.test(action.href) ? (
                  <Button
                    key={action.label}
                    as="a"
                    href={action.href}
                    target={/^https?:\/\//i.test(action.href) ? "_blank" : undefined}
                    rel={/^https?:\/\//i.test(action.href) ? "noreferrer" : undefined}
                    variant={action.variant || "primary"}
                  >
                    {action.label}
                  </Button>
                ) : (
                  <Button key={action.label} as={Link} to={action.href} variant={action.variant || "primary"}>
                    {action.label}
                  </Button>
                )
              ) : (
                <Button key={action.label} type="button" variant={action.variant || "primary"} onClick={action.onClick}>
                  {action.label}
                </Button>
              )
            )}
          </div>
        ) : null}
      </section>

      <Card>{children}</Card>
    </div>
  );
};

export default PageShell;
