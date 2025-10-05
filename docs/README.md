# ds-smartContract Documentation

## Overview

The ds-smartContract system provides a secure, efficient solution for storing and verifying metadata hashes on EVM-compatible blockchains. This documentation covers all aspects of the system, from architecture to deployment.

## Documentation Index

### 1. [System Architecture](system-architecture.md)
- Component overview
- Data flow diagrams
- Security features
- Scalability considerations

### 2. [API Reference](api-reference.md)
- Endpoint specifications
- Request/response formats
- Authentication methods
- Error handling

### 3. [Workflow](workflow.md)
- Storage process
- Verification process
- Batch operations
- Error handling

### 4. [Cryptography](cryptography.md)
- Hash functions
- Metadata commitment scheme
- Verification process
- Security properties

### 5. [Client Implementation](client-implementation.md)
- Authentication examples
- Storage implementation
- Verification implementation
- Best practices

### 6. [Smart Contract](smart-contract.md)
- Contract functions
- Events and structs
- Security features
- Deployment process

### 7. [Deployment and Operations](deployment.md)
- Prerequisites
- Deployment options
- Configuration management
- Monitoring and logging

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Smart Contract Deployment

```bash
npm run compile
NETWORK=custom npx hardhat run scripts/deploy.ts --network custom
```

### 4. API Startup

```bash
npm run dev  # Development
npm run build && npm start  # Production
```

## Key Features

### Security
- JWT-based authentication
- Owner-only blockchain writes
- Rate limiting and CORS protection
- Helmet security middleware

### Efficiency
- Gas-optimized smart contract
- Batch operations for multiple hashes
- Cryptographic metadata commitments
- Event-based tracking

### Scalability
- Stateless API design
- Horizontal scaling support
- Efficient data structures
- Connection pooling

## Use Cases

### Document Verification
- Store document hashes on blockchain
- Verify document integrity at any time
- Detect unauthorized modifications

### Digital Signatures
- Commit to signed metadata
- Verify signature authenticity
- Maintain audit trails

### Compliance
- Immutable storage of compliance data
- Regulatory audit support
- Tamper-evident logging

## Support

For issues, questions, or contributions, please:
1. Check existing documentation
2. Review open GitHub issues
3. Create a new issue with detailed information

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.