import type { ReactNode } from "react";

export default function ProfileItemLayout({ children }: { children: ReactNode }) {
    return <div className="mx-auto w-full max-w-2xl px-4">{children}</div>;
}
