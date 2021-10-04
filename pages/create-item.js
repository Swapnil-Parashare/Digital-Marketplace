import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";                   
import { useRouter } from "next/router";
import Web3Modal from "web3modal";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");                                                // Passing IPFS-Infura URI 

{/* Importing Addresses and ABIs */}
import { nftaddress, nftmarketaddress } from "../config";
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function CreateItem() {
 
  const [fileUrl, setFileUrl] = useState(null);                                                                    // This is the location were image of NFT lives.
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '', category : '' }) ;         // Now we are adding "category" property to "formInput" Object which is our "state".
  const router = useRouter()

  async function onChange(e) {

    const file = e.target.files[0]

    try {

      const added = await client.add(                                                          // Here we are uploading image to IPFS.
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      );

      const url = `https://ipfs.infura.io/ipfs/${added.path}`;                                 // URL were our file is located.

      setFileUrl(url);                                                                         // Updating our component state.

    } catch (error) {
      console.log('Error uploading file: ', error);
    }  
  }



async function createItem() {

  const { name, description, price, category } = formInput;                                                    // Destructing Information from the 'formInput'.

  if (!name || !description || !price || !fileUrl || !category) return;
  
  const data = JSON.stringify({                                                                      // Stringifying the Information .
    name : name,
    description : description,
    image: fileUrl,
    category : category
  });

  try {

    const added = await client.add(data);                                                             // Uploading Meta-Data to IPFS                     
    const url = `https://ipfs.infura.io/ipfs/${added.path}`;                                          // This is the URL were our Data is present.

    createSale(url);
  } catch (error) {
    console.log("Error uploading file: ", error);
  }
}

/* Listing an item for sale */
async function createSale(url) {

  const web3Modal = new Web3Modal();
  const connection = await web3Modal.connect();
  const provider = new ethers.providers.Web3Provider(connection);                                   // provider -> injectedprovider
  const signer = provider.getSigner();

  /* next, create the item */
  let contract = new ethers.Contract(nftaddress, NFT.abi, signer);                                    // Getting reference to NFT contract.
  let transaction = await contract.createToken(url);                                                  // Calling the function "createToken()" using contract.
  let tx = await transaction.wait();                                                                  // Wait till the transaction processed.
  
  let event = tx.events[0];
  let value = event.args[2];
  let tokenId = value.toNumber();                                                                      // Getting reference to "tokenId".

  const price = ethers.utils.parseUnits(formInput.price, "ether");                                     // Getting reference to "Price".

  /* then list the item for sale on the marketplace */
  contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);                                // Getting reference to "Market" contract.
  let listingPrice = await contract.getListingPrice();                                                 // Fetching the listing fee through function call.
  listingPrice = listingPrice.toString();

  transaction = await contract.createMarketItem(nftaddress, tokenId, price, {                          // Creating a "MarketItem" through function call "createMarketItem()".
    value: listingPrice,
  });

  await transaction.wait();

  router.push("/");                                                                                     // Route our user to home page.

}

  /* Returning the actual User-Interface */
  return (
    <div className="flex justify-center">
    
      {/* Taking input :- 1]Name      2]Description   3]Price  4]fileUrl(through "onChange()")  5]Category */}
      <div className="w-1/2 flex flex-col pb-12">

        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <input
          placeholder="Asset Price in Matic"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, price: e.target.value })
          }
        />

        <select name="art" id="art" className="mt-2 border rounded p-4"                                       // Same as we are updating different properties of "formInput" state using "updateFormInput". Here are updating newly added "category" property.
          onChange={(e) =>
          updateFormInput({ ...formInput, category : e.target.value })
          } >
          <option value="" disabled selected hidden>Choose a Category</option>
          <option value="Handicraft">Handicraft</option>
          <option value="Digital Art">Others</option>
        </select>

        <input type="file" name="Asset" className="my-4" onChange={onChange} />                                 {/* Our Image file is getting uploaded at this line by calling function "onChange" defined above. "onChange" function also updates "fileUrl" state. */}

        {fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}                                 {/*Uploaded file is displayed instantly due to this line. This is done by state "fileUrl" which is updated by us in "onChange" function.*/}

        {/* Button for creating digital assest, it will call createMarket() function. */}
        <button
          onClick={createItem}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
        >
          Create Digital Asset
        </button>
      </div>
    </div>
  );
}

  /*
  Important Note :- Control Flow of the Page.

  Initial :- As soon as user input data "name", "description", "price" , "category" we update our state "formInput" with the help of function "updateFormInput()".

  A] onChange() :- Uploading NFT image to IPFS
  1] Image of our NFT is uploaded as soon as the user selects the image. 
  2] This is done by "onChange" function, through "onChange" Event on the "input" tag.
  3] After uploading, we get an Url which specifies were our image lives on IPFS.
  4] We have updated the "fileUrl" state which this Url. 

  B] createItem() :- Uploading Metadata of NFT to IPFS
  1] Our NFT has metadata "name", "description" , "price", "fileUrl", "category".
  2] We have stored this metadata in our "formInput" state right at the time of taking input form user.
  3] This function creates a object containing all this metadata and uploads it to IPFS.
  4] So we get a url were this metadata is present. (Same as we get url for the NFT image in "onChange()" and we upated our "fileUrl" state with it.)
  5] We have passes this URL to createSale() fucntion.
  
  C] createSale() :- This is the function were we actually interact with the "Smart Contracts".
  1] This function recieves the Url which contains all the metadata of our NFT.
  2] 

  Step 1 : Create a 'signer'.
         i]  Create instance of "Web3Modal".
         ii] Form a "connection" which users metamask.
        iii] Create a "provider" using this "connection".                                                  (Note : Don't use usual 'JsonRpcProvider()'. Instead use 'Web3Provider()' .)
         iv] As we have use 'Web3Provider', now we can create a 'signer' with the help of "provider".      (Note : JsonRpcProvider() doesn't give "signer". )
         v] 'signer' is used to create reference to our Smart Contracts.                                   (Note : 1] provider = JsonRpcProvider()   ----> i) Used to create reference to smart contract.
                                                                                                                                                          ii) This reference is used to call the function which does not cost money.
                                                                                                                                                         iii) Simple "Calling a function" and not a "Transction"
                                                                                                                                                          iv) Example :- loadNFTs() inside "index.js"
                                                                                                                   2] provider = Web3Modal()         
                                                                                                                      signer = provider.getSigner()  ----> i)  Used to create reference to smart contract.
                                                                                                                                                          ii)  This reference is used to call the function which do cost money.
                                                                                                                                                         iii)  Means to perform a "Trasaction" and not just "Calling a function".
                                                                                                                                                          iv)  Example :- createSale() inside "create-item.js"                                                                         )
  
  Step 2 : NFT Contract : It is used for creating a NFT.
      i] Create reference to NFT contract with the help of 'address' , 'abi' , 'signer'.
     ii] Call the 'createToken(url)' function by passing the metadata url.
    iii] Wait till the transaction is processed.
     iv] Extract 'tokenId' from the returned object.
      v] Extract 'price' from our "formInput" state. This is the price of the NFT set by the user.

  Step 3 : NFT Market Contract : It is used to create a Market Item from the above created NFT.
     i] Create reference to NFT Market Contract with the help of 'address' , 'abi' , 'signer'.
    ii] Call "getListingPrice()" to fectch the "Listing Price" from the contract. 
   iii] Call "createMarketItem(nftaddress, tokenId, price, listingPrice)" 
    iv] It takes 4 arguments which are "Address of NFT Contract", "Token Id fetched above", "Price fetched above", "Listing Price fetched above".
     v] Wait till the transaction is processed.

  Step 4 : Finally redirect the user to the home page.

  
                                                                                                                                                          */



/*

Notes :-

1] import { create as ipfsHttpClient } from "ipfs-http-client"
--> Way for us to interact with IPFS for uploading and downloading files.

2] import { useRouter } from "next/router"
--> It the hook from next/router. It allows us to programmatically route to different routes.

*/