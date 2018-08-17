pragma solidity ^0.4.24;

import "./Registry.sol";

contract Library {
  address public owner_;
  mapping (bytes32 => Lib) private libraries_; // hashed methodless owner did => library
  Registry registry_;

  struct Lib {
    uint16 size;
    mapping (uint16 => bytes32) content; // index => contentId (unhashed)
  }

  event AddedToLib(bytes32 indexed _contentId);

  constructor(address _registry) public {
    owner_ = msg.sender;
    registry_ = Registry(_registry);
  }

  modifier restricted() {
    require (msg.sender == owner_);
     _;
  }

  modifier fromProxy(bytes32 _contentId) {
    require (msg.sender == registry_.getProxyAddress(_contentId));
     _;
  }

  function getLibrarySize(bytes32 _identity) public view returns (uint16 size) {
    return libraries_[_identity].size;
  }

  function getLibraryItem(bytes32 _identity, uint16 _index) public view returns (bytes32 contentId) {
    require (_index < libraries_[_identity].size);
    return libraries_[_identity].content[_index];
  }

  function addLibraryItem(bytes32 _identity, bytes32 _contentId) public fromProxy(_contentId) {
    uint16 libSize = libraries_[_identity].size;
    require (libraries_[_identity].content[libSize] == bytes32(0));
    libraries_[_identity].content[libSize] = _contentId;
    libraries_[_identity].size++;
    emit AddedToLib(_contentId);
  }
}
