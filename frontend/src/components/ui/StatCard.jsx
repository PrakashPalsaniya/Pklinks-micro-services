import { cn } from "../../utils/cn";
import { Card, CardContent } from "./Card";

export function StatCard({ eyebrow, value, helper, icon: Icon, className }) {
  return (
    <Card className={cn("group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10", className)}>
      <CardContent className="flex items-start justify-between p-6">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">{eyebrow}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-black text-ink">{value}</h3>
          </div>
          {helper && <p className="text-xs leading-tight text-secondary">{helper}</p>}
        </div>
        
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/5 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
            <Icon size={24} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
