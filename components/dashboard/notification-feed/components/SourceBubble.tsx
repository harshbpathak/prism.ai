"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { getSiteIcon, safeDateFormat } from "../functions"
import { metadataCache } from "../constants"
import type { NotificationSource, SourceMetadata } from "../types"

interface SourceBubbleProps {
  source: NotificationSource
}

export function SourceBubble({ source }: SourceBubbleProps) {
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
        const response = await fetch(`/api/getmetaData?url=${encodeURIComponent(source.url)}`)
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
        console.error('Failed to fetch metadata:', error)
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
    window.open(source.url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    const hostname = new URL(source.url).hostname.replace(/^www\./, '')
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
        {getSiteIcon(source.url)}
        <TextShimmer duration={1.5}>{`Fetching ${hostname}...`}</TextShimmer>
      </div>
    )
  }

  const displayTitle = metadata?.siteName || source.title || new URL(source.url).hostname

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={handleClick}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer hover:opacity-80 transition-all border bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {getSiteIcon(source.url)}
            {displayTitle.length > 25 ? `${displayTitle.substring(0, 25)}...` : displayTitle}
            <ExternalLink className="w-2 h-2 opacity-60" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="flex flex-col gap-2">
            {metadata?.image && (
              <img 
                src={metadata.image} 
                alt={source.title || 'Source preview'}
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
                    : metadata.description
                  }
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 