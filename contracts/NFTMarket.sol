/*  Aim :- This contract allows users to put their digital assets for sale on an open market. */

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";            // Security Mechanism

contract NFTMarket is ReentrancyGuard {

    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;                                                        // Counter for Marketplace Item Id.
    Counters.Counter private _itemsSold;                                                      // Counter for Total Items Sold.

    address payable owner;
    uint256 listingPrice = 0.025 ether;       // This is Listing Fee. API will handle Ether --> Matic

    constructor() {                           // The one who deploys the contract becomes the owner.
        owner = payable(msg.sender);
    }

    struct MarketItem {                       // These are all the attributes of the Market Item.
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;   // To fetch the details of particular market iteml.

                                                             // 'event' matched to our 'struct'. Required to listen events from front end application.
    event MarketItemCreated (                               
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }


    /****************     Creating a Market Item -------> Listing     ***************/

    function createMarketItem(address nftContract, uint tokenId, uint256 price) public payable nonReentrant {
       
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(                                                                    // Here we are mapping "itemId" with struct "MarketItem".
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),                                                                                // Seller has put the item for sale and initially no one owns it.
            price,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);                                  // Here we are transfering the ownership from "Seller" to our "Contract" itself. So now contract holds the item.

        emit MarketItemCreated(                                                                                 // Here we are emitting the event we created earlier.
             itemId,
             nftContract,
             tokenId,
             msg.sender,
             address(0),
             price,
             false
        );

    }

    /****************     Selling a Market Item    ***************/

    function createMarketSale( address nftContract, uint256 itemId) public payable nonReentrant {

        uint price = idToMarketItem[itemId].price;                     // Fetching 'price' from mapping.
        uint tokenId = idToMarketItem[itemId].tokenId;                 // Fetching 'tokenId' from mapping.

        require(msg.value == price, "Please submit the asking price in order to comtplete the pruchase");

        idToMarketItem[itemId].seller.transfer(msg.value);                                       // Here we are transfering money hold by this transaction into the seller's account.
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);                   // Here we are transfering the ownership of NFT from 'Contract' to 'Buyer' i.e Transaction sender.
        idToMarketItem[itemId].owner = payable(msg.sender);                                      // Here we are updating the "Owner's Address" of mapping to "Buyer" i.e Transaction Sender.
        idToMarketItem[itemId].sold = true;                                                      // Setting 'sold' as true.
        _itemsSold.increment();

        payable(owner).transfer(listingPrice);                                                   // Once the item is sold the "Listing Price" is send to the owner of the Contract.

    }

    /*****************    Fetching Unsold MarketItems     ***************/

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);                             // Creating an array which we will eventually return. Its size is set equal to total unsold items.

        for (uint i = 0; i < itemCount ; i++) {
            if(idToMarketItem[i+1].owner == address(0))                                            // Filtering our unsold items
            {
                uint currentId = idToMarketItem[i+1].itemId;                                       // Fetching their "itemId"      
                MarketItem memory currentItem = idToMarketItem[currentId];                         // Fetching out the whole 'MarketItem' from the fetched "itemId"
                items[currentIndex] = currentItem;                                                 // Adding the fetched MarketItem to our array.                                               
                currentIndex += 1;
            }
        }
        return items;
    }

    /****************     Fetching the MarketItems that the user owns     ***************/

    function fetchMyNFTs() public view returns (MarketItem[] memory) {

        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i = 0 ; i< totalItemCount ; i++)
        {
            if(idToMarketItem[i+1].owner == msg.sender){                                          // Calculating the items which the user owns.
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);                                  // Creating an array which we will eventually return. Its size is set equal to total item possesed by user.

        for (uint i = 0 ; i < totalItemCount ; i++)
        {
            if(idToMarketItem[i+1].owner == msg.sender){                                           // Filtering out the MarketItems which the user owns

                uint currentId = idToMarketItem[i+1].itemId;                                       // Fetching out 'itemId'
                MarketItem storage currentItem = idToMarketItem[currentId];                        // Fetching out the whole 'MarketItem'
                items[currentIndex] = currentItem;                                                 // Adding the MarketItem to our Array
                currentIndex += 1;
            }
        }

        return items;
    }

    /****************     Fetching the MarketItems that the user have created.     ***************/

    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i = 0 ; i < totalItemCount ; i++)
        {
            if(idToMarketItem[i+1].seller == msg.sender){                                          // Calculating the items which the user has created.
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);                                  // Creating an array which we will eventually return. Its size is set equal to total item created by user.

        for (uint i = 0 ; i < totalItemCount ; i++)
        {
            if(idToMarketItem[i+1].seller == msg.sender){                                           // Filtering out the MarketItems which the user have created

                uint currentId = idToMarketItem[i+1].itemId;                                       // Fetching out 'itemId'
                MarketItem storage currentItem = idToMarketItem[currentId];                        // Fetching out the whole 'MarketItem'
                items[currentIndex] = currentItem;                                                 // Adding the MarketItem to our Array
                currentIndex += 1;
            }
        }
        return items;
    }

}