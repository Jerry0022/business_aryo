"use client";

import { ArrowUp, Hourglass, Mail, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { siteConfig } from "@/config/site";
import { formatCountdown, parseBlocks, parseSpans } from "../format";
import { CHAT_LIMITS, QUESTIONS_PER_HOUR, type ChatErrorCode, type ChatMessage } from "../limits";
import { MiniAryo } from "./MiniAryo";

const SUGGESTIONS = [
  "Parkett oder Vinyl – was passt zu mir?",
  "Wie pflege ich einen geölten Holzboden?",
  "Kann mein Parkett abgeschliffen werden?",
  "Parkett auf Fußbodenheizung – geht das?",
] as const;

class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    /** Seconds until asking is possible again (rate limits). */
    readonly retryAfter?: number,
  ) {
    super(code);
  }
}

const ERROR_TEXT: Record<ChatErrorCode | "network", string> = {
  not_configured: "Mini-Aryo macht gerade Pause.",
  bad_request: "Diese Nachricht konnte ich nicht verarbeiten. Bitte formulieren Sie sie etwas kürzer.",
  forbidden: "Diese Anfrage wurde abgelehnt. Bitte laden Sie die Seite neu.",
  rate_limited: `Kurz durchatmen: Sie haben das Limit von ${QUESTIONS_PER_HOUR} Fragen pro Stunde erreicht.`,
  busy: "Mini-Aryo hat gerade sehr viele Fragen zu beantworten und ist ausgelastet.",
  upstream: "Da ist gerade etwas schiefgelaufen. Bitte versuchen Sie es gleich noch einmal.",
  network: "Keine Verbindung. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
};

function MessageText({ text }: { text: string }) {
  return (
    <>
      {parseBlocks(text).map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={index} className="whitespace-pre-line">
              <Spans text={block.text} />
            </p>
          );
        }
        const List = block.type;
        return (
          <List key={index} className={`space-y-1 pl-5 ${List === "ul" ? "list-disc" : "list-decimal"}`}>
            {block.items.map((item, i) => (
              <li key={i}>
                <Spans text={item} />
              </li>
            ))}
          </List>
        );
      })}
    </>
  );
}

function Spans({ text }: { text: string }) {
  return (
    <>
      {parseSpans(text).map((span, i) =>
        span.bold ? (
          <strong key={i} className="font-semibold text-ink">
            {span.text}
          </strong>
        ) : (
          <Fragment key={i}>{span.text}</Fragment>
        ),
      )}
    </>
  );
}

/** Floating service button with Mini-Aryo; opens the floor-advice chat (answered by an LLM, see llm.ts). */
export function BeraterFab() {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<ChatErrorCode | "network" | null>(null);
  /** While rate limited: epoch ms when asking is possible again, plus a ticking clock for the countdown. */
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  /** Questions left in the current hour, as reported by the API. */
  const [remaining, setRemaining] = useState<number | null>(null);

  const titleId = useId();
  const inputId = useId();
  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A short speech bubble once per page view (nothing is stored in the browser).
  useEffect(() => {
    const show = window.setTimeout(() => setTeaser(true), 4000);
    const hide = window.setTimeout(() => setTeaser(false), 14000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  // Focus moves into the chat when it opens and back to the button (visible again) when it closes.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) fabRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Keep the newest text in view while an answer streams in.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, error, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Live countdown while rate limited; unlocks the input when it reaches zero.
  useEffect(() => {
    if (blockedUntil === null) return;
    const tick = () => {
      const current = Date.now();
      if (current >= blockedUntil) {
        setBlockedUntil(null);
        setError(null);
        setRemaining(null);
      } else {
        setNow(current);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [blockedUntil]);

  const blocked = blockedUntil !== null;
  const secondsLeft = blocked ? (blockedUntil - now) / 1000 : 0;

  // Escape closes the chat wherever focus is (e.g. after a clicked suggestion disappeared).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  const toggle = () => {
    setTeaser(false);
    if (open) close();
    else setOpen(true);
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
    inputRef.current?.focus();
  };

  const send = async (text: string, previous: ChatMessage[] = messages) => {
    const question = text.trim().slice(0, CHAT_LIMITS.maxInputChars);
    if (!question || streaming || blocked) return;

    const history: ChatMessage[] = [...previous, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    // Keep keyboard focus in the chat; on touch devices this would pop up the keyboard.
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let answer = "";
    try {
      const response = await fetch("/api/berater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .slice(-CHAT_LIMITS.maxHistory)
            .map((m) => ({ ...m, content: m.content.slice(0, CHAT_LIMITS.maxMessageChars) })),
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as {
          error?: ChatErrorCode;
          retryAfter?: number;
        } | null;
        throw new ChatError(data?.error ?? "upstream", data?.retryAfter);
      }
      const left = Number(response.headers.get("X-Chat-Remaining"));
      setRemaining(Number.isFinite(left) && response.headers.has("X-Chat-Remaining") ? left : null);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        const current = answer;
        setMessages((list) => [...list.slice(0, -1), { role: "assistant", content: current }]);
      }
      answer += decoder.decode();
      if (!answer.trim()) throw new ChatError("upstream");
      setMessages((list) => [...list.slice(0, -1), { role: "assistant", content: answer.trim() }]);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof ChatError ? caught.code : "network");
      if (caught instanceof ChatError && caught.retryAfter) {
        // Rate limited: take the question back into the input so it can be sent once the timer ends.
        setBlockedUntil(Date.now() + caught.retryAfter * 1000);
        setNow(Date.now());
        setMessages((list) => list.slice(0, -2));
        setDraft(question);
        return;
      }
      // Drop an empty or half-written answer; keep the question so it can be retried.
      setMessages((list) => (answer.trim() ? list : list.slice(0, -1)));
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setStreaming(false);
      }
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(draft);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  };

  const lastUserQuestion = [...messages].reverse().find((m) => m.role === "user")?.content;
  const canRetry = error && !blocked && error !== "not_configured" && error !== "busy" && lastUserQuestion;

  return (
    <div className="berater">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="berater-panel site-light fixed inset-x-3 bottom-3 top-20 z-30 flex flex-col overflow-hidden rounded-[1.75rem] bg-paper text-ink shadow-[0_40px_90px_-30px_rgb(23_19_15/0.7)] ring-1 ring-ink/10 sm:inset-x-auto sm:bottom-[7.25rem] sm:right-7 sm:top-auto sm:h-[min(38rem,calc(100svh-9.5rem))] sm:w-[25rem]"
        >
          <header className="flex items-center gap-3 bg-ink px-4 py-3 text-paper">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-walnut ring-2 ring-copper/70">
              <MiniAryo working={streaming} className="absolute inset-0 size-full" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display text-xl font-medium leading-tight">
                Mini-Aryo
              </h2>
              <p className="text-xs text-paper/70">
                {streaming ? "schleift an einer Antwort …" : "KI-Bodenberater · Parkett & mehr"}
              </p>
            </div>
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={reset}
                className="flex size-9 items-center justify-center rounded-full text-paper/70 transition hover:bg-paper/10 hover:text-paper"
                aria-label="Neues Gespräch"
                title="Neues Gespräch"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="flex size-9 items-center justify-center rounded-full text-paper/70 transition hover:bg-paper/10 hover:text-paper"
              aria-label="Chat schließen"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div
            ref={logRef}
            className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5"
            aria-live="polite"
          >
            <div className="max-w-[88%] space-y-2 rounded-2xl rounded-tl-md bg-sand px-4 py-3 text-[0.95rem] leading-relaxed text-ink-soft">
              <p>
                Hallo! Ich bin <strong className="font-semibold text-ink">Mini-Aryo</strong>, der digitale Helfer von
                Aryo Sabouri. Fragen Sie mich alles rund um Parkett, Dielen, Vinyl, Pflege und Renovierung.
              </p>
              <p className="text-sm text-ink-muted">
                Ich bin eine KI und kann mich irren – für ein verbindliches Angebot schaut sich Aryo Ihren Boden
                persönlich an.
              </p>
            </div>

            {messages.length === 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Vorschläge">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => void send(suggestion)}
                      disabled={blocked}
                      className="rounded-full border border-ink/15 bg-white/70 px-3.5 py-2 text-left text-sm font-medium text-ink-soft transition hover:border-copper hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {messages.map((message, index) =>
              message.role === "user" ? (
                <div
                  key={index}
                  className="ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-[0.95rem] leading-relaxed text-paper"
                >
                  {message.content}
                </div>
              ) : (
                <div
                  key={index}
                  className="max-w-[88%] space-y-2.5 rounded-2xl rounded-tl-md bg-sand px-4 py-3 text-[0.95rem] leading-relaxed text-ink-soft"
                >
                  {message.content ? (
                    <MessageText text={message.content} />
                  ) : (
                    <span className="berater-typing inline-flex gap-1 py-1" aria-label="Mini-Aryo schreibt">
                      <span />
                      <span />
                      <span />
                    </span>
                  )}
                </div>
              ),
            )}

            {error ? (
              <div
                role="alert"
                className="space-y-2 rounded-2xl border border-copper/40 bg-copper/10 px-4 py-3 text-sm text-ink-soft"
              >
                <p>{ERROR_TEXT[error]}</p>
                {blocked ? (
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <Hourglass className="size-4 text-oak-deep" aria-hidden="true" />
                    <span>
                      Nächste Frage möglich in{" "}
                      <span role="timer" aria-live="off" className="tabular-nums">
                        {formatCountdown(secondsLeft)}
                      </span>
                    </span>
                  </p>
                ) : null}
                {error === "not_configured" || error === "busy" ? (
                  <p>
                    Schreiben Sie Aryo gern direkt:{" "}
                    <a
                      className="font-semibold text-oak-deep underline underline-offset-2"
                      href={`mailto:${siteConfig.email}`}
                    >
                      {siteConfig.email}
                    </a>
                  </p>
                ) : null}
                {canRetry ? (
                  <button
                    type="button"
                    onClick={() => {
                      const previous = messages.at(-1)?.role === "user" ? messages.slice(0, -1) : messages;
                      void send(lastUserQuestion, previous);
                    }}
                    className="font-semibold text-oak-deep underline underline-offset-2"
                  >
                    Erneut versuchen
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-ink/10 bg-white/60 px-3 pb-3 pt-3">
            <label htmlFor={inputId} className="sr-only">
              Ihre Frage an Mini-Aryo
            </label>
            {remaining !== null && remaining <= 3 && !blocked ? (
              <p className="mb-2 px-1 text-xs font-medium text-oak-deep">
                {remaining === 0
                  ? "Das war Ihre letzte Frage in dieser Stunde."
                  : `Noch ${remaining} ${remaining === 1 ? "Frage" : "Fragen"} in dieser Stunde.`}
              </p>
            ) : null}
            <div className="flex items-end gap-2 rounded-2xl border border-ink/15 bg-paper px-3 py-2 focus-within:border-copper">
              <textarea
                ref={inputRef}
                id={inputId}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onInputKeyDown}
                maxLength={CHAT_LIMITS.maxInputChars}
                rows={1}
                placeholder={blocked ? `Nächste Frage in ${formatCountdown(secondsLeft)}` : "Ihre Frage zum Boden …"}
                className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent py-1.5 text-[0.95rem] leading-snug text-ink outline-none placeholder:text-ink-muted [field-sizing:content]"
              />
              <button
                type="submit"
                disabled={streaming || blocked || !draft.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-copper text-ink transition hover:bg-oak-light disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Frage senden"
              >
                <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[0.72rem] leading-snug text-ink-muted">
              <span>
                KI-Antworten ohne Gewähr ·{" "}
                <Link href="/datenschutz#mini-aryo" className="underline underline-offset-2 hover:text-ink">
                  Datenschutz
                </Link>
              </span>
              <Link
                href="/#kontakt"
                onClick={close}
                className="inline-flex items-center gap-1 font-semibold text-oak-deep hover:text-ink"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                Angebot anfragen
              </Link>
            </p>
          </form>
        </section>
      ) : null}

      {teaser && !open ? (
        <button
          type="button"
          onClick={toggle}
          className="berater-teaser fixed bottom-[6.25rem] right-5 z-30 max-w-[15rem] rounded-2xl rounded-br-md bg-paper px-4 py-3 text-left text-sm font-medium text-ink shadow-[0_20px_40px_-20px_rgb(23_19_15/0.6)] ring-1 ring-ink/10 sm:right-7"
        >
          Fragen zu Parkett oder Boden? Ich helfe gern!
        </button>
      ) : null}

      <button
        ref={fabRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "Mini-Aryo schließen" : "Mini-Aryo fragen – KI-Bodenberater öffnen"}
        className={`berater-fab fixed bottom-5 right-5 z-30 size-[4.5rem] overflow-hidden rounded-full bg-walnut shadow-[0_18px_40px_-14px_rgb(23_19_15/0.8)] ring-2 ring-copper transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:ring-oak-light sm:bottom-7 sm:right-7 ${
          open ? "max-sm:hidden" : ""
        }`}
      >
        <MiniAryo working={streaming} className="absolute inset-0 size-full translate-y-[5%] scale-[1.4]" />
      </button>
    </div>
  );
}
