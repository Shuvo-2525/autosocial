"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { KnowledgeSnippet } from "@/lib/db-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Brain, Save, Sparkles } from "lucide-react";

export default function BrainConfigPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeSnippet[]>([]);
  const [newFact, setNewFact] = useState("");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Existing Knowledge
  useEffect(() => {
    const q = query(collection(db, "knowledge_base"), orderBy("isActive", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as KnowledgeSnippet[];
      setKnowledge(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Add New Knowledge
  const handleAddFact = async () => {
    if (!newFact.trim()) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, "knowledge_base"), {
        content: newFact,
        tone: tone,
        isActive: true,
        createdAt: new Date()
      });
      setNewFact(""); // Clear input
    } catch (error) {
      console.error("Error adding fact:", error);
    }
    setLoading(false);
  };

  // 3. Toggle Active Status
  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "knowledge_base", id), {
      isActive: !currentStatus
    });
  };

  // 4. Delete Knowledge
  const deleteFact = async (id: string) => {
    if (confirm("Are you sure you want to forget this fact?")) {
      await deleteDoc(doc(db, "knowledge_base", id));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <Brain className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Knowledge Base</h2>
          <p className="text-slate-500">Teach your AI facts about your business so it can reply accurately.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT COLUMN: Input Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add New Knowledge</CardTitle>
            <CardDescription>
              What should the AI know? (e.g., Business hours, Pricing, Policies)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fact / Context</label>
              <Textarea 
                placeholder="e.g., We offer free shipping on orders over $50." 
                className="min-h-[120px]"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reply Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional & Polite</SelectItem>
                  <SelectItem value="Friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="Humorous">Witty & Humorous</SelectItem>
                  <SelectItem value="Empathetic">Empathetic (Customer Support)</SelectItem>
                  <SelectItem value="Pirate">Pirate Mode (Arr!)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddFact} disabled={loading || !newFact} className="w-full">
              {loading ? "Teaching AI..." : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save to Memory
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: Knowledge List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Current Memory
          </h3>
          
          {knowledge.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed rounded-lg text-slate-400">
              Brain is empty. Add some facts!
            </div>
          )}

          {knowledge.map((item) => (
            <Card key={item.id} className={`transition-all ${!item.isActive ? "opacity-60 bg-slate-50" : ""}`}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.isActive ? "default" : "outline"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="secondary">{item.tone}</Badge>
                  </div>
                  <p className="text-slate-800 text-sm whitespace-pre-wrap">{item.content}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Switch 
                    checked={item.isActive} 
                    onCheckedChange={() => toggleActive(item.id, item.isActive)}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => deleteFact(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}