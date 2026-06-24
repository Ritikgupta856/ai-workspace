import { tool } from "ai"
import { z } from "zod"
import { Octokit } from "@octokit/rest"

export function createGitHubTools(octokit: Octokit) {
  return {
    listRepositories: tool({
      description: "List repositories for the authenticated user, optionally filtered by type",
      inputSchema: z.object({
        type: z.enum(["all", "owner", "public", "private", "member"]).optional().default("all"),
        perPage: z.number().min(1).max(100).optional().default(30),
      }),
      execute: async ({ type, perPage }) => {
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
          type: type ?? "all",
          per_page: perPage ?? 30,
          sort: "updated",
        })
        return data.map((repo) => ({
          id: repo.id,
          name: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          private: repo.private,
          defaultBranch: repo.default_branch,
          updatedAt: repo.updated_at,
        }))
      },
    }),

    getRepository: tool({
      description: "Get details of a specific repository",
      inputSchema: z.object({
        owner: z.string().describe("Owner of the repository"),
        repo: z.string().describe("Name of the repository"),
      }),
      execute: async ({ owner, repo }) => {
        const { data } = await octokit.rest.repos.get({ owner, repo })
        return {
          id: data.id,
          name: data.full_name,
          description: data.description,
          url: data.html_url,
          language: data.language,
          stars: data.stargazers_count,
          forks: data.forks_count,
          openIssues: data.open_issues_count,
          private: data.private,
          defaultBranch: data.default_branch,
          topics: data.topics,
          license: data.license?.spdx_id ?? null,
          updatedAt: data.updated_at,
          createdAt: data.created_at,
        }
      },
    }),

    listIssues: tool({
      description: "List issues in a repository, optionally filtered by state and labels",
      inputSchema: z.object({
        owner: z.string().describe("Owner of the repository"),
        repo: z.string().describe("Name of the repository"),
        state: z.enum(["open", "closed", "all"]).optional().default("open"),
        labels: z.string().optional().describe("Comma-separated list of label names"),
        perPage: z.number().min(1).max(100).optional().default(30),
      }),
      execute: async ({ owner, repo, state, labels, perPage }) => {
        const { data } = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: state ?? "open",
          labels,
          per_page: perPage ?? 30,
          sort: "updated",
          direction: "desc",
        })
        return data.map((issue) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          body: issue.body?.slice(0, 2000),
          url: issue.html_url,
          labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
          assignees: issue.assignees?.map((a) => a.login) ?? [],
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
        }))
      },
    }),

    getIssue: tool({
      description: "Get a specific issue by number",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        issueNumber: z.number().describe("The issue number"),
      }),
      execute: async ({ owner, repo, issueNumber }) => {
        const { data } = await octokit.rest.issues.get({
          owner,
          repo,
          issue_number: issueNumber,
        })
        return {
          number: data.number,
          title: data.title,
          state: data.state,
          body: data.body,
          url: data.html_url,
          labels: data.labels.map((l) => (typeof l === "string" ? l : l.name)),
          assignees: data.assignees?.map((a) => a.login) ?? [],
          comments: data.comments,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
      },
    }),

    searchCode: tool({
      description: "Search for code across repositories using a query. Supports qualifiers like repo:, language:, path:",
      inputSchema: z.object({
        query: z.string().describe("Search query with optional qualifiers"),
        perPage: z.number().min(1).max(100).optional().default(10),
      }),
      execute: async ({ query, perPage }) => {
        const { data } = await octokit.rest.search.code({
          q: query,
          per_page: perPage ?? 10,
        })
        return {
          totalCount: data.total_count,
          items: data.items.map((item) => ({
            name: item.name,
            path: item.path,
            url: item.html_url,
            repository: item.repository.full_name,
          })),
        }
      },
    }),

    listPullRequests: tool({
      description: "List pull requests in a repository",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        state: z.enum(["open", "closed", "all"]).optional().default("open"),
        perPage: z.number().min(1).max(100).optional().default(30),
      }),
      execute: async ({ owner, repo, state, perPage }) => {
        const { data } = await octokit.rest.pulls.list({
          owner,
          repo,
          state: state ?? "open",
          per_page: perPage ?? 30,
          sort: "updated",
          direction: "desc",
        })
        return data.map((pr) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          body: pr.body?.slice(0, 2000),
          url: pr.html_url,
          draft: pr.draft ?? false,
          author: pr.user?.login ?? "unknown",
          baseBranch: pr.base.ref,
          headBranch: pr.head.ref,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
        }))
      },
    }),

    getPullRequest: tool({
      description: "Get details of a specific pull request including diff stats",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        pullNumber: z.number(),
      }),
      execute: async ({ owner, repo, pullNumber }) => {
        const { data } = await octokit.rest.pulls.get({
          owner,
          repo,
          pull_number: pullNumber,
        })
        return {
          number: data.number,
          title: data.title,
          state: data.state,
          body: data.body,
          url: data.html_url,
          draft: data.draft ?? false,
          author: data.user?.login ?? "unknown",
          baseBranch: data.base.ref,
          headBranch: data.head.ref,
          additions: data.additions,
          deletions: data.deletions,
          changedFiles: data.changed_files,
          comments: data.comments,
          reviewComments: data.review_comments,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
      },
    }),

    getFileContent: tool({
      description: "Get the content of a file from a repository",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string().describe("Path to the file in the repository"),
        ref: z.string().optional().describe("Branch, tag, or commit SHA"),
      }),
      execute: async ({ owner, repo, path, ref }) => {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref,
        })
        if ("content" in data && data.content) {
          return {
            name: data.name,
            path: data.path,
            content: Buffer.from(data.content, "base64").toString("utf-8"),
            size: data.size,
            url: data.html_url,
          }
        }
        return { message: "Not a file or directory listing returned", path }
      },
    }),
  }
}
