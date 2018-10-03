pragma solidity ^0.4.24;

contract Ownable {

  address public owner_;
  address public stagedOwner_;

  event TransferApproved(address indexed _previousOwner, address indexed _newOwner);
  event TransferStaged(address indexed _currentOwner, address indexed _stagedOwner);

  modifier onlyOwner() {
    require(msg.sender == owner_);
    _;
  }

  modifier onlyStagedOwner() {
    require(msg.sender == stagedOwner_);
    _;
  }

  function stageOwnershipTransfer(address _stagedOwner) public onlyOwner {
    _stageOwnershipTransfer(_stagedOwner);
  }

  function approveOwnershipTransfer() public onlyStagedOwner {
    _approveOwnershipTransfer();
  }

  function _stageOwnershipTransfer(address _stagedOwner) internal {
    require(_stagedOwner != address(0));
    emit TransferStaged(owner_, _stagedOwner);
    stagedOwner_ = _stagedOwner;
  }

  function _approveOwnershipTransfer() internal {
    require(stagedOwner_ != address(0));
    emit TransferApproved(owner_, stagedOwner_);
    owner_ = stagedOwner_;
  }

}
