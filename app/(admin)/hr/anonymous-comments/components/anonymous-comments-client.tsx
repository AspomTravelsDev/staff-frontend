"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Search, ShieldAlert, MessageSquare, Clock, ShieldCheck, User, Quote } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatsCard } from "@/components/stats-card";
import { AnonymousComment } from "@/lib/api/anonymous-comments";

interface AnonymousCommentsClientProps {
  initialComments: AnonymousComment[];
}

export function AnonymousCommentsClient({ initialComments }: AnonymousCommentsClientProps) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate notifications query to clear badge counts immediately on page load
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const filteredComments = initialComments.filter((comment) =>
    comment.content.toLowerCase().includes(search.toLowerCase())
  );

  const lastSubmittedText =
    initialComments.length > 0
      ? formatDistanceToNow(new Date(initialComments[0].created_at), { addSuffix: true })
      : "N/A";

  return (
    <div className="space-y-6">
      {/* Stats Summary Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Submissions"
          icon={MessageSquare}
          value={initialComments.length}
          description="Total anonymous comments received"
          cardColor="blue"
          variant="dashboard"
        />
        <StatsCard
          title="Last Submitted"
          icon={Clock}
          value={lastSubmittedText}
          description="Most recent feedback arrival"
          cardColor="green"
          variant="dashboard"
        />
        <StatsCard
          title="Privacy Status"
          icon={ShieldCheck}
          value="Secure"
          description="Sender identity is 100% encrypted"
          cardColor="purple"
          variant="dashboard"
        />
      </div>

      {/* Filter and Search controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments..."
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredComments.length} of {initialComments.length} comments
        </div>
      </div>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-bold text-lg">No comments found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {search
              ? "Try adjusting your search terms to find matching comments."
              : "No staff member has left anonymous comments yet."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredComments.map((comment) => {
            const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
            return (
              <Card key={comment.id} className="flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-slate-100 hover:border-slate-200">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 bg-slate-100 border border-slate-200">
                        <AvatarFallback className="text-xs text-slate-500 font-semibold bg-slate-50">
                          AS
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold text-slate-700">Anonymous Staff</div>
                        <div className="text-xs text-muted-foreground">Anonymous Department</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                      <Clock className="h-3 w-3" />
                      {timeAgo}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-1 relative">
                  <blockquote className="text-sm italic text-slate-600 leading-relaxed pl-4 border-l-2 border-primary/30 relative">
                    <Quote className="absolute -top-3 -left-1 h-8 w-8 text-primary/5 -z-0 pointer-events-none transform -scale-x-100" />
                    <p className="relative z-10 whitespace-pre-wrap">{comment.content}</p>
                  </blockquote>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
