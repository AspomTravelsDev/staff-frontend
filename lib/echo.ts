import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Attach Pusher to global scope as required by laravel-echo
if (typeof window !== "undefined") {
    (window as any).Pusher = Pusher;
}

let echoInstance: Echo<"pusher" | "reverb"> | null = null;

export function getEchoInstance(): Echo<"pusher" | "reverb"> | null {
    if (typeof window === "undefined") {
        return null;
    }

    if (echoInstance) {
        return echoInstance;
    }

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "mt1";

    const reverbKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
    const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST;
    const reverbScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME || "http";
    const reverbPort = Number(process.env.NEXT_PUBLIC_REVERB_PORT || (reverbScheme === "https" ? 443 : 8080));

    let config: any;

    if (pusherKey) {
        config = {
            broadcaster: "pusher",
            key: pusherKey,
            cluster: pusherCluster,
            forceTLS: true,
            authEndpoint: "/api/broadcasting/auth",
            auth: {
                headers: {
                    Accept: "application/json",
                },
            },
            withCredentials: true,
        };
        console.info("Echo init (Pusher)", { cluster: pusherCluster });
    } else if (reverbKey && reverbHost) {
        config = {
            broadcaster: "reverb",
            key: reverbKey,
            wsHost: reverbHost,
            wsPort: reverbPort,
            wssPort: reverbPort,
            forceTLS: reverbScheme === "https",
            enabledTransports: ["ws", "wss"],
            authEndpoint: "/api/broadcasting/auth",
            auth: {
                headers: {
                    Accept: "application/json",
                },
            },
            withCredentials: true,
        };
        console.info("Echo init (Reverb)", { host: reverbHost, port: reverbPort, scheme: reverbScheme });
    } else {
        console.warn(
            "Echo: missing NEXT_PUBLIC_PUSHER_APP_KEY and NEXT_PUBLIC_REVERB_APP_KEY — real-time chat disabled",
        );
        return null;
    }

    echoInstance = new Echo(config);

    const connector = (echoInstance as any).connector;
    const socket = connector?.socket;

    if (socket?.bind) {
        socket.bind("connecting", () => console.info("Echo socket connecting"));
        socket.bind("connected", () => console.info("Echo socket connected"));
        socket.bind("disconnected", () => console.warn("Echo socket disconnected"));
        socket.bind("error", (error: unknown) => console.error("Echo socket error", error));
        socket.bind("unavailable", () =>
            console.error("Echo socket unavailable — check connection/credentials"),
        );
    }

    return echoInstance;
}
