import { memoryService, PreferenceMemoryConsentError } from './application/memory-service';

export { PreferenceMemoryConsentError };

export async function writePreferenceMemory(input: {
  userId: string;
  key: string;
  value: unknown;
  source?: string;
  consentGranted: boolean;
  consentGivenAt?: Date;
}) {
  return memoryService.writePreferenceMemory(input);
}
