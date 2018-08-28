pragma solidity 0.4.24;

import "./ARAToken.sol";

contract Jobs {

  ARAToken public token_;

  mapping(bytes32 => bool)                        public unlocked_; // jobId => unlocked
  mapping(bytes32 => mapping(bytes32 => uint256)) public balances_; // keccak256(address) => jobId => balance
  mapping(bytes32 => Job)                         public budgets_; // jobId => Job

  struct Job {
    address sender;
    uint256 budget;
  }

  event Unlocked(bytes32 _jobId);
  event BudgetSubmitted(bytes32 _jobId, uint256 _budget);
  event RewardsAllocated(uint256 _allocated, uint256 _returned);
  event Redeemed(address _sender);

  constructor(address _token) public {
    token_ = ARAToken(_token);
  }

  modifier jobUnlocked(bytes32 _jobId) {
    require(unlocked_[_jobId], "Job must be unlocked.");
    _;
  }

  modifier budgetSubmitted(bytes32 _jobId) {
    require(budgets_[_jobId].sender == msg.sender 
      && budgets_[_jobId].budget > 0, "Job is invalid.");
    _;
  }

  function unlockJob(bytes32 _jobId, uint256 _budget) external {
    unlocked_[_jobId] = true;
    emit Unlocked(_jobId);

    if(_budget > 0) {
      submitBudget(_jobId, _budget);
    }
  }

  function submitBudget(bytes32 _jobId, uint256 _budget) public jobUnlocked(_jobId) {
    uint256 allowance = token_.allowance(msg.sender, address(this));
    require(_jobId != bytes32(0) && _budget > 0 && allowance >= _budget
      && (budgets_[_jobId].sender == address(0) || budgets_[_jobId].sender == msg.sender), "Job submission invalid.");

    if (token_.transferFrom(msg.sender, address(this), _budget)) {
      budgets_[_jobId].budget += _budget;
      budgets_[_jobId].sender = msg.sender;
      assert(budgets_[_jobId].budget <= token_.balanceOf(address(this)));
      emit BudgetSubmitted(_jobId, _budget);
    }
  }

  function allocateRewards(bytes32 _jobId, bytes32[] _addresses, uint256[] _rewards) public budgetSubmitted(_jobId) {
    require(_addresses.length == _rewards.length, "Unequal number of addresses and rewards.");
    uint256 totalRewards;
    for (uint8 i = 0; i < _rewards.length; i++) {
      totalRewards += _rewards[i];
    }
    require(totalRewards <= budgets_[_jobId].budget, "Insufficient budget.");
    for (uint8 j = 0; j < _addresses.length; j++) {
      assert(budgets_[_jobId].budget >= _rewards[j]);
      balances_[_addresses[j]][_jobId] = _rewards[j];
      budgets_[_jobId].budget -= _rewards[j];
    }

    uint256 remaining = budgets_[_jobId].budget;
    if (remaining > 0) {
      balances_[keccak256(abi.encodePacked(msg.sender))][_jobId] = remaining;
      budgets_[_jobId].budget = 0;
      redeemBalance(_jobId);
    }

    emit RewardsAllocated(totalRewards, remaining);
  }

  function redeemBalance(bytes32 _jobId) public {
    bytes32 hashedAddress = keccak256(abi.encodePacked(msg.sender));
    require(balances_[hashedAddress][_jobId] > 0, "No balance to redeem.");
    if (token_.transfer(msg.sender, balances_[hashedAddress][_jobId])) {
      balances_[hashedAddress][_jobId] = 0;
      emit Redeemed(msg.sender);
    }
  }

  function getBalance(address _address, bytes32 _jobId) public view returns (uint256) {
    return balances_[keccak256(abi.encodePacked(_address))][_jobId];
  }

  function getBudget(bytes32 _jobId) public view returns (uint256) {
    return budgets_[_jobId].budget;
  }

}
