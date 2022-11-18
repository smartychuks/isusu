import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Contract, providers, utils } from "ethers";
import React, { useRef, useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ISUSU_CONTRACT_ABI, ISUSU_CONTRACT_ADDRESS} from "../constants/index.js";

export default function Home() {

    const [walletConnected, setWalletConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [connectedAddress, setConnectedAddress] = useState("");
    const [addressBalance, setAddressBalance] = useState(0);
    const [depositAmount, setDepositAmount] = useState(0);
    const [withdrawDate, setWithdrawDate] = useState();
    const [unixWithdrawDate, setUnixWithdrawDate] = useState();
    const [extendTime, setExtendTime] = useState();
    const web3ModalRef = useRef();

    const connectWallet = async() => {
      try {
        await getProviderOrSigner();
        setWalletConnected(true);
      } catch (error) {
        console.error(error);
      }
    }

    const getProviderOrSigner = async (needSigner = false) => {
      // Connect to metamask
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      // Check if user is connected to mumbai network
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 80001) {
        window.alert("Please switch to Mumbai");
        throw new Error("Change Network to Mumbai");
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        console.log("signer");
        return signer;
      }
      console.log("provider");
      return web3Provider;
    };

    // Use Effect to react to changes in the state of the website
    useEffect(() => {
      if(!walletConnected){
        web3ModalRef.current = new Web3Modal({
          network: "mumbai",
          providerOptions: {},
          disableInjectedProvider: false,
        });

        connectWallet()
      }
    }, [walletConnected]);

    // Function to get the Balance
    const getBalance = async ()=>{
      try {
        const signer = await getProviderOrSigner(true);
        const address = await signer.getAddress();
        setConnectedAddress(address);
        // Create an instance of the contract
        const isusuContract = new Contract(ISUSU_CONTRACT_ADDRESS, ISUSU_CONTRACT_ABI, signer);
        let bal;
        bal = await isusuContract.getBalances();
        bal = utils.formatEther(bal);
        setAddressBalance(bal);
        return addressBalance;
      } catch (error) {
        console.error(error);
      }
    };

    // function to transfer tokenss to contract
    const deposit = async () => {
      try {
        const signer = await getProviderOrSigner(true);
        console.log("before isusu instance");
        const isusuContract = new Contract(ISUSU_CONTRACT_ADDRESS, ISUSU_CONTRACT_ABI, signer);
        console.log("After isusuContract");
        let add = await isusuContract.deposit({value: depositAmount});    
        setLoading(true);
        await add.wait();
        await getBalance();
        await getLockTime();
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }

    // function to send tokens to user
    const withdraw = async()=>{
      try {
        // Check if time to withdraw has reached
        if(unixWithdrawDate > Date.now()/1000){
          alert("ERROR ! ! ! You can only withdraw after", {withdrawDate});
        }else{
          const signer = await getProviderOrSigner(true);
          const isusuContract = new Contract(ISUSU_CONTRACT_ADDRESS, ISUSU_CONTRACT_ABI, signer);
          let withdraw = await isusuContract.withdraw();
          setLoading(true);
          await withdraw.wait();
          setWithdrawDate("Not Available");
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
      }
    }

    // function to get that sets the widrawal date
    const getLockTime = async()=>{
      try {
        const signer = await getProviderOrSigner(true);
        const isusuContract = new Contract(ISUSU_CONTRACT_ADDRESS, ISUSU_CONTRACT_ABI, signer);

        let withdrawalDate = await isusuContract.getLockTime();
        setUnixWithdrawDate(withdrawalDate.toString());
        withdrawalDate = new Date (withdrawalDate * 1000);
        setWithdrawDate(withdrawalDate.toString());
      } catch (error) {
        console.error(error);
      }
    }

    // Function to increase the time which the user wants to withdraw tokens
    const increaseLockTime = async()=>{
      try {
        const signer = getProviderOrSigner(true);
        const isusuContract = new Contract(ISUSU_CONTRACT_ADDRESS, ISUSU_CONTRACT_ABI, signer);
        let newDate = extendTime.toString(); 
        newDate = new Date(newDate).getTime()/1000;
        if (newDate - unixWithdrawDate < 0){
          alert("The extended time must be further ahead of previous Date");
        }else{
          newDate = newDate - unixWithdrawDate;
          const increaseTime = await isusuContract.increaseLockTime(newDate);
          setLoading(true);
          await increaseTime.wait();
          await getLockTime()
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
      }
    }

    // function to disconnect wallet
    const onDisconnect = async () => {
      try {
        await web3ModalRef.current.clearCachedProvider();
        const provider = await getProviderOrSigner();
        provider = await web3ModalRef.current.clearCachedProvider();
        setWalletConnected(false);
        console.log("Disconnected");
  
      } catch (err) {
        console.error(err);
      }
    };

    // function that displays loading animation
    const isLoading = () => (
      <div className={styles.loading}>
        <h6 className={styles.description}>This may take few seconds :)</h6>
      </div>
    )

    // Function that renders content after wallet is connected
    const renderConnect = () => {
      if(walletConnected && !loading) {
        return(
          <div>                  
            <div className={styles.description}>
              <strong>Wallet Address Connected:</strong> {connectedAddress}
              <br/>
              <strong> Total Amount Locked:</strong> {addressBalance}
              <br/>
              <strong> Unlock Date</strong> {withdrawDate}
              <br/>
              <label>
                Deposit:    
                <input id= "deposit" type="number" placeholder="Amount of MATIC"
                  onChange={(e) => setDepositAmount(utils.parseEther(e.target.value || "0"))}
                  className={styles.input}
                />
                <button className={styles.button} onClick={deposit}>
                  Lock It Up 💸
                </button>
              </label>
              <br/>
              <label> 
                Extend Unlock Date:
                <input type="datetime-local" id="withdrawalTime" className={styles.input}
                  onChange={(e) => setExtendTime(e.target.value || "0")}
                />
                <button className={styles.button} onClick={increaseLockTime}>
                  Increase unlock
                </button>
              </label>
            </div>
            <button className={styles.button} onClick={withdraw}>
              Unlock my Isusu
            </button>
            <div>
              <button onClick={onDisconnect} className={styles.button}>
              Disconnect Wallet
              </button>
            </div>
          </div>
        )
      }
    }

    // content to render if wallet not connected or wallet is disconnected
    const renderOnDisconnect = () => (
      <button onClick={connectWallet} className={styles.button}>
        Connect Wallet
      </button>
    );

    return(
      <div>
        <Head>
          <title>Isusu</title>
          <meta name="description" content="TimeLock" />
          <link rel="icon" href="#" />
        </Head>
        <div className={styles.main}>
          <div className={styles.body}>
            <h1 className={styles.title}>Isusu</h1>
            
          </div>
          <div className={styles.description}>
            Lock your MATIC in the Isusu to aid you to hodl
          </div>
          <div className={styles.description}>
            Coins are locked for a minimum of 1 minute, too soon? You can HODL longer using isusu
          </div>
          <div className={styles.description}>
            {walletConnected ? renderConnect() : renderOnDisconnect()}
            <div>
              <br /><br /><br />
              {loading == true ? isLoading() : null}
            </div>

          </div>

          <footer className={styles.footer}>
            Made with &#10084; by <a href="https://twitter.com/goldenchuks4" target = "_blank" rel="noreferrer"> @iSmarty</a>
          </footer>
        </div>
      </div>
    );

  }
