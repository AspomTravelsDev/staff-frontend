import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Attach Pusher to global scope as required by laravel-echo
if (typeof window !== "undefined") {
    (window as any).Pusher = Pusher;
}

let echoInstance: Echo<"reverb"> | null = null;

export function getEchoInstance(token?: string): Echo<"reverb"> | null {
    if (typeof window === "undefined") {
        return null; // Server-side rendering guard
    }

    if (echoInstance && !token) {
        return echoInstance;
    }

    const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY || "evm26g5c8qg6a00h0o24";
    const host = process.env.NEXT_PUBLIC_REVERB_HOST || "127.0.0.1";
    const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
    const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    echoInstance = new Echo({
        broadcaster: "reverb",
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: `${apiUrl}/api/broadcasting/auth`,
        auth: {
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        },
    });

    return echoInstance;
}
