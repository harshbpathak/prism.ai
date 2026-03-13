import { type NextRequest, NextResponse } from "next/server"
import ogs from "open-graph-scraper"

// Add this export to mark the route as dynamic
export const dynamic = "force-dynamic"

/**
 * API route that fetches metadata (like og:title, og:description, og:image, etc.)
 * from a URL passed as a query parameter ?url=...
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const link = searchParams.get("url")

        if (!link) {
            return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 })
        }

        try {
            const url = new URL(link)
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return NextResponse.json(
                    { error: "Invalid URL protocol. Only HTTP and HTTPS are allowed." },
                    { status: 400 },
                )
            }
        } catch (error) {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
        }

        const options = { url: link }
        const { error, result } = await ogs(options)

        if (error) {
            return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 })
        }

        // Extract all useful metadata
        const {
            ogTitle,
            ogDescription,
            ogImage,
            twitterImage,
            ogSiteName,
            ogUrl,
            ogType,
            favicon,
            charset,
            requestUrl,
            success,
            twitterCard,
            twitterTitle,
            twitterDescription,
            articlePublishedTime,
            articleAuthor,
            ogDate,
            dcDate,
            dcCreator,
        } = result

        // Handle ogImage and twitterImage which can be arrays or single objects
        const getImageUrl = (imageData: any) => {
            if (!imageData) return null

            // If it's an array, take the first item's URL
            if (Array.isArray(imageData)) {
                return imageData[0]?.url || null
            }

            // If it's a single object
            return imageData.url || null
        }

        return NextResponse.json({
            title: ogTitle || twitterTitle || null,
            description: ogDescription || twitterDescription || null,
            image: getImageUrl(ogImage) || getImageUrl(twitterImage) || null,
            siteName: ogSiteName || null,
            url: ogUrl || requestUrl || null,
            type: ogType || null,
            favicon: favicon || null,
            publishedTime: articlePublishedTime || ogDate || dcDate || null,
            author: articleAuthor || dcCreator || null,
            twitterCard: twitterCard || null,
            success: success || false,
        })
    } catch (err: any) {
        console.error("Metadata fetch error:", err)
        return NextResponse.json({ error: "Server error fetching metadata" }, { status: 500 })
    }
}

