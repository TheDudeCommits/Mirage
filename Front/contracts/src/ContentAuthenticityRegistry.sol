// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ContentAuthenticityRegistry
 * @dev Store content verification results on-chain with IPFS references
 * @notice contract is optimized for gas efficiency and scalability
 */
contract ContentAuthenticityRegistry is Ownable, ReentrancyGuard, Pausable {
    // ============ Custom Types ============
    
    enum DetectionType { TEXT, IMAGE, VIDEO, VOICE }
    
    struct VerificationRecord {
        bytes32 contentHash;        // Keccak256 hash of the content
        string ipfsCid;             // IPFS CID containing full analysis data
        address verifier;           // Wallet address of the verifier
        uint256 timestamp;          // Block timestamp
        bool isAuthentic;           // true = Human, false = AI-generated
        uint8 confidenceScore;      // 0-100 confidence score
        DetectionType detectionType; // Type of content verified
        bool exists;                // Flag to check if record exists
    }
    
    // ============ State Variables ============
    
    // Mapping from content hash to verification record
    mapping(bytes32 => VerificationRecord) public verifications;
    
    // Mapping from user address to their verification hashes
    mapping(address => bytes32[]) private userVerifications;
    
    // Array of all verification hashes for pagination
    bytes32[] private allVerificationHashes;
    
    // Total number of verifications
    uint256 public totalVerifications;
    
    // Fee for verification registration (can be 0)
    uint256 public verificationFee;
    
    // ============ Events ============
    
    event ContentVerified(
        bytes32 indexed contentHash,
        string ipfsCid,
        address indexed verifier,
        bool isAuthentic,
        uint8 confidenceScore,
        DetectionType detectionType,
        uint256 timestamp
    );
    
    event VerificationUpdated(
        bytes32 indexed contentHash,
        string newIpfsCid,
        uint256 timestamp
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        verificationFee = 0; // Free by default
    }
    
    // ============ Main Functions ============
    
    /**
     * @dev Register a new content verification
     * @param _contentHash Hash of the content being verified
     * @param _ipfsCid IPFS CID containing full verification data
     * @param _isAuthentic Whether content is authentic (human) or AI-generated
     * @param _confidenceScore Confidence score (0-100)
     * @param _detectionType Type of detection performed
     */
    function registerVerification(
        bytes32 _contentHash,
        string memory _ipfsCid,
        bool _isAuthentic,
        uint8 _confidenceScore,
        DetectionType _detectionType
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(_contentHash != bytes32(0), "Invalid content hash");
        require(bytes(_ipfsCid).length > 0, "IPFS CID required");
        require(_confidenceScore <= 100, "Invalid confidence score");
        require(msg.value >= verificationFee, "Insufficient fee");
        require(!verifications[_contentHash].exists, "Already verified");
        
        // Create verification record
        VerificationRecord memory record = VerificationRecord({
            contentHash: _contentHash,
            ipfsCid: _ipfsCid,
            verifier: msg.sender,
            timestamp: block.timestamp,
            isAuthentic: _isAuthentic,
            confidenceScore: _confidenceScore,
            detectionType: _detectionType,
            exists: true
        });
        
        // Store verification
        verifications[_contentHash] = record;
        userVerifications[msg.sender].push(_contentHash);
        allVerificationHashes.push(_contentHash);
        totalVerifications++;
        
        emit ContentVerified(
            _contentHash,
            _ipfsCid,
            msg.sender,
            _isAuthentic,
            _confidenceScore,
            _detectionType,
            block.timestamp
        );
    }
    
    /**
     * @dev Register multiple verifications in a single transaction (batch)
     * @param _contentHashes Array of content hashes
     * @param _ipfsCids Array of IPFS CIDs
     * @param _isAuthentic Array of authenticity flags
     * @param _confidenceScores Array of confidence scores
     * @param _detectionTypes Array of detection types
     */
    function batchRegisterVerifications(
        bytes32[] memory _contentHashes,
        string[] memory _ipfsCids,
        bool[] memory _isAuthentic,
        uint8[] memory _confidenceScores,
        DetectionType[] memory _detectionTypes
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        uint256 count = _contentHashes.length;
        require(count > 0 && count <= 50, "Invalid batch size"); // Max 50 per batch
        require(
            _ipfsCids.length == count &&
            _isAuthentic.length == count &&
            _confidenceScores.length == count &&
            _detectionTypes.length == count,
            "Array length mismatch"
        );
        require(msg.value >= verificationFee * count, "Insufficient fee");
        
        for (uint256 i = 0; i < count; i++) {
            require(_contentHashes[i] != bytes32(0), "Invalid content hash");
            require(bytes(_ipfsCids[i]).length > 0, "IPFS CID required");
            require(_confidenceScores[i] <= 100, "Invalid confidence score");
            require(!verifications[_contentHashes[i]].exists, "Already verified");
            
            VerificationRecord memory record = VerificationRecord({
                contentHash: _contentHashes[i],
                ipfsCid: _ipfsCids[i],
                verifier: msg.sender,
                timestamp: block.timestamp,
                isAuthentic: _isAuthentic[i],
                confidenceScore: _confidenceScores[i],
                detectionType: _detectionTypes[i],
                exists: true
            });
            
            verifications[_contentHashes[i]] = record;
            userVerifications[msg.sender].push(_contentHashes[i]);
            allVerificationHashes.push(_contentHashes[i]);
            totalVerifications++;
            
            emit ContentVerified(
                _contentHashes[i],
                _ipfsCids[i],
                msg.sender,
                _isAuthentic[i],
                _confidenceScores[i],
                _detectionTypes[i],
                block.timestamp
            );
        }
    }
    
    /**
     * @dev Update IPFS CID for existing verification (only by original verifier)
     * @param _contentHash Content hash to update
     * @param _newIpfsCid New IPFS CID
     */
    function updateVerificationCid(
        bytes32 _contentHash,
        string memory _newIpfsCid
    ) 
        external 
        whenNotPaused 
    {
        require(verifications[_contentHash].exists, "Verification not found");
        require(
            verifications[_contentHash].verifier == msg.sender,
            "Not the verifier"
        );
        require(bytes(_newIpfsCid).length > 0, "IPFS CID required");
        
        verifications[_contentHash].ipfsCid = _newIpfsCid;
        
        emit VerificationUpdated(_contentHash, _newIpfsCid, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get verification record by content hash
     * @param _contentHash Content hash to query
     * @return VerificationRecord struct
     */
    function getVerification(bytes32 _contentHash)
        external
        view
        returns (VerificationRecord memory)
    {
        require(verifications[_contentHash].exists, "Verification not found");
        return verifications[_contentHash];
    }
    
    /**
     * @dev Get all verification hashes for a user
     * @param _user User address
     * @return Array of content hashes
     */
    function getUserVerifications(address _user)
        external
        view
        returns (bytes32[] memory)
    {
        return userVerifications[_user];
    }
    
    /**
     * @dev Get verification count for a user
     * @param _user User address
     * @return Number of verifications
     */
    function getUserVerificationCount(address _user)
        external
        view
        returns (uint256)
    {
        return userVerifications[_user].length;
    }
    
    /**
     * @dev Get paginated verification hashes (for listing)
     * @param _offset Starting index
     * @param _limit Number of records to return
     * @return Array of content hashes
     */
    function getPaginatedVerifications(uint256 _offset, uint256 _limit)
        external
        view
        returns (bytes32[] memory)
    {
        require(_limit > 0 && _limit <= 100, "Invalid limit");
        require(_offset < allVerificationHashes.length, "Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > allVerificationHashes.length) {
            end = allVerificationHashes.length;
        }
        
        bytes32[] memory result = new bytes32[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            result[i - _offset] = allVerificationHashes[i];
        }
        
        return result;
    }
    
    /**
     * @dev Check if content has been verified
     * @param _contentHash Content hash to check
     * @return True if verified, false otherwise
     */
    function isVerified(bytes32 _contentHash) external view returns (bool) {
        return verifications[_contentHash].exists;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update verification fee (only owner)
     * @param _newFee New fee amount in wei
     */
    function setVerificationFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = verificationFee;
        verificationFee = _newFee;
        emit FeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Pause contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Utility Functions ============
    
    /**
     * @dev Generate content hash from string
     * @param _content Content string
     * @return bytes32 hash
     */
    function generateContentHash(string memory _content)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_content));
    }
}

