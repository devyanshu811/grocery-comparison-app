"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Oops! Something went wrong</h1>
          <p className="text-muted-foreground mb-6 text-center">We're sorry for the inconvenience. Please try again.</p>
          <Button onClick={() => this.setState({ hasError: false })}>Try Again</Button>
        </div>
      )
    }

    return this.props.children
  }
}
