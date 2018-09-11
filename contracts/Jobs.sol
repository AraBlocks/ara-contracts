pragma solidity 0.4.24;

import "./AraToken.sol";
import "./Registry.sol";
import "./AFS.sol";

contract Jobs {

  AraToken public token_;
  Registry public registry_;

  mapping(bytes32 => bool)                        public unlocked_; // jobId => unlocked
  mapping(bytes32 => mapping(bytes32 => uint256)) public balances_; // keccak256(address) => jobId => balance
  mapping(bytes32 => Job)                         public budgets_; // jobId => Job

  struct Job {
    address sender;
    uint256 budget;
  }

  event IsValidPurchase(bool _isPurchaser, address _sender, address _msgSender, address _proxyAddress);
  event Unlocked(bytes32 _jobId);
  event BudgetSubmitted(bytes32 _jobId, uint256 _budget);
  event RewardsAllocated(uint256 _allocated, uint256 _returned);
  event Redeemed(address _sender);

  constructor(address _token, address _registry) public {
    token_ = AraToken(_token);
    registry_ = Registry(_registry);
  }

  modifier jobUnlocked(bytes32 _jobId) {
    require(unlocked_[_jobId], "Job must be unlocked.");
    _;
  }

  modifier budgetSubmitted(bytes32 _jobId) {
    require(budgets_[_jobId].sender == msg.sender 
      && budgets_[_jobId].budget > 0, "Budget is invalid.");
    _;
  }

  modifier isValidPurchase(bytes32 _contentId, address _sender) {
    bytes32 hashedAddress = keccak256(abi.encodePacked(_sender));
    AFS afs = AFS(registry_.getProxyAddress(_contentId));
    emit IsValidPurchase(afs.isPurchaser(hashedAddress), _sender, msg.sender, registry_.getProxyAddress(_contentId));
    //require(afs.isPurchaser(hashedAddress), "Job is invalid.");
    //require(registry_.getProxyAddress(_contentId) == msg.sender, "Unlock not originating from proxy.");
     _;
  }

  function unlockJob(bytes32 _jobId, uint256 _budget, bytes32 _contentId, address _sender) 
    external isValidPurchase(_contentId, _sender) {

    unlocked_[_jobId] = true;
    emit Unlocked(_jobId);

    if(_budget > 0) {
      submitBudget(_contentId, _jobId, _budget, _sender);
    }
  }

  event Allowance(uint256 _allowance);
  event AfterRequire(
    bytes32 _jobId, 
    address _purchaser,
    uint256 _budget
  );

  // test this WITHOUT unlocking job first, make sure it reverts
  // test this after unlocking job (purchase) with budget of 0
  function submitBudget(bytes32 _contentId, bytes32 _jobId, uint256 _budget, address _sender) public jobUnlocked(_jobId) {
    address purchaser = registry_.getProxyAddress(_contentId) == msg.sender 
      ? _sender
      : msg.sender;

    // owner should be where transaction came from
    uint256 allowance = token_.allowance(purchaser, address(this));
    emit Allowance(allowance);

    // require(_jobId != bytes32(0) && _budget > 0 && allowance >= _budget
    //   && (budgets_[_jobId].sender == address(0) || budgets_[_jobId].sender == purchaser), "Job submission invalid.");

    emit AfterRequire(_jobId, purchaser, _budget);

    // if (token_.transferFrom(purchaser, address(this), _budget)) {
    //   budgets_[_jobId].budget += _budget;
    //   budgets_[_jobId].sender = purchaser;
    //   assert(budgets_[_jobId].budget <= token_.balanceOf(address(this)));
    //   emit BudgetSubmitted(_jobId, _budget);
    // }
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
