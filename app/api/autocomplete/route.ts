// app/api/autocomplete/route.ts

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const input = searchParams.get('input');

        // Validate input
        if (!input || input.trim().length < 2) {
            return NextResponse.json(
                { error: 'Input is too short. Minimum 2 characters required.' },
                { status: 400 }
            );
        }

        // Retrieve API key from environment variables
        const apiKey = process.env.OLA_MAPS_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key is missing in environment variables.' },
                { status: 500 }
            );
        }

        // Generate a unique request ID
        const requestId = uuidv4();

        // Call Ola Maps Autocomplete API
        const olaResponse = await fetch(
            `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
                input
            )}&api_key=${apiKey}`,
            {
                method: 'GET',
                headers: {
                    'X-Request-Id': requestId,
                },
            }
        );

        // Handle non-OK responses
        if (!olaResponse.ok) {
            const errorData = await olaResponse.json();
            return NextResponse.json(
                { error: 'Failed to fetch data from Ola Maps.', details: errorData },
                { status: olaResponse.status }
            );
        }

        // Parse the JSON response
        const data = await olaResponse.json();

        // Optionally, you can process or sanitize the data here before sending it to the frontend

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in autocomplete API route:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
