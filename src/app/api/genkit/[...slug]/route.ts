import {createApiHandler} from '@genkit-ai/next';
import '@/ai/flows/pii-detection-for-registration';

export const {GET, POST} = createApiHandler();
