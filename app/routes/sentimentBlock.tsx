import { useEffect, useRef, useState } from "react";
import styles from "./sentimentBlock.module.css";

// Options must match what we pass to prompt() later (see https://developer.chrome.com/docs/ai/prompt-api)
const SENTIMENT_AVAILABILITY_OPTIONS = {
  expectedInputs: [{ type: "text" as const, languages: ["en"] }],
  expectedOutputs: [{ type: "text" as const, languages: ["en"] }],
};

type AvailabilityStatus =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

async function fetchAvailabilityStatus(): Promise<AvailabilityStatus> {
  if (!LanguageModel?.availability) return "unavailable";

  try {
    const status = await LanguageModel.availability(
      SENTIMENT_AVAILABILITY_OPTIONS,
    );
    if (
      status === "unavailable" ||
      status === "downloadable" ||
      status === "downloading" ||
      status === "available"
    ) {
      return status;
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

function buildSentimentPrompt(userText: string): string {
  const escaped = userText.trim().replace(/\s+/g, " ");
  return `What is the sentiment of the following text? Reply with only one short word or phrase (e.g. positive, negative, neutral, mixed). Text: ${escaped}.`;
}

/** Maps model reply to a fixed label (4.1); never display raw. Unknown/empty → neutral (4.2). */
function normalizeSentimentResponse(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t.includes("positive")) return "positive";
  if (t.includes("negative")) return "negative";
  if (t.includes("mixed")) return "mixed";
  if (t.includes("neutral")) return "neutral";
  return "neutral";
}

export function SentimentBlock() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus | null>(null);
  const sessionRef = useRef<LanguageModel | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchAvailabilityStatus().then(setAvailabilityStatus);
  }, []);

  const unsupported = availabilityStatus === "unavailable";

  const analyseButtonEnabled =
    (availabilityStatus === "available" ||
      availabilityStatus === "downloadable") &&
    !isAnalyzing;
  const analyseButtonLabel =
    availabilityStatus === "downloading" ? "Downloading…" : "Analyse sentiment";

  const handleAnalyse = async () => {
    if (
      availabilityStatus !== "available" &&
      availabilityStatus !== "downloadable"
    ) {
      return;
    }
    if (!LanguageModel?.create) return;

    setIsAnalyzing(true);
    if (!sessionRef.current) {
      try {
        sessionRef.current = await LanguageModel.create(
          SENTIMENT_AVAILABILITY_OPTIONS,
        );
      } catch {
        setResult("Error starting session");
        setIsAnalyzing(false);
        return;
      }
    }

    const promptText = buildSentimentPrompt(text);
    try {
      const rawResponse = await sessionRef.current.prompt(promptText);
      const label = normalizeSentimentResponse(rawResponse);
      setResult(label);
    } catch {
      setResult("Error analysing sentiment");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const statusMessage =
    availabilityStatus === "available"
      ? "Sentiment analysis ready"
      : availabilityStatus === "downloadable"
        ? "Click to enable"
        : availabilityStatus === "downloading"
          ? "Downloading model…"
          : null;

  return (
    <section className={styles.block} aria-labelledby="sentiment-heading">
      <h2 id="sentiment-heading" className={styles.heading}>
        Sentiment analysis on Built-in AI
      </h2>
      {unsupported === true && (
        <p className={styles.unsupportedMessage}>
          Sentiment analysis is only available in supported Chrome environments.
        </p>
      )}
      {!unsupported && statusMessage !== null && (
        <p className={styles.statusIndicator} role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter a short sentence…"
        rows={3}
        aria-label="Text to analyse"
        disabled={!analyseButtonEnabled}
      />
      <button
        type="button"
        className={styles.button}
        onClick={handleAnalyse}
        aria-label={isAnalyzing ? "Analysing…" : analyseButtonLabel}
        disabled={!analyseButtonEnabled}
      >
        {isAnalyzing ? (
          <>
            <span className={styles.spinnerInButton} aria-hidden="true" />
            Analysing…
          </>
        ) : (
          analyseButtonLabel
        )}
      </button>
      <div
        className={styles.result}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {result !== null ? result : "\u00A0"}
      </div>
    </section>
  );
}
