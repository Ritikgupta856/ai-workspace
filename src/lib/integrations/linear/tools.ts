import { tool } from "ai"
import { z } from "zod"

import { apiJson } from "../shared"

async function linear<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {}
) {
  const data = await apiJson<{ data?: T; errors?: { message: string }[] }>(
    "https://api.linear.app/graphql",
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      errorLabel: "Linear GraphQL",
    }
  )

  if (data.errors?.length) {
    throw new Error(`Linear query failed: ${data.errors[0].message}`)
  }
  return data.data as T
}

const ISSUE_FIELDS = `
  id
  identifier
  title
  description
  url
  priority
  createdAt
  updatedAt
  state { name type }
  assignee { name email }
  team { key name }
  project { name }
`

type Issue = {
  id: string
  identifier: string
  title: string
  description?: string | null
  url: string
  priority?: number
  createdAt: string
  updatedAt: string
  state?: { name: string; type: string }
  assignee?: { name: string; email: string } | null
  team?: { key: string; name: string }
  project?: { name: string } | null
}

function shapeIssue(issue: Issue, withBody = false) {
  return {
    id: issue.identifier,
    title: issue.title,
    url: issue.url,
    state: issue.state?.name ?? null,
    assignee: issue.assignee?.name ?? null,
    team: issue.team?.key ?? null,
    project: issue.project?.name ?? null,
    priority: issue.priority ?? null,
    updatedAt: issue.updatedAt,
    ...(withBody ? { description: issue.description ?? null } : {}),
  }
}

export function createLinearTools(token: string) {
  return {
    listLinearIssues: tool({
      description:
        "List recent Linear issues, most recently updated first. Optionally filter to a team key like ENG.",
      inputSchema: z.object({
        teamKey: z.string().optional().describe("Team key, e.g. ENG"),
        limit: z.number().min(1).max(50).optional().default(25),
      }),
      execute: async ({ teamKey, limit }) => {
        const data = await linear<{ issues: { nodes: Issue[] } }>(
          token,
          `query Issues($first: Int!, $filter: IssueFilter) {
            issues(first: $first, filter: $filter, orderBy: updatedAt) {
              nodes { ${ISSUE_FIELDS} }
            }
          }`,
          {
            first: limit ?? 25,
            filter: teamKey ? { team: { key: { eq: teamKey } } } : undefined,
          }
        )
        return data.issues.nodes.map((i) => shapeIssue(i))
      },
    }),

    searchLinearIssues: tool({
      description: "Search Linear issues by text across titles and descriptions.",
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().min(1).max(50).optional().default(20),
      }),
      execute: async ({ query, limit }) => {
        const data = await linear<{ searchIssues: { nodes: Issue[] } }>(
          token,
          `query Search($term: String!, $first: Int!) {
            searchIssues(term: $term, first: $first) {
              nodes { ${ISSUE_FIELDS} }
            }
          }`,
          { term: query, first: limit ?? 20 }
        )
        return data.searchIssues.nodes.map((i) => shapeIssue(i))
      },
    }),

    getLinearIssue: tool({
      description:
        "Get one Linear issue in full, including its description and comments, by identifier like ENG-231.",
      inputSchema: z.object({ identifier: z.string() }),
      execute: async ({ identifier }) => {
        const data = await linear<{
          issue: (Issue & { comments: { nodes: { body: string; user?: { name: string }; createdAt: string }[] } }) | null
        }>(
          token,
          `query Issue($id: String!) {
            issue(id: $id) {
              ${ISSUE_FIELDS}
              comments(first: 20) {
                nodes { body createdAt user { name } }
              }
            }
          }`,
          { id: identifier }
        )

        if (!data.issue) return { error: `Issue ${identifier} not found` }

        return {
          ...shapeIssue(data.issue, true),
          comments: data.issue.comments.nodes.map((c) => ({
            author: c.user?.name ?? null,
            body: c.body,
            createdAt: c.createdAt,
          })),
        }
      },
    }),

    listLinearProjects: tool({
      description: "List Linear projects with their progress and target dates.",
      inputSchema: z.object({
        limit: z.number().min(1).max(50).optional().default(25),
      }),
      execute: async ({ limit }) => {
        const data = await linear<{
          projects: {
            nodes: {
              id: string
              name: string
              description?: string
              state: string
              progress: number
              targetDate?: string | null
              url: string
            }[]
          }
        }>(
          token,
          `query Projects($first: Int!) {
            projects(first: $first) {
              nodes { id name description state progress targetDate url }
            }
          }`,
          { first: limit ?? 25 }
        )

        return data.projects.nodes.map((p) => ({
          name: p.name,
          state: p.state,
          progress: Math.round((p.progress ?? 0) * 100),
          targetDate: p.targetDate ?? null,
          url: p.url,
        }))
      },
    }),

    listLinearTeams: tool({
      description: "List Linear teams and their keys, to filter issues by team.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await linear<{
          teams: { nodes: { id: string; key: string; name: string }[] }
        }>(token, `query { teams(first: 50) { nodes { id key name } } }`)
        return data.teams.nodes
      },
    }),
  }
}
