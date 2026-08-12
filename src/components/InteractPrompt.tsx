"use client";

/**
 * Contextual interact prompt — visible only while near a destination.
 * Desktop: "E — Action". Touch: compact ENTER button (lower-right via CSS).
 */

interface InteractPromptProps {
  action: string | null;
  touchMode?: boolean;
  onEnter?: () => void;
}

export function InteractPrompt({
  action,
  touchMode = false,
  onEnter,
}: InteractPromptProps) {
  if (!action) return null;

  if (touchMode) {
    return (
      <button
        type="button"
        className="touch-enter"
        onClick={onEnter}
        aria-label={`Enter — ${action}`}
      >
        <span className="touch-enter__label">ENTER</span>
        <span className="touch-enter__action">{action}</span>
      </button>
    );
  }

  return (
    <div className="interact-prompt" role="status">
      <button
        type="button"
        className="interact-prompt__key"
        data-action="enter"
        onClick={onEnter}
        aria-label={action}
      >
        E
      </button>
      <span className="interact-prompt__sep">—</span>
      <span className="interact-prompt__action">{action}</span>
    </div>
  );
}
