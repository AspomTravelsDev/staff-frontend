export interface PresetDay {
  dayNumber: number;
  title: string;
  morning?: string;
  afternoon?: string;
  evening?: string;
}

export interface CountryPreset {
  countryKey: string;
  countryName: string;
  defaultCity: string;
  defaultAccommodationName: string;
  defaultAccommodationAddress: string;
  activitiesHighlights: string;
  presets: {
    7: PresetDay[];
    14: PresetDay[];
  };
}

export const ITINERARY_PRESETS: Record<string, CountryPreset> = {
  brazil: {
    countryKey: "brazil",
    countryName: "Brazil",
    defaultCity: "São Paulo",
    defaultAccommodationName: "DOUBLETREE BY HILTON SAO PAULO ITAIM",
    defaultAccommodationAddress:
      "Rua Manuel Guedes 320 - Itaim Bibi Sao Paulo, 04536-070 Brazil",
    activitiesHighlights:
      "exploring São Paulo Tourist iconic attractions such as Ibirapuera Park, São Paulo Cathedral, Botanical Garden of São Paulo, and Municipal Theatre, which offers spectacular seasonal activities.",
    presets: {
      14: [
        {
          dayNumber: 1,
          title: "Arrival in São Paulo",
          evening:
            "Arrive in São Paulo and check into my hotel, relax and get acclimated by visiting Ibirapuera Park, enjoy dinner in Vila Madalena.",
        },
        {
          dayNumber: 2,
          title: "Downtown Culture",
          morning:
            "Tour the historic downtown area, visiting the São Paulo Cathedral and Pátio do Colégio.",
          afternoon:
            "Head to the Municipal Market for local delicacies. Don’t miss the famous mortadella sandwich!",
          evening:
            "Dinner and samba show at a local venue for an immersive cultural experience.",
        },
        {
          dayNumber: 3,
          title: "Botanical Garden of Sao Paulo",
          morning:
            "Visit the Botanical Garden of São Paulo to unwind in nature.",
          afternoon: "Enjoy a spa treatment or massage at a local spa.",
          evening:
            "Dinner at a rooftop restaurant with a beautiful view of the city.",
        },
        {
          dayNumber: 4,
          title: "Ibirapuera Park",
          morning: "Visit the Museum of Contemporary Art in Ibirapuera Park.",
          afternoon: "Explore the Latin America Memorial.",
          evening: "Dinner at a trendy restaurant in the Pinheiros district.",
        },
        {
          dayNumber: 5,
          title: "Afro Brazil Museum",
          morning:
            "Explore the Mercado Municipal for unique food items and gifts.",
          afternoon: "Visit the Afro-Brazil Museum for cultural insights.",
          evening: "Dinner at a local restaurant.",
        },
        {
          dayNumber: 6,
          title: "Beach Getaway",
          morning:
            "Take a day trip to Guarujá Beach for sun, sand, and relaxation.",
          afternoon: "Enjoy beach activities or lounge by the water.",
          evening: "Seaside dinner at Guarujá before returning to hotel.",
        },
        {
          dayNumber: 7,
          title: "Explore the City",
          morning:
            "Visit the São Paulo Museum of Art for its impressive collection.",
          afternoon: "Explore Avenida Paulista, checking out shops and cafes.",
          evening:
            "Attend a live music show in the Vila Madalena neighborhood.",
        },
        {
          dayNumber: 8,
          title: "Museum of Football",
          morning: "Tour the Museum of Football at Pacaembu Stadium.",
          afternoon: "Visit the Municipal Theatre and nearby Republic Square.",
          evening:
            "Enjoy a show or concert at one of São Paulo’s cultural venues.",
        },
        {
          dayNumber: 9,
          title: "Shopping Spree",
          morning: "Visit the 25 de Março street market for affordable gifts.",
          afternoon:
            "Stop by local artisan shops for unique handcrafted items.",
          evening: "Enjoy Dinner at a local restaurant.",
        },
        {
          dayNumber: 10,
          title: "Day Trip to Santos",
          morning: "Take a day trip to Santos.",
          afternoon: "Visit the Coffee Museum and the beach.",
          evening: "Return to São Paulo and have dinner at a local restaurant.",
        },
        {
          dayNumber: 11,
          title: "Revisit Favorite Spots/Shopping",
          morning:
            "Have breakfast in a classic restaurant and revisit favorite spots.",
          afternoon: "Last-minute shopping or sightseeing.",
          evening: "Enjoy a farewell dinner at a high-end restaurant.",
        },
        {
          dayNumber: 12,
          title: "Cultural Galleries & Park Stroll",
          morning:
            "Stroll through Parque do Povo and visit neighboring art galleries.",
          afternoon: "Enjoy a relaxing coffee at a local boutique café.",
          evening: "Dinner at a cozy restaurant in Itaim Bibi.",
        },
        {
          dayNumber: 13,
          title: "Local Markets & Souvenirs",
          morning: "Browse local craft markets for souvenirs and artwork.",
          afternoon:
            "Leisurely afternoon sightseeing around the financial district.",
          evening: "Evening cultural performance in downtown São Paulo.",
        },
        {
          dayNumber: 14,
          title: "Departure",
          morning: "Relax before departure and finish packing.",
          afternoon:
            "Transfer to the airport and Depart back to my Home country Nigeria.",
        },
      ],
      7: [
        {
          dayNumber: 1,
          title: "Arrival in São Paulo",
          evening:
            "Arrive in São Paulo and check into hotel. Evening relaxation in Vila Madalena.",
        },
        {
          dayNumber: 2,
          title: "Downtown Culture & Municipal Market",
          morning:
            "Tour historic downtown area, visiting São Paulo Cathedral and Pátio do Colégio.",
          afternoon: "Head to Municipal Market for local delicacies.",
          evening: "Dinner and live music in Vila Madalena.",
        },
        {
          dayNumber: 3,
          title: "Botanical Garden & Ibirapuera Park",
          morning: "Visit Botanical Garden of São Paulo.",
          afternoon: "Explore Museum of Contemporary Art in Ibirapuera Park.",
          evening: "Rooftop dinner overlooking the city.",
        },
        {
          dayNumber: 4,
          title: "Afro Brazil Museum & Avenida Paulista",
          morning: "Visit Afro-Brazil Museum.",
          afternoon:
            "Stroll along Avenida Paulista and visit São Paulo Museum of Art.",
          evening: "Dinner in Pinheiros district.",
        },
        {
          dayNumber: 5,
          title: "Day Trip to Santos & Coffee Museum",
          morning: "Day trip to Santos.",
          afternoon: "Visit the historic Coffee Museum and Santos beachfront.",
          evening: "Return to São Paulo for dinner.",
        },
        {
          dayNumber: 6,
          title: "Football Museum & Shopping",
          morning: "Tour Museum of Football at Pacaembu Stadium.",
          afternoon: "Shopping for souvenirs at 25 de Março market.",
          evening: "Farewell dinner at a fine restaurant.",
        },
        {
          dayNumber: 7,
          title: "Departure",
          morning: "Relax at hotel and final packing.",
          afternoon: "Transfer to airport for return flight to Nigeria.",
        },
      ],
    },
  },
  canada: {
    countryKey: "canada",
    countryName: "Canada",
    defaultCity: "Toronto",
    defaultAccommodationName: "DOUBLETREE BY HILTON HOTEL TORONTO DOWNTOWN",
    defaultAccommodationAddress:
      "108 Chestnut Street, Toronto, Ontario, M5G1R3, Canada",
    activitiesHighlights:
      "exploring iconic Tourist attractions such as the CN Tower, Ripley’s Aquarium of Canada, Canada wonderland and the Toronto Islands, Distillery Winter Village.",
    presets: {
      14: [
        {
          dayNumber: 1,
          title: "Arrival in Toronto",
          afternoon: "Arrival in Toronto. Settle into the hotel.",
          evening:
            "Family dinner and relaxation while preparing ourselves ahead of the adventure.",
        },
        {
          dayNumber: 2,
          title: "Evergreen Brick Works & Ripley's Aquarium",
          morning: "Ice skate at Evergreen Brick Works Winter Village.",
          afternoon:
            "Visit Ripley’s Aquarium, featuring holiday dive shows with my family.",
          evening: "Have a Sumptuous family dinner.",
        },
        {
          dayNumber: 3,
          title: "Hockey Hall of Fame & CN Tower",
          morning:
            "Visit the Hockey Hall of Fame to learn about Canada’s favorite sport.",
          afternoon: "Trip with my family to the CN Tower.",
          evening:
            "Spend the early evenings at St. Lawrence Market, and a walk through Kensington Market.",
        },
        {
          dayNumber: 4,
          title: "Distillery Winter Village",
          morning:
            "Visit Toronto Christmas Market / Distillery Winter Village.",
          afternoon: "Ice skating at Distillery District rink.",
          evening: "Return to hotel and enjoy a relaxing dinner.",
        },
        {
          dayNumber: 5,
          title: "Casa Loma & Castle Tour",
          morning: "Visit Casa Loma for Holiday Lights Tour.",
          afternoon: "Stroll through Christmas at the Castle displays.",
          evening: "Drive around neighborhood to admire holiday lights.",
        },
        {
          dayNumber: 6,
          title: "Chinguacousy Park Day Trip",
          morning: "Breakfast at a nice cafe.",
          afternoon: "Family day trip to Chinguacousy park.",
          evening: "End the night with hot chocolate at a cafe.",
        },
        {
          dayNumber: 7,
          title: "Ontario Science Center",
          morning: "Visit Ontario Science Centre with hands-on exhibits.",
          afternoon: "Snow art and sledding at local parks.",
          evening: "Dinner in a nice restaurant as a family.",
        },
        {
          dayNumber: 8,
          title: "Toronto Islands & Museums",
          morning:
            "Take ferry to Toronto Islands for winter stroll and skyline views.",
          afternoon: "Visit Museum of Illusions.",
          evening: "Relaxing evening together as a family.",
        },
        {
          dayNumber: 9,
          title: "Leisure & Shopping",
          morning: "Spend the morning at leisure.",
          afternoon: "Relaxing afternoon at Toronto Eaton Centre.",
          evening: "Dinner at a rooftop city view restaurant.",
        },
        {
          dayNumber: 10,
          title: "Day Trip to Niagara Falls",
          morning: "Day trip to Niagara Falls with my family.",
          afternoon: "Explore Clifton Hill and visit Niagara SkyWheel.",
          evening: "Return to hotel for a nice dinner.",
        },
        {
          dayNumber: 11,
          title: "Royal Ontario Museum",
          morning: "Visit Royal Ontario Museum.",
          afternoon: "Lunch at Yorkville cafes and Toronto Botanical Garden.",
          evening: "Attend evening festivities and live music.",
        },
        {
          dayNumber: 12,
          title: "Community Event & Leisure",
          morning: "Leisurely family brunch.",
          afternoon: "Visit local community winter event.",
          evening: "Cozy family movie night.",
        },
        {
          dayNumber: 13,
          title: "Toronto Zoo",
          morning: "Visit Toronto Zoo for Tundra Trek and wildlife.",
          afternoon: "Sledding at Riverdale Park.",
          evening: "Return to hotel for dinner.",
        },
        {
          dayNumber: 14,
          title: "Departure",
          morning: "Pack luggage and check out of hotel.",
          afternoon:
            "Transfer to Pearson International Airport for return flight to Nigeria.",
        },
      ],
      7: [
        {
          dayNumber: 1,
          title: "Arrival in Toronto",
          afternoon: "Arrival at Toronto Pearson Airport, check in to hotel.",
          evening: "Dinner in downtown Toronto.",
        },
        {
          dayNumber: 2,
          title: "CN Tower & Ripley's Aquarium",
          morning: "Guided tour of CN Tower.",
          afternoon: "Visit Ripley's Aquarium of Canada.",
          evening: "Dinner at Harbourfront.",
        },
        {
          dayNumber: 3,
          title: "Day Trip to Niagara Falls",
          morning: "Travel to Niagara Falls.",
          afternoon: "Boat cruise and Clifton Hill sightseeing.",
          evening: "Return to Toronto.",
        },
        {
          dayNumber: 4,
          title: "Royal Ontario Museum & Shopping",
          morning: "Explore Royal Ontario Museum.",
          afternoon: "Shopping at Eaton Centre.",
          evening: "Dinner in Yorkville.",
        },
        {
          dayNumber: 5,
          title: "Casa Loma & Distillery District",
          morning: "Tour Casa Loma castle.",
          afternoon: "Explore historic Distillery District.",
          evening: "Dinner at local bistro.",
        },
        {
          dayNumber: 6,
          title: "Toronto Islands & Souvenirs",
          morning: "Ferry trip to Toronto Islands for skyline views.",
          afternoon: "Souvenir shopping and city stroll.",
          evening: "Farewell dinner.",
        },
        {
          dayNumber: 7,
          title: "Departure",
          morning: "Check out of hotel.",
          afternoon:
            "Transfer to Toronto Pearson Airport for departure to Nigeria.",
        },
      ],
    },
  },
  uk: {
    countryKey: "uk",
    countryName: "United Kingdom",
    defaultCity: "London",
    defaultAccommodationName: "THE PARK TOWER LONDON KNIGHTSBRIDGE",
    defaultAccommodationAddress:
      "101 Knightsbridge, London, SW1X 7RN, United Kingdom",
    activitiesHighlights:
      "exploring iconic London tourist attractions such as the London Eye, Big Ben, Tower of London, British Museum, and Buckingham Palace.",
    presets: {
      14: [
        {
          dayNumber: 1,
          title: "Arrival in London",
          evening:
            "Arrive at Heathrow Airport, hotel check-in and evening walk at Hyde Park.",
        },
        {
          dayNumber: 2,
          title: "Westminster & Big Ben",
          morning: "Tour Big Ben & Houses of Parliament.",
          afternoon: "Ride the London Eye.",
          evening: "Dinner in Covent Garden.",
        },
        {
          dayNumber: 3,
          title: "British Museum & Soho",
          morning: "Explore British Museum.",
          afternoon: "Stroll through Soho & Oxford Street.",
          evening: "West End theater show.",
        },
        {
          dayNumber: 4,
          title: "Tower of London & Tower Bridge",
          morning: "Visit Tower of London.",
          afternoon: "Walk across Tower Bridge.",
          evening: "Dinner at Borough Market.",
        },
        {
          dayNumber: 5,
          title: "Buckingham Palace & Parks",
          morning: "Witness Changing of the Guard at Buckingham Palace.",
          afternoon: "Walk through St. James's Park.",
          evening: "Dinner in Mayfair.",
        },
        {
          dayNumber: 6,
          title: "Day Trip to Windsor Castle",
          morning: "Train to Windsor Castle.",
          afternoon: "Tour Royal State Apartments.",
          evening: "Return to London for dinner.",
        },
        {
          dayNumber: 7,
          title: "Day Trip to Oxford",
          morning: "Day excursion to Oxford University.",
          afternoon: "Explore Christ Church & Bodleian Library.",
          evening: "Return to London.",
        },
        {
          dayNumber: 8,
          title: "Greenwich & Thames Cruise",
          morning: "Thames River Cruise to Greenwich.",
          afternoon: "Visit Royal Observatory & Cutty Sark.",
          evening: "Dinner in Greenwich.",
        },
        {
          dayNumber: 9,
          title: "Kensington Palace & Shopping",
          morning: "Tour Kensington Palace.",
          afternoon: "Shopping at Harrods & Knightsbridge.",
          evening: "High tea & dinner.",
        },
        {
          dayNumber: 10,
          title: "Natural History Museum",
          morning: "Visit Natural History Museum & V&A Museum.",
          afternoon: "Leisure stroll in South Kensington.",
          evening: "Dinner at local pub.",
        },
        {
          dayNumber: 11,
          title: "Camden Town & Regent's Canal",
          morning: "Explore Camden Market.",
          afternoon: "Walk along Regent's Canal to Primrose Hill.",
          evening: "Dinner in Camden.",
        },
        {
          dayNumber: 12,
          title: "Day Trip to Bath & Stonehenge",
          morning: "Excursion to Stonehenge.",
          afternoon: "Visit Roman Baths in Bath.",
          evening: "Return to London.",
        },
        {
          dayNumber: 13,
          title: "London Souvenir Shopping",
          morning: "Regent Street & Liberty London shopping.",
          afternoon: "Relaxing afternoon at Hyde Park.",
          evening: "Farewell dinner.",
        },
        {
          dayNumber: 14,
          title: "Departure",
          morning: "Hotel check-out and airport transfer.",
          afternoon: "Flight departure to Nigeria.",
        },
      ],
      7: [
        {
          dayNumber: 1,
          title: "Arrival in London",
          evening: "Check-in at hotel, evening stroll at Hyde Park.",
        },
        {
          dayNumber: 2,
          title: "London Eye & Big Ben",
          morning: "Visit Big Ben & Westminster Abbey.",
          afternoon: "London Eye flight.",
          evening: "Dinner in Covent Garden.",
        },
        {
          dayNumber: 3,
          title: "Tower of London & Thames",
          morning: "Tour Tower of London & Tower Bridge.",
          afternoon: "Thames River cruise.",
          evening: "Dinner at Borough Market.",
        },
        {
          dayNumber: 4,
          title: "British Museum & Oxford St",
          morning: "Explore British Museum.",
          afternoon: "Shopping on Oxford Street.",
          evening: "West End show.",
        },
        {
          dayNumber: 5,
          title: "Buckingham Palace & Windsor",
          morning: "Buckingham Palace & Changing of the Guard.",
          afternoon: "Half-day trip to Windsor Castle.",
          evening: "Dinner in London.",
        },
        {
          dayNumber: 6,
          title: "Kensington & Harrods",
          morning: "Visit Kensington Palace.",
          afternoon: "Shopping at Harrods.",
          evening: "Farewell dinner.",
        },
        {
          dayNumber: 7,
          title: "Departure",
          morning: "Hotel check-out.",
          afternoon:
            "Transfer to London Heathrow Airport for flight back to Nigeria.",
        },
      ],
    },
  },
  usa: {
    countryKey: "usa",
    countryName: "United States of America",
    defaultCity: "New York",
    defaultAccommodationName: "MARRIOTT MARQUIS NEW YORK TIMES SQUARE",
    defaultAccommodationAddress:
      "1535 Broadway, New York, NY 10036, United States",
    activitiesHighlights:
      "exploring iconic attractions such as Times Square, Statue of Liberty, Central Park, Empire State Building, and Metropolitan Museum of Art.",
    presets: {
      14: [
        {
          dayNumber: 1,
          title: "Arrival in New York",
          evening: "Arrive at JFK Airport, check in to hotel in Times Square.",
        },
        {
          dayNumber: 2,
          title: "Statue of Liberty & Ellis Island",
          morning: "Ferry to Statue of Liberty.",
          afternoon: "Tour Ellis Island Museum.",
          evening: "Dinner in Financial District.",
        },
        {
          dayNumber: 3,
          title: "Central Park & Met Museum",
          morning: "Walk through Central Park.",
          afternoon: "Visit Metropolitan Museum of Art.",
          evening: "Dinner in Upper East Side.",
        },
        {
          dayNumber: 4,
          title: "Empire State & Fifth Avenue",
          morning: "Empire State Building observation deck.",
          afternoon: "Shopping on 5th Avenue.",
          evening: "Broadway Show.",
        },
        {
          dayNumber: 5,
          title: "Brooklyn Bridge & DUMBO",
          morning: "Walk across Brooklyn Bridge.",
          afternoon: "Explore DUMBO & Brooklyn Heights.",
          evening: "Dinner with skyline views.",
        },
        {
          dayNumber: 6,
          title: "High Line & Chelsea Market",
          morning: "Stroll along High Line park.",
          afternoon: "Food tour at Chelsea Market.",
          evening: "Dinner in Meatpacking District.",
        },
        {
          dayNumber: 7,
          title: "Day Trip to Washington DC",
          morning: "Train to Washington DC.",
          afternoon: "Tour National Mall & Capitol.",
          evening: "Return to New York.",
        },
        {
          dayNumber: 8,
          title: "Rockefeller Center & MoMA",
          morning: "Top of the Rock Observation Deck.",
          afternoon: "Visit Museum of Modern Art (MoMA).",
          evening: "Dinner in Midtown.",
        },
        {
          dayNumber: 9,
          title: "SoHo, Chinatown & Little Italy",
          morning: "Shopping in SoHo.",
          afternoon: "Explore Chinatown & Little Italy.",
          evening: "Authentic Italian dinner.",
        },
        {
          dayNumber: 10,
          title: "9/11 Memorial & One World Trade",
          morning: "9/11 Memorial & Museum.",
          afternoon: "One World Observatory.",
          evening: "Dinner in Tribeca.",
        },
        {
          dayNumber: 11,
          title: "American Museum of Natural History",
          morning: "Explore Natural History Museum.",
          afternoon: "Stroll Upper West Side.",
          evening: "Dinner.",
        },
        {
          dayNumber: 12,
          title: "Hudson Yards & Vessel",
          morning: "Visit Hudson Yards & Edge deck.",
          afternoon: "Shopping at Hudson Yards.",
          evening: "Jazz club dinner.",
        },
        {
          dayNumber: 13,
          title: "Grand Central & Souvenir Shopping",
          morning: "Tour Grand Central Terminal.",
          afternoon: "Souvenir shopping.",
          evening: "Farewell dinner.",
        },
        {
          dayNumber: 14,
          title: "Departure",
          morning: "Hotel check-out.",
          afternoon: "Transfer to JFK Airport for departure back to Nigeria.",
        },
      ],
      7: [
        {
          dayNumber: 1,
          title: "Arrival in New York",
          evening: "Arrival at JFK Airport, check in to Times Square hotel.",
        },
        {
          dayNumber: 2,
          title: "Statue of Liberty & Wall St",
          morning: "Statue of Liberty ferry.",
          afternoon: "Wall Street & 9/11 Memorial.",
          evening: "Dinner in Lower Manhattan.",
        },
        {
          dayNumber: 3,
          title: "Central Park & 5th Avenue",
          morning: "Central Park stroll.",
          afternoon: "Shopping on 5th Avenue & Rockefeller Center.",
          evening: "Broadway Show.",
        },
        {
          dayNumber: 4,
          title: "Empire State & Brooklyn Bridge",
          morning: "Empire State Building deck.",
          afternoon: "Walk across Brooklyn Bridge.",
          evening: "Dinner in DUMBO.",
        },
        {
          dayNumber: 5,
          title: "High Line & Chelsea Market",
          morning: "High Line walk.",
          afternoon: "Chelsea Market food tasting.",
          evening: "Dinner in Greenwich Village.",
        },
        {
          dayNumber: 6,
          title: "Met Museum & Shopping",
          morning: "Visit Metropolitan Museum of Art.",
          afternoon: "Last-minute souvenir shopping.",
          evening: "Farewell dinner.",
        },
        {
          dayNumber: 7,
          title: "Departure",
          morning: "Check out.",
          afternoon: "Transfer to airport for return flight to Nigeria.",
        },
      ],
    },
  },
};

// Date calculation utility helper
export function generateDateString(
  startDateStr: string,
  addDaysCount: number,
): string {
  try {
    const baseDate = new Date(startDateStr);
    if (isNaN(baseDate.getTime())) return `Day ${addDaysCount + 1}`;

    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + addDaysCount);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dayNum = targetDate.getDate();
    const monthStr = monthNames[targetDate.getMonth()];
    const yearNum = targetDate.getFullYear();

    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${monthStr} ${getOrdinal(dayNum)}, ${yearNum}`;
  } catch (e) {
    return `Day ${addDaysCount + 1}`;
  }
}
