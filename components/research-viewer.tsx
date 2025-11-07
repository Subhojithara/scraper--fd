"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Tag,
  Lightbulb,
  FolderOpen,
  Users,
  Building2,
  MapPin,
} from "lucide-react";
import type { ResearchData } from "@/lib/api";

interface ResearchViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  researchData: ResearchData | null;
}

export function ResearchViewer({
  open,
  onOpenChange,
  researchData,
}: ResearchViewerProps) {
  if (!researchData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* p-0 so we control padding; h-[85vh] with min-h-0 enables child scroll */}
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        {/* Shell must have fixed height + min-h-0 for ScrollArea to work */}
        <div className="flex h-[85vh] flex-col min-h-0">
          {/* Sticky header (non-scrolling) */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-6 pt-5">
              <DialogHeader className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Research Results
                </DialogTitle>
                <DialogDescription>
                  AI-powered analysis and insights from the scraped content
                </DialogDescription>
              </DialogHeader>
            </div>
            <Separator className="mt-4" />
          </div>

          {/* Scrollable content area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-6">
              {/* Summary */}
              <Card className="border-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {researchData.summary}
                  </p>
                </CardContent>
              </Card>

              {/* Responsive 2-col layout where it helps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <Card className="border-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="text-sm capitalize">
                      {researchData.category}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Topics */}
                {researchData.topics && researchData.topics.length > 0 && (
                  <Card className="border-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {researchData.topics.map((topic, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Key Insights */}
              {researchData.insights && researchData.insights.length > 0 && (
                <Card className="border-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {researchData.insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 rounded-lg border p-3 bg-muted/30"
                        >
                          <Badge
                            variant="outline"
                            className="h-fit text-xs capitalize shrink-0"
                          >
                            {insight.type}
                          </Badge>
                          <p className="text-sm text-muted-foreground flex-1">
                            {insight.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Entities */}
              {researchData.entities && (
                <Card className="border-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Entities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {researchData.entities.people &&
                      researchData.entities.people.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">People</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {researchData.entities.people.map((person, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {person}
                              </Badge>
                            ))}
                          </div>
                        </section>
                      )}

                    {researchData.entities.organizations &&
                      researchData.entities.organizations.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Organizations
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {researchData.entities.organizations.map(
                              (org, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {org}
                                </Badge>
                              )
                            )}
                          </div>
                        </section>
                      )}

                    {researchData.entities.locations &&
                      researchData.entities.locations.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Locations
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {researchData.entities.locations.map(
                              (location, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {location}
                                </Badge>
                              )
                            )}
                          </div>
                        </section>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              {researchData.metadata && (
                <Card className="border-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-mono">
                          {researchData.metadata.model}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Processing Time:
                        </span>
                        <span>{researchData.metadata.processing_time_ms}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Timestamp:
                        </span>
                        <span>
                          {new Date(
                            researchData.metadata.timestamp
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
