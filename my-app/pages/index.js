import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import Web3Modal from "web3modal"
import styles from '../styles/Home.module.css'
import { useEffect, useRef, useState } from 'react'
import { ABI, CryptoDevsContractAddress } from '../constant'
import { ethers, utils } from "ethers";
import{providers} from "ethers"
import { getJsonWalletAddress } from 'ethers/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [loading, setLoading] = useState(false);

  const [walletConnected, setWalletConnected] = useState(false);
  
  const [presaleStarted, setPresaleStarted] = useState(false);

  const [presaleEnded, setPresaleEnded] = useState(false);

  const [isOwner, setIsOwner] = useState(false);

  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");


  const web3ModalRef = useRef();


/**
 * presaleMint-minting during presale
 * 
 */
const presaleMint=async()=>{
  try {

    const signer=await getProviderOrSigner(true);
    const nftContract=new ethers.Contract(CryptoDevsContractAddress,ABI,signer);

    const trasactionResponse=await nftContract.presaleMint({
      value: utils.parseEther("0.01"),
    })
    setLoading(true);
    await trasactionResponse.wait();
    setLoading(false);

window.alert("You successfully minted a Crypto Dev!")
    
  } catch (error) {
    console.log(error);
  }
}

/**
 * public mint=> when presalmint is closed anyone can mint so here we go
 */

const publicMint=async()=>{
  try {
    const signer=await getProviderOrSigner(true);
    const nftContract=new ethers.Contract(CryptoDevsContractAddress,ABI,signer);
    const transctionResponse=await nftContract.mint({
      value:utils.parseEther("0.01"),
    });
    setLoading(true);
    await transctionResponse.wait();
    setLoading(false);
    window.alert("You successfully minted a Crypto Dev!")
    
  } catch (error) {
    console.log(error);
  }
}
/**
 * GetPrivoder or signer for making fucntion calls
 */
const getProviderOrSigner=async(needSigner=true)=>{
  const provider=await web3ModalRef.current.connect();
  const web3Provider=new providers.Web3Provider(provider);
  const {chainId}=await web3Provider.getNetwork();
  if(chainId!==5){
    window.alert("Change the network to Goelri");
    throw new Error("Change network to Goerli");
  }
  if(needSigner){
    const signer=web3Provider.getSigner();
    return signer;
  }
  return web3Provider;
}
  
/**
 * connnect wallet or give alert for connecting wallet
 */

const connectWallet=async()=>{
  try {
    await getProviderOrSigner();
    setWalletConnected(true);
    
  } catch (error) {
    console.log(error);
  }

}

/**
 * startPresale=> make the bool true to start the presale and it will clascl
 */

const startPresale=async()=>{
  try {
    const signer=await getProviderOrSigner(true);
    const nftContract=new ethers.Contract(CryptoDevsContractAddress,ABI,signer);

    const trasactionResponse=await nftContract.startPresale();
    setLoading(true);
    await trasactionResponse.wait();
    setLoading(false);
    await checkIfPresaleStarted();
  } catch (error) {
    console.log(error);
  }
}


/**
 * @dev checkIfPresaleStarted- checks if the presale has started by quering thr presalestarted
 */

const checkIfPresaleStarted=async()=>{
  try {
    const provider= await getProviderOrSigner();
    const nftContract=new ethers.Contract(CryptoDevsContractAddress,ABI,provider);
    const _presaleStarted=await nftContract.presaleStarted();
    if(!_presaleStarted){
      await getOwner();
    }
    setPresaleStarted(_presaleStarted);
    return _presaleStarted;
    
  } catch (error) {
    console.log(error);
    return false;
  }
};
 
/**
 * @dev checkIfPresaleEnded - checks if the presale has ended by quering presaleEnded from the contract
 * 
 */
const checkIfPresaleEnded=async()=>{
  try {
    const provider=await getProviderOrSigner();
    const nftContract=new ethers.Contract(CryptoDevsContractAddress,ABI,provider);

    const _presaleEnded=await nftContract.presaleEnded();
    // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      
      const hasEnded=_presaleEnded.lt(Math.floor(Date.now()/1000));
      if(hasEnded){
        setPresaleEnded(true)
      }else{
           setPresaleEnded(false); 
      }
    return hasEnded;
  } catch (error) {
    console.log(error);
return false;
  }
}
/**
 * @dev calls the contract to retrieve the ownwer
 * 
 */
const getOwner=async()=>{
  try {
    
  const provider=await getProviderOrSigner();
  const nftContract=new ethers.Contract(CryptoDevsContractAddress,ABI,provider);
  const _owner=await nftContract.owner()
  const signer=await getProviderOrSigner(true);
  const address=await signer.getAddress();
  if(address.toLowerCase()===_owner.toLowerCase()){
    setIsOwner(true);
  }
  } catch (error) {
    console.log(error);
  }
}
/**
 * @dev getTokenIdsMinted= gets the number of tokenIds that have minted 
 */
const getTokenIdsMinted=async()=>{
  try {

    const provider=await getProviderOrSigner();
    const nftContract=new ethers.Contract(CryptoDevsContractAddress,ABI,provider);

    const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());


    
  } catch (error) {
    console.log(error);

  }

}

useEffect(()=>{
  if(!walletConnected){
    web3ModalRef.current=new Web3Modal({
      network:"goerli",
      providerOptions:{},
      disableInjectedProvider:false,
    });
    connectWallet();
    //check if presale has started/Ended
    const _presaleStarted=checkIfPresaleStarted();
    if(_presaleStarted){
      checkIfPresaleEnded();
    }
    getTokenIdsMinted();

    //set an interval which gets called every 5 seconds to check presale has ended
    const presaleEndedInterval=setInterval(async()=>{
      const _presaleStarted=await checkIfPresaleStarted();
      if(_presaleStarted){
        const _presaleEnded=await checkIfPresaleEnded();
        if(_presaleEnded){
          clearInterval(presaleEndedInterval);
        }
      }
    },5*1000);
    setInterval(async() => {
      await getTokenIdsMinted();
    }, 5*1000);
  }
},[walletConnected]);
/**
 * renderButton returns a button based on the stae of the dapp
 */
const renderButton=()=>{
  if(!walletConnected){
    return(
      <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
    )
  }
  //if loading return the Loading Button
  if(loading){
    return <button className={styles.button}>Loading...</button>;

  }
  //if connected user is the owner and presale hasn't started yet,allow them to start presale
  if (isOwner && !presaleStarted) {
    return (
      <button className={styles.button} onClick={startPresale}>
        Start Presale!
      </button>
    );
  }
   // If connected user is not the owner but presale hasn't started yet, tell them that
   if (!presaleStarted) {
    return (
      <div>
        <div className={styles.description}>Presale hasnt started!</div>
      </div>
    );
  }
  // If presale started, but hasn't ended yet, allow for minting during the presale period
  if (presaleStarted && !presaleEnded) {
    return (
      <div>
        <div className={styles.description}>
          Presale has started!!! If your address is whitelisted, Mint a Crypto
          Dev 🥳
        </div>
        <button className={styles.button} onClick={presaleMint}>
          Presale Mint 🚀
        </button>
      </div>
    );
  }
  if (presaleStarted && presaleEnded) {
    return (
      <button className={styles.button} onClick={publicMint}>
        Public Mint 🚀
      </button>
    );
  }
};


  return (
<div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Tripathi
      </footer>
    </div>
  );
}