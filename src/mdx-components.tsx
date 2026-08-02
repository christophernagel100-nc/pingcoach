import type { MDXComponents } from 'mdx/types'

// Global MDX styling for /wissen articles — matches the Sport Dark Theme
// (Emerald/Cyan accents, text-secondary body copy) used across the rest of the app.
const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold text-text-primary mt-10 mb-4 scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-text-primary mt-8 mb-3 scroll-mt-24">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-text-secondary leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 space-y-2 text-text-secondary mb-4">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 space-y-2 text-text-secondary mb-4">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="text-text-primary font-semibold">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-emerald hover:text-emerald-light underline underline-offset-2 transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-emerald/40 pl-4 my-4 text-text-secondary italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan text-sm font-mono">
      {children}
    </code>
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
