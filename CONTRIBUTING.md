# Contributing

Thanks for your interest in @ticketevolution/seatmaps-client. All forms of contribution are
welcome, from issue reports to PRs and documentation / write-ups.

## Development

This repository uses a monorepo structure and consists of multiple packages.

### Tooling

- [PNPM](https://pnpm.io/) to manage packages and dependencies
- [Turborepo](https://turbo.build/) to simplify running scripts in monorepo and configure scripts dependencies.
- [Tsup](https://tsup.egoist.dev/) to bundle packages
- [Testing Library](https://testing-library.com/) for testing components and
  hooks
- [Changesets](https://github.com/atlassian/changesets) for changes
  documentation, changelog generation, and release management.

### Commands

**`pnpm install`**: installs project dependencies

**`pnpm dev`**: starts dev environment

**`pnpm run-examples`**: starts http servers for usage examples

**`pnpm changeset`**: create a new changeset to describe the changes you are making in the PR. NOTE: do not update package versions manually, changeset will do the correct bump in release PR based on accumulated changes.

**`pnpm build`**: run build for all publishable packages.

**`pnpm test`**: run test for all packages.

## NPM Release

This project uses [Changesets](https://github.com/atlassian/changesets) to manage npm releases.

For new version of the package to be released:

1. PR with changes and a new changeset file should be merged to the master branch.

2. Changeset github action will then open a new PR with all changesets merged into a chengelog and package versions changed.

3. Once PR with updated changelog is merged, changeset github action will publish all changed packages.
