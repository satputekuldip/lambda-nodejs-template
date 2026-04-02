## Lambda: Kinesis User Logs Consumer

This Lambda consumes records from the Kinesis stream `event-logger-event-stream` and writes them into the `user_logs` table in Postgres. Invalid or failed records are sent to an SQS DLQ for later analysis.

### Handler

- Runtime: Node.js 18+
- Handler: `index.handler`

### Event Source

- Kinesis stream ARN: `arn:aws:kinesis:ap-south-1:591815746004:stream/event-logger-event-stream`
- Suggested mapping settings:
    - Batch size: `1000`
    - Starting position: `LATEST`
    - Split batch on error: `false`
    - Report batch item failures: `false`

Each Kinesis record must contain a base64-encoded JSON body matching the `user_logs` table structure, for example:

```json
{
	"ip": "192.168.1.3",
	"zl_uid": "asdasdas",
	"source": "ecommerce",
	"source_type": "user",
	"source_id": 1,
	"source_name": "source name",
	"event": "login",
	"unit": "boolean",
	"value": "true",
	"meta": { "device": "ios", ... },
	"sub_source_id": "chapter_1",
	"sub_source_name": "Chapter 1",
	"sub_source": "chapter",
	"remarks": { "note": "first login", ... },
	"activity_start": "2025-01-01 10:00:00",
	"activity_end": "2025-01-01 10:05:00",
	"created_at": "2025-01-01 10:05:00"
}
```

### Environment Variables

- `ACCOUNTS_DB_HOST`, `ACCOUNTS_DB_PORT`, `ACCOUNTS_DB_USERNAME`, `ACCOUNTS_DB_PASSWORD`, `ACCOUNTS_DB_DATABASE` – Postgres connection for `user_logs`.
- `DLQ_QUEUE_URL` – SQS queue URL where failed records are sent.

### Local Build

```bash
npm install
npm run build
```

### Testing

Unit tests cover parsing, deduplication, bulk insert query building, and DLQ payload shape.

```bash
npm test
```

### Failure Handling & Deduplication

- Records are decoded and parsed individually. Any per-record error is logged and sent to DLQ, while the batch continues.
- Valid records are deduplicated in-memory within the Lambda invocation using a composite key (`zl_uid|event|source|source_type|source_id|unit|value|sub_source...|created_at`).
- Insertions are performed via bulk multi-row `INSERT`. If bulk insert fails, the Lambda falls back to per-row insertion to isolate failing records and send those to DLQ.
- **Resilience**: Lambda always returns success (does not throw) even if DLQ send fails. DLQ failures are logged but don't stop processing. This ensures Kinesis doesn't retry the batch and cause duplicates.
- By handling all failures gracefully and never throwing, the Lambda prevents Kinesis from redelivering the same batch repeatedly.

### CloudWatch EMF Metrics

This service emits **Embedded Metric Format (EMF)** logs for all critical stages so you can measure throughput, success/failure, and pinpoint bottlenecks.

#### Namespace

- `ZebraLearn/LambdaEventLogsConsumerDb` (override with `METRICS_NAMESPACE`)

#### Standard Dimensions

Each metric event includes these dimensions by default:

- `Service`
- `FunctionName`
- `Environment`
- `Scope` (`kinesis`, `sqs`, `validation`)
- `Operation` (`request`, `single_ingest`, `bulk_ingest`, `dedupe`, `batch_summary`, `send_dlq_message`)
- `Outcome`

Additional dimensions are included where relevant:

- `Route`
- `Method`
- `HttpStatus`
- `StatusClass`
- `ErrorType`
- `ErrorScope`
- `Reason`
- `MessageType`

#### Key Metrics

- Request and batch health: `Requests`, `RecordsReceived`, `Success`, `Failure`, `Errors`, `BatchProcessingLatencyMs`
- Parsing: `ParseAttemptCount`, `ParseSuccessCount`, `ParseFailureCount`, `MissingDataCount`, `DecodeFailureCount`
- Dedupe: `DedupeInputCount`, `DedupeOutputCount`, `DuplicatesRemovedCount`, `RecordsDeduped`
- DB write path: `DbBulkInsertAttemptCount`, `DbBulkInsertSuccessCount`, `DbBulkInsertFailureCount`, `RecordsBulkInserted`, `DbBulkInsertLatencyMs`, `DbInsertSuccessCount`, `DbInsertFailureCount`, `DbInsertLatencyMs`
- Fallback path: `FallbackInsertAttemptCount`, `FallbackInsertSuccessCount`, `FallbackInsertFailureCount`, `RecordsInsertedFallback`
- DLQ path: `DlqAttemptCount`, `DlqSuccessCount`, `DlqFailureCount`, `DlqConfigurationFailureCount`, `DlqDispatchFailureCount`

### Suggested CloudWatch Dashboard

Build widgets in the EMF namespace grouped by dimensions:

1. **Traffic & Load**
    - `Requests`, `RecordsReceived`
    - Split by `Service`, `Environment`, `FunctionName`, `Scope`, `Operation`

2. **Batch Reliability**
    - `Success`, `Failure`, `Errors`, `RecordsProcessedSuccess`, `RecordsProcessedFailure`
    - Split by `Scope=kinesis`, `Operation=batch_summary`, `Outcome`

3. **Parser Health**
    - `ParseAttemptCount`, `ParseSuccessCount`, `ParseFailureCount`, `MissingDataCount`, `DecodeFailureCount`
    - Split by `Scope=validation`, `Operation`, `ErrorType`, `Reason`

4. **Dedupe Efficiency**
    - `DedupeInputCount`, `DedupeOutputCount`, `DuplicatesRemovedCount`
    - Split by `Scope=kinesis`, `Operation=dedupe`

5. **DB Performance**
    - `DbBulkInsertLatencyMs`, `DbInsertLatencyMs`, `DbBulkInsertFailureCount`, `DbInsertFailureCount`
    - Split by `Scope=kinesis`, `Operation`, `Outcome`, `ErrorType`

6. **DLQ Reliability**
    - `DlqAttemptCount`, `DlqSuccessCount`, `DlqFailureCount`, `DlqConfigurationFailureCount`
    - Split by `Scope=sqs`, `Operation=send_dlq_message`, `ErrorType`, `Reason`

With this structure you can quickly answer:

- Is traffic increasing?
- Are failures parse-related, DB-related, or DLQ-related?
- Are bulk inserts slowing down?
- Is fallback insert compensating or failing?

### DLQ Message Schema

DLQ payloads conform to a shared structure across lambdas via `SqsErrorMessage`:

- `type` and `scope` identify error class and lambda scope.
- `region`, `timestamp`, `path`, `method`, `headers` provide context.
- `body` contains the parsed payload (if available).
- `details` include `message`, normalized `error`, and payload previews with Kinesis metadata.
