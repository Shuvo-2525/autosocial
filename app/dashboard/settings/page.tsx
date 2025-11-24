"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SocialAccount } from "@/lib/db-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Facebook, Youtube, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [platform, setPlatform] = useState<"facebook" | "youtube">("facebook");
  const [name, setName] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // 1. Fetch Connected Accounts
  useEffect(() => {
    const q = query(collection(db, "social_accounts"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SocialAccount[];
      setAccounts(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Add New Account
  const handleAddAccount = async () => {
    if (!name || !platformId || !accessToken) return;
    setLoading(true);

    try {
      await addDoc(collection(db, "social_accounts"), {
        platform,
        name,
        platformId, // The ID usually sent in the webhook
        accessToken, // The secret key needed to reply
        createdAt: new Date(),
      });
      
      // Reset Form
      setName("");
      setPlatformId("");
      setAccessToken("");
    } catch (error) {
      console.error("Error adding account:", error);
    }
    setLoading(false);
  };

  // 3. Delete Account
  const handleDelete = async (id: string) => {
    if (confirm("Disconnect this account? The AI will stop replying to it.")) {
      await deleteDoc(doc(db, "social_accounts", id));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-100 rounded-full text-slate-600">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connected Accounts</h2>
          <p className="text-slate-500">Manage access tokens for your social media pages.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* LEFT: Connection Form */}
        <Card>
          <CardHeader>
            <CardTitle>Connect New Page/Channel</CardTitle>
            <CardDescription>
              Enter the credentials provided by the Facebook/Google Developer Console.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={(val: any) => setPlatform(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook Page</SelectItem>
                  <SelectItem value="youtube">YouTube Channel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Friendly Name</label>
              <Input 
                placeholder="e.g. My Official Business Page" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Page ID / Channel ID</label>
              <Input 
                placeholder="e.g. 1029384756 (Facebook) or UC_x... (YouTube)" 
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                This ID is sent in the webhook. It must match exactly.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Access Token</label>
              <Input 
                type="password"
                placeholder="Paste the long access token here..." 
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>

            <Button onClick={handleAddAccount} disabled={loading} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Connect Account
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: List of Accounts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Connections</h3>
          
          {accounts.length === 0 && (
            <div className="text-center p-8 border rounded-lg bg-slate-50 text-slate-500">
              No accounts connected. The AI is idle.
            </div>
          )}

          <div className="grid gap-3">
            {accounts.map((account) => (
              <Card key={account.id} className="overflow-hidden">
                <div className="flex items-center p-4 gap-4">
                  <div className={`p-2 rounded-full ${account.platform === 'youtube' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {account.platform === 'youtube' ? <Youtube className="w-5 h-5" /> : <Facebook className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{account.name}</h4>
                    <p className="text-xs text-slate-500 truncate">ID: {account.platformId}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Active
                    </Badge>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => handleDelete(account.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}