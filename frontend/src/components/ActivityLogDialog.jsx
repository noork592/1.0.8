import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, RefreshCcw } from "lucide-react";

const ACTIONS = {
  add: { label: "Added", icon: Plus, cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  edit: { label: "Edited", icon: Pencil, cls: "bg-sky-50 text-sky-800 border-sky-200" },
  delete: { label: "Deleted", icon: Trash2, cls: "bg-rose-50 text-rose-800 border-rose-200" },
};

const prettyModule = (m) => (m || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
};

function LogRow({ log }) {
  const a = ACTIONS[log.action] || ACTIONS.edit;
  const Icon = a.icon;
  const details = Object.entries(log.details || {});
  return (
    <div className="p-3 border-b border-slate-100 last:border-0" data-testid={`activity-log-${log.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 border rounded-sm ${a.cls}`}>
            <Icon className="w-3 h-3" /> {a.label}
          </span>
          <span className="font-bold text-slate-900 text-sm">{prettyModule(log.module)}</span>
          {log.target && <span className="text-sm text-slate-700 break-words">· {log.target}</span>}
        </div>
        <span className="font-mono-num text-[11px] text-slate-500 whitespace-nowrap shrink-0">{fmtTime(log.created_at)}</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500 font-mono-num break-all">
        {log.path}{log.record_id ? ` · #${log.record_id.slice(0, 8)}` : ""} · IP {log.ip || "—"}
      </div>
      {details.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {details.map(([k, v]) => (
            <span key={k} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm break-words max-w-full">
              {k}: <span className="font-bold text-slate-800">{String(v ?? "—")}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActivityLogDialog({ user, onClose }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const { data } = await api.get("/admin/activity-logs", {
        params: { user_id: user.user_id, action: action || undefined, limit: 300 },
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { setItems([]); setTotal(0); }
    finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.user_id, action]);

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-sm max-w-3xl max-h-[90vh] flex flex-col" data-testid="activity-log-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Activity log · {user?.user_name || user?.username}</DialogTitle>
          <DialogDescription>
            Every add, edit and delete by {user?.user_email || "this user"} — newest first ({total} total).
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            data-testid="activity-log-action-filter"
            className="h-9 rounded-sm border border-slate-300 px-2 text-sm bg-white flex-1 sm:flex-none"
          >
            <option value="">All actions</option>
            <option value="add">Added</option>
            <option value="edit">Edited</option>
            <option value="delete">Deleted</option>
          </select>
          <Button variant="outline" size="sm" onClick={load} className="rounded-sm h-9" data-testid="activity-log-refresh">
            <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-sm min-h-[200px]" data-testid="activity-log-list">
          {loading && <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>}
          {!loading && items.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-sm" data-testid="activity-log-empty">No activity recorded yet.</div>
          )}
          {!loading && items.map((l) => <LogRow key={l.id} log={l} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
