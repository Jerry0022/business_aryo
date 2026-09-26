const SKIN = "#c98b62";
const SKIN_SHADE = "#a96d47";
const HAIR = "#15100d";
const SHIRT = "#2b221b";
const COPPER = "#d8712c";

interface MiniAryoProps {
  className?: string;
  /** Sander runs continuously (while an answer is being written) instead of in short bursts. */
  working?: boolean;
}

/**
 * Mini-Aryo: a small illustrated Aryo (black hair, full black beard) working a board with an
 * orbital sander. Pure SVG + CSS animation (see `.aryo` in globals.css), decorative only.
 */
export function MiniAryo({ className, working = false }: MiniAryoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`aryo ${className ?? ""}`}
      data-working={working}
      aria-hidden="true"
      focusable="false"
    >
      {/* Torso: dark work shirt with a copper apron */}
      <path d="M22 122C22 100 37 89 60 89s38 11 38 33Z" fill={SHIRT} />
      <path d="M45 122l1.5-24c6-3 21-3 27 0l1.5 24Z" fill={COPPER} />
      <path d="M46.5 98 43 90M73.5 98 77 90" stroke={COPPER} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="53" y="104" width="14" height="8" rx="1.5" fill="#b85d22" />

      <g className="aryo-head">
        <path d="M53 70h14v21c-4 3-10 3-14 0Z" fill={SKIN_SHADE} />
        <ellipse cx="38.5" cy="55" rx="4.2" ry="6" fill={SKIN} />
        <ellipse cx="81.5" cy="55" rx="4.2" ry="6" fill={SKIN} />
        <ellipse cx="60" cy="52" rx="21.5" ry="23.5" fill={SKIN} />

        {/* Thick black hair with curls on top */}
        <path
          d="M38.5 52C35 35 45 23 60 23s25.5 12 21.5 29c-1.8-6.5-5-10.5-9.5-12.5-6 3.2-17 3.6-24.5-.2-4.5 2.3-7.5 6.5-9 12.7Z"
          fill={HAIR}
        />
        <circle cx="44" cy="31" r="7" fill={HAIR} />
        <circle cx="52" cy="25.5" r="7.5" fill={HAIR} />
        <circle cx="61.5" cy="23.5" r="8" fill={HAIR} />
        <circle cx="71" cy="26" r="7.5" fill={HAIR} />
        <circle cx="78.5" cy="32.5" r="6.2" fill={HAIR} />

        {/* Full black beard with moustache */}
        <path
          d="M38.3 51c-.6 18 8.4 32 21.7 32.5 13.3-.5 22.3-14.5 21.7-32.5-1.6 6.5-4.3 10.8-8.5 12.4-4.2-2.6-22.2-2.6-26.4 0-4.2-1.6-6.9-5.9-8.5-12.4Z"
          fill={HAIR}
        />
        <path d="M54 69.5q6 5.5 12 0-6 1.8-12 0Z" fill="#7a3426" />
        <path
          d="M48.5 65.5c3.5-4 8.5-4.2 11.5-1.8 3-2.4 8-2.2 11.5 1.8-4 1.6-8.4 1.6-11.5.4-3.1 1.2-7.5 1.2-11.5-.4Z"
          fill={HAIR}
        />

        <path
          d="M60 49.5c-1.6 5-2.4 8.3.2 9.3 1.8.4 3-.4 2.6-1.6"
          fill="none"
          stroke={SKIN_SHADE}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <ellipse cx="47" cy="57.5" rx="3.6" ry="2" fill="#d9725a" opacity="0.35" />
        <ellipse cx="73" cy="57.5" rx="3.6" ry="2" fill="#d9725a" opacity="0.35" />

        <path
          d="M44.5 43.2q6-4 11.5-1M64 42.2q5.5-3 11.5 1"
          fill="none"
          stroke={HAIR}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <g className="aryo-eyes">
          <ellipse cx="50.5" cy="49" rx="2.7" ry="3.2" fill="#1c130f" />
          <ellipse cx="69.5" cy="49" rx="2.7" ry="3.2" fill="#1c130f" />
          <circle cx="51.4" cy="47.9" r="0.95" fill="#fff" />
          <circle cx="70.4" cy="47.9" r="0.95" fill="#fff" />
        </g>
      </g>

      {/* Board on the workbench, freshly sanded strip behind the machine */}
      <rect x="50" y="104" width="72" height="16" rx="2.5" fill="#c99352" />
      <path
        d="M56 109.5h22M84 114.5h30M58 116h16"
        stroke="#9c6a33"
        strokeOpacity="0.5"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <rect x="50" y="104" width="30" height="16" fill="#f0cf9e" opacity="0.55" />

      <g className="aryo-dust" fill="#f3d9b1">
        <circle cx="70" cy="103" r="1.9" />
        <circle cx="108" cy="102.5" r="1.5" />
        <circle cx="66" cy="100" r="1.2" />
        <circle cx="111" cy="99" r="1.1" />
        <circle cx="74" cy="100.5" r="1" />
      </g>

      {/* Arm, orbital sander, hand */}
      <path d="M83 97q3-8 6-12" stroke={SHIRT} strokeWidth="9" strokeLinecap="round" fill="none" />
      <g className="aryo-sander">
        <path d="M105 95c6 0 10 3 16 8" fill="none" stroke="#2a211a" strokeWidth="2" strokeLinecap="round" />
        <rect x="69" y="100.5" width="38" height="5" rx="2" fill="#3a2d24" />
        <path d="M72 101.5v-7c0-6 5.5-9.5 13-9.5h10c6 0 10 3.5 10 9v7.5Z" fill={COPPER} />
        <rect x="76" y="92.5" width="25" height="3" rx="1.5" fill="#f3c08a" opacity="0.9" />
        <rect x="79" y="80" width="20" height="7.5" rx="3.75" fill="#2a211a" />
        <ellipse cx="89" cy="81.5" rx="6.5" ry="4.6" fill={SKIN} />
      </g>
    </svg>
  );
}
