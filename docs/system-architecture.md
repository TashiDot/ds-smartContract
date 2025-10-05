# System Architecture Documentation

## Overview

This system provides a secure REST API for writing and verifying metadata hashes on EVM-compatible blockchains. The architecture is designed to ensure data integrity through cryptographic commitments while maintaining efficiency and security.

## Components

### 1. Client Application
- Computes hashes of metadata off-chain
- Sends hashes and metadata to the API for blockchain storage
- Maintains its own metadata history for detailed verification
- Recomputes hashes during verification process

### 2. REST API (Express + TypeScript)
- Handles authentication and authorization
- Processes client requests for hash storage and verification
- Computes cryptographic commitments of metadata
- Interacts with the blockchain smart contract

### 3. Smart Contract (Solidity)
- Stores hashes and their cryptographic metadata commitments
- Provides verification functions
- Emits events for tracking storage operations

### 4. Blockchain Network
- Ethereum, Polygon, or other EVM-compatible chains
- Provides decentralized, immutable storage

## Data Flow

### Storage Workflow

1. **Client Preparation**
   - Client application generates metadata (name, signature, date, etc.)
   - Client computes keccak256 hash of the metadata
   - Client sends hash and metadata to the API

2. **API Processing**
   - API receives hash and metadata
   - API computes cryptographic commitment (Merkle root) of metadata
   - API calls smart contract to store both hash and metadata commitment

3. **Blockchain Storage**
   - Smart contract stores hash and metadata commitment
   - Smart contract emits HashStored event
   - API returns transaction hash and explorer URL to client

### Verification Workflow

1. **Client Initiated Verification**
   - Client retrieves stored transaction link
   - Client recomputes hash from current metadata
   - Client sends hash to API for verification

2. **API Verification**
   - API checks if hash exists on blockchain
   - If hash exists, API retrieves stored metadata commitment
   - API computes cryptographic commitment of current metadata
   - API compares commitments to detect changes

3. **Result Reporting**
   - If commitments match: Verification successful
   - If commitments don't match: Verification failed, metadata changed

## Security Features

### Authentication
- JWT-based authentication with short-lived access tokens
- Rotating refresh tokens for continuous access
- Claim validation (iss, aud, exp) for token integrity

### Authorization
- Owner-only writes to blockchain contract
- Client credentials flow without database storage
- Role-based access control for API endpoints

### Data Protection
- Helmet security middleware for HTTP headers
- CORS protection with configurable origins
- Rate limiting to prevent abuse (120 requests/minute default)
- Request compression for efficient data transfer

## Gas Optimization

### Smart Contract Design
- Minimal storage: Only hashes and cryptographic commitments
- Batch operations for multiple hashes
- Event-based tracking instead of extensive on-chain storage

### API Efficiency
- Server-side computation of metadata commitments
- Efficient data serialization for consistent hashing
- Caching strategies for frequently accessed data

## Scalability Considerations

### Horizontal Scaling
- Statelessness allows for multiple API instances
- Consistent private key usage across instances
- Load balancing compatibility

### Performance Optimization
- Connection pooling for blockchain interactions
- Efficient request handling with Express
- Asynchronous processing for non-blocking operations

## Error Handling

### Client Errors
- 400 Bad Request for invalid input
- 401 Unauthorized for authentication failures
- 403 Forbidden for authorization issues
- 404 Not Found for missing resources

### Server Errors
- 500 Internal Server Error for unexpected issues
- 503 Service Unavailable for blockchain connectivity issues
- Comprehensive logging for debugging and monitoring

## Monitoring and Logging

### API Logging
- Pino-based structured logging
- Request/response logging for audit trails
- Error logging with stack traces

### Blockchain Events
- HashStored events for tracking storage operations
- Timestamp tracking for verification timelines
- Transaction status monitoring

## Deployment Options

### Docker Deployment
- Containerized application for consistent deployment
- Environment-based configuration
- Port mapping for service access

### PM2 Deployment
- Process management for Node.js applications
- Automatic restart on failures
- Performance monitoring capabilities

## Configuration Management

### Environment Variables
- Security-sensitive configuration via environment variables
- Network-specific settings for different environments
- JWT secrets and blockchain credentials

### Network Configuration
- Support for multiple EVM-compatible networks
- Dynamic network switching via configuration
- Chain ID validation for transaction safety