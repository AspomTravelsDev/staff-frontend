export interface ExchangeRateResponse {
    result: string;
    documentation: string;
    terms_of_use: string;
    time_last_update_unix: number;
    time_last_update_utc: string;
    time_next_update_unix: number;
    time_next_update_utc: string;
    base_code: string;
    conversion_rates: {
        [key: string]: number;
    };
}

export interface SelectedRates {
    USD: number;
    EUR: number;
    GBP: number;
}

export const getExchangeRate = async (): Promise<SelectedRates | null> => {
    try {
        const response = await fetch(
            "https://v6.exchangerate-api.com/v6/775a8bff3671de1219913317/latest/NGN",
            { next: { revalidate: 3600 } } 
        );

        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates");
        }

        const data: ExchangeRateResponse = await response.json();

        const { USD, EUR, GBP } = data.conversion_rates;

        return {
            USD: 1 / USD,
            EUR: 1 / EUR,
            GBP: 1 / GBP,
        };
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
        return null;
    }
};
