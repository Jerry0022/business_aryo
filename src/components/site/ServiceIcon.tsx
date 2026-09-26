import { Droplets, Hammer, Layers, MessagesSquare, PanelBottom, Sofa, Sparkles, type LucideProps } from "lucide-react";
import type { ServiceIcon as ServiceIconName } from "./content";

function PlanksIcon(props: LucideProps) {
  const { strokeWidth = 1.75, className, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9.33h18M3 14.67h18" />
      <path d="M12 4v5.33M7 9.33v5.34M16 14.67V20" />
    </svg>
  );
}

function StairsIcon(props: LucideProps) {
  const { strokeWidth = 1.75, className, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M3 20h5v-4h4v-4h4V8h5" />
      <path d="M3 20h18V8" />
      <path d="M8 16h13M12 12h9" />
    </svg>
  );
}

const ICONS: Record<ServiceIconName, (props: LucideProps) => React.ReactNode> = {
  planks: PlanksIcon,
  sanding: Sparkles,
  oil: Droplets,
  repair: Hammer,
  stairs: StairsIcon,
  vinyl: Layers,
  skirting: PanelBottom,
  advice: MessagesSquare,
  furniture: Sofa,
};

export function ServiceIcon({ name, ...props }: LucideProps & { name: ServiceIconName }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
