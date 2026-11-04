# ADR-0006: CV extraction, bounded AI requests and manual HR review

## Status

Partially superseded by [ADR-0015](0015-on-demand-cv-analysis.md) for how CV analysis is started and executed. The extraction, bounded provider request, manual review, and score-gate decisions below remain in effect.

## Decision

AI failure must not block HR. The CV advance dialog allows an explicit manual review with a required HR note when no genuine AI score exists, including failed or pending analysis. The server records an unscored manual review and its reason. It does not invent a score or mark the AI gate passed. Existing scored results below 50% continue to require an exception note. Management sees the manual review as an exception in the submitted evidence.

The recruitment job extracts PDF text with the installed Smalot PDF parser, DOCX text with ZipArchive plus DOM/XML parsing, and TXT content directly. Extracted text is saved before the provider call and reused on retry. Empty extraction never calls AI and receives a distinct failure code; scanned image PDFs require OCR or manual review. Oversized extracted input is rejected rather than silently truncated.

CV provider calls use an 8-second connection timeout, 25-second request timeout and at most two attempts. Temporary connection failures and 408/429/500/502/503/504 responses are retryable. Retry-After delays longer than the available short retry budget are not retried immediately. The request budget is below the 75-second job timeout; extraction time is additional and extracted text survives provider failure. Authorization/configuration errors are not retried. CV diagnostic logs record provider/status/error class instead of credentials or provider response bodies.

Groq is supported through its OpenAI-compatible chat completion endpoint with JSON responses and existing result validation. Provider, model, endpoint and credentials are explicit recruitment configuration; choosing Groq does not inherit Gemini credentials/endpoints/models. Default Groq model is `openai/gpt-oss-120b`, configurable for the account. No live provider switch occurs without configured credentials. Provider availability and score quality are separate concerns; changing provider does not eliminate rate limits or replace HR judgment.

## Configuration

To activate Groq in the backend environment, set:

```dotenv
RECRUITMENT_AI_PROVIDER=groq
RECRUITMENT_AI_MODEL=openai/gpt-oss-120b
RECRUITMENT_AI_ENDPOINT=https://api.groq.com/openai/v1/chat/completions
RECRUITMENT_AI_API_KEY=<configure privately on the server>
```

Alternatively use `GROQ_API_KEY` when `RECRUITMENT_AI_API_KEY` is unset. Clear/rebuild Laravel configuration and restart recruitment queue workers after deployment. Existing explicit recruitment settings take precedence. Do not place a private API key in frontend environment variables.

## Validation

Regression tests reproduce failed-CV progression, enforce HR notes without scores, preserve extraction before provider failure, prevent AI calls for unreadable CVs, exercise DOCX entity/paragraph handling, Groq JSON requests and transient provider retries. Existing score gates, revisions and management evidence remain covered.

References: https://console.groq.com/docs/openai ; https://console.groq.com/docs/models ; https://console.groq.com/docs/rate-limits ; https://ai.google.dev/gemini-api/docs/troubleshooting
