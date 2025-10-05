# Workflow Documentation

## Overview

This document describes the complete workflow for storing and verifying metadata hashes using the ds-smartContract system.

## Storage Workflow

### 1. Client-Side Preparation

1. **Metadata Generation**
   - Client application creates metadata (name, signature, date, document ID, etc.)
   - Metadata is structured as a JSON object

2. **Hash Computation**
   - Client computes keccak256 hash of the metadata
   - Hash is formatted as 0x-prefixed 64-character hexadecimal string

3. **API Request Preparation**
   - Client prepares request with hash and metadata
   - Client obtains valid JWT access token if needed

### 2. API Processing

1. **Request Reception**
   - API receives POST request to `/blockchain/write`
   - Request is validated for proper format and authentication

2. **Metadata Commitment Computation**
   - API computes cryptographic commitment (Merkle root) of the metadata
   - Commitment computation ensures consistent ordering of metadata fields

3. **Blockchain Interaction**
   - API calls smart contract `store()` function with hash and metadata commitment
   - Transaction is submitted to the blockchain network

4. **Response Generation**
   - API waits for transaction confirmation
   - API generates response with transaction hash and explorer URL

### 3. Client Storage

1. **Transaction Link Storage**
   - Client stores the transaction hash and explorer URL
   - These are used for future verification

## Verification Workflow

### 1. Client-Side Initiation

1. **Metadata Retrieval**
   - Client retrieves current metadata for verification
   - This may be from local storage or reconstructed from other sources

2. **Hash Recomputation**
   - Client recomputes keccak256 hash of current metadata
   - Hash format must match original computation

3. **API Request Preparation**
   - Client prepares verification request with hash
   - Optionally includes current metadata for detailed comparison

### 2. API Verification

1. **Request Reception**
   - API receives POST request to `/blockchain/verify`
   - Request is validated for proper format and authentication

2. **Blockchain Lookup**
   - API checks if hash exists on blockchain using `exists()` function
   - If hash doesn't exist, verification fails immediately

3. **Metadata Commitment Comparison**
   - If hash exists and metadata provided, API computes commitment of current metadata
   - API retrieves stored metadata commitment from blockchain
   - API compares commitments to detect changes

4. **Response Generation**
   - If commitments match: Verification successful
   - If commitments don't match: Verification failed with details

### 3. Result Processing

1. **Success Case**
   - Client confirms metadata integrity
   - No further action needed

2. **Failure Case**
   - Client knows metadata has been modified
   - If detailed comparison needed, client uses local history with `/diff` endpoint

## Batch Operations

### Storage Batch Workflow

1. **Client Preparation**
   - Client prepares arrays of hashes and corresponding metadata
   - Arrays must be of equal length

2. **API Processing**
   - API computes metadata commitments for all items
   - API calls smart contract `storeBatch()` function
   - Single transaction processes all items

3. **Response Handling**
   - Single transaction hash and explorer URL returned
   - Client stores link for future verification of all items

### Verification Batch Workflow

Individual verification is recommended for batch items to provide granular results.

## Error Handling

### Storage Errors

1. **Authentication Failures**
   - Invalid or expired JWT tokens
   - Incorrect client credentials

2. **Blockchain Errors**
   - Insufficient gas for transaction
   - Network connectivity issues
   - Contract ownership issues

3. **Data Validation Errors**
   - Invalid hash format
   - Malformed metadata

### Verification Errors

1. **Hash Not Found**
   - Hash never stored or removed from blockchain
   - Incorrect hash computation

2. **Metadata Mismatch**
   - Metadata has been modified since storage
   - Different commitment computation algorithms

## Security Considerations

### Data Integrity

1. **Hash Consistency**
   - Client and API must use identical hash algorithms
   - Metadata serialization must be deterministic

2. **Commitment Computation**
   - Metadata commitment algorithm must be consistent
   - Field ordering must be standardized

### Access Control

1. **Authentication**
   - All write operations require valid JWT tokens
   - Tokens should be short-lived with refresh mechanism

2. **Authorization**
   - Only contract owner can write to blockchain
   - Read operations are publicly accessible

## Performance Optimization

### Client-Side Optimization

1. **Batch Processing**
   - Use batch operations for multiple items
   - Reduce network round trips

2. **Caching**
   - Cache frequently accessed metadata
   - Store transaction links locally

### API-Side Optimization

1. **Connection Management**
   - Efficient blockchain connection pooling
   - Request batching where appropriate

2. **Computation Efficiency**
   - Optimized metadata commitment algorithms
   - Efficient data serialization

## Monitoring and Debugging

### Tracking Verification Results

1. **Success Metrics**
   - Count of successful verifications
   - Average verification time

2. **Failure Analysis**
   - Count of verification failures
   - Types of failures (not found vs. modified)

### Blockchain Event Monitoring

1. **Storage Events**
   - Track `HashStored` events for audit trails
   - Monitor storage frequency and patterns

2. **Performance Metrics**
   - Transaction confirmation times
   - Gas usage statistics