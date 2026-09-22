# Third-party software

## CITIZEN POS Print SDK (JavaScript)

This repository does not redistribute the CITIZEN SDK, its sample editor, or SDK-containing application bundles.

- [Official download](https://www.citizen-systems.co.jp/printer/download/sdk/)
- [SDK license terms](https://www.citizen-systems.co.jp/en/printer/download/term_sdk.html)

Obtain the SDK from CITIZEN after reviewing and accepting its terms. The tested integration uses CITIZEN XMP Print API v1.03 (Copyright 2015–2020 CITIZEN SYSTEMS JAPAN CO., LTD.).

Place your locally obtained `Library/cxmlp-api.js` using `pnpm sdk:install /path/to/cxmlp-api.js`. This file is ignored by Git. It is not covered by this project's ISC license.

Local build and macOS packaging commands copy the SDK into their output. Do not publish these generated files without the necessary permission from CITIZEN. Automated binary release workflows are deliberately not included.

## Dependencies

Node.js, Vue, Hono, Sharp, and other dependencies retain their own licenses. Consult their distributions and the lockfile for the versions used.
