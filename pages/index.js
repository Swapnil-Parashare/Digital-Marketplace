import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { nftaddress, nftmarketaddress } from "../config";                                     // Importing Addresses of our smart-contracts.
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";                                    // Importing ABI's of our smart-contracts from the "Artifacts" folder.
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => { loadNFTs() }, []);

  /*** Loading Unsold NFT's of our Marketplace */
  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider(
      // "https://matic-testnet-archive-rpc.bwarelabs.com"
      "https://speedy-nodes-nyc.moralis.io/f49af60b20d6f40c2964bd1f/polygon/mumbai"                         // We don't need this while working on local host, if we keep it, it gives error. (Be careful!!!)
    );              
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);                               // Here we have taken reference to NFT contract.
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider );                    // Here we have taken reference to Market contract.
  
  
    const data = await marketContract.fetchMarketItems();                                                   //Now we will start interacting with our Smart-Contracts.                                
    // console.log(data);                                                                                      // Console logging data for verification.
    
    const items = await Promise.all(              
      data.map(async (i) => {                                                                               // We are mapping over our 'data'                                            
        const tokenUri = await tokenContract.tokenURI(i.tokenId);                                           // Fetching 'tokenURI' by using "NFT.sol" contract.
        const meta = await axios.get(tokenUri);                                                             // That "tokenURI" is used to get meta data about token like :- Name , Description , Image , Vedio.
        if(true)
        {
          let price = ethers.utils.formatUnits(i.price.toString(), "ether");                                  // It is something IPFS stuff.
          let item = {
            price    : price,
            tokenId  : i.tokenId.toNumber(),
            seller   : i.seller,
            owner    : i.owner,
            image    : meta.data.image,
            name     : meta.data.name,
            description  : meta.data.description,
            category : meta.data.category
          }
          console.log(tokenUri);                                                                              // This is the IPFS Uri were all the meta-data of the NFT is present. Console logging it for verification.
          return item;                                                                                        // Element of 'data' is processed to create this 'item'. Then this 'item' is added to 'items' Array.
        }
      })            
    );            
    setNfts(items);                                                                                         // Updating the state.
    setLoadingState("loaded");            
  }           

  /*** Buying Unsold NFT's of our Marketplace */            
  async function buyNft(nft) {                                                                              // We are passing an 'item' as argument.
    const web3modal = new Web3Modal();            
    const connection = await web3modal.connect();                                                           // Connecting the Application with user's metamask account.
    const provider = new ethers.providers.Web3Provider(connection);                                         // Creating a Provider using user's metamask account address.
    const signer = provider.getSigner();                                                                    // To execute actual transaction we need 'signer'
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);                             // We have reference to "Market" contract. Instead of passing in basic provider, we have passed 'signer'.
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");                                   // Fetching price from the 'item'.
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId,{ value: price });          // Performing "Buying" Transaciton.
    await transaction.wait();
    loadNFTs();
  }

  if (loadingState === "loaded" && !nfts.length)
    return <h1 className="px-20 py-10 text-3xl"> No items in marketplace </h1>;

  /* This is the actual User Interface */
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
          nfts.map( (nft,i ) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />                                                                                {/* Displaying Image of NFT */}
                <div className="p-4">
                  <p
                    style={{ height: "64px" }}
                    className="text-2xl font-semibold"
                  >
                    {nft.name}                                                                                         {/* Displaying Name of NFT */}
                  </p>
                  <div style={{ height: "70px", overflow: "hidden" }}>
                    <p className="text-gray-400">{nft.description}</p>{" "}                                            {/* Displaying Description of NFT */}
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">
                    {nft.price} Eth                                                                 {/* Displaying Price of NFT */}
                  </p>
                  <p className="text-2xl mb-4 font-bold text-white">
                    Category : {nft.category}                                                                 {/* Displaying Price of NFT */}
                  </p>
                  <button
                    className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                    onClick={() => buyNft(nft)}                                                                         /* Displaying "Buy" Button which will invoke our "buyNft()" function */
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default Home;

/* Notes :-

1] import { useEffect, useState } from 'react'
--> These are hooks.
    useState : To keep up with local state.
    useEffect : To invoke a function when a component loads.

2] axios and web3modal    
-->    axios     : Data Fetching Library
    web3modal : Way for us to connect to someones ethereum wallet.

3] ABI's are basically JSON representation of our smart contract.
   It allows us to interact with it "Client-Side Application".

4] npx hardhat test ---------> i] hardhat looks at our smart contracts and compiles it.
                              ii] And then put it into the "Artifacts" folder.
                             iii] Whenever we do "npx hardhat compile" this "Artifacts" directory is created/updated.

*/
