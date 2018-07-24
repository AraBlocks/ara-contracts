pragma solidity ^0.4.24;

contract Library {
  address public owner;
  mapping (string => Lib) libraries;

  struct Lib {
    uint16 size;
    mapping (uint16 => string) content;
  }

  event Added(string contentId);

  constructor() public {
    owner = msg.sender;
  }

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  function getLibrarySize(string identity) public view returns (uint16 size) {
    return libraries[identity].size;
  }

  function getLibraryItem(string identity, uint16 index) public view returns (string contentId) {
    require (index < libraries[identity].size && index >= 0);
    return libraries[identity].content[index];
  }

  function addLibraryItem(string identity, string contentId) public {
    uint16 libSize = libraries[identity].size;
    require (bytes(libraries[identity].content[libSize]).length == 0);
    libraries[identity].content[libSize] = contentId;
    libraries[identity].size++;
    emit Added(contentId);
  }
}
