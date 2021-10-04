import "../styles/globals.css";
import Link from "next/link";

import {useState,useEffect} from 'react';

function MyApp({ Component, pageProps }) {

  const [metamask, setMetamask] = useState(true);

  async function connectMetamask() {
       if (typeof window.ethereum !== 'undefined') {                                                
       const accounts = await ethereum.request({ method: 'eth_requestAccounts' });                  // Request for connecting with Metamask.
       console.log(accounts[0]);
       }
       else{
        setMetamask(false);
       }
  }

  if(!metamask){
    return(
      <h1>Please Install Metamask!!!</h1>
    )
  }

  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Kalachain Marketplace</p>
        <div className="text-4xl font-bold">
        <button className = "absolute top-0 right-0 h-16 w-18 ..." onClick = {connectMetamask}>Connect</button>
        </div>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-pink-500">Home</a>
          </Link>
          <Link href="/create-item">
            <a className="mr-6 text-pink-500">Sell Digital Asset</a>
          </Link>
          <Link href="/my-assets">
            <a className="mr-6 text-pink-500">My Digital Assets</a>
          </Link>
          <Link href="/creator-dashboard">
            <a className="mr-6 text-pink-500">Creator Dashboard</a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;

/*
Note : 1]Most of the time, this file is used for layout and navigation.
       2]Here Tailwind CSS is used.
*/
