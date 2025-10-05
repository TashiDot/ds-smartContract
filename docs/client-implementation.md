# Client Implementation Guide

## Overview

This guide provides instructions for implementing client applications that interact with the ds-smartContract API for metadata storage and verification.

## Authentication

### Obtaining Access Tokens

Client applications must first obtain a JWT access token using client credentials:

```javascript
async function getAccessToken(appId, appSecret) {
  const response = await fetch('/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      appid: appId,
      appsecret: appSecret
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to obtain access token');
  }
  
  return await response.json();
}
```

### Using Access Tokens

Include the access token in the Authorization header for all protected requests:

```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

## Storage Implementation

### Single Hash Storage

To store a single metadata hash:

```javascript
async function storeMetadata(metadata, accessToken) {
  // Compute hash of metadata
  const hash = computeMetadataHash(metadata);
  
  // Send to API
  const response = await fetch('/blockchain/write', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hash: hash,
      metadata: metadata
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to store metadata');
  }
  
  const result = await response.json();
  
  // Store transaction link for future verification
  storeTransactionLink(metadata.documentId, result.txHash, result.explorerUrl);
  
  return result;
}
```

### Batch Hash Storage

To store multiple metadata hashes efficiently:

```javascript
async function storeMetadataBatch(metadataArray, accessToken) {
  // Compute hashes for all metadata
  const hashes = metadataArray.map(metadata => computeMetadataHash(metadata));
  const metadatas = metadataArray;
  
  // Send to API
  const response = await fetch('/blockchain/write', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hashes: hashes,
      metadatas: metadatas
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to store metadata batch');
  }
  
  const result = await response.json();
  
  // Store transaction link for future verification
  metadataArray.forEach((metadata, index) => {
    storeTransactionLink(metadata.documentId, result.txHash, result.explorerUrl);
  });
  
  return result;
}
```

### Hash Computation

Implement consistent hash computation:

```javascript
function computeMetadataHash(metadata) {
  // Convert metadata to deterministic JSON string
  const jsonString = JSON.stringify(metadata, Object.keys(metadata).sort());
  
  // Compute keccak256 hash
  const { keccak256 } = require('ethers');
  const hash = keccak256(new TextEncoder().encode(jsonString));
  
  return hash;
}
```

## Verification Implementation

### Basic Verification

To verify metadata integrity:

```javascript
async function verifyMetadata(documentId, currentMetadata, accessToken) {
  // Compute hash of current metadata
  const currentHash = computeMetadataHash(currentMetadata);
  
  // Send to API for verification
  const response = await fetch('/blockchain/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hash: currentHash,
      metadata: currentMetadata
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to verify metadata');
  }
  
  return await response.json();
}
```

### Detailed Verification with Diff

To get detailed information about metadata changes:

```javascript
async function verifyMetadataWithDiff(documentId, currentMetadata, accessToken) {
  // Get original metadata from local storage
  const originalMetadata = getOriginalMetadata(documentId);
  
  // Compute hash of current metadata
  const currentHash = computeMetadataHash(currentMetadata);
  
  // First, verify with API
  const verifyResponse = await fetch('/blockchain/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hash: currentHash,
      metadata: currentMetadata
    })
  });
  
  const verifyResult = await verifyResponse.json();
  
  // If verification failed and we have original metadata, get detailed diff
  if (!verifyResult.verified && originalMetadata) {
    const diffResponse = await fetch('/blockchain/diff', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        original: originalMetadata,
        current: currentMetadata
      })
    });
    
    if (diffResponse.ok) {
      const diffResult = await diffResponse.json();
      return {
        ...verifyResult,
        changes: diffResult.details
      };
    }
  }
  
  return verifyResult;
}
```

## Transaction Link Management

### Storing Transaction Links

```javascript
function storeTransactionLink(documentId, txHash, explorerUrl) {
  // Store in local database or storage
  localStorage.setItem(`tx_${documentId}`, JSON.stringify({
    txHash: txHash,
    explorerUrl: explorerUrl,
    storedAt: new Date().toISOString()
  }));
}
```

### Retrieving Transaction Links

```javascript
function getTransactionLink(documentId) {
  const stored = localStorage.getItem(`tx_${documentId}`);
  return stored ? JSON.parse(stored) : null;
}
```

## Error Handling

### Common Error Scenarios

```javascript
async function handleApiError(response) {
  const errorData = await response.json();
  
  switch (errorData.error) {
    case 'invalid_input':
      throw new Error('Invalid input data provided');
    case 'invalid_token':
      throw new Error('Authentication token is invalid or expired');
    case 'not_owner':
      throw new Error('Not authorized to perform this operation');
    case 'hash_not_found':
      throw new Error('Hash not found on blockchain');
    case 'write_failed':
      throw new Error('Failed to write to blockchain');
    default:
      throw new Error(`API error: ${errorData.error}`);
  }
}
```

### Retry Logic

```javascript
async function retryableApiCall(apiFunction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

## Security Best Practices

### Token Management

```javascript
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
  
  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshTokens();
    }
    return this.accessToken;
  }
  
  async refreshTokens() {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: this.refreshToken
      })
    });
    
    if (!response.ok) {
      // Need to re-authenticate
      throw new Error('Session expired, please log in again');
    }
    
    const tokens = await response.json();
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    // Set expiry to slightly before actual expiry for safety
    this.tokenExpiry = Date.now() + this.parseExpiry(tokens.expiresIn) - 60000;
  }
  
  parseExpiry(expiryString) {
    // Parse strings like "15m", "1h", etc.
    const match = expiryString.match(/(\d+)([mh])/);
    if (!match) return 900000; // Default 15 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    return unit === 'm' ? value * 60000 : value * 3600000;
  }
}
```

### Data Validation

```javascript
function validateMetadata(metadata) {
  // Ensure metadata has required fields
  if (!metadata.documentId) {
    throw new Error('Metadata must include documentId');
  }
  
  // Validate field types
  if (typeof metadata.documentId !== 'string') {
    throw new Error('documentId must be a string');
  }
  
  // Add more validation as needed
  return true;
}
```

## Performance Optimization

### Batch Processing

```javascript
class BatchProcessor {
  constructor(batchSize = 10) {
    this.batchSize = batchSize;
    this.pendingItems = [];
  }
  
  async addItem(item) {
    this.pendingItems.push(item);
    
    if (this.pendingItems.length >= this.batchSize) {
      return await this.processBatch();
    }
    
    return null;
  }
  
  async processBatch() {
    if (this.pendingItems.length === 0) return null;
    
    const batch = [...this.pendingItems];
    this.pendingItems = [];
    
    return await storeMetadataBatch(batch);
  }
  
  async flush() {
    return await this.processBatch();
  }
}
```

### Caching

```javascript
class VerificationCache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes
  }
  
  set(hash, result) {
    this.cache.set(hash, {
      result: result,
      timestamp: Date.now()
    });
  }
  
  get(hash) {
    const entry = this.cache.get(hash);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(hash);
      return null;
    }
    
    return entry.result;
  }
}
```

## Testing

### Unit Tests

```javascript
// Example test for hash computation
function testHashComputation() {
  const metadata = {
    name: "John Doe",
    date: "2023-01-01",
    documentId: "doc-001"
  };
  
  const hash1 = computeMetadataHash(metadata);
  const hash2 = computeMetadataHash({...metadata}); // Different object instance
  
  console.assert(hash1 === hash2, "Hashes should be consistent");
}

// Example test for verification workflow
async function testVerificationWorkflow() {
  const metadata = {
    name: "John Doe",
    date: "2023-01-01",
    documentId: "test-doc"
  };
  
  // Store metadata
  const storeResult = await storeMetadata(metadata, accessToken);
  
  // Verify metadata
  const verifyResult = await verifyMetadata("test-doc", metadata, accessToken);
  
  console.assert(verifyResult.verified, "Metadata should verify successfully");
}
```

## Integration Examples

### Web Application Integration

```javascript
class DocumentManager {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.tokenManager = new TokenManager();
  }
  
  async storeDocument(documentData) {
    const token = await this.tokenManager.ensureValidToken();
    return await storeMetadata(documentData, token);
  }
  
  async verifyDocument(documentId, currentData) {
    const token = await this.tokenManager.ensureValidToken();
    return await verifyMetadata(documentId, currentData, token);
  }
}
```

### Backend Service Integration

```javascript
// Express.js route example
app.post('/documents', async (req, res) => {
  try {
    const documentData = req.body;
    const result = await documentManager.storeDocument(documentData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/documents/:id/verify', async (req, res) => {
  try {
    const documentId = req.params.id;
    const currentData = req.body;
    const result = await documentManager.verifyDocument(documentId, currentData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```