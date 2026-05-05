# Contributing to Ducati

Thanks for your interest. This is a personal project but issues and pull requests are welcome.

## Before you start

- Open an issue describing the change before sending a non-trivial PR. Saves both of us time if the direction doesn't fit.
- For bug reports, include reproduction steps, expected vs actual behavior, and the relevant viewport / browser if it's a UI issue.
- For feature requests, explain the problem the feature solves before proposing a solution.

## Local setup

Requires Node 20+. The repo uses [bun](https://bun.sh) by default; npm/pnpm/yarn also work.

```bash
git clone https://github.com/howdoiusekeyboard/Ducati.git
cd Ducati
bun install
cp .env.example .env.local
# fill in GOOGLE_API_KEY and the six NEXT_PUBLIC_FIREBASE_* values
bun run check-env
bun run dev
```

Visit <http://localhost:3000>. Sign in with Google or email. The app talks to Firebase + OpenAI directly; there's no separate backend.

## Quality gates

Before opening a PR, run all of these locally:

```bash
bun tsc --noEmit       # type check
bun run lint           # eslint via Next
bun jest               # all tests
bun run build          # production build
```

If any fail, fix them before pushing. CI doesn't gate on this repo (yet) — quality gates are on you.

## Commit style

Conventional commits, specific:

- `fix: resolve header overlap on viewports below 375px`
- `feat: add savings-goal widget to dashboard`
- `chore: bump firebase to 12.12.1`
- `docs: clarify env var requirements in README`

Avoid generic forms like `fix: fix stuff` or `update: code changes`.

## Code style

- Follow existing patterns in the file you're editing.
- Mobile-first responsive CSS; design tokens (CSS custom properties) for colors / spacing / radii — no hardcoded hex inside component CSS where a theme token exists.
- React: function components + hooks. Server components for static metadata only (the rest is client-side under `dynamic({ ssr: false })`).
- Touch only what your change requires. Don't refactor adjacent code unprompted.

## Pull request flow

1. Fork the repo and create a feature branch.
2. Make your changes; keep commits focused.
3. Run the quality gates above.
4. Open a PR with a clear description: what changed, why, and how to test.
5. Be responsive to review comments. Squash if asked.

## Areas that need help

- Component-level test coverage (currently 6 unit/integration tests; no component rendering tests yet)
- Accessibility audit (WCAG 2.1 AA target; keyboard navigation, screen reader, color contrast)
- Visual regression at 320 / 375 / 768 / 1024 / 1440 / 1920 px
- Migration of the legacy `.js` components to `.tsx`

## Out of scope

- Switching the framework (Next.js + Firebase is the stack)
- Replacing OpenAI with a different provider (would change the product surface)
- Marketing-style README or feature-list bloat

## License

By contributing, you agree your contributions are licensed under the MIT License (see [LICENSE](LICENSE)).
