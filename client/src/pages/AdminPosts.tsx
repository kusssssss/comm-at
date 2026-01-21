import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Pin, 
  PinOff,
  Eye,
  MessageCircle,
  Heart,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminPosts() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  // Form state
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("text");
  const [visibility, setVisibility] = useState("public");
  const [isPinned, setIsPinned] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  
  const { data: posts, isLoading, refetch } = trpc.social.adminList.useQuery({
    limit: 100,
  });
  
  const createPostMutation = trpc.social.createPost.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully");
      resetForm();
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updatePostMutation = trpc.social.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully");
      resetForm();
      setEditingPost(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const deletePostMutation = trpc.social.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted successfully");
      setDeleteConfirmId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const togglePinMutation = trpc.social.togglePin.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const resetForm = () => {
    setContent("");
    setPostType("text");
    setVisibility("public");
    setIsPinned(false);
    setAllowComments(true);
    setMediaUrls([]);
    setNewMediaUrl("");
  };
  
  const handleCreate = async () => {
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }
    
    await createPostMutation.mutateAsync({
      content: content.trim(),
      postType: postType as any,
      visibility: visibility as any,
      isPinned,
      allowComments,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    });
  };
  
  const handleUpdate = async () => {
    if (!editingPost) return;
    
    await updatePostMutation.mutateAsync({
      postId: editingPost.id,
      content: content.trim() || undefined,
      visibility: visibility as any,
      allowComments,
    });
    // Update pin status separately if changed
    if (isPinned !== editingPost.isPinned) {
      await togglePinMutation.mutateAsync({ postId: editingPost.id });
    }
  };
  
  const handleEdit = (post: any) => {
    setEditingPost(post);
    setContent(post.content || "");
    setPostType(post.postType);
    setVisibility(post.visibility);
    setIsPinned(post.isPinned);
    setAllowComments(post.allowComments);
    setMediaUrls(post.mediaUrls || []);
  };
  
  const handleAddMedia = () => {
    if (newMediaUrl.trim()) {
      setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
      setNewMediaUrl("");
    }
  };
  
  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };
  
  const getPostTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: "bg-zinc-500/20 text-zinc-400",
      photo: "bg-blue-500/20 text-blue-400",
      video: "bg-green-500/20 text-green-400",
      announcement: "bg-red-500/20 text-red-400",
      event_recap: "bg-purple-500/20 text-purple-400",
      drop_preview: "bg-amber-500/20 text-amber-400",
    };
    return <Badge className={colors[type] || colors.text}>{type.toUpperCase()}</Badge>;
  };
  
  const getVisibilityBadge = (vis: string) => {
    const colors: Record<string, string> = {
      public: "bg-green-500/20 text-green-400",
      members: "bg-cyan-500/20 text-cyan-400",
      inner_circle: "bg-amber-500/20 text-amber-400",
      private: "bg-zinc-500/20 text-zinc-400",
    };
    return <Badge className={colors[vis] || colors.public}>{vis.replace('_', ' ').toUpperCase()}</Badge>;
  };
  
  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-zinc-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Posts</h1>
            <p className="text-zinc-400">Create and manage feed posts for the community</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Create a new post for the community feed
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's happening in the collective?"
                    className="bg-zinc-800 border-zinc-700 min-h-[120px]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Post Type</Label>
                    <Select value={postType} onValueChange={setPostType}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="event_recap">Event Recap</SelectItem>
                        <SelectItem value="drop_preview">Drop Preview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="inner_circle">Inner Circle</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Media URLs</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <Button type="button" variant="outline" onClick={handleAddMedia}>
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mediaUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="h-16 w-16 object-cover rounded" />
                          <button
                            onClick={() => handleRemoveMedia(i)}
                            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={isPinned} onCheckedChange={setIsPinned} />
                    <Label>Pin to top</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                    <Label>Allow comments</Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={createPostMutation.isPending}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {createPostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Post
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Edit Dialog */}
        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 min-h-[120px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="members">Members Only</SelectItem>
                    <SelectItem value="inner_circle">Inner Circle</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={isPinned} onCheckedChange={setIsPinned} />
                  <Label>Pin to top</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                  <Label>Allow comments</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={updatePostMutation.isPending}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {updatePostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteConfirmId && deletePostMutation.mutateAsync({ postId: deleteConfirmId })}
                disabled={deletePostMutation.isPending}
              >
                {deletePostMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Posts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No posts yet. Create your first post!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Card key={post.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {post.isPinned && (
                        <Badge className="bg-amber-500/20 text-amber-400">
                          <Pin className="h-3 w-3 mr-1" />
                          PINNED
                        </Badge>
                      )}
                      {getPostTypeBadge(post.postType)}
                      {getVisibilityBadge(post.visibility)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePinMutation.mutate({ postId: post.id })}
                      >
                        {post.isPinned ? (
                          <PinOff className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Pin className="h-4 w-4 text-zinc-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4 text-zinc-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteConfirmId(post.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-zinc-200 whitespace-pre-wrap mb-3">{post.content}</p>
                  
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {(post.mediaUrls as string[]).slice(0, 4).map((url, i) => (
                        <img key={i} src={url} alt="" className="h-16 w-16 object-cover rounded" />
                      ))}
                      {post.mediaUrls.length > 4 && (
                        <div className="h-16 w-16 bg-zinc-800 rounded flex items-center justify-center text-zinc-400">
                          +{post.mediaUrls.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-400 pt-3 border-t border-zinc-800">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {post.likesCount} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.commentsCount} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.viewsCount || 0} views
                    </span>
                    <span className="ml-auto">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
