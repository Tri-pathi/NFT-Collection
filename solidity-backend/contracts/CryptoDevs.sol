// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//imports

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {



//state variables

    string _baseTokenURI;

    uint256 public _price= 0.01 ether;

    bool public _paused;

    uint256 public maxTokenIds=20;
 
    uint256 public tokenIds;

    IWhitelist private immutable whitelist;

    bool public presaleStarted;

    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused,"Contract currently paused");
        _;
        
    }
    constructor (string memory baseURI, address whitelistContractAddress) ERC721("Crypto Devs","CD"){
        _baseTokenURI=baseURI;
        whitelist=IWhitelist(whitelistContractAddress);
    }


    /**
     * @dev startPreSale starts a presale for the whitelisted address
     * 
     */
    function startPresale() public onlyOwner{
        presaleStarted=true;
        //let's assume we want to continue presale for just 5  minutes
        presaleEnded=block.timestamp+ 5 minutes;

    }
    /**
     * @dev presaleMint allows a user to mint one NFT per transaction during presale period
     * 
     */

    function presaleMint() public payable onlyWhenNotPaused{
        require(presaleStarted && block.timestamp <presaleEnded,"Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender),"You are not whitelisted");
        require(tokenIds<maxTokenIds,"Exceeded maximim token ids");
        require(msg.value >= _price, "Ether sent is not enough");


        tokenIds+=1;
        //_safeMint is a safer version of the _mint function as it ensures that
        // if the address being minted to is a contract, then it knows how to deal with ERC721 tokens
        // If the address being minted to is not a contract, it works the same way as _mint
        //otherwise we can be caught in ReEntrancy type of attacks

        _safeMint(msg.sender,tokenIds);
    }
    /**
     * @dev mint allows a user to mint 1 NFT per transaction after the presale has ended 
     * basically anyone can mint by paying 
     * 
     */
    function mint() public payable onlyWhenNotPaused{
         require(presaleStarted && block.timestamp >=  presaleEnded, "Presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);

    }
    /**
     * @dev _baseURI overrides the Openzeppelin'a ERC721 implementation which by default returned an emppty string for the BASE_URI
     * 
     */
    function _baseURI() internal view virtual override returns(string memory){
        return _baseTokenURI;
    }
    /**
    * @dev setPaused makes the contract paused or unpaused
      */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }
    /**
     * @dev withdraw sends all the ether in the contract to the owner of the Contract
     * 
     */
    function withdraw() public onlyOwner{
    address _owner=owner();
    uint256 amount=address(this).balance;
     (bool sent,)=_owner.call{value:amount}("");
     require(sent,"transaction Failed");
    }
    //fucnction to receive Ether, msg.data must be empty
    receive() external payable{}
    //Fallback function when msg.data is not empty

    fallback() external payable{}


}
