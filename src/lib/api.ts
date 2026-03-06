import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Creates headers with the current user's Supabase JWT token.
 * This ensures the backend knows *who* is making the request securely.
 */
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    };
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    // If the response is not ok, parse the error message if possible
    if (!response.ok) {
        let errorMsg = `Http status ${response.status}`;
        try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
        } catch (e) {
            // Not JSON, just use status text
            errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
    }

    // Handle empty responses (like 204 No Content for Deletes)
    if (response.status === 204) {
        return null;
    }

    return response.json();
}
