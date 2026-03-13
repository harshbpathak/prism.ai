"use client"

import { useEffect, useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TextShimmer } from "@/components/ui/text-shimmer"
import {
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  Instagram,
  BookOpen,
  MessageSquare,
  FileCode,
  Package,
  Code2,
  Globe,
  Newspaper,
  Bookmark,
  Server,
  Zap,
  Coffee,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// Site icons mapping
const siteIcons: Record<string, React.ReactNode> = {
  "github.com": <Github className="w-3.5 h-3.5" />,
  "twitter.com": <Twitter className="w-3.5 h-3.5" />,
  "x.com": <Twitter className="w-3.5 h-3.5" />,
  "linkedin.com": <Linkedin className="w-3.5 h-3.5" />,
  "youtube.com": <Youtube className="w-3.5 h-3.5" />,
  "youtu.be": <Youtube className="w-3.5 h-3.5" />,
  "facebook.com": <Facebook className="w-3.5 h-3.5" />,
  "fb.com": <Facebook className="w-3.5 h-3.5" />,
  "instagram.com": <Instagram className="w-3.5 h-3.5" />,
  "medium.com": <BookOpen className="w-3.5 h-3.5" />,
  "stackoverflow.com": <MessageSquare className="w-3.5 h-3.5" />,
  "reddit.com": <MessageSquare className="w-3.5 h-3.5" />,
  "news.ycombinator.com": <Newspaper className="w-3.5 h-3.5" />,
  "npmjs.com": <Package className="w-3.5 h-3.5" />,
  "vercel.com": <Zap className="w-3.5 h-3.5" />,
  "nextjs.org": <Zap className="w-3.5 h-3.5" />,
  "reactjs.org": <Code2 className="w-3.5 h-3.5" />,
  "react.dev": <Code2 className="w-3.5 h-3.5" />,
  "developer.mozilla.org": <FileCode className="w-3.5 h-3.5" />,
  "mdn.dev": <FileCode className="w-3.5 h-3.5" />,
  "docs.microsoft.com": <FileCode className="w-3.5 h-3.5" />,
  "aws.amazon.com": <Server className="w-3.5 h-3.5" />,
  "cloud.google.com": <Server className="w-3.5 h-3.5" />,
  "azure.microsoft.com": <Server className="w-3.5 h-3.5" />,
  "digitalocean.com": <Server className="w-3.5 h-3.5" />,
  "dev.to": <Code2 className="w-3.5 h-3.5" />,
  "hashnode.com": <Bookmark className="w-3.5 h-3.5" />,
  "codepen.io": <Code2 className="w-3.5 h-3.5" />,
  "codesandbox.io": <Code2 className="w-3.5 h-3.5" />,
  "stackblitz.com": <Code2 className="w-3.5 h-3.5" />,
  "replit.com": <Code2 className="w-3.5 h-3.5" />,
  "kaggle.com": <FileCode className="w-3.5 h-3.5" />,
  "huggingface.co": <FileCode className="w-3.5 h-3.5" />,
  "buymeacoffee.com": <Coffee className="w-3.5 h-3.5" />,
  "patreon.com": <Bookmark className="w-3.5 h-3.5" />,
}

// Utility function to safely format dates
function safeDateFormat(dateString: string): string | null {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return null
  }
}

// Utility function to get site icon
function getSiteIcon(url: string): React.ReactNode {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    // Remove www. prefix
    const cleanHostname = hostname.replace(/^www\./, "")
    return siteIcons[cleanHostname] || <Globe className="w-3.5 h-3.5" />
  } catch {
    return <Globe className="w-3.5 h-3.5" />
  }
}

interface SourceMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  url?: string
  author?: string
  publishedTime?: string
}

// Metadata cache to avoid repeated API calls
const metadataCache = new Map<string, SourceMetadata | null>()

export interface NotificationSource {
  url: string
  title: string
  credibility: number
  publishedAt: string
}

export function SourceBubble({ source }: { source: NotificationSource }) {
  const [metadata, setMetadata] = useState<SourceMetadata | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMetadata() {
      if (!source.url) return

      // Check cache first
      if (metadataCache.has(source.url)) {
        const cachedData = metadataCache.get(source.url)
        setMetadata(cachedData || null)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          `/api/getmetaData?url=${encodeURIComponent(source.url)}`,
        )
        if (response.ok) {
          const data = await response.json()
          setMetadata(data)
          // Cache the result
          metadataCache.set(source.url, data)
        } else {
          // Cache null for failed requests to avoid retrying
          metadataCache.set(source.url, null)
        }
      } catch (error) {
        console.error("Failed to fetch metadata:", error)
        // Cache null for failed requests
        metadataCache.set(source.url, null)
      } finally {
        setLoading(false)
      }
    }
    fetchMetadata()
  }, [source.url])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(source.url, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    const hostname = new URL(source.url).hostname.replace(/^www\./, "")
    return (
      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-muted/50 text-muted-foreground rounded-md">
        {getSiteIcon(source.url)}
        <TextShimmer duration={1.5}>{`Fetching ${hostname}...`}</TextShimmer>
      </div>
    )
  }

  const displayTitle =
    metadata?.siteName || source.title || new URL(source.url).hostname

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md cursor-pointer hover:opacity-80 transition-all border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          >
            {getSiteIcon(source.url)}
            {displayTitle.length > 25
              ? `${displayTitle.substring(0, 25)}...`
              : displayTitle}
            <ExternalLink className="w-2 h-2 opacity-60" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="flex flex-col gap-2">
            {metadata?.image && (
              <img
                src={metadata.image}
                alt={source.title || "Source preview"}
                className="w-full h-24 object-cover rounded"
              />
            )}
            <div>
              <button
                onClick={handleClick}
                className="font-medium text-sm text-left hover:underline cursor-pointer"
              >
                {source.title}
                <ExternalLink className="w-3 h-3 inline ml-1 opacity-60" />
              </button>
              <div className="text-xs text-muted-foreground mt-1">
                Credibility: {Math.round(source.credibility * 100)}%
              </div>
              {source.publishedAt && safeDateFormat(source.publishedAt) && (
                <div className="text-xs text-muted-foreground">
                  {safeDateFormat(source.publishedAt)}
                </div>
              )}
              {metadata?.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {metadata.description.length > 120
                    ? `${metadata.description.substring(0, 120)}...`
                    : metadata.description}
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 