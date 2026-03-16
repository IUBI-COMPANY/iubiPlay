Frontend stack:

- Next.js
- TypeScript
- TailwindCSS

Rules:

- Prefer server components
- Use client components only when needed
- Avoid large components
- Use async data fetching in server components
- Use loading.tsx and error.tsx patterns
- Use dynamic imports for heavy components
- Avoid unnecessary re-renders
- avoid prop drilling, use context or state management when needed
- Avoid use middleware, use proxy API routes instead

UI rules:

- Components must be reusable
- Avoid inline styles
- Use Tailwind utilities
- Use semantic HTML
- Accessibility is required (aria labels)

When debugging:

1. Identify the root cause
2. Explain the issue briefly
3. Provide the minimal fix
4. Avoid rewriting the entire file

Architecture rules:

- Components should be in /components
- Hooks in /hooks
- API calls in /lib/api
- Types in /types

Performance rules:

- Use next/image for images
- Avoid large client bundles
- Lazy load heavy components
- Prefer server rendering
- Use caching when possible 

SEO rules:

- Use semantic HTML
- Use proper meta tags
- Use Next.js metadata API
- Avoid client-side rendering for important content