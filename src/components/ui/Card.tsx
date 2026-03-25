import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({
  title,
  subtitle,
  children,
  className,
  headerAction,
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-[#0D1626] border border-white/[0.07] rounded-xl",
        "transition-colors duration-200",
        className
      )}
    >
      {(title || headerAction) && (
        <div className={cn(
          "flex items-start justify-between",
          noPadding ? "px-5 pt-5 pb-4" : "px-5 pt-5 pb-4",
          (title || subtitle) && children ? "border-b border-white/[0.05]" : ""
        )}>
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2 ml-4">{headerAction}</div>
          )}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>
        {children}
      </div>
    </div>
  );
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function CardSection({ label, children, className }: SectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {label}
      </p>
      {children}
    </div>
  );
}
