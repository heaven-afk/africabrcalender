"use client";

import React, { Component, ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

interface Props {
  publishableKey: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary wrapper around ClerkProvider.
 * If Clerk fails to initialize (e.g. malformed key, network error, atob failure),
 * this boundary catches the exception and renders children cleanly without crashing the page.
 */
export class ClerkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("ClerkProvider initialization error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>;
    }

    return (
      <ClerkProvider publishableKey={this.props.publishableKey}>
        {this.props.children}
      </ClerkProvider>
    );
  }
}
