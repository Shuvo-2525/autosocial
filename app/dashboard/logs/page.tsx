"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CommentLog } from "@/lib/db-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, Youtube, Facebook, Trash2 } from "lucide-react";

export default function LiveLogsPage() {
  const [logs, setLogs] = useState<CommentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to the last 50 interactions in real-time
    const q = query(
      collection(db, "comments"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map((doc) => ({
        externalId: doc.id,
        ...doc.data(),
      })) as CommentLog[];
      
      setLogs(liveData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to choose status color
  const getStatusBadge = (status: string, isAbusive: boolean) => {
    if (isAbusive || status === 'DELETED') {
      return <Badge variant="destructive" className="flex gap-1 items-center"><Trash2 className="w-3 h-3" /> Blocked</Badge>;
    }
    if (status === 'REPLIED') {
      return <Badge className="bg-green-600 hover:bg-green-700 flex gap-1 items-center"><CheckCircle className="w-3 h-3" /> Replied</Badge>;
    }
    return <Badge variant="secondary" className="flex gap-1 items-center"><Clock className="w-3 h-3" /> {status}</Badge>;
  };

  // Helper for platform icon
  const getPlatformIcon = (platform: string) => {
    if (platform === 'youtube') return <Youtube className="w-5 h-5 text-red-600" />;
    return <Facebook className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Live Interactions</h2>
        <Badge variant="outline" className="animate-pulse text-green-600 border-green-200">
          ● Live Connection Active
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Source</TableHead>
                <TableHead className="w-[150px]">Author</TableHead>
                <TableHead className="w-[300px]">User Comment</TableHead>
                <TableHead>AI Action / Reply</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                    No interactions yet. Wait for a webhook event.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.externalId} className={log.isAbusive ? "bg-red-50/50" : ""}>
                    <TableCell>{getPlatformIcon(log.platform)}</TableCell>
                    <TableCell className="font-medium">{log.author}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-sm text-slate-700" title={log.text}>
                        "{log.text}"
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {log.isAbusive ? (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Content identified as toxic
                        </span>
                      ) : (
                        <p className="truncate text-sm text-slate-500 italic" title={log.aiReply || ""}>
                          {log.aiReply || "No reply generated"}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status, log.isAbusive)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}