import { useState } from 'react';
import { MOCK_EVENTS, MOCK_RUN, type TraceEvent, type RunMeta } from '../data/mock';
import Dashboard from './Dashboard';

export default function App() {
  const [events] = useState<TraceEvent[]>(MOCK_EVENTS);
  const [run] = useState<RunMeta>(MOCK_RUN);
  return <Dashboard events={events} run={run} />;
}
