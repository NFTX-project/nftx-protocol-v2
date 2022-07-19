pragma solidity ^0.8.0;

contract MockOracle {
  uint currentId;
  string returnValue;

  // Event that triggers oracle outside of the blockchain
  event NewRequest(uint id, string urlToQuery, string attributeToFetch);

  // Triggered when there's a consensus on the final result
  event UpdatedRequest(uint id, string urlToQuery, string attributeToFetch, string agreedValue);

  function createRequest(string memory _urlToQuery, string memory _attributeToFetch) external {
    // launch an event to be detected by oracle outside of blockchain
    emit NewRequest(currentId, _urlToQuery, _attributeToFetch);

    // Update the request straight away
		emit UpdatedRequest(currentId, _urlToQuery, _attributeToFetch, returnValue);

		// increase request id
    ++currentId;
  }

  function setReturnValue(string calldata _returnValue) external {
  	returnValue = _returnValue;
  }
}
