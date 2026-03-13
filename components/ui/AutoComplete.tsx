'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import debounce from 'lodash.debounce'
import { OlaMaps } from '@/lib/OlaMap/OlaMapsWebSDK/olamaps-js-sdk.es'
import '@/lib/OlaMap/OlaMapsWebSDK/style.css'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Prediction {
    description: string
    geometry: {
        location: {
            lat: number
            lng: number
        }
    }
}

interface AddressAutocompleteMapProps {
    onCoordinatesChange: (lat: string, lng: string, address: string) => void
    initialAddress?: string
    initialLat?: string
    initialLng?: string
}

export default function AddressAutocompleteMap({
    onCoordinatesChange,
    initialAddress = '',
    initialLat = '',
    initialLng = ''
}: AddressAutocompleteMapProps) {
    const [query, setQuery] = useState(initialAddress)
    const [suggestions, setSuggestions] = useState<Prediction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [latitude, setLatitude] = useState(initialLat)
    const [longitude, setLongitude] = useState(initialLng)
    const [inputFocused, setInputFocused] = useState(false)
    const mapRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLUListElement>(null)
    const selectedItemRef = useRef<HTMLLIElement>(null)

    const olaMaps = useMemo(() => {
        const apiKey = process.env.OLA_MAPS_API_KEY
        if (!apiKey) {
            console.error('OlaMaps API key is not configured. Please set NEXT_PUBLIC_OLA_MAPS_API_KEY environment variable.')
            setError('Map service is not configured. Please check your API key settings.')
            return null
        }
        return new OlaMaps({
            apiKey: apiKey,
        })
    }, [])

    useEffect(() => {
        const mapContainer = document.getElementById('map')
        if (!mapContainer || !olaMaps) return

        const myMap = olaMaps.init({
            style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard-mr/style.json",
            container: mapContainer,
            center: [88.346142, 22.529923],
            zoom: 15,
        })

        mapRef.current = myMap

        return () => {
            if (myMap) {
                try {
                    // Remove marker first to avoid issues
                    if (markerRef.current) {
                        markerRef.current.remove()
                        markerRef.current = null
                    }
                    // Remove map with error handling
                    myMap.remove()
                } catch (error) {
                    // Silently handle AbortError and other cleanup errors
                    if (error instanceof Error && error.name !== 'AbortError') {
                        console.warn('Error during map cleanup:', error)
                    }
                }
            }
        }
    }, [olaMaps])

    // Click outside handler to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputRef.current && 
                !inputRef.current.contains(event.target as Node) &&
                suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false)
                setInputFocused(false)
                setSelectedIndex(-1)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Update state when initial values change
    useEffect(() => {
        if (initialAddress) {
            setQuery(initialAddress)
        }
        if (initialLat) {
            setLatitude(initialLat)
        }
        if (initialLng) {
            setLongitude(initialLng)
        }
    }, [initialAddress, initialLat, initialLng])

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(-1)
    }, [suggestions])

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && suggestionsRef.current) {
            const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                })
            }
        }
    }, [selectedIndex])

    const fetchSuggestions = useCallback(
        debounce(async (input: string) => {
            if (input.length < 2) {
                setSuggestions([])
                setIsLoading(false)
                setShowSuggestions(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/autocomplete?input=${encodeURIComponent(input)}`)

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to fetch suggestions.')
                }

                const data = await response.json()
                setSuggestions(data.predictions || [])
                setShowSuggestions(data.predictions?.length > 0 && inputFocused)
            } catch (err: any) {
                console.error('Error fetching autocomplete suggestions:', err)
                setError(err.message || 'An unexpected error occurred.')
                setShowSuggestions(false)
            } finally {
                setIsLoading(false)
            }
        }, 300),
        [inputFocused]
    )

    useEffect(() => {
        if (inputFocused && query.length >= 2) {
            fetchSuggestions(query)
        } else {
            setShowSuggestions(false)
        }

        return () => {
            fetchSuggestions.cancel()
        }
    }, [query, fetchSuggestions, inputFocused])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
        setError(null)
        setSelectedIndex(-1)
    }

    const handleInputFocus = () => {
        setInputFocused(true)
        if (suggestions.length > 0 && query.length >= 2) {
            setShowSuggestions(true)
        }
    }

    const handleInputBlur = () => {
        // Delay hiding suggestions to allow for clicks
        setTimeout(() => {
            setShowSuggestions(false)
            setInputFocused(false)
            setSelectedIndex(-1)
            // Auto-select first suggestion if available and query is long enough
            if (suggestions.length > 0 && query.length >= 2) {
                updateMap(suggestions[0].geometry.location, suggestions[0].description)
            }
        }, 200)
    }

    const selectSuggestion = (prediction: Prediction) => {
        setQuery(prediction.description)
        setSuggestions([])
        setShowSuggestions(false)
        setInputFocused(false)
        setSelectedIndex(-1)
        updateMap(prediction.geometry.location, prediction.description)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter') {
                setShowSuggestions(false)
                setInputFocused(false)
                // Auto-select first suggestion if available
                if (suggestions.length > 0) {
                    updateMap(suggestions[0].geometry.location, suggestions[0].description)
                }
            }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
                )
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    selectSuggestion(suggestions[selectedIndex])
                } else if (suggestions.length > 0) {
                    selectSuggestion(suggestions[0])
                }
                break
            case 'Escape':
                setShowSuggestions(false)
                setInputFocused(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
                break
        }
    }

    const handleSuggestionClick = (prediction: Prediction) => {
        selectSuggestion(prediction)
    }

    const updateMap = (location: { lat: number; lng: number }, address: string = query) => {
        if (mapRef.current) {
            const coordinates: [number, number] = [location.lng, location.lat]
            mapRef.current.setCenter(coordinates)
            mapRef.current.setZoom(15)

            // Remove existing marker
            if (markerRef.current) {
                markerRef.current.remove()
            }

            // Add a popup if olaMaps is available
            if (olaMaps) {
                const popup = olaMaps
                    .addPopup({ offset: [0, -30], anchor: 'bottom' })
                    .setHTML(`<div>${address}</div>`)

                const marker = olaMaps
                    .addMarker({
                        offset: [0, -15],
                        anchor: 'bottom',
                        color: 'red',
                        draggable: true,
                    })
                    .setLngLat(coordinates)
                    .setPopup(popup)
                    .addTo(mapRef.current)

                markerRef.current = marker

                // Update latitude and longitude fields
                setLatitude(location.lat.toFixed(6))
                setLongitude(location.lng.toFixed(6))
                onCoordinatesChange(location.lat.toFixed(6), location.lng.toFixed(6), address)

                // Add drag event listener
                marker.on('drag', onDrag)
            }
        }
    }

    const onDrag = () => {
        if (markerRef.current) {
            const lngLat = markerRef.current.getLngLat()
            console.log('Marker dragged to:', lngLat)
            setLatitude(lngLat.lat.toFixed(6))
            setLongitude(lngLat.lng.toFixed(6))
            onCoordinatesChange(lngLat.lat.toFixed(6), lngLat.lng.toFixed(6), query)
        }
    }

    const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === 'latitude') {
            setLatitude(value)
        } else if (name === 'longitude') {
            setLongitude(value)
        }

        const lat = parseFloat(name === 'latitude' ? value : latitude)
        const lng = parseFloat(name === 'longitude' ? value : longitude)

        if (!isNaN(lat) && !isNaN(lng)) {
            updateMap({ lat, lng })
        }
    }

    return (
        <div className="w-full space-y-4">
            {/* Address Input with Autocomplete */}
            <div className="relative">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        ) : (
                            <Search className="w-4 h-4 text-muted-foreground" />
                        )}
                    </div>
                    <Input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter address or location..."
                        className={cn(
                            "pl-10 shadow-md",
                            error && "border-destructive focus:ring-destructive"
                        )}
                        autoComplete="off"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {error}
                    </p>
                )}

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[9999] mt-1">
                        <ul
                            ref={suggestionsRef}
                            className="bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto overflow-x-hidden"
                        >
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={`${suggestion.description}-${index}`}
                                    ref={index === selectedIndex ? selectedItemRef : null}
                                    className={cn(
                                        "px-3 py-1.5 cursor-pointer text-foreground border-b border-border/50 last:border-b-0 transition-colors",
                                        index === selectedIndex 
                                            ? "bg-accent text-accent-foreground" 
                                            : "hover:bg-muted/50"
                                    )}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <span className="text-sm leading-tight line-clamp-2 break-words">
                                            {suggestion.description}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Coordinates Display */}
            {(latitude || longitude) && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">
                            Latitude
                        </Label>
                        <Input
                            type="text"
                            name="latitude"
                            value={latitude}
                            onChange={handleCoordinateChange}
                            placeholder="0.000000"
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">
                            Longitude
                        </Label>
                        <Input
                            type="text"
                            name="longitude"
                            value={longitude}
                            onChange={handleCoordinateChange}
                            placeholder="0.000000"
                            className="font-mono text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Hidden Map Container */}
            <div id="map" className="hidden">
                <span className="sr-only">Map showing the selected location</span>
            </div>
        </div>
    )
}