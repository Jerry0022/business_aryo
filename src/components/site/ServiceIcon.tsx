import { Droplets, Hammer, Layers, MessagesSquare, PanelBottom, Sparkles, type LucideProps } from "lucide-react";
import type { ServiceIcon as ServiceIconName } from "./content";

function HerringboneIcon(props: LucideProps) {
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
      <path d="m12 3 6 6-2 2-6-6z" />
      <path d="m10 5-6 6 2 2 6-6" />
      <path d="m12 9 6 6-2 2-6-6" />
      <path d="m10 11-6 6 2 2 6-6" />
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
  herringbone: HerringboneIcon,
  sanding: Sparkles,
  oil: Droplets,
  repair: Hammer,
  stairs: StairsIcon,
  vinyl: Layers,
  skirting: PanelBottom,
  advice: MessagesSquare,
};

export function ServiceIcon({ name, ...props }: LucideProps & { name: ServiceIconName }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
