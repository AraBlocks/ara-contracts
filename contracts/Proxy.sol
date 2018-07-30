pragma solidity ^0.4.24;

import "./Registry.sol";

contract Proxy {
  address  public owner_;
  Registry public registry_;

  string   public did_;
  bool     public listed_;
  uint256  public price_;

  mapping(bytes32 => uint256) public rewards_;
  mapping(bytes32 => bool)    public purchasers_;

  mapping(uint8 => Buffers) public metadata_;
  struct Buffers {
    mapping (uint256 => bytes) buffers;
    uint256[] offsets;
    bool invalid;
  }

  constructor(address _registry, string _did) public {
    owner_    = msg.sender;
    registry_ = Registry(_registry);
    did_      = _did;
    listed_   = true;
    price_    = 0;
  }

  /**
  * @dev Tells the address of the implementation where every call will be delegated.
  * @return address of the implementation to which it will be delegated
  */
  function implementation() public view returns (address) {
    return registry_.standard_();
  }

  /**
  * @dev Fallback function allowing to perform a delegatecall to the given implementation.
  * This function will return whatever the implementation call returns
  */
  function () payable public {
    address _impl = implementation();
    require(_impl != address(0));

    assembly {
      let ptr := mload(0x40)
      calldatacopy(ptr, 0, calldatasize)
      let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
      let size := returndatasize
      returndatacopy(ptr, 0, size)

      switch result
      case 0 { revert(ptr, size) }
      default { return(ptr, size) }
    }
  }
}
