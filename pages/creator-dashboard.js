import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

/* Importing Smart Contract Addresses and ABI's */
import { nftmarketaddress, nftaddress } from "../config";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";


export default function CreatorDashboard() {

    const [nfts,setNfts] = useState([]);
    const [sold, setSold] = useState([]);
    const [loadingState, setLoadingState] = useState("not-loaded");

    useEffect(() => {
        loadNFTs();
    }, []);

    async function loadNFTs() {

      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      /* Getting Reference to both Smart-Contract */
      const marketContract = new ethers.Contract(nftmarketaddress,Market.abi,signer);
      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    
      /* Fetching out data from Market Smart Contract */
      const data = await marketContract.fetchItemsCreated();

      /* Mapping over 'data' to create array 'items' */
      const items = await Promise.all(
        data.map(async (i) => {
          const tokenUri = await tokenContract.tokenURI(i.tokenId);
          const meta = await axios.get(tokenUri);
          let price = ethers.utils.formatUnits(i.price.toString(), "ether");
          let item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            owner: i.owner,
            sold: i.sold,
            image: meta.data.image,
          };
          return item;                                                                                           // Each element of 'data' is processed to create this 'item'. Then this 'item' is added to 'items' Array.
        })
      );
    
      const soldItems = items.filter((i) => i.sold);                                                              // Creating additional array of sold items by filtering our orignal 'items' array.
      
      setSold(soldItems);                                                                                         // Updating our states.
      setNfts(items);
      setLoadingState("loaded");
    }

    if (loadingState === 'loaded' && !nfts.length) 
        return (<h1 className="py-10 px-20 text-3xl">No assets created</h1>);

    return (
      <div>

        {/* Displaying all the NFT's created by the user so far */}
        <div className="p-4">
          <h2 className="text-2xl py-2">Items Created</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">

            {nfts.map((nft, i) => (                                                                       // Mapping through 'nfts' i.e our 'state'.
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />                                               {/* Displaying the Image */}
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">
                    Price - {nft.price} Eth                                                               {/* Displaying the Price */}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>


        {/* Displaying the NFTs which are created by the user and are sold. */}
        <div className="px-4">
          {Boolean(sold.length) && (
            <div>
              <h2 className="text-2xl py-2">Items sold</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">

                {sold.map((nft, i) => (                                                                      // Mapping over 'sold' i.e our 'state'
                  <div
                    key={i}
                    className="border shadow rounded-xl overflow-hidden"
                  >
                    <img src={nft.image} className="rounded" />                                                {/* Displaying the Image */}
                    <div className="p-4 bg-black">
                      <p className="text-2xl font-bold text-white">
                        Price - {nft.price} Eth                                                                {/* Displaying the Price */}
                      </p>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          )}
        </div>
      </div>
    );


}