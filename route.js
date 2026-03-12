// app/api/flights/route.js
// Amadeus Flight Offers Search API
// Docs: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search

import { NextResponse } from "next/server";

let amadeusToken = null;
let tokenExpiry = 0;

// ─── Step 1: Get OAuth2 token from Amadeus ────────────────────────────────────
async function getAmadeusToken() {
  if (amadeusToken && Date.now() < tokenExpiry) return amadeusToken;

  const res = await fetch(`${process.env.AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error("Failed to authenticate with Amadeus");
  const data = await res.json();
  amadeusToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 1 min early
  return amadeusToken;
}

// ─── Step 2: Search Flights ───────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");        // IATA code e.g. "DEL"
  const destination = searchParams.get("destination"); // e.g. "BOM"
  const date = searchParams.get("date");            // YYYY-MM-DD
  const adults = searchParams.get("adults") || "1";
  const travelClass = searchParams.get("class") || "ECONOMY"; // ECONOMY | PREMIUM_ECONOMY | BUSINESS | FIRST
  const maxResults = searchParams.get("max") || "10";

  if (!origin || !destination || !date) {
    return NextResponse.json(
      { error: "Missing required params: origin, destination, date" },
      { status: 400 }
    );
  }

  try {
    const token = await getAmadeusToken();

    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults,
      travelClass,
      max: maxResults,
      currencyCode: searchParams.get("currency") || "INR",
    });

    const res = await fetch(
      `${process.env.AMADEUS_BASE_URL}/v2/shopping/flight-offers?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const raw = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: raw.errors?.[0]?.detail || "Amadeus error" }, { status: res.status });
    }

    // ─── Transform Amadeus response to our clean format ────────────────────
    const flights = raw.data?.map((offer) => {
      const itinerary = offer.itineraries[0];
      const segment = itinerary.segments[0];
      const price = offer.price;

      return {
        id: offer.id,
        airline: segment.carrierCode,
        flightNumber: `${segment.carrierCode}${segment.number}`,
        from: segment.departure.iataCode,
        to: segment.arrival.iataCode,
        departure: segment.departure.at,
        arrival: segment.arrival.at,
        duration: itinerary.duration, // e.g. "PT2H10M"
        stops: itinerary.segments.length - 1,
        cabin: offer.travelerPricings[0].fareDetailsBySegment[0].cabin,
        price: `${price.currency} ${parseFloat(price.grandTotal).toLocaleString()}`,
        priceRaw: parseFloat(price.grandTotal),
        currency: price.currency,
        seatsLeft: offer.numberOfBookableSeats,
        bookingToken: offer.id, // use for booking confirmation
      };
    }) || [];

    return NextResponse.json({ flights, total: flights.length });
  } catch (err) {
    console.error("Flights API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Create flight booking (price confirmation step) ────────────────────
export async function POST(request) {
  const body = await request.json();
  const { flightOfferId, travelers } = body;

  try {
    const token = await getAmadeusToken();

    // First confirm the price is still valid
    const priceRes = await fetch(
      `${process.env.AMADEUS_BASE_URL}/v1/shopping/flight-offers/pricing`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: [{ type: "flight-offer", id: flightOfferId }],
          },
        }),
      }
    );

    const priceData = await priceRes.json();
    if (!priceRes.ok) {
      return NextResponse.json({ error: "Price confirmation failed" }, { status: 400 });
    }

    return NextResponse.json({
      confirmed: true,
      finalPrice: priceData.data?.flightOffers?.[0]?.price,
      offerId: flightOfferId,
    });
  } catch (err) {
    return NextResponse.json({ error: "Booking error" }, { status: 500 });
  }
}
