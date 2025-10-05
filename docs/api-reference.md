# API Reference Documentation

## Authentication

All protected endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Obtain Access Token

**Endpoint**: `POST /auth/token`

**Description**: Exchange client credentials for an access token.

**Request Body**:
```json
{
  "appid": "string",
  "appsecret": "string"
}
```

**Response**:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": "string"
}
```

### Refresh Access Token

**Endpoint**: `POST /auth/refresh`

**Description**: Obtain a new access token using a refresh token.

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response**:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": "string"
}
```

## Blockchain Operations

### Store Hash

**Endpoint**: `POST /blockchain/write`

**Description**: Store a hash and its metadata commitment on the blockchain.

**Request Body (Single)**:
```json
{
  "hash": "string", // Client-computed hash (0x-prefixed 64-hex)
  "metadata": { // Metadata to compute cryptographic commitment
    "key": "value"
  }
}
```

**Request Body (Batch)**:
```json
{
  "hashes": ["string"], // Array of client-computed hashes
  "metadatas": [{}] // Array of metadata objects (same length as hashes)
}
```

**Response**:
```json
{
  "txHash": "string", // Blockchain transaction hash
  "explorerUrl": "string" // Blockchain explorer URL for the transaction
}
```

### Read Hash Information

**Endpoint**: `GET /blockchain/read`

**Description**: Check if a hash exists on the blockchain or get transaction details.

**Query Parameters**:
- `hash`: Check if a specific hash exists
- `tx`: Get details for a specific transaction hash
- `txUrl`: Get details from a blockchain explorer URL

**Response (Hash Check)**:
```json
{
  "exists": true, // Whether the hash exists on blockchain
  "metadataRoot": "string", // Cryptographic commitment of original metadata
  "timestamp": "string" // When the hash was stored (Unix timestamp)
}
```

**Response (Transaction Details)**:
```json
{
  "blockNumber": 12345, // Block number where transaction was included
  "status": 1, // Transaction status (1 = success, 0 = failure)
  "logs": 2 // Number of event logs emitted
}
```

### Verify Hash

**Endpoint**: `POST /blockchain/verify`

**Description**: Verify a hash and optionally compare metadata commitments.

**Request Body**:
```json
{
  "hash": "string", // Client-recomputed hash to verify
  "metadata": { // Optional: Current metadata for commitment comparison
    "key": "value"
  }
}
```

**Response (Hash Not Found)**:
```json
{
  "verified": false,
  "error": "hash_not_found"
}
```

**Response (Verification Successful)**:
```json
{
  "verified": true
}
```

**Response (Metadata Changed)**:
```json
{
  "verified": false,
  "error": "metadata_changed",
  "details": "Metadata cryptographic commitment does not match stored commitment"
}
```

## Health Check

**Endpoint**: `GET /health`

**Description**: Check if the API is running and responsive.

**Response**:
```json
{
  "ok": true,
  "uptime": 1234.56 // Seconds since server start
}
```

## Error Responses

All error responses follow a consistent format:

```json
{
  "error": "error_code"
}
```

### Common Error Codes

- `invalid_input`: Request body or parameters are invalid
- `invalid_token`: JWT token is missing, expired, or invalid
- `not_owner`: Attempt to write to blockchain without proper ownership
- `hash_not_found`: Requested hash does not exist on blockchain
- `tx_not_found`: Transaction not found on blockchain
- `write_failed`: Failed to write hash to blockchain
- `read_failed`: Failed to read from blockchain
- `verification_failed`: Verification process failed
- `not_found`: Requested endpoint does not exist

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Default limit: 120 requests per minute per IP address
- Exceeding the limit returns a 429 Too Many Requests response

## CORS Policy

The API implements CORS protection:
- Origins are configurable via `CORS_ORIGIN` environment variable
- In production, specific origins should be whitelisted
- Wildcard (`*`) is acceptable for development but not recommended for production