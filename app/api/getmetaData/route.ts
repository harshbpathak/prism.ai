import { type NextRequest, NextResponse } from "next/server"
import ogs from "open-graph-scraper"

export const dynamic = "force-dynamic"

/**
 * API route that fetches Open Graph metadata from a URL.
 * Falls back to null data (200 OK) if the site blocks scrapers or times out.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const link = searchParams.get("url")

        if (!link) {
            return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 })
        }

        // Validate URL format and protocol
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(link)
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                return NextResponse.json(
                    { error: "Invalid URL protocol. Only HTTP and HTTPS are allowed." },
                    { status: 400 },
                )
            }
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
        }

        try {
            const { error: ogsError, result } = await ogs({
                url: link,
                timeout: 5000, // 5 second timeout
                fetchOptions: {
                    headers: {
                        // Mimic a browser to reduce bot-blocking
                        'User-Agent': 'Mozilla/5.0 (compatible; Prism/1.0; +https://prism.ai)',
                        'Accept': 'text/html,application/xhtml+xml',
                    },
                },
            })

            // OGS returns error:true when it can't fetch — return null data gracefully
            if (ogsError || !result) {
                return NextResponse.json({
                    title: null,
                    description: null,
                    image: null,
                    siteName: parsedUrl.hostname,
                    url: link,
                    favicon: null,
                    success: false,
                })
            }

            const {
                ogTitle, ogDescription, ogImage, twitterImage,
                ogSiteName, ogUrl, ogType, favicon, requestUrl,
                success, twitterCard, twitterTitle, twitterDescription,
                articlePublishedTime, articleAuthor, ogDate, dcDate, dcCreator,
            } = result

            const getImageUrl = (imageData: any) => {
                if (!imageData) return null
                if (Array.isArray(imageData)) return imageData[0]?.url || null
                return imageData.url || null
            }

            return NextResponse.json({
                title: ogTitle || twitterTitle || null,
                description: ogDescription || twitterDescription || null,
                image: getImageUrl(ogImage) || getImageUrl(twitterImage) || null,
                siteName: ogSiteName || parsedUrl.hostname || null,
                url: ogUrl || requestUrl || link,
                type: ogType || null,
                favicon: favicon || null,
                publishedTime: articlePublishedTime || ogDate || dcDate || null,
                author: articleAuthor || dcCreator || null,
                twitterCard: twitterCard || null,
                success: success || false,
            })

        } catch (ogsErr: any) {
            // Network error, timeout, ECONNREFUSED, etc. — degrade gracefully
            console.warn(`[getmetaData] Failed to fetch OG data for ${link}:`, ogsErr?.message || ogsErr)
            return NextResponse.json({
                title: null,
                description: null,
                image: null,
                siteName: parsedUrl.hostname,
                url: link,
                favicon: null,
                success: false,
            })
        }

    } catch (err: any) {
        console.error("Metadata fetch error:", err)
        return NextResponse.json({ error: "Server error fetching metadata" }, { status: 500 })
    }
}
