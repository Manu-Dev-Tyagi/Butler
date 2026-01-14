import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Check if backend API is reachable
 */
export async function checkApiHealth() {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`, {
            timeout: 5000
        });
        return {
            isHealthy: response.status === 200,
            message: 'Backend server is running',
            url: API_BASE_URL
        };
    } catch (error) {
        return {
            isHealthy: false,
            message: `Cannot reach backend server at ${API_BASE_URL}`,
            error: error.message,
            url: API_BASE_URL
        };
    }
}
