import { Platform } from 'react-native';

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// For production, replace this with your actual Render API URL
const PROD_API_URL = 'https://seed-of-thought-backend.onrender.com';

export const API_URL = __DEV__
    ? `http://${LOCALHOST}:3000`
    : PROD_API_URL;
