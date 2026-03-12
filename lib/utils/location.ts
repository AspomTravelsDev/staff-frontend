/**
 * Utility to fetch the current GPS location of the user.
 */
export async function getGPSLocation(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    return new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                reject(new Error(error.message || "Failed to retrieve location."));
            },
            { timeout: 10000, maximumAge: 60000 }
        );
    });
}

/**
 * Utility to fetch the public IP address of the user.
 */
export async function getPublicIP(): Promise<string> {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Failed to fetch public IP:", error);
        throw new Error("Could not determine public IP address.");
    }
}
