pragma solidity ^0.5.16;

import '../SafeMath32.sol';
import './Registry.sol';

contract Library {
  using SafeMath32 for uint32;

  address public owner_;
  mapping (bytes32 => Lib) private libraries_; // hashed methodless owner did => library
  Registry registry_;

  struct Lib {
    uint32 size;
    mapping (uint32 => bytes32) content; // index => contentId (unhashed)
  }

  event AddedToLib(bytes32 indexed _identity, bytes32 indexed _contentId);

  function init(bytes memory _data) public {
    require(owner_ == address(0), 'Library has already been initialized.');

    uint256 btsptr;
    address ownerAddr;
    address registryAddr;
    assembly {
      btsptr := add(_data, 32)
      ownerAddr := mload(btsptr)
      btsptr := add(_data, 64)
      registryAddr := mload(btsptr)
    }
    owner_ = ownerAddr;
    registry_ = Registry(registryAddr);
  }

  modifier restricted() {
    require (msg.sender == owner_, 'Sender not authorized.');
     _;
  }

  modifier fromProxy(bytes32 _contentId) {
    require (msg.sender == registry_.getProxyAddress(_contentId), 'Proxy not authorized.');
     _;
  }

  function getLibrarySize(bytes32 _identity) public view returns (uint32 size) {
    return libraries_[_identity].size;
  }

  function getLibraryItem(bytes32 _identity, uint32 _index) public view returns (bytes32 contentId) {
    require (_index < libraries_[_identity].size, 'Index does not exist.');
    return libraries_[_identity].content[_index];
  }

  function addLibraryItem(bytes32 _identity, bytes32 _contentId) public fromProxy(_contentId) {
    uint32 libSize = libraries_[_identity].size;
    assert (libraries_[_identity].content[libSize] == bytes32(0));
    libraries_[_identity].content[libSize] = _contentId;
    libraries_[_identity].size++;
    emit AddedToLib(_identity, _contentId);
  }
}
