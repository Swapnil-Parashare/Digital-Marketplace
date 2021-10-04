const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function () {

    const Market = await ethers.getContractFactory("NFTMarket");               // Getting reference to our "NFTMarket.sol" Smart Contract.
    const market = await Market.deploy();                                      // Deploying our "MarketNFT.sol" smart contract.
    await market.deployed();                                                   // Waiting for deployment process.
    const marketAddress = market.address                                       // Getting the address from which smart contract was deployed. Note :- This is the owner of the whole marketplace.

    const NFT = await ethers.getContractFactory("NFT");                        // Getting reference to our "NFT.sol" Smart Contract.
    const nft = await NFT.deploy(marketAddress);                               // Deploying our "NFT.sol" smart contract. Note :- 'marketAddress' is required as argument inorder to deploy it.
    await market.deployed();                                                   // Waiting for deployment process.
    const nftContractAddress = nft.address;                                    // Getting the address from which smart contract was deployed.

    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();

    const auctionPrice = ethers.utils.parseUnits('100', 'ether');

    await nft.createToken("https://www.mytokenlocation.com");                                                         // Here we are creating the tokens.
    await nft.createToken("https://www.mytokenlocation2.com");

    await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice });                      // Here we are putting the tokens for sale -----> Listing.
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice });

    const [_, buyerAddress] = await ethers.getSigners();                                                              // Getting the free accounts

    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1,{value : auctionPrice});                // Selling the tokens.

    let items = await market.fetchMarketItems();                                                                      // Fetching the Unsold Marketitem.

    items = await Promise.all(items.map(async i => {                                                                  // Mapping over all the items to get the data we are concerned about.

      const tokenUri = await nft.tokenURI(i.tokenId)

      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller : i.seller,
        owner : i.owner,
        tokenUri 
      }
      return item;
    }))

    console.log('items: ', items);

  });
});
