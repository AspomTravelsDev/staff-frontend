export interface ConsularAddress {
  countryCode: string;
  countryName: string;
  consularTitle: string;
  embassyName: string;
  addressLines: string[];
}

export const CONSULAR_ADDRESSES: Record<string, ConsularAddress> = {
  canada: {
    countryCode: "canada",
    countryName: "Canada (General)",
    consularTitle: "The Consular",
    embassyName: "Canadian Deputy High Commission",
    addressLines: [
      "The Consular,",
      "Canadian Deputy High Commission,",
      "4 Anifowose Street,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  canada_winter: {
    countryCode: "canada_winter",
    countryName: "Canada (Winter)",
    consularTitle: "The Consular",
    embassyName: "Canadian Deputy High Commission",
    addressLines: [
      "The Consular,",
      "Canadian Deputy High Commission,",
      "4 Anifowose Street,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  canada_summer: {
    countryCode: "canada_summer",
    countryName: "Canada (Summer)",
    consularTitle: "The Consular",
    embassyName: "Canadian Deputy High Commission",
    addressLines: [
      "The Consular,",
      "Canadian Deputy High Commission,",
      "4 Anifowose Street,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  uk: {
    countryCode: "uk",
    countryName: "United Kingdom",
    consularTitle: "The Visa Officer",
    embassyName: "British High Commission",
    addressLines: [
      "The Visa Officer,",
      "British High Commission,",
      "11 Walter Carrington Crescent,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  usa: {
    countryCode: "usa",
    countryName: "United States of America",
    consularTitle: "The Consular Officer",
    embassyName: "U.S. Consulate General",
    addressLines: [
      "The Consular Officer,",
      "U.S. Consulate General,",
      "2 Walter Carrington Crescent,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  france: {
    countryCode: "france",
    countryName: "France (Schengen)",
    consularTitle: "The Consular Section",
    embassyName: "Consulate General of France",
    addressLines: [
      "The Consular Section,",
      "Consulate General of France,",
      "1 Oyinkan Abayomi Drive,",
      "Ikoyi,",
      "Lagos State.",
    ],
  },
  spain: {
    countryCode: "spain",
    countryName: "Spain (Schengen)",
    consularTitle: "The Consular Section",
    embassyName: "Consulate of Spain",
    addressLines: [
      "The Consular Section,",
      "Consulate of Spain,",
      "21C Kofo Abayomi Street,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  germany: {
    countryCode: "germany",
    countryName: "Germany (Schengen)",
    consularTitle: "The Visa Department",
    embassyName: "Consulate General of the Federal Republic of Germany",
    addressLines: [
      "The Visa Department,",
      "Consulate General of the Federal Republic of Germany,",
      "15 Walter Carrington Crescent,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  australia: {
    countryCode: "australia",
    countryName: "Australia",
    consularTitle: "The Migration Officer",
    embassyName: "Australian High Commission Office",
    addressLines: [
      "The Migration Officer,",
      "Australian High Commission Office,",
      "76 Norman Williams Street,",
      "Ikoyi,",
      "Lagos State.",
    ],
  },
  brazil: {
    countryCode: "brazil",
    countryName: "Brazil",
    consularTitle: "THE CONSULAR GENERAL",
    embassyName: "BRAZIL CONSULATE",
    addressLines: [
      "THE CONSULAR GENERAL,",
      "BRAZIL CONSULATE,",
      "PLOT 257, KOFO ABAYOMI STREET,",
      "VICTORIA ISLAND,",
      "101241, LAGOS STATE.",
    ],
  },
  south_africa: {
    countryCode: "south_africa",
    countryName: "South Africa",
    consularTitle: "The Consular Section",
    embassyName: "High Commission of South Africa",
    addressLines: [
      "The Consular Section,",
      "High Commission of South Africa,",
      "24 Molade Okoya Thomas Street,",
      "Victoria Island,",
      "Lagos State.",
    ],
  },
  turkey: {
    countryCode: "turkey",
    countryName: "Turkey",
    consularTitle: "The Consular Section",
    embassyName: "Embassy of the Republic of Turkey",
    addressLines: [
      "The Consular Section,",
      "Embassy of the Republic of Turkey,",
      "5 Alexis Street, Off Alexandra Avenue,",
      "Ikoyi, Lagos State.",
    ],
  },
};

export function getConsularAddressFormatted(countryKey: string): string {
  const consular = CONSULAR_ADDRESSES[countryKey.toLowerCase()];
  if (consular) {
    return consular.addressLines.join("\n");
  }
  return "";
}