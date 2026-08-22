import type { ReactNode } from "react";

import { Alert, Button, Spinner } from "@heroui/react";

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({
  className = "",
  label = "",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={`flex min-h-screen items-center justify-center ${className}`}>
      <div className="gap-1 text-center">
        <div>
          <Spinner className="animate-[spin_0.4s_linear_infinite] motion-reduce:animate-none" />
        </div>
        <div>{label}</div>
      </div>
    </div>
  );
}

export function ErrorState({
  actionLabel = "Try again",
  description,
  onRetry,
  title = "Something went wrong",
}: {
  actionLabel?: string;
  description: ReactNode;
  onRetry?: () => void;
  title?: ReactNode;
}) {
  return (
    <div className="px-6 py-16">
      <Alert className="mx-auto max-w-xl" status="danger">
        <Alert.Content>
          <Alert.Title>{title}</Alert.Title>
          <Alert.Description>{description}</Alert.Description>
          {onRetry && (
            <Button
              className="mt-4"
              size="sm"
              type="button"
              variant="danger"
              onPress={onRetry}
            >
              {actionLabel}
            </Button>
          )}
        </Alert.Content>
      </Alert>
    </div>
  );
}
