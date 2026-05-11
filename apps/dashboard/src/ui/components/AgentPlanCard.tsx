import type { AgentPlan } from '../../data/chat';

type AgentPlanCardProps = {
  plan: AgentPlan;
};

export default function AgentPlanCard({ plan }: AgentPlanCardProps) {
  return (
    <section aria-label={plan.title} style={styles.card}>
      <div style={styles.title}>{plan.title}</div>
      <ol style={styles.steps}>
        {plan.steps.map((step) => (
          <li key={step.id} style={styles.step}>
            <span style={styles.stepLabel}>{step.label}</span>
            <span style={{ ...styles.status, ...statusStyles[step.status] }}>{step.status}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const styles = {
  card: {
    border: '1px solid #25304a',
    borderRadius: '14px',
    background: '#0e1422',
    padding: '14px',
    marginTop: '12px',
  },
  title: {
    color: '#f8fafc',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '10px',
  },
  steps: {
    display: 'grid',
    gap: '8px',
    margin: 0,
    paddingLeft: '18px',
  },
  step: {
    color: '#aab2c8',
    fontSize: '12px',
  },
  stepLabel: {
    marginRight: '8px',
  },
  status: {
    borderRadius: '999px',
    padding: '2px 7px',
    fontSize: '10px',
    fontWeight: 800,
  },
} satisfies Record<string, React.CSSProperties>;

const statusStyles = {
  pending: { color: '#cbd5e1', background: '#1e293b' },
  running: { color: '#bfdbfe', background: '#1e3a8a' },
  completed: { color: '#bbf7d0', background: '#14532d' },
  failed: { color: '#fecaca', background: '#7f1d1d' },
  waiting: { color: '#fde68a', background: '#713f12' },
} satisfies Record<string, React.CSSProperties>;
