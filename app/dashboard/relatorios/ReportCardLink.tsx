"use client";

import Link from "next/link";
import { FiFileText, FiRepeat, FiDroplet, FiDollarSign } from "react-icons/fi";
import { AnimatedIcon, type AnimatedIconName } from "@/components/ui/AnimatedIcon";

const ICON_MAP = {
  fileText: FiFileText,
  repeat: FiRepeat,
  droplet: FiDroplet,
  dollarSign: FiDollarSign,
} as const;

export type ReportIconKey = keyof typeof ICON_MAP;

export interface ReportCardLinkProps {
  href: string;
  label: string;
  description: string;
  iconKey: ReportIconKey;
  animation: AnimatedIconName;
}

export function ReportCardLink({ href, label, description, iconKey, animation }: ReportCardLinkProps) {
  const Icon = ICON_MAP[iconKey];
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-card border border-bmq-border bg-white shadow-card p-6 transition-all duration-300 ease-out hover:scale-[1.015] hover:shadow-cardHover hover:border-bmq-mid"
      style={{ backgroundColor: "var(--bmq-cardBg, #FFFFFF)" }}
    >
      <div className="rounded-lg bg-bmq-mid/40 p-3">
        <AnimatedIcon Icon={Icon} animation={animation} size={24} className="text-bmq-dark" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </Link>
  );
}
