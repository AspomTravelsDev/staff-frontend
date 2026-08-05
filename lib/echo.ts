import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Attach Pusher to global scope as required by laravel-echo
if (typeof window !== "undefined") {
    (window as any).Pusher = Pusher;
}

let echoInstance: Echo<"reverb"> | null = null;

export function getEchoInstance(): Echo<"reverb"> | null {
    if (typeof window === "undefined") {
        return null;
    }

    if (echoInstance) {
        return echoInstance;
    }

    const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
    const host = process.env.NEXT_PUBLIC_REVERB_HOST;
    const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
    const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || (scheme === "https" ? 443 : 8080));
    const forceTLS = scheme === "https";

    if (!key || !host) {
        console.warn(
            "Echo: missing NEXT_PUBLIC_REVERB_APP_KEY or NEXT_PUBLIC_REVERB_HOST — real-time chat disabled",
        );
        return null;
    }

    const config = {
        broadcaster: "reverb",
        key,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS,
        enabledTransports: ["ws", "wss"],
        authEndpoint: "/api/broadcasting/auth",
        auth: {
            headers: {
                Accept: "application/json",
            },
        } as any,
        withCredentials: true,
    } as any;

    console.info("Echo init", { host, port, scheme, forceTLS });

    echoInstance = new Echo(config);

    const connector = (echoInstance as any).connector;
    const socket = connector?.socket;

    if (socket?.bind) {
        socket.bind("connecting", () => console.info("Echo socket connecting"));
        socket.bind("connected", () => console.info("Echo socket connected"));
        socket.bind("disconnected", () => console.warn("Echo socket disconnected"));
        socket.bind("error", (error: unknown) => console.error("Echo socket error", error));
        socket.bind("unavailable", () =>
            console.error(
                "Echo socket unavailable — check that Reverb is running and /app is proxied on the server",
            ),
        );
    }

    return echoInstance;
}
