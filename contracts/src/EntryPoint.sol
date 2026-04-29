// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IEscrow } from "./Escrow.sol";
import { IVault } from "./Vault.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20;

contract EntryPoint {
    enum JobStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED
    }

    enum BidStatus {
        ACTIVE,
        ACCEPTED,
        REJECTED
    }

    enum JobPriority {
        CHEAP,
        FAST,
        BALANCED
    }

    enum JobQuality {
        LOW,
        MEDIUM,
        HIGH
    }

    struct Job {
        string jobId;
        address creator;
        uint256 createdAt;
        uint256 deadline;
        uint256 maxTokenAmount;
        JobPriority priority;
        JobQuality quality;
        uint256 minReputation;
        Bid bestBid;
        uint256 bestBidScore;
        uint256 bidCount;
        JobStatus status;
        bool exists;
    }

    struct Bid {
        string bidId;
        string jobId;
        address bidder;
        uint256 createdAt;
        uint256 tokenAmount;
        uint256 timeToComplete;
        uint256 reputationScore;
        BidStatus status;
        bool exists;
    }

    mapping(bytes32 => Job) public jobs;
    mapping(bytes32 => Bid[]) public jobBids;
    mapping(bytes32 => mapping(bytes32 => uint256)) public jobBidIndexPlusOne;
    mapping(address => bytes32[]) public nodeToJobs;
    mapping(bytes32 => address) public jobToAssignee;
    mapping(address => uint256) public reputation;

    address public coordinator;
    address public deployer;

    IERC20 public token;
    IEscrow public escrow;
    IVault public vault;

    uint256 public constant MAX_BID = 5;
    uint256 public constant REP_REWARD = 2;
    uint256 public constant REP_PENALTY = 5;
    uint256 public constant MAX_REPUTATION = 100;
    uint256 public constant INITIAL_REPUTATION = 10;

    event JobCreated(string jobId, address creator, uint256 maxTokenAmount, uint256 deadline);
    event JobAssigned(string jobId, address node);
    event BidPlaced(string bidId, string jobId, address bidder, uint256 tokenAmount);
    event EscrowCreated(string jobId, string bidId, address payer, address payee, uint256 amount);
    event EscrowReleased(string jobId, uint256 amount);
    event EscrowRefund(string jobId);

    constructor(address _escrowAddress, address _coordinator, address _token, address _vaultAddress) {
        escrow = IEscrow(_escrowAddress);
        coordinator = _coordinator;
        token = IERC20(_token);
        vault = IVault(_vaultAddress);
        deployer = msg.sender;
    }

    modifier onlyCoordinator() {
        _onlyCoordinator();
        _;
    }

    function _onlyCoordinator() internal view {
        require(msg.sender == coordinator, "Only the coordinator can call this function");
    }

    modifier onlyDeployer() {
        _onlyDeployer();
        _;
    }

    function _onlyDeployer() internal view {
        require(msg.sender == deployer, "Only the deployer can call this function");
    }

    struct CreateJobParams {
        string jobId;
        address creator;
        uint256 maxTokenAmount;
        uint256 deadline;
        uint256 createdAt;
        JobPriority priority;
        JobQuality quality;
        uint256 minReputation;
    }

    function createJob(CreateJobParams memory _params) public onlyDeployer {
        bytes32 jobKey = _hashString(_params.jobId);
        require(jobs[jobKey].exists == false, "Job ID already exists");
        require(_params.deadline > block.timestamp, "Invalid deadline");

        jobs[jobKey] = Job({
            jobId: _params.jobId,
            creator: _params.creator,
            createdAt: _params.createdAt,
            deadline: _params.deadline,
            maxTokenAmount: _params.maxTokenAmount,
            priority: _params.priority,
            quality: _params.quality,
            minReputation: _params.minReputation,
            bestBid: Bid({
                bidId: "",
                jobId: _params.jobId,
                bidder: address(0),
                createdAt: 0,
                tokenAmount: 0,
                timeToComplete: 0,
                reputationScore: 0,
                status: BidStatus.ACTIVE,
                exists: false
            }),
            bestBidScore: 0,
            bidCount: 0,
            status: JobStatus.PENDING,
            exists: true
        });
        
        vault.transfer(_params.creator, address(escrow), _params.maxTokenAmount);
        _createEscrow(_params.jobId, "", jobs[jobKey].creator, address(0), jobs[jobKey].maxTokenAmount);

        emit JobCreated(_params.jobId, _params.creator, _params.maxTokenAmount, _params.deadline);
    }

    function finalizeJob(string memory _jobId) public onlyCoordinator {
        bytes32 jobKey = _hashString(_jobId);

        require(jobs[jobKey].exists == true, "Job ID does not exist");
        if (jobs[jobKey].status != JobStatus.PENDING) return;

        bool ready = jobs[jobKey].bidCount >= MAX_BID || block.timestamp >= jobs[jobKey].deadline;

        require(ready, "Not ready");
        
        // No bids placed mark as failed and refund
        if (jobs[jobKey].bidCount == 0) {
            jobs[jobKey].status = JobStatus.FAILED;
            refundEscrow(_jobId);
            emit EscrowRefund(_jobId);
            return;
        }

        Bid memory bid = jobs[jobKey].bestBid;

        address node = bid.bidder;

        jobs[jobKey].status = JobStatus.IN_PROGRESS;
        nodeToJobs[node].push(jobKey);
        jobToAssignee[jobKey] = node;

        escrow.setPayee(_jobId, node);

        emit JobAssigned(_jobId, node);
    }

    function markJobAsCompleted(string memory _jobId) public onlyCoordinator {
        bytes32 jobKey = _hashString(_jobId);
        Job storage job = jobs[jobKey];

        require(job.exists, "Job does not exist");

        if (job.status != JobStatus.IN_PROGRESS) return;

        address node = jobToAssignee[jobKey];

        job.status = JobStatus.COMPLETED;

        if (reputation[node] + REP_REWARD > MAX_REPUTATION) {
            reputation[node] = MAX_REPUTATION;
        } else {
            reputation[node] += REP_REWARD;
        }

        releaseEscrowFunds(_jobId);
    }

    function markJobAsFailed(string memory _jobId) public onlyCoordinator {
        bytes32 jobKey = _hashString(_jobId);
        Job storage job = jobs[jobKey];

        require(job.exists, "Job does not exist");

    
        if (job.status != JobStatus.IN_PROGRESS) return;

        address node = jobToAssignee[jobKey];

        job.status = JobStatus.FAILED;

        if (reputation[node] > REP_PENALTY) {
            reputation[node] -= REP_PENALTY;
        } else {
            reputation[node] = 0;
        }

        refundEscrow(_jobId);

        emit EscrowRefund(_jobId);
    }

    function getJobDetails(string memory _jobId) public view returns (string memory, address, uint256, uint256, uint256, JobPriority, JobQuality, uint256, JobStatus, Bid memory, uint256, uint256) {
        bytes32 jobKey = _hashString(_jobId);
        require(jobs[jobKey].exists == true, "Job ID does not exist");
        Job memory job = jobs[jobKey];
        return (job.jobId, job.creator, job.maxTokenAmount, job.createdAt, job.deadline, job.priority, job.quality, job.minReputation, job.status, job.bestBid, job.bestBidScore, job.bidCount);
    }  

    function _getWeights(JobPriority p) internal pure returns (uint256 wPrice, uint256 wTime, uint256 wRep) {
        if (p == JobPriority.CHEAP) {
            return (50, 20, 15);
        } else if (p == JobPriority.FAST) {
            return (20, 50, 15);
        } else {
            // BALANCED
            return (25, 25, 25);
        }
    }

    function _adjustForQuality(JobQuality q, uint256 wRep) internal pure returns (uint256) {
        if (q == JobQuality.HIGH) {
            wRep += 20;
        } else if (q == JobQuality.LOW) {
            if (wRep > 10) wRep -= 10;
            else wRep = 0;
        }

        return wRep;
    }

    function _getBidSScore(Job storage job, Bid memory bid) internal view returns (uint256) {
        (uint256 wPrice, uint256 wTime, uint256 wRep) = _getWeights(job.priority);
        wRep = _adjustForQuality(job.quality, wRep);
        uint256 score = (wPrice * (1e18 / bid.tokenAmount)) + (wTime * (1e18 / bid.timeToComplete)) + (wRep * bid.reputationScore);

        return score;
    }

    function _hashString(string memory _str) internal pure returns (bytes32) {
        bytes32 result;
        assembly {
            result := keccak256(add(_str, 0x20), mload(_str))
        }
        return result;
    }

    function isMaxBidReached(string memory _jobId) public view returns (bool) {
        bytes32 jobKey = _hashString(_jobId);
        require(jobs[jobKey].exists == true, "Job ID does not exist");
        return jobs[jobKey].bidCount >= MAX_BID;
    }

    function isJobExpired(string memory _jobId) public view returns (bool) {
        bytes32 jobKey = _hashString(_jobId);
        require(jobs[jobKey].exists == true, "Job ID does not exist");
        return block.timestamp > jobs[jobKey].deadline;
    }

    function placeBid(string memory _bidId, uint256 _tokenAmount, string memory _jobId, uint256 _createdAt, uint256 _timeToComplete) public {
        require(_tokenAmount > 0, "Invalid token amount");
        require(_timeToComplete > 0, "Invalid time");
        require(!isMaxBidReached(_jobId), "Maximum bids reached");
        require(!isJobExpired(_jobId), "Job has expired");
        bytes32 jobKey = _hashString(_jobId);
        bytes32 bidKey = _hashString(_bidId);

        if (reputation[msg.sender] == 0) {
            reputation[msg.sender] = INITIAL_REPUTATION;
        }

        require(reputation[msg.sender] >= jobs[jobKey].minReputation, "Low reputation");
        require(_tokenAmount <= jobs[jobKey].maxTokenAmount, "Too expensive");
        require(jobs[jobKey].exists == true, "Job ID does not exist");
        require(jobBidIndexPlusOne[jobKey][bidKey] == 0, "Bid ID already exists");

        Bid memory newBid = Bid({
            bidId: _bidId,
            jobId: _jobId,
            bidder: msg.sender,
            createdAt: _createdAt,
            tokenAmount: _tokenAmount,
            timeToComplete: _timeToComplete,
            reputationScore: reputation[msg.sender],
            status: BidStatus.ACTIVE,
            exists: true
        });

        jobBids[jobKey].push(newBid);
        jobBidIndexPlusOne[jobKey][bidKey] = jobBids[jobKey].length;
        jobs[jobKey].bidCount++;

        // Update best bid
        uint256 newBidScore = _getBidSScore(jobs[jobKey], newBid);
        if (jobs[jobKey].bestBid.exists) {
            uint256 currentBestBidScore = jobs[jobKey].bestBidScore;

            if (newBidScore > currentBestBidScore) {
                jobs[jobKey].bestBid = newBid;
                jobs[jobKey].bestBidScore = newBidScore;
            }
        } else {
            jobs[jobKey].bestBid = newBid;
            jobs[jobKey].bestBidScore = newBidScore;
        }
        
        emit BidPlaced(_bidId, _jobId, msg.sender, _tokenAmount);
    }

    function getBidDetails(string memory _jobId, string memory _bidId) public view returns (string memory, string memory, address, uint256, uint256, uint256, uint256, BidStatus) {
        bytes32 jobKey = _hashString(_jobId);
        bytes32 bidKey = _hashString(_bidId);
        uint256 bidIndexPlusOne = jobBidIndexPlusOne[jobKey][bidKey];

        require(jobs[jobKey].exists == true, "Job ID does not exist");
        require(bidIndexPlusOne != 0, "Bid ID does not exist");

        Bid memory bid = jobBids[jobKey][bidIndexPlusOne - 1];
        return (bid.bidId, bid.jobId, bid.bidder, bid.tokenAmount, bid.createdAt, bid.timeToComplete, bid.reputationScore, bid.status);
    }

    function getBidsForJob(string memory _jobId) public view returns (Bid[] memory) {
        bytes32 jobKey = _hashString(_jobId);
        require(jobs[jobKey].exists == true, "Job ID does not exist");

        return jobBids[jobKey];
    }

    function getBidCountForJob(string memory _jobId) public view returns (uint256) {
        bytes32 jobKey = _hashString(_jobId);
        require(jobs[jobKey].exists == true, "Job ID does not exist");

        return jobs[jobKey].bidCount;
    }

    function getJobAssignee(string memory _jobId) public view returns (address) {
        bytes32 jobKey = _hashString(_jobId);
        require(jobs[jobKey].exists == true, "Job ID does not exist");
        return jobToAssignee[jobKey];
    }

    function getJobsByNode(address node) public view returns (bytes32[] memory) {
        return nodeToJobs[node];
    }

    function getNodeReputation(address node) public view returns (uint256) {
        return reputation[node];
    }

    // Escrow contract interactions
    function _createEscrow(string memory _jobId, string memory _bidId, address _payer, address _payee, uint256 _amount) internal {
        escrow.createEscrow(_jobId, _bidId, _payer, _payee, _amount);
        emit EscrowCreated(_jobId, _bidId, _payer, _payee, _amount);
    }

    function releaseEscrowFunds(string memory _jobId) public onlyCoordinator {
        bytes32 jobKey = _hashString(_jobId);
        uint256 amount = jobs[jobKey].bestBid.tokenAmount;

        require(amount > 0, "No accepted bid");
        
        escrow.releaseFunds(_jobId, amount);
        emit EscrowReleased(_jobId, amount);
    }

    function refundEscrow(string memory _jobId) public onlyCoordinator {
        escrow.refund(_jobId);
        emit EscrowRefund(_jobId);
    }

    function getEscrowDetails(string memory _jobId) public view returns (string memory, string memory, address, address, uint256, bool) {
        return escrow.getEscrowDetails(_jobId);
    }
}
