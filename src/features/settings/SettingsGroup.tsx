import type { ReactNode } from 'react';

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 md:p-5">
      <h3 className="text-base leading-tight font-semibold break-words text-balance md:text-[15px]">{title}</h3>
      {children}
    </section>
  );
}
