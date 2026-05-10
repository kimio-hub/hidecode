import type { Policy, PolicyDecision, ToolRequest } from '@world-harness/core';

export const defaultPolicy: Policy = { id: 'default-local-safe', allow: ['read'], ask: ['write', 'execute', 'git', 'network'], deny: ['rm -rf', 'secret'] };

export function decide(policy: Policy = defaultPolicy, request: ToolRequest): PolicyDecision {
  const haystack = `${request.tool} ${JSON.stringify(request.input)} ${request.risks.join(' ')}`;
  for (const pattern of policy.deny) if (haystack.includes(pattern)) return { decision: 'deny', reason: `Denied by pattern ${pattern}`, matchedRule: pattern };
  for (const risk of request.risks) if (policy.ask.includes(risk)) return { decision: 'ask', reason: `Risk ${risk} requires approval`, matchedRule: risk };
  for (const risk of request.risks) if (!policy.allow.includes(risk)) return { decision: 'ask', reason: `Risk ${risk} is not explicitly allowed`, matchedRule: risk };
  return { decision: 'allow', reason: 'All risks explicitly allowed' };
}
