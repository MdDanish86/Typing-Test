import React, { useState, useEffect, useRef } from "react";
import paragraphs from "../data/paragraphs";
import "../styles/TypingTest.css";

// Helper: split paragraph into lines of n words each
const chunkParagraphIntoLines = (paragraph, wordsPerLine = 5) => {
  const words = paragraph.split(" ");
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  }
  return lines;
};

const TypingTest = () => {
  const [phase, setPhase] = useState("setup"); // setup | typing | finished
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [fullText, setFullText] = useState("");
  const [lines, setLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [started, setStarted] = useState(false);

  const intervalRef = useRef(null);
  const inputRef = useRef();

  // Start test: pick random paragraph, split into lines, reset states
  const startTest = () => {
    const para = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    const linesArr = chunkParagraphIntoLines(para, 5); // 5 words per line
    setFullText(para);
    setLines(linesArr);
    setCurrentLineIndex(0);
    setUserInput("");
    setTimeLeft(duration);
    setStarted(false);
    setPhase("typing");
    setTimeout(() => inputRef.current.focus(), 100);
  };

  // Timer logic
  useEffect(() => {
    if (started && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setPhase("finished");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [started, timeLeft]);

  // Handle typing input
  const handleChange = (e) => {
    const value = e.target.value;
    if (!started) setStarted(true);

    const currentLine = lines[currentLineIndex];

    // Check if user finished typing the line (space or full line)
    if (value.endsWith(" ") || value === currentLine) {
      if (value.trim() === currentLine) {
        // Correct line typed, move to next
        if (currentLineIndex + 1 < lines.length) {
          setCurrentLineIndex(currentLineIndex + 1);
          setUserInput("");
        } else {
          // Finished all lines
          setPhase("finished");
          clearInterval(intervalRef.current);
          setTimeLeft(0);
          setUserInput(value);
        }
      } else {
        setUserInput(value);
      }
    } else {
      setUserInput(value);
    }
  };

  const handleRestart = () => {
    setPhase("setup");
    setUserInput("");
    setStarted(false);
    setFullText("");
    setLines([]);
    setCurrentLineIndex(0);
    clearInterval(intervalRef.current);
  };

  // Calculate words typed and accuracy for all lines typed so far
  const calculateResults = () => {
    const totalSeconds = duration;

    // Words typed = full lines completed + words typed in current line
    const completedWords = currentLineIndex * 5;
    const currentWords = userInput.trim().split(/\s+/).filter(Boolean).length;
    const wordsTyped = completedWords + currentWords;

    // Approximate characters typed: completed words * avg chars + userInput length
    const completedChars = completedWords * 6; // avg 6 chars per word (including spaces)
    const totalCharsTyped = completedChars + userInput.length;

    // Calculate correct chars so far by comparing fullText with typed text
    const typedText =
      lines.slice(0, currentLineIndex).join(" ") + (userInput || "");
    let correctCharsCount = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === fullText[i]) {
        correctCharsCount++;
      }
    }

    const accuracy = fullText.length
      ? Math.round((correctCharsCount / typedText.length) * 100)
      : 0;
    const wps = (wordsTyped / totalSeconds).toFixed(2);
    return { wps, accuracy };
  };

  // Render all lines with coloring for completed and current line
  const renderLines = () => {
    return lines.map((line, index) => {
      if (index < currentLineIndex) {
        // Completed lines, show all words green
        return (
          <div key={index} className="line completed-line">
            {line.split(" ").map((word, i) => (
              <span key={i} className="correct-word">
                {word + " "}
              </span>
            ))}
          </div>
        );
      } else if (index === currentLineIndex) {
        // Current line - highlight words based on user input
        const inputWords = userInput.trim().split(" ");
        const originalWords = line.split(" ");
        return (
          <div key={index} className="line current-line">
            {originalWords.map((word, i) => {
              let className = "";
              if (inputWords[i] != null) {
                className =
                  inputWords[i] === word ? "correct-word" : "incorrect-word";
              }
              return (
                <span key={i} className={className}>
                  {word + " "}
                </span>
              );
            })}
          </div>
        );
      } else {
        // Future lines - normal text
        return (
          <div key={index} className="line upcoming-line">
            {line}
          </div>
        );
      }
    });
  };

  return (
    <div className="typing-wrapper">
      <div className="typing-container">
        <h1>⌨️ Typing Speed Test</h1>

        {phase === "setup" && (
          <div className="setup">
            <p>Select test duration:</p>
            <div className="button-group">
              {[60, 120, 180].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setDuration(sec)}
                  className={duration === sec ? "selected" : ""}
                >
                  {sec / 60} min
                </button>
              ))}
            </div>
            <button className="start-btn" onClick={startTest}>
              Start Test
            </button>
          </div>
        )}

        {phase === "typing" && (
          <>
            <div className="info-bar">
              <span>⏳ Time Left: {timeLeft}s</span>
              <span>
                Line {currentLineIndex + 1} / {lines.length}
              </span>
            </div>

            <div className="paragraph">{renderLines()}</div>

            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleChange}
              className="input-box"
              placeholder="Start typing here..."
              spellCheck="false"
              disabled={phase !== "typing"}
            />
          </>
        )}

        {phase === "finished" && (
          <div className="results">
            <h2>✅ Test Complete!</h2>
            <p>
              <strong>Words per second (WPS):</strong> {calculateResults().wps}
            </p>
            <p>
              <strong>Accuracy:</strong> {calculateResults().accuracy}%
            </p>
            <button onClick={handleRestart} className="restart-btn">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingTest;
