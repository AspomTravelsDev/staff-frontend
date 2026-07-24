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
    countryName: "Canada",
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
    countryName: "Canada (Summer Season)",
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
    countryName: "Canada (Winter / Festive)",
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
    embassyName: "UK Visas and Immigration",
    addressLines: [
      "The Visa Officer,",
      "UK Visas and Immigration,",
      "British High Commission,",
      "11 Walter Carrington Crescent,",
      "Victoria Island, Lagos.",
    ],
  },
  usa: {
    countryCode: "usa",
    countryName: "United States of America",
    consularTitle: "The Consular Officer",
    embassyName: "Embassy of the United States of America",
    addressLines: [
      "The Consular Officer,",
      "Embassy of the United States of America,",
      "Consular Section,",
      "1075 Diplomatic Drive, Central Business District,",
      "Abuja, Nigeria.",
    ],
  },
  france: {
    countryCode: "france",
    countryName: "France (Schengen)",
    consularTitle: "The Consular Section",
    embassyName: "Consulate General of France / VFS Global",
    addressLines: [
      "The Consular Section,",
      "Consulate General of France,",
      "Plot 1686b, Oladele Olashore Street,",
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
    embassyName: "Australian High Commission",
    addressLines: [
      "The Migration Officer,",
      "Australian High Commission,",
      "5th Floor, Tower A, 1 Neutrality Way,",
      "Central Business District,",
      "Abuja, Nigeria.",
    ],
  },
  brazil: {
    countryCode: "brazil",
    countryName: "Brazil",
    consularTitle: "The Consular General",
    embassyName: "Brazil Consulate",
    addressLines: [
      "The Consular General,",
      "Brazil Consulate,",
      "Plot 257, Kofo Abayomi Street,",
      "Victoria Island,",
      "101241, Lagos State.",
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