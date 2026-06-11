"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash } from "lucide-react";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blog");
      if (res.ok) {
        setBlogs(await res.json());
      }
    } catch (e) {
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      
      const payload = {
        title,
        slug,
        excerpt,
        content,
        category,
        image: image || "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=800",
        readTime: "5 min read",
        featured: false,
      };

      // Ensure your backend /api/blog supports POST.
      // If not, we fall back to a toast for now.
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save blog");
      
      toast.success("Blog published successfully!");
      setTitle(""); setCategory(""); setExcerpt(""); setContent(""); setImage("");
      fetchBlogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish blog");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Blogs</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <Card>
             <CardHeader>
               <CardTitle>Published Articles</CardTitle>
               <CardDescription>All blog posts published on your platform.</CardDescription>
             </CardHeader>
             <CardContent>
                {loading ? (
                   <Loader2 className="w-6 h-6 animate-spin mx-auto my-10 text-muted-foreground" />
                ) : blogs.length === 0 ? (
                   <p className="text-muted-foreground text-center py-10">No blogs published yet.</p>
                ) : (
                   <div className="space-y-4">
                      {blogs.map(blog => (
                         <div key={blog.id} className="flex justify-between items-center p-4 border rounded-lg bg-card">
                            <div>
                               <h3 className="font-semibold">{blog.title}</h3>
                               <p className="text-sm text-muted-foreground">{blog.category} • {blog.views} views</p>
                            </div>
                            <div className="flex gap-2">
                               <Button variant="outline" size="sm"><Edit2 className="w-4 h-4" /></Button>
                               <Button variant="destructive" size="sm"><Trash className="w-4 h-4" /></Button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </CardContent>
           </Card>
        </div>

        <div>
           <Card>
             <CardHeader>
               <CardTitle>Write New Blog</CardTitle>
             </CardHeader>
             <CardContent>
               <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Summer Trends 2024" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input required value={category} onChange={e => setCategory(e.target.value)} placeholder="Trends" />
                  </div>
                  <div>
                    <Label>Image URL (Optional)</Label>
                    <Input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <Label>Excerpt</Label>
                    <Textarea required value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="A short summary..." />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="Write your article here..." className="min-h-[200px]" />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Publish Article
                  </Button>
               </form>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
