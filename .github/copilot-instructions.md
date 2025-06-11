# Introduction

This package mocks the complete commercetools Rest API, allowing you to test your
code without needing a real commercetools project. It is designed to be used in
unit tests and can be run in any environment that supports Node.js.

It uses msw to hook into the fetch API and intercept requests to the
commercetools API, and handle them ourselves.

The code is split into these parts:
 - services: These are the main entry points for the Rest API, and they handle the requests and responses.
 - repositories: These are the implementations, entrypoint agnostic and implement all business logic. The repositories are used by the services (or other repositories!)
 - storage: The actual storage layer, which is a simple in-memory store.


# Guidelines
- Use TypeScript for all code
- Avoid enums and namespaces, all TypeScript code should be able to be stripped from the codebase
- The code is tested with vitest
