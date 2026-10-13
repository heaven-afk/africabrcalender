"use client";

import React, { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

const STORAGE_KEY = "ios-install-prompt-dismissed";

export const IOSInstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem(STORAGE_KEY) === "1";

    if (isIos && !isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="ios-prompt" role="status" aria-live="polite">
      <div className="ios-prompt__inner">
        <Share className="ios-prompt__icon" aria-hidden="true" />
        <p>
          To get notifications on iPhone, tap <Share aria-label="Share" className="ios-prompt__inline-icon" />
          {" "}then <strong>Add to Home Screen</strong>.
        </p>
        <button onClick={dismiss} aria-label="Dismiss install prompt">
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
