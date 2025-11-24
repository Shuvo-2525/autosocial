"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, getDoc, setDoc, updateDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Client SDK
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Activity, ShieldAlert, MessageSquare, Zap } from "lucide-react";
import { CommentLog } from "@/lib/db-service";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    total: 0,
    abusive: 0,
    replied: 0,
  });
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. Listen to Real-time Stats
  useEffect(() => {
    // We listen to the last 100 comments to calculate simple stats for this view
    // In a huge app, you'd use a dedicated 'stats' document, but this is perfect for now.
    const q = query(collection(db, "comments"), orderBy("timestamp", "desc"), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let abusive = 0;
      let replied = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as CommentLog;
        total++;
        if (data.isAbusive) abusive++;
        if (data.status === 'REPLIED') replied++;
      });

      setStats({ total, abusive, replied });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to AI Master Switch Status
  useEffect(() => {
    const fetchSettings = async () => {
      const ref = doc(db, "settings", "ai_config");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setAiEnabled(snap.data().enabled);
      } else {
        // Create default if missing
        await setDoc(ref, { enabled: true });
      }
    };
    fetchSettings();
  }, []);

  // 3. Toggle AI Handler
  const toggleAI = async (val: boolean) => {
    setAiEnabled(val);
    await updateDoc(doc(db, "settings", "ai_config"), {
      enabled: val
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border">
          <Switch 
            checked={aiEnabled} 
            onCheckedChange={toggleAI} 
            id="ai-mode"
          />
          <label htmlFor="ai-mode" className="text-sm font-medium cursor-pointer">
            {aiEnabled ? "AI Automation: ON" : "AI Automation: PAUSED"}
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Interactions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-slate-500">Last 100 interactions</p>
          </CardContent>
        </Card>

        {/* Abusive Blocked Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toxic Blocked</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.abusive}</div>
            <p className="text-xs text-slate-500">Auto-deleted by Gemini</p>
          </CardContent>
        </Card>

        {/* Replies Sent Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replies Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
            <p className="text-xs text-slate-500">Auto-generated responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card className="bg-slate-50 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            The system is currently <strong>{aiEnabled ? "ACTIVE" : "PAUSED"}</strong>. 
            {aiEnabled 
              ? " New comments from connected Facebook Pages and YouTube Channels will be processed automatically."
              : " No actions will be taken on incoming comments."
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}