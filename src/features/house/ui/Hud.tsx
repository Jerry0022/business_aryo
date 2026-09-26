"use client";

import {
  Eye,
  Footprints,
  Home,
  Layers,
  List,
  Maximize,
  Minimize,
  Moon,
  Settings2,
  Sun,
  Sunrise,
  Sunset,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { MAX_ITEMS_PER_ROOM, ROOMS, roomArea } from "../data/rooms";
import { formatHour, skyStateAt } from "../engine/sun";
import type { Quality } from "../models/materials";
import { Joystick } from "./Joystick";
import { useStudio } from "./store";

const panel = "pointer-events-auto rounded-2xl border border-white/10 bg-[#0d0f12]/70 text-studio-text shadow-2xl shadow-black/30 backdrop-blur-xl";

const TIME_PRESETS = [
  { hour: 8, label: "Morgen", icon: Sunrise },
  { hour: 13, label: "Mittag", icon: Sun },
  { hour: 19.9, label: "Abend", icon: Sunset },
  { hour: 22.5, label: "Nacht", icon: Moon },
] as const;

const QUALITY_LABELS: Record<Quality, string> = { high: "Hoch", medium: "Mittel", low: "Niedrig" };

/** Media query state; `false` during SSR, live on the client. */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function ModeSwitch() {
  const mode = useStudio((state) => state.mode);
  const setMode = useStudio((state) => state.setMode);
  const options = [
    { value: "overview", label: "Übersicht", icon: Eye },
    { value: "walk", label: "Begehen", icon: Footprints },
  ] as const;
  return (
    <div role="radiogroup" aria-label="Ansicht" className={`${panel} flex p-1`}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          onClick={() => setMode(value)}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
            mode === value ? "bg-oak text-ink shadow" : "text-studio-muted hover:text-white"
          }`}
        >
          <Icon className="size-4" aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function TimeControl() {
  const hour = useStudio((state) => state.hour);
  const setHour = useStudio((state) => state.setHour);
  const isNight = skyStateAt(hour).night > 0.5;

  return (
    <div className={`${panel} w-full p-3 sm:w-80`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-studio-muted">Uhrzeit</p>
          <p className="font-display text-2xl font-semibold tabular-nums" aria-live="polite">
            {formatHour(hour)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHour(isNight ? 13 : 22.5, true)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10"
          aria-label={isNight ? "Auf Tag umschalten" : "Auf Nacht umschalten"}
        >
          {isNight ? <Sun className="size-4 text-oak-light" aria-hidden /> : <Moon className="size-4 text-sky-200" aria-hidden />}
          {isNight ? "Tag" : "Nacht"}
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={23.75}
        step={0.25}
        value={Math.round(hour * 4) / 4}
        onChange={(event) => setHour(Number(event.target.value))}
        aria-label="Uhrzeit einstellen"
        className="time-slider mt-3 w-full"
      />
      <div className="mt-2 grid grid-cols-4 gap-1">
        {TIME_PRESETS.map(({ hour: presetHour, label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setHour(presetHour, true)}
            className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] text-studio-muted transition hover:bg-white/5 hover:text-white"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RoomPanel({ onClose }: { onClose?: () => void }) {
  const selectedRoomId = useStudio((state) => state.selectedRoomId);
  const focusRoom = useStudio((state) => state.focusRoom);
  const mode = useStudio((state) => state.mode);
  const setRoofHidden = useStudio((state) => state.setRoofHidden);
  const selected = ROOMS.find((room) => room.id === selectedRoomId);

  const pick = (roomId: string | null) => {
    focusRoom(roomId);
    const room = ROOMS.find((entry) => entry.id === roomId);
    if (mode === "overview") setRoofHidden(Boolean(room && room.level === "ground" && room.id !== "garden"));
  };

  return (
    <div className={`${panel} flex max-h-full min-h-0 flex-col overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-studio-muted">Traumhaus</p>
          <p className="font-display text-lg font-semibold">Räume</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => pick(null)}
            className="rounded-lg p-2 text-studio-muted transition hover:bg-white/10 hover:text-white"
            aria-label="Gesamtansicht"
            title="Gesamtansicht"
          >
            <Home className="size-4" aria-hidden />
          </button>
          {onClose ? (
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-studio-muted hover:bg-white/10 hover:text-white" aria-label="Schließen">
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Räume">
        {ROOMS.map((room) => {
          const active = room.id === selectedRoomId;
          return (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => pick(room.id)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active ? "bg-oak/20 text-white" : "text-studio-text hover:bg-white/5"
                }`}
              >
                <span>
                  <span className="block font-medium">{room.name}</span>
                  <span className="block text-xs text-studio-muted">
                    {room.level === "roof" ? "Dach" : "Erdgeschoss"} · {roomArea(room)} m²
                  </span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? "bg-oak text-ink" : "bg-white/5 text-studio-muted"}`}>
                  {room.items.length}/{MAX_ITEMS_PER_ROOM}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected ? (
        <div className="max-h-48 overflow-y-auto border-t border-white/10 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-studio-muted">Ausstattung · {selected.name}</p>
          <ul className="flex flex-wrap gap-1.5">
            {selected.items.map((item) => (
              <li key={item.id} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-studio-text">
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const quality = useStudio((state) => state.quality);
  const setQuality = useStudio((state) => state.setQuality);
  const roofHidden = useStudio((state) => state.roofHidden);
  const setRoofHidden = useStudio((state) => state.setRoofHidden);
  const walking = useStudio((state) => state.mode === "walk");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const toggleFullscreen = async () => {
    const root = document.getElementById("dream-house-root");
    if (document.fullscreenElement) await document.exitFullscreen();
    else await root?.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className="relative flex gap-2">
      <button
        type="button"
        onClick={() => setRoofHidden(!roofHidden)}
        aria-pressed={roofHidden}
        disabled={walking}
        className={`${panel} flex items-center gap-2 px-3 py-2.5 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${roofHidden ? "!bg-oak/30" : ""}`}
        title={walking ? "Im Begehen-Modus bleibt das Dach sichtbar" : "Dach ausblenden (H)"}
      >
        <Layers className="size-4" aria-hidden />
        <span className="hidden lg:inline">{roofHidden ? "Dach zeigen" : "Dach ausblenden"}</span>
      </button>
      <button
        type="button"
        onClick={toggleFullscreen}
        className={`${panel} hidden px-3 py-2.5 transition hover:bg-white/10 sm:block`}
        aria-label={fullscreen ? "Vollbild beenden" : "Vollbild"}
        title={fullscreen ? "Vollbild beenden" : "Vollbild"}
      >
        {fullscreen ? <Minimize className="size-4" aria-hidden /> : <Maximize className="size-4" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`${panel} px-3 py-2.5 transition hover:bg-white/10`}
        aria-label="Grafikeinstellungen"
        title="Grafikeinstellungen"
      >
        <Settings2 className="size-4" aria-hidden />
      </button>
      {open ? (
        <div className={`${panel} absolute right-0 top-full z-10 mt-2 w-56 p-3`}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-studio-muted">Grafikqualität</p>
          <div role="radiogroup" aria-label="Grafikqualität" className="grid grid-cols-3 gap-1">
            {(Object.keys(QUALITY_LABELS) as Quality[]).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={quality === value}
                onClick={() => setQuality(value)}
                className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  quality === value ? "bg-oak text-ink" : "bg-white/5 text-studio-muted hover:text-white"
                }`}
              >
                {QUALITY_LABELS[value]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-studio-muted">
            „Hoch“ aktiviert Umgebungsverdeckung, 4K-Schatten und Kantenglättung. Bei ruckelnder Darstellung eine Stufe niedriger wählen.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ControlsHint({ coarse }: { coarse: boolean }) {
  const mode = useStudio((state) => state.mode);
  const pointerLocked = useStudio((state) => state.pointerLocked);
  if (coarse) {
    return (
      <p className="text-center text-xs text-white/70 drop-shadow">
        {mode === "walk" ? "Links laufen · rechts umsehen" : "Wischen zum Drehen · zwei Finger zoomen · Stick bewegt"}
      </p>
    );
  }
  const hints =
    mode === "walk"
      ? pointerLocked
        ? ["WASD laufen", "Maus umsehen", "Shift rennen", "Esc Maus freigeben"]
        : ["Klick ins Bild: umsehen", "WASD laufen", "Shift rennen"]
      : ["WASD bewegen", "Maus ziehen: drehen", "Rad: zoomen", "Q/E drehen", "N Tag/Nacht", "V Begehen"];
  return (
    <ul className={`${panel} hidden flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-xs text-studio-muted md:flex`}>
      {hints.map((hint) => (
        <li key={hint}>{hint}</li>
      ))}
    </ul>
  );
}

export function Hud() {
  const coarse = useMediaQuery("(pointer: coarse)");
  const wide = useMediaQuery("(min-width: 640px)");
  const mode = useStudio((state) => state.mode);
  const pointerLocked = useStudio((state) => state.pointerLocked);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Global shortcuts: N = day/night, V = toggle view, H = roof.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const state = useStudio.getState();
      if (event.code === "KeyN") state.setHour(skyStateAt(state.hour).night > 0.5 ? 13 : 22.5, true);
      if (event.code === "KeyV") state.setMode(state.mode === "walk" ? "overview" : "walk");
      if (event.code === "KeyH") state.setRoofHidden(!state.roofHidden);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <ModeSwitch />
        <SettingsMenu />
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-between gap-3">
        {panelCollapsed ? (
          <button
            type="button"
            onClick={() => setPanelCollapsed(false)}
            className={`${panel} hidden items-center gap-2 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 lg:flex`}
          >
            <List className="size-4" aria-hidden /> Räume
          </button>
        ) : (
          <div className="hidden h-full max-h-[calc(100%-1rem)] w-72 min-h-0 lg:flex">
            <RoomPanel onClose={() => setPanelCollapsed(true)} />
          </div>
        )}
        {wide ? (
          <div className="ml-auto">
            <TimeControl />
          </div>
        ) : null}
      </div>

      {mode === "walk" && !coarse && !pointerLocked ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className={`${panel} !pointer-events-none px-5 py-3 text-sm`}>Ins Bild klicken, um sich umzusehen</p>
        </div>
      ) : null}
      {mode === "walk" && pointerLocked ? (
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow" />
      ) : null}

      <div className="flex flex-col gap-3">
        {wide ? null : <TimeControl />}
        <div className="flex items-end justify-between gap-3">
          {coarse ? <Joystick target="move" label={mode === "walk" ? "Laufen" : "Bewegen"} /> : <span />}
          <div className="flex flex-1 flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setRoomsOpen(true)}
              className={`${panel} flex items-center gap-2 px-4 py-2.5 text-sm font-medium lg:hidden`}
            >
              <List className="size-4" aria-hidden /> Räume
            </button>
            <ControlsHint coarse={coarse} />
          </div>
          {coarse && mode === "walk" ? <Joystick target="look" label="Umsehen" /> : <span className="w-0" />}
        </div>
      </div>

      {roomsOpen ? (
        <div className="pointer-events-auto absolute inset-x-3 bottom-3 top-16 z-20 flex flex-col lg:hidden">
          <RoomPanel onClose={() => setRoomsOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
