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

    listRepositoryFiles: tool({
      description:
        "List the files in a repository as a flat path tree. This is how you browse a repo — use it before reading files or reviewing code. Optionally scope to a subdirectory or to specific extensions.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        path: z
          .string()
          .optional()
          .describe("Only return files under this directory prefix, e.g. src/lib"),
        extensions: z
          .array(z.string())
          .optional()
          .describe(
            'Filter to these file extensions, without the dot, e.g. ["ts","tsx"]'
          ),
        ref: z.string().optional().describe("Branch, tag, or commit SHA"),
        limit: z.number().min(1).max(500).optional().default(300),
      }),
      execute: async ({ owner, repo, path, extensions, ref, limit }) => {
        let treeRef = ref
        if (!treeRef) {
          const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
          treeRef = repoData.default_branch
        }

        const { data } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: treeRef,
          recursive: "1",
        })

        let files = data.tree.filter((node) => node.type === "blob")

        if (path) {
          const prefix = path.replace(/^\/+|\/+$/g, "")
          files = files.filter((f) => f.path?.startsWith(`${prefix}/`) || f.path === prefix)
        }

        if (extensions?.length) {
          const wanted = extensions.map((e) => e.replace(/^\./, "").toLowerCase())
          files = files.filter((f) => {
            const ext = f.path?.split(".").pop()?.toLowerCase()
            return ext ? wanted.includes(ext) : false
          })
        }

        const capped = files.slice(0, limit ?? 300)

        return {
          repository: `${owner}/${repo}`,
          ref: treeRef,
          totalFiles: files.length,
          returned: capped.length,
          truncated: files.length > capped.length || Boolean(data.truncated),
          files: capped.map((f) => ({ path: f.path, size: f.size ?? null })),
        }
      },
    }),

    listCommits: tool({
      description:
        "List recent commits on a repository, optionally for a single file path or branch. Use to answer what changed recently and who changed it.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string().optional().describe("Only commits touching this file or directory"),
        sha: z.string().optional().describe("Branch or commit to start from"),
        perPage: z.number().min(1).max(100).optional().default(20),
      }),
      execute: async ({ owner, repo, path, sha, perPage }) => {
        const { data } = await octokit.rest.repos.listCommits({
          owner,
          repo,
          path,
          sha,
          per_page: perPage ?? 20,
        })
        return data.map((c) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split("\n")[0],
          author: c.commit.author?.name ?? c.author?.login ?? "unknown",
          date: c.commit.author?.date ?? null,
          url: c.html_url,
        }))
      },
    }),

    getPullRequestFiles: tool({
      description:
        "Get the changed files and their diffs for a pull request. This is what you read to review a PR's code.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        pullNumber: z.number(),
        perPage: z.number().min(1).max(100).optional().default(50),
      }),
      execute: async ({ owner, repo, pullNumber, perPage }) => {
        const { data } = await octokit.rest.pulls.listFiles({
          owner,
          repo,
          pull_number: pullNumber,
          per_page: perPage ?? 50,
        })
        return data.map((f) => ({
          path: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          url: f.blob_url,
          patch: f.patch ? f.patch.slice(0, 8000) : null,
        }))
      },
    }),

    getFileContent: tool({
      description:
        "Read a file from a repository. Pass a directory path instead and you get that directory's listing back, so this is safe to call when you're unsure which it is.",
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

        // A directory comes back as an array — return the listing rather than
        // an error, so an ambiguous path still moves the investigation forward.
        if (Array.isArray(data)) {
          return {
            type: "directory" as const,
            path,
            entries: data.map((entry) => ({
              name: entry.name,
              path: entry.path,
              type: entry.type,
              size: entry.size,
            })),
          }
        }

        if ("content" in data && data.content) {
          const decoded = Buffer.from(data.content, "base64").toString("utf-8")
          const MAX = 60_000
          return {
            type: "file" as const,
            name: data.name,
            path: data.path,
            content: decoded.slice(0, MAX),
            truncated: decoded.length > MAX,
            size: data.size,
            url: data.html_url,
          }
        }

        return {
          type: "unsupported" as const,
          path,
          message: "This path is a submodule or symlink, not a readable file.",
        }
      },
    }),
  }
}
