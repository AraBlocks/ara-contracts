pragma solidity ^0.4.24;

import "./StandardToken.sol";

contract AraToken is StandardToken {

  // metadata
  string  public constant name = "Ara Token";
  string  public constant symbol = "ARA";
  uint256 public constant decimals = 18;
  string  public version = "1.0";


  mapping (address => uint256) private deposits_;

  event Deposit(address indexed from, uint256 value, uint256 total);
  event Withdraw(address indexed to, uint256 value, uint256 total);

  // constructor
  constructor() public {
    _mint(msg.sender, formatDecimals(1000000000)); // 1,000,000,000
  }

  function formatDecimals(uint256 _value) internal pure returns (uint256) {
    return _value * 10 ** decimals;
  }

  function amountDeposited(address _owner) public view returns (uint256) {
    return deposits_[_owner];
  }

  function deposit(uint256 _value) external returns (bool) {
    require(_value <= balanceOf(msg.sender));

    deposits_[msg.sender] = deposits_[msg.sender].add(_value);
    emit Deposit(msg.sender, _value, deposits_[msg.sender]);
    return true;
  }

  function withdraw(uint256 _value) external returns (bool) {
    require(_value <= deposits_[msg.sender]);

    deposits_[msg.sender] = deposits_[msg.sender].sub(_value);
    emit Withdraw(msg.sender, _value, deposits_[msg.sender]);
    return true;
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    require(balanceOf(msg.sender) - _value >= deposits_[msg.sender]);
    return super.transfer(_to, _value);
  }

  function approve(address _spender, uint256 _value) public returns (bool) {
    require(balanceOf(msg.sender) - _value >= deposits_[msg.sender]);
    return super.approve(_spender, _value);
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  )
    public
    returns (bool)
  {
    require(balanceOf(_from) - _value >= deposits_[_from]);
    return super.transferFrom(_from, _to, _value);
  }

  function increaseApproval(
    address _spender,
    uint256 _addedValue
  )
    public
    returns (bool)
  {
    require(balanceOf(msg.sender) - (_addedValue + allowance(msg.sender, _spender)) >= deposits_[msg.sender]);
    return super.increaseApproval(_spender, _addedValue);
  }
}
