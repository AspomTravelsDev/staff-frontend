# Recruitment CV analysis diagnostics

The applicant table and retry toast show the stored failure reason, rather than
only “Analysis failed”. The detailed CV analysis sheet uses the same messages.
Transport failures distinguish DNS lookup, TLS/certificates, timeout, and other
connection failures. Unreadable provider answers always retain `invalid_response`.
Failed analyses remain unscored and can be reviewed manually by HR.

## Check the deployed backend

```powershell
php artisan recruitment:check-ai
php artisan recruitment:check-ai --probe
```

The first command reports provider/model configuration and whether a key exists;
it does not call the provider. The probe calls the configured analysis service
using fictitious text and returns only status, failure code, and whether a score
was returned. It does not create an applicant or change a hiring decision. The
probe exits unsuccessfully if analysis cannot complete.

To inspect a particular applicant's saved failure and extraction metadata without
sending their CV to the provider:

```powershell
php artisan recruitment:check-ai --candidate=APPLICANT_ID
```

Neither command prints credentials, CV contents, applicant names or contact details.
Run the probe on the backend host where the live failure occurs; a local failure
does not establish the live cause.

## Interpreting failures

| Failure | Check |
| --- | --- |
| `text_extraction_failed` | Source file existence and extracted-character count; scanned PDFs require OCR or a text-based CV. |
| `missing_api_key` | Recruitment AI key in the backend's effective configuration. |
| `provider_dns` | Backend host DNS resolution and outbound network access. |
| `provider_tls` | Server CA certificates and secure connection to the provider. |
| `provider_timeout` | Provider latency and hosting request limits. |
| `provider_http_401` / `provider_http_403` | Credentials and provider permissions. |
| `provider_http_404` | Configured model and endpoint availability. |
| `provider_http_400` / `provider_http_422` | Model support for the request configuration. |
| `provider_http_429` | Provider quota and rate limits. |
| `invalid_response` | Provider output was missing a valid score/summary or was not valid JSON. |

These checks preserve authentication and certificate verification. Do not disable
TLS validation or replace a failed analysis with an invented score.

## Local Windows PHP certificate configuration

If the probe reports `provider_tls`, check the PHP configuration loaded by
`php --ini`. The Windows OpenSSL build may have neither `curl.cainfo` nor
`openssl.cafile` configured and no default certificate bundle installed.

Download the standard Mozilla bundle and its published SHA-256 checksum from
[curl's CA extract service](https://curl.se/ca/). Verify the checksum, back up
`php.ini`, and configure both directives with the bundle's absolute path:

```ini
curl.cainfo="C:\tools\php85\extras\ssl\cacert.pem"
openssl.cafile="C:\tools\php85\extras\ssl\cacert.pem"
```

Use the appropriate path for the installed PHP runtime. Restart the local backend
so its PHP processes reload the configuration, and rerun
`php artisan recruitment:check-ai --probe`. A successful probe reports `completed`,
no failure code, and `score_present: true`. Existing failed applicant analyses must
be retried explicitly; repairing TLS does not automatically reprocess them.

On 2026-10-29, these missing local settings were reproduced with the configured
Gemini service. The same synthetic probe completed successfully after configuring
the verified bundle, without temporary command-line settings or disabling TLS.

## Probe succeeds but applicant analysis times out

On 2026-10-29 a second failure was reproduced through the actual retry controller:
the result returned `processing` immediately, with no extraction or provider call.
Both the controller and analysis service wrote the same processing timestamp in
the same second. MySQL returned zero **changed** rows for the second write. The
service incorrectly treated that as a superseded analysis and exited; the stale
analysis check later recorded `analysis_timeout`.

The service and legacy queued job now check whether the generation still exists
when a processing write returns zero. A redundant update continues normally; a
deleted or superseded generation still stops. The regression test in
`RecruitmentPipelineTest::test_on_demand_cv_continues_when_processing_update_changes_zero_rows`
reproduces MySQL's changed-row result at the SQL seam while using isolated SQLite
and mocked extraction/provider services. Ordinary SQLite updates report matched
rows, so an unmodified SQLite test did not expose this bug.
