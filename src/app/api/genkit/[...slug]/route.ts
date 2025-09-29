import {createApiHandler} from 'genkit/next';
import '@/ai/flows/pii-detection-for-registration';

export const {GET, POST} = createApiHandler();
