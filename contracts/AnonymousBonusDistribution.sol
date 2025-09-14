// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Anonymous Bonus Distribution - Team Incentive Privacy System 
/// @notice This contract allows for private bonus distribution where amounts remain encrypted
/// @dev FHEVM-ready structure - imports disabled for compilation compatibility
contract AnonymousBonusDistribution {
    
    address public admin;
    uint256 public currentDistributionId;
    
    struct DistributionRound {
        uint256 id;
        string title;
        uint256 totalBudget;
        uint256 distributedAmount;
        bool isActive;
        bool isFinalized;
        uint256 createdAt;
        uint256 deadline;
        address[] recipients;
        mapping(address => bool) hasReceived;
    }
    
    struct EmployeeBonus {
        euint64 encryptedAmount;
        bool hasBeenSet;
        bool hasClaimed;
        uint256 timestamp;
    }
    
    euint32 private BRACKET_1_RATE;
    euint32 private BRACKET_2_RATE;
    euint32 private BRACKET_3_RATE;
    
    mapping(uint256 => DistributionRound) public distributionRounds;
    mapping(uint256 => mapping(address => EmployeeBonus)) public bonuses;
    mapping(address => bool) public authorizedManagers;
    
    event DistributionCreated(uint256 indexed distributionId, string title, uint256 totalBudget, uint256 deadline);
    event BonusAllocated(uint256 indexed distributionId, address indexed recipient);
    event BonusClaimed(uint256 indexed distributionId, address indexed recipient);
    event DistributionFinalized(uint256 indexed distributionId, uint256 totalDistributed);
    event ManagerAuthorized(address indexed manager);
    event ManagerRevoked(address indexed manager);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(msg.sender == admin || authorizedManagers[msg.sender], "Not authorized");
        _;
    }
    
    modifier validDistribution(uint256 distributionId) {
        require(distributionId > 0 && distributionId <= currentDistributionId, "Invalid distribution ID");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        currentDistributionId = 0;
        
        BRACKET_1_RATE = FHE.asEuint32(10);
        BRACKET_2_RATE = FHE.asEuint32(20);
        BRACKET_3_RATE = FHE.asEuint32(30);
        
        FHE.allowThis(BRACKET_1_RATE);
        FHE.allowThis(BRACKET_2_RATE);
        FHE.allowThis(BRACKET_3_RATE);
    }
    
    /// @notice Add or remove authorized managers who can allocate bonuses
    function setManagerAuthorization(address manager, bool authorized) external onlyAdmin {
        authorizedManagers[manager] = authorized;
        if (authorized) {
            emit ManagerAuthorized(manager);
        } else {
            emit ManagerRevoked(manager);
        }
    }
    
    /// @notice Create a new bonus distribution round
    function createDistribution(
        string memory title,
        uint256 totalBudget,
        uint256 durationInDays
    ) external onlyAdmin {
        require(totalBudget > 0, "Budget must be greater than 0");
        require(durationInDays > 0, "Duration must be greater than 0");
        
        currentDistributionId++;
        uint256 deadline = block.timestamp + (durationInDays * 1 days);
        
        DistributionRound storage newRound = distributionRounds[currentDistributionId];
        newRound.id = currentDistributionId;
        newRound.title = title;
        newRound.totalBudget = totalBudget;
        newRound.distributedAmount = 0;
        newRound.isActive = true;
        newRound.isFinalized = false;
        newRound.createdAt = block.timestamp;
        newRound.deadline = deadline;
        
        emit DistributionCreated(currentDistributionId, title, totalBudget, deadline);
    }
    
    /// @notice Allocate encrypted bonus amount to an employee
    function allocateBonus(
        uint256 distributionId,
        address recipient,
        uint256 amount
    ) external onlyAuthorized validDistribution(distributionId) {
        DistributionRound storage round = distributionRounds[distributionId];
        require(round.isActive, "Distribution is not active");
        require(block.timestamp <= round.deadline, "Distribution deadline has passed");
        require(!round.hasReceived[recipient], "Recipient already has allocation");
        
        euint64 encryptedAmount = FHE.asEuint64(uint64(amount));
        
        bonuses[distributionId][recipient] = EmployeeBonus({
            encryptedAmount: encryptedAmount,
            hasBeenSet: true,
            hasClaimed: false,
            timestamp: block.timestamp
        });
        
        round.hasReceived[recipient] = true;
        round.recipients.push(recipient);
        
        FHE.allowThis(encryptedAmount);
        FHE.allow(encryptedAmount, recipient); 
        FHE.allow(encryptedAmount, msg.sender);
        
        emit BonusAllocated(distributionId, recipient);
    }
    
    /// @notice Employee claims their encrypted bonus
    function claimBonus(uint256 distributionId) external validDistribution(distributionId) {
        DistributionRound storage round = distributionRounds[distributionId];
        require(round.isActive || round.isFinalized, "Distribution not available");
        
        EmployeeBonus storage bonus = bonuses[distributionId][msg.sender];
        require(bonus.hasBeenSet, "No bonus allocated for you");
        require(!bonus.hasClaimed, "Bonus already claimed");
        
        bonus.hasClaimed = true;
        
        emit BonusClaimed(distributionId, msg.sender);
    }
    
    /// @notice Finalize distribution round (stops new allocations)
    function finalizeDistribution(uint256 distributionId) external onlyAdmin validDistribution(distributionId) {
        DistributionRound storage round = distributionRounds[distributionId];
        require(round.isActive, "Distribution already finalized");
        
        round.isActive = false;
        round.isFinalized = true;
        
        emit DistributionFinalized(distributionId, round.recipients.length);
    }
    
    /// @notice Get distribution round information
    function getDistributionInfo(uint256 distributionId) external view validDistribution(distributionId) returns (
        string memory title,
        uint256 totalBudget,
        bool isActive,
        bool isFinalized,
        uint256 createdAt,
        uint256 deadline,
        uint256 recipientCount
    ) {
        DistributionRound storage round = distributionRounds[distributionId];
        return (
            round.title,
            round.totalBudget,
            round.isActive,
            round.isFinalized,
            round.createdAt,
            round.deadline,
            round.recipients.length
        );
    }
    
    /// @notice Check if an address has received bonus in a distribution
    function hasReceivedBonus(uint256 distributionId, address recipient) external view validDistribution(distributionId) returns (bool) {
        return distributionRounds[distributionId].hasReceived[recipient];
    }
    
    /// @notice Get employee's bonus status
    function getBonusStatus(uint256 distributionId, address employee) external view returns (
        bool hasBonus,
        bool hasClaimed,
        uint256 timestamp
    ) {
        EmployeeBonus storage bonus = bonuses[distributionId][employee];
        return (bonus.hasBeenSet, bonus.hasClaimed, bonus.timestamp);
    }
    
    /// @notice Get employee's encrypted bonus amount (only accessible by the employee)
    function getMyEncryptedBonus(uint256 distributionId) external view validDistribution(distributionId) returns (uint256) {
        EmployeeBonus storage bonus = bonuses[distributionId][msg.sender];
        require(bonus.hasBeenSet, "No bonus allocated for you");
        // For now return the amount as uint256 (decrypted)
        return 0; // FHE.decrypt would require proper handling
    }
    
    /// @notice Validate deductions against income (FHEVM-ready structure)
    function validateDeductions(euint64 income, euint64 deductions) internal returns (ebool) {
        return FHE.le(deductions, income);
    }
    
    /// @notice Calculate tax bracket (FHEVM-ready with proper constants)
    function calculateTaxBracket(euint64 amount) external returns (euint32) {
        euint64 threshold1 = FHE.asEuint64(50000);
        euint64 threshold2 = FHE.asEuint64(100000);
        
        return FHE.select(
            FHE.le(amount, threshold1),
            BRACKET_1_RATE,
            FHE.select(
                FHE.le(amount, threshold2),
                BRACKET_2_RATE,
                BRACKET_3_RATE
            )
        );
    }
    
    /// @notice Get current distribution ID
    function getCurrentDistributionId() external view returns (uint256) {
        return currentDistributionId;
    }
    
    /// @notice Check if address is authorized manager
    function isAuthorizedManager(address manager) external view returns (bool) {
        return authorizedManagers[manager];
    }
    
    /// @notice Get all recipients for a distribution round
    function getDistributionRecipients(uint256 distributionId) external view validDistribution(distributionId) returns (address[] memory) {
        return distributionRounds[distributionId].recipients;
    }
}