import { Link } from "react-router-dom";
import PageShell from "./_PageShell";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const NotFoundPage = () => {
  return (
    <PageShell
      title="Page not found"
      description="The page you’re looking for does not exist or may have moved."
      actions={[{ label: "Back to Home", href: "/" }]}
    >
      <div className="flex flex-col items-start gap-4">
        <Badge variant="warning">404</Badge>
        <p className="text-sm text-slate-300">Try heading back to the homepage or browse the latest jobs.</p>
        <Button as={Link} to="/jobs" variant="secondary">
          Browse Jobs
        </Button>
      </div>
    </PageShell>
  );
};

export default NotFoundPage;
