# Contributing to stellar-pay-ui

## Setup
```bash
git clone https://github.com/stellar-pay-ui/stellar-pay-ui
cd stellar-pay-ui
pnpm install
pnpm dev
```

## Submitting changes
- Fork the repo
- Create a branch: `git checkout -b feat/your-feature`
- Make your changes with tests
- Open a pull request against `main`

## Component guidelines
- Every component must accept `className` and `style` props
- Every interactive element needs `aria-label`
- All new hooks must export a typed return interface
