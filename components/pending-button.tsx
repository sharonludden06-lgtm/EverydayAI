"use client";
import { useFormStatus } from "react-dom";

export function PendingButton({
  children,
  pendingText,
  className,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  // Only the clicked button shows its pending label; all are disabled while saving.
  const mine = pending && (!name || data?.get("intent") === value);
  return (
    <button className={className} type="submit" name={name} value={value} disabled={pending}>
      {mine ? pendingText : children}
    </button>
  );
}
