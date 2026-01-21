import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  MessageCircle, 
  Bookmark,
  Share2,
  MoreHorizontal,
  Pin,
  Image as ImageIcon,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Post = {
  id: number;
  authorId: number;
  content: string | null;
  mediaUrls: string[] | null;
  postType: string;
  visibility: string;
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  allowComments: boolean;
  createdAt: Date;
  author: {
    id: number;
    name: string | null;
    callSign: string | null;
    role: string;
  };
  isLiked: boolean;
  isBookmarked: boolean;
};

export default function Feed() {
  const { user, isAuthenticated } = useAuth();
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  
  const { data: posts, isLoading, refetch } = trpc.social.feed.useQuery({
    limit: 50,
  });
  
  const toggleLikeMutation = trpc.social.toggleLike.useMutation({
    onSuccess: () => refetch(),
  });
  
  const toggleBookmarkMutation = trpc.social.toggleBookmark.useMutation({
    onSuccess: () => refetch(),
  });
  
  const handleLike = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like posts");
      return;
    }
    await toggleLikeMutation.mutateAsync({ targetType: 'post', targetId: postId });
  };
  
  const handleBookmark = async (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to bookmark posts");
      return;
    }
    await toggleBookmarkMutation.mutateAsync({ postId });
  };
  
  const toggleComments = (postId: number) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };
  
  const getPostTypeBadge = (postType: string) => {
    switch (postType) {
      case 'announcement':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">ANNOUNCEMENT</Badge>;
      case 'event_recap':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">EVENT RECAP</Badge>;
      case 'drop_preview':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">DROP PREVIEW</Badge>;
      case 'photo':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">PHOTO</Badge>;
      case 'video':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">VIDEO</Badge>;
      default:
        return null;
    }
  };
  
  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'inner_circle':
        return <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">INNER CIRCLE</Badge>;
      case 'members':
        return <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 text-xs">MEMBERS</Badge>;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container max-w-2xl py-8">
          <h1 className="text-2xl font-bold mb-6">Feed</h1>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-2xl py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Feed</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-zinc-400">
              {posts?.length || 0} posts
            </Badge>
          </div>
        </div>
        
        {!posts || posts.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-zinc-400">Check back later for updates from the collective.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: Post) => (
              <Card key={post.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                {post.isPinned && (
                  <div className="bg-amber-500/10 px-4 py-2 flex items-center gap-2 text-amber-400 text-sm border-b border-amber-500/20">
                    <Pin className="h-4 w-4" />
                    Pinned Post
                  </div>
                )}
                
                <CardContent className="p-4">
                  {/* Author Header */}
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/profile/${post.authorId}`}>
                      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-zinc-800">
                            {post.author.callSign?.[0] || post.author.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{post.author.callSign || post.author.name}</span>
                            {(post.author.role === 'admin' || post.author.role === 'staff') && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                {post.author.role.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>{new Date(post.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}</span>
                            {getVisibilityBadge(post.visibility)}
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-2">
                      {getPostTypeBadge(post.postType)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + `/feed/${post.id}`);
                            toast.success("Link copied to clipboard");
                          }}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="mb-4">
                    <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>
                  
                  {/* Media */}
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className={`mb-4 grid gap-2 ${
                      post.mediaUrls.length === 1 ? 'grid-cols-1' :
                      post.mediaUrls.length === 2 ? 'grid-cols-2' :
                      post.mediaUrls.length === 3 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {(post.mediaUrls as string[]).slice(0, 4).map((url, i) => (
                        <div 
                          key={i} 
                          className={`relative overflow-hidden rounded-lg ${
                            post.mediaUrls!.length === 3 && i === 0 ? 'row-span-2' : ''
                          }`}
                        >
                          <img 
                            src={url} 
                            alt="" 
                            className="w-full h-full object-cover"
                            style={{ maxHeight: post.mediaUrls!.length === 1 ? '400px' : '200px' }}
                          />
                          {i === 3 && post.mediaUrls!.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-2xl font-bold">+{post.mediaUrls!.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-zinc-800">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-zinc-400 hover:text-red-400 ${post.isLiked ? 'text-red-400' : ''}`}
                      onClick={() => handleLike(post.id)}
                      disabled={toggleLikeMutation.isPending}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                      {post.likesCount > 0 && post.likesCount}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-zinc-400 hover:text-cyan-400"
                      onClick={() => toggleComments(post.id)}
                      disabled={!post.allowComments}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.commentsCount > 0 && post.commentsCount}
                      {expandedComments.has(post.id) ? (
                        <ChevronUp className="h-3 w-3 ml-1" />
                      ) : (
                        <ChevronDown className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-zinc-400 hover:text-amber-400 ml-auto ${post.isBookmarked ? 'text-amber-400' : ''}`}
                      onClick={() => handleBookmark(post.id)}
                      disabled={toggleBookmarkMutation.isPending}
                    >
                      <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  
                  {/* Comments Section */}
                  {expandedComments.has(post.id) && post.allowComments && (
                    <CommentsSection postId={post.id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsSection({ postId }: { postId: number }) {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  
  const { data: post, refetch } = trpc.social.getById.useQuery({ postId });
  
  const addCommentMutation = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const toggleLikeMutation = trpc.social.toggleLike.useMutation({
    onSuccess: () => refetch(),
  });
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    await addCommentMutation.mutateAsync({
      postId,
      content: newComment.trim(),
    });
  };
  
  const handleLikeComment = async (commentId: number) => {
    await toggleLikeMutation.mutateAsync({ targetType: 'comment', targetId: commentId });
  };
  
  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      {/* Comment Input */}
      {isAuthenticated && (
        <div className="flex gap-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-800 text-xs">
              {user?.callSign?.[0] || user?.name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="bg-zinc-800 border-zinc-700 resize-none min-h-[40px] text-sm"
              rows={1}
            />
            <Button 
              size="icon"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Comments List */}
      {post?.comments && post.comments.length > 0 ? (
        <div className="space-y-3">
          {post.comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <Link href={`/profile/${comment.userId}`}>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-zinc-800 text-xs">
                    {comment.user.callSign?.[0] || comment.user.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="bg-zinc-800 rounded-lg px-3 py-2">
                  <Link href={`/profile/${comment.userId}`}>
                    <span className="font-medium text-sm hover:underline cursor-pointer">
                      {comment.user.callSign || comment.user.name}
                    </span>
                  </Link>
                  <p className="text-sm text-zinc-300">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  <button 
                    className="hover:text-red-400 transition-colors"
                    onClick={() => handleLikeComment(comment.id)}
                  >
                    {comment.likesCount > 0 ? `${comment.likesCount} likes` : 'Like'}
                  </button>
                  {comment.repliesCount > 0 && (
                    <span>{comment.repliesCount} replies</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 text-center py-4">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}
