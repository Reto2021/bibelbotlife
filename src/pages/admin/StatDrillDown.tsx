import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type DrillDownType = "users" | "subscribers" | "chats" | null;

interface StatDrillDownProps {
  type: DrillDownType;
  open: boolean;
  onClose: () => void;
}

function useRegisteredUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-drill-users"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_registered_users_list" as any);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        email: string;
        created_at: string;
        last_sign_in_at: string | null;
      }>;
    },
  });
}

function useActiveSubscribers(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-drill-subscribers"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_subscribers")
        .select("id, channel, first_name, language, phone_number, created_at, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useTodayChats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-drill-chats"],
    enabled,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at, conversation_id")
        .gte("created_at", today)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

const TITLES: Record<string, string> = {
  users: "Registrierte Benutzer",
  subscribers: "Aktive Impuls-Abonnenten",
  chats: "Heutige Chat-Nachrichten",
};

export function StatDrillDown({ type, open, onClose }: StatDrillDownProps) {
  const users = useRegisteredUsers(type === "users");
  const subscribers = useActiveSubscribers(type === "subscribers");
  const chats = useTodayChats(type === "chats");

  const isLoading =
    (type === "users" && users.isLoading) ||
    (type === "subscribers" && subscribers.isLoading) ||
    (type === "chats" && chats.isLoading);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{type ? TITLES[type] : ""}</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="space-y-3 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {type === "users" && !users.isLoading && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">{users.data?.length ?? 0} Benutzer</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead>Letzter Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("de-CH")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString("de-CH")
                        : "–"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {type === "subscribers" && !subscribers.isLoading && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">{subscribers.data?.length ?? 0} Abonnenten</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead>Sprache</TableHead>
                  <TableHead>Seit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.data?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.first_name || "–"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.channel}</Badge>
                    </TableCell>
                    <TableCell>{s.language ?? "de"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("de-CH")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {type === "chats" && !chats.isLoading && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">{chats.data?.length ?? 0} Nachrichten heute</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Inhalt</TableHead>
                  <TableHead>Zeit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.data?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant={m.role === "user" ? "default" : "secondary"}>{m.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-md truncate">{m.content.slice(0, 120)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(m.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
