export type JournalEntryCreatedEvent = {
  type: 'journal-entry.created';
  userId: string;
  journalEntryId: string;
  content: string;
};

type AppEvent = JournalEntryCreatedEvent;

type EventHandler<TEvent extends AppEvent> = (event: TEvent) => Promise<void>;

const handlers: { [K in AppEvent['type']]?: Array<EventHandler<Extract<AppEvent, { type: K }>>> } = {};

export function subscribeEvent<TType extends AppEvent['type']>(
  type: TType,
  handler: EventHandler<Extract<AppEvent, { type: TType }>>,
) {
  const existing = handlers[type] ?? [];
  handlers[type] = [...existing, handler] as typeof existing;
}

export async function publishEvent(event: AppEvent) {
  const eventHandlers = handlers[event.type] ?? [];
  for (const handler of eventHandlers) {
    await handler(event as never);
  }
}
