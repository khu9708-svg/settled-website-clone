type TitanLogEvent = {
  event: string;
  analysisId?: string;
  documentType?: string;
  status?: string;
  latencyMs?: number;
  findings?: number;
  timestamp: string;
};

const globalForTitanLog = globalThis as unknown as {
  titanLogEvents?: TitanLogEvent[];
};

function store() {
  globalForTitanLog.titanLogEvents ||= [];
  return globalForTitanLog.titanLogEvents;
}

export function titanLog(event: Omit<TitanLogEvent, 'timestamp'>) {
  const record = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  store().unshift(record);
  store().splice(250);

  if (process.env.NODE_ENV !== 'test') {
    console.info('[TitanLog]', JSON.stringify(record));
  }
}

export function getTitanLogEvents() {
  return store();
}
