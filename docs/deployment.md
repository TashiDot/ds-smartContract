# Deployment and Operations Guide

## Overview

This guide provides comprehensive instructions for deploying and operating the ds-smartContract system in production environments.

## Prerequisites

### System Requirements

1. **Node.js**: Version 22.10 or later (Active LTS recommended)
2. **npm**: Version 8 or later
3. **Blockchain Network Access**: RPC endpoint for target EVM chain
4. **Blockchain Account**: Wallet with sufficient funds for gas costs
5. **Domain Name**: For production deployments (optional but recommended)

### Environment Variables

Create a `.env` file with the following configuration:

```env
# General Configuration
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://yourdomain.com

# JWT Configuration
JWT_ACCESS_SECRET=your-strong-access-secret
JWT_REFRESH_SECRET=your-strong-refresh-secret
JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-app-users
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# Client Credentials
APP_ID=your-app-id
APP_SECRET=your-app-secret

# Blockchain Configuration
RPC_URL=https://your-rpc-endpoint.com
CHAIN_ID=137  # Polygon Mainnet example
PRIVATE_KEY=your-wallet-private-key
CONTRACT_ADDRESS=0x... # Set after deployment

# Optional: Blockchain Explorer API for verification
# ETHERSCAN_API_KEY=your-etherscan-api-key
```

## Smart Contract Deployment

### 1. Compile the Contract

```bash
npm run compile
```

This command:
- Compiles the Solidity contract
- Generates artifacts in the `artifacts/` directory
- Exports the ABI to `src/abi/HashStore.json`

### 2. Deploy to Blockchain

```bash
NETWORK=custom npx hardhat run scripts/deploy.ts --network custom
```

This command:
- Deploys the contract to the network specified by `RPC_URL` and `CHAIN_ID`
- Uses the wallet specified by `PRIVATE_KEY`
- Outputs the deployed contract address

### 3. Update Environment

After deployment, update your `.env` file with the deployed contract address:

```env
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## API Deployment Options

### Docker Deployment (Recommended)

#### 1. Build Docker Image

```bash
docker build -t ds-smart-api:latest .
```

#### 2. Run Docker Container

```bash
docker run --rm -p 4000:4000 --env-file .env ds-smart-api:latest
```

#### 3. Production Docker Run

```bash
docker run -d \
  --name ds-smart-api \
  -p 4000:4000 \
  --env-file .env \
  --restart unless-stopped \
  ds-smart-api:latest
```

### PM2 Deployment

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Build Application

```bash
npm run build
```

#### 3. Start with PM2

```bash
pm2 start dist/index.js --name ds-smart-api
```

#### 4. PM2 Configuration

Create an `ecosystem.config.js` file:

```javascript
module.exports = {
  apps: [{
    name: 'ds-smart-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    env_file: '.env'
  }]
};
```

Then start with:

```bash
pm2 start ecosystem.config.js
```

## Configuration Management

### Environment-Specific Configurations

Create separate `.env` files for different environments:

```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

### Configuration Loading

The application loads configuration in this priority order:
1. Environment variables
2. `.env` file
3. Default values

### Security Best Practices

1. **Secret Management**
   - Never commit `.env` files to version control
   - Use secret management systems in production (HashiCorp Vault, AWS Secrets Manager, etc.)
   - Rotate secrets regularly

2. **Network Security**
   - Restrict `CORS_ORIGIN` to specific domains in production
   - Use HTTPS/TLS for all communications
   - Place API behind a reverse proxy (Nginx, ALB, etc.)

## Scaling and High Availability

### Horizontal Scaling

1. **Multiple API Instances**
   - Deploy multiple instances behind a load balancer
   - Ensure all instances use the same `PRIVATE_KEY` for contract writes
   - Use sticky sessions if needed for session-based operations

2. **Load Balancer Configuration**

Example Nginx configuration:
```nginx
upstream api_backend {
    server api1.yourdomain.com:4000;
    server api2.yourdomain.com:4000;
    server api3.yourdomain.com:4000;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Database Considerations

Although this system is designed to be database-free, consider:

1. **Client Credential Storage**
   - For applications with many clients, consider external storage
   - Implement caching for credential lookups

2. **Session Management**
   - For high-traffic applications, consider Redis for session storage
   - Implement session invalidation mechanisms

## Monitoring and Logging

### Application Logging

The application uses Pino for structured logging:

1. **Log Levels**
   - `trace`: Detailed debugging information
   - `debug`: Debugging information
   - `info`: General operational information
   - `warn`: Warning conditions
   - `error`: Error conditions
   - `fatal`: Critical errors requiring immediate attention

2. **Log Format**
   - JSON format for easy parsing
   - Includes timestamp, level, message, and context

### Health Checks

1. **API Health Endpoint**
   - `GET /health` returns 200 OK with uptime information
   - Use for load balancer health checks

2. **Blockchain Connectivity**
   - Monitor RPC endpoint availability
   - Alert on transaction failure rates

### Performance Monitoring

1. **Response Time Monitoring**
   - Track API response times
   - Set alerts for slow responses

2. **Rate Limiting**
   - Monitor rate limit hits
   - Adjust limits based on usage patterns

### Blockchain Monitoring

1. **Transaction Monitoring**
   - Track successful/failed transactions
   - Monitor gas usage patterns

2. **Event Monitoring**
   - Listen for `HashStored` events
   - Track storage volume and patterns

## Backup and Recovery

### Configuration Backup

1. **Environment Variables**
   - Store securely in secret management systems
   - Regular backup of configuration

2. **Contract ABI**
   - Version control the ABI file
   - Backup compiled contract artifacts

### Disaster Recovery

1. **Contract Redeployment**
   - Keep deployment scripts and private keys secure
   - Document redeployment process

2. **Data Recovery**
   - Blockchain data is immutable and recoverable
   - Client-side data recovery depends on client implementation

## Maintenance

### Regular Maintenance Tasks

1. **Dependency Updates**
   ```bash
   npm outdated
   npm update
   ```

2. **Security Audits**
   ```bash
   npm audit
   npm audit fix
   ```

3. **Contract Verification**
   - Verify contract on blockchain explorers
   - Update documentation with verified contract addresses

### Version Upgrades

1. **API Versioning**
   - Use semantic versioning
   - Maintain backward compatibility when possible

2. **Contract Upgrades**
   - Plan for contract upgrades using upgradeable patterns
   - Test upgrades thoroughly in staging

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check JWT configuration
   - Verify client credentials
   - Check token expiration

2. **Blockchain Connectivity**
   - Verify RPC URL and network configuration
   - Check wallet balance for gas costs
   - Monitor network status

3. **Deployment Issues**
   - Ensure Node.js version compatibility
   - Check contract compilation errors
   - Verify private key format

### Diagnostic Commands

1. **Health Check**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Environment Verification**
   ```bash
   npm run build && node -e "console.log(require('./dist/config/env.js').getEnv())"
   ```

3. **Contract Interaction Test**
   ```bash
   # Test contract deployment
   npx hardhat run scripts/deploy.ts --network custom
   ```

### Log Analysis

1. **Error Pattern Recognition**
   - Look for repeated error patterns
   - Correlate with user reports

2. **Performance Analysis**
   - Identify slow endpoints
   - Optimize based on usage patterns

## Security Operations

### Regular Security Audits

1. **Code Reviews**
   - Regular peer code reviews
   - Security-focused review checklists

2. **Automated Scanning**
   - Use tools like Snyk for dependency scanning
   - Static analysis tools for Solidity contracts

### Incident Response

1. **Compromised Keys**
   - Immediate key rotation
   - Deploy new contract if necessary
   - Audit affected transactions

2. **API Abuse**
   - Adjust rate limits
   - Implement IP blocking
   - Add additional authentication layers

## Performance Tuning

### API Performance

1. **Connection Pooling**
   - Optimize blockchain connection pools
   - Tune HTTP connection limits

2. **Caching Strategies**
   - Implement appropriate caching
   - Balance cache freshness with performance

### Blockchain Performance

1. **Gas Optimization**
   - Monitor gas usage patterns
   - Optimize contract functions

2. **Transaction Batching**
   - Use batch operations for multiple items
   - Reduce overall transaction count

## Compliance and Auditing

### Audit Trails

1. **Transaction Logging**
   - Maintain logs of all blockchain transactions
   - Include user context and metadata

2. **Access Logging**
   - Log all API access attempts
   - Include authentication success/failure

### Regulatory Compliance

1. **Data Retention**
   - Implement data retention policies
   - Comply with relevant regulations (GDPR, etc.)

2. **Privacy Considerations**
   - Ensure metadata commitments don't leak sensitive information
   - Implement appropriate access controls