# Development Guidelines & Coding Style

This guide outlines the engineering standards and conventions to keep the codebase idiomatic, secure, and maintainable.

---

## 1. Smart Contract Conventions (Solidity)

### Architecture Patterns
- **Simplicity Over Inheritance**: Prefer explicit composition and simple contract structures. Keep validation targets decoupled from application logic.
- **Gas Optimization**: Enable optimizer with `via_ir: true` in production.
- **State Identifiers**: Store session keys associated with `address(this)`. When executed via `delegatecall` in an EIP-7702 context, `address(this)` represents the calling EOA, giving independent storage profiles to each delegator.

### Formatting & Readability
- Follow the official **Solidity Style Guide**.
- Standard layout for contract contents:
  1. Types & Structs
  2. Errors
  3. Events
  4. Mappings & State Variables
  5. Modifiers
  6. External Functions
  7. Public/Internal Functions

---

## 2. Frontend & Type Conventions (TypeScript / React)

### Framework Standards
- **Next.js App Router**: Leverage Server Components for static/explanatory pages (`/` and `/explain`), and use `"use client"` exclusively for interactive client elements (`/demo` page and UI controls).
- **TypeScript Strictness**: Keep strict type safety. Avoid using `any` type casts. Use explicit type guards where appropriate.
- **Clean State Hooks**: Consolidate state changes in components rather than threading state deeply across unrelated child containers.

### Component Design & Styling
- **Aesthetic Consistency**: Maintain a modern, dark-mode-first or theme-switching layout with clean typography and standardized spacing.
- **shadcn/ui Guidelines**: Keep UI primitives (like dialogs, alerts, progress bars) as neutral wrapper components, modifying their properties safely using class utilities like `cn(...)`.
- **CSS Formatting**: Use Tailwind CSS utility classes inline. Do not mix with arbitrary styled-components or complex global overrides unless absolutely necessary.

---

## 3. Demo Design Philosophy

- **Zero-Friction User Flow**: To eliminate browser extension dependency during testing, the interactive demo utilizes a preset private key configuration (`NEXT_PUBLIC_DEMO_PRIVATE_KEY` in `.env`) with viem's `privateKeyToAccount` utility.
- **Educational UI Elements**: Always display original byte formats alongside descriptive text to make cryptography and binary protocols clear for developers.
