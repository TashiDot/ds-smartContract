// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HashStore
 * @dev Contract for storing cryptographic hashes with metadata commitments
 * 
 * Workflow:
 * 1. Client computes hash of metadata off-chain
 * 2. Client sends hash and metadata to API
 * 3. API computes cryptographic commitment of metadata
 * 4. API stores both hash and metadata commitment on-chain
 * 5. During verification, API compares metadata commitments to detect changes
 */
contract HashStore is Ownable {
    // Emitted for each stored hash with metadata commitment
    event HashStored(
        address indexed owner, 
        bytes32 indexed hashValue, 
        bytes32 metadataRoot, // Cryptographic commitment of metadata
        uint256 timestamp
    );

    struct HashRecord {
        bool exists;
        bytes32 metadataRoot; // Cryptographic commitment of original metadata
        uint256 timestamp;
    }

    mapping(bytes32 => HashRecord) private _records;

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Store a hash with its metadata commitment
     * @param hashValue The hash computed by the client
     * @param metadataRoot The cryptographic commitment of the metadata
     */
    function store(bytes32 hashValue, bytes32 metadataRoot) external onlyOwner {
        _records[hashValue] = HashRecord({
            exists: true,
            metadataRoot: metadataRoot,
            timestamp: block.timestamp
        });
        emit HashStored(_msgSender(), hashValue, metadataRoot, block.timestamp);
    }

    /**
     * @dev Store multiple hashes with their metadata commitments
     * @param hashes Array of hashes computed by the client
     * @param metadataRoots Array of cryptographic commitments of the metadata
     */
    function storeBatch(bytes32[] calldata hashes, bytes32[] calldata metadataRoots) external onlyOwner {
        require(hashes.length == metadataRoots.length, "Array length mismatch");
        
        uint256 len = hashes.length;
        for (uint256 i = 0; i < len; i++) {
            _records[hashes[i]] = HashRecord({
                exists: true,
                metadataRoot: metadataRoots[i],
                timestamp: block.timestamp
            });
            emit HashStored(_msgSender(), hashes[i], metadataRoots[i], block.timestamp);
        }
    }

    /**
     * @dev Check if a hash exists
     * @param hashValue The hash to check
     * @return bool Whether the hash exists
     */
    function exists(bytes32 hashValue) external view returns (bool) {
        return _records[hashValue].exists;
    }
    
    /**
     * @dev Get the metadata commitment for a hash
     * @param hashValue The hash to look up
     * @return bytes32 The metadata commitment
     */
    function getMetadataRoot(bytes32 hashValue) external view returns (bytes32) {
        return _records[hashValue].metadataRoot;
    }
    
    /**
     * @dev Get the timestamp when a hash was stored
     * @param hashValue The hash to look up
     * @return uint256 The timestamp
     */
    function getStoredTimestamp(bytes32 hashValue) external view returns (uint256) {
        return _records[hashValue].timestamp;
    }
    
    /**
     * @dev Get the full record for a hash
     * @param hashValue The hash to look up
     * @return HashRecord The full record
     */
    function getRecord(bytes32 hashValue) external view returns (HashRecord memory) {
        return _records[hashValue];
    }
}