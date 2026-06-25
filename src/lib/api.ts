/**
 * Centralized API utility for YahyaTel
 * Handles JWT injection for protected routes
 */

// Use environment variable for production, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";


export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = sessionStorage.getItem("access_token");
    
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Handle token expiration - clear storage and redirect to login
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("userName");
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        throw new Error("Unauthorized: Token expired or invalid.");
    }

    return response;
}
