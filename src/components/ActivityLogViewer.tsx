import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export type ActivityLogEntry = {
  timestamp?: string;
  action?: string;
  status?: "success" | "error" | "info" | string;
  details?: string;
};

function formatTs(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

function statusVariant(status?: string): "default" | "secondary" | "destructive" {
  if (status === "error") return "destructive";
  if (status === "success") return "default";
  return "secondary";
}

export default function ActivityLogViewer({
  activityLog,
}: {
  activityLog?: ActivityLogEntry[] | null;
}) {
  const items = useMemo(() => (Array.isArray(activityLog) ? activityLog : []), [activityLog]);
  if (items.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardContent className="py-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="activity">
            <AccordionTrigger>Generation activity log</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {items
                  .slice()
                  .reverse()
                  .map((e, idx) => (
                    <div key={idx} className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(e.status)}>{e.status || "info"}</Badge>
                        <span className="text-sm font-medium text-foreground">
                          {e.action || "(unknown action)"}
                        </span>
                        {e.timestamp && (
                          <span className="text-xs text-muted-foreground">{formatTs(e.timestamp)}</span>
                        )}
                      </div>
                      {e.details && <p className="mt-2 text-sm text-muted-foreground">{e.details}</p>}
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
