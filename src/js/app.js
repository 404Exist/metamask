import MetaMaskOnboarding from '@metamask/onboarding';
import { ethers } from 'ethers';
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"
import "../app.css";
const { origin, host, pathname } = window.location;
const initialize = async () => {
  const onboardButton = document.getElementById('connectBtn');
  const walletAddressEl = document.getElementById('walletAddress');
  const input = document.getElementById('mintnumber');
  const plusEl = document.getElementById('plus');
  const minusEl = document.getElementById('minus');
  const maxEl = document.getElementById('max');
  const costEl = document.getElementById('cost');
  const dateEl = document.getElementById('date');
  const toalEl = document.getElementById('total');
  const onboarding = new MetaMaskOnboarding({ origin });
  
  const setup = () => {
    maxEl.innerText = MAX;
    costEl.innerText = COST;
    toalEl.innerText = parseFloat(COST).toFixed(1);
    dateEl.innerText = formatedDate();
  }

  const formatedDate = () => {
    const formatNumber = num => num < 10 ? `0${num}` : num;
    let date = new Date(),
      fullYear = date.getFullYear(),
      month = formatNumber(date.getMonth() + 1),
      day = formatNumber(date.getDate());
    return `${month}/${day}/${fullYear}`;
  }
  const isMetaMaskInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };
  let accounts = [];

  if (isMetaMaskInstalled()) {
    accounts = await ethereum.request({ method: 'eth_accounts' });
    ethereum.on('accountsChanged', (newAccounts) => {
      accounts = newAccounts;
      MetaMaskClientCheck();
    });
  }
  const onClickInstall = () => {
    if (isMobileDevice()) {
      window.location.href = `https://metamask.app.link/dapp/${host}${pathname}`;
    } else {
      onboardButton.innerText = 'Onboarding in progress';
      onboardButton.disabled = true;
      onboarding.startOnboarding();
    }
  };

  const onClickConnect = async () => {
    isLoading(true);
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
      notify({
        text: `Your wallet has been connected successfully...`,
        destination: ''
      });
    } catch (error) {
      notify({
        text: error.message,
        destination: '',
        background: "linear-gradient(to right, rgb(176 0 0), rgb(201 61 61))"
      });
    }
    isLoading(false);
  };

  const MetaMaskClientCheck = async () => {
    walletAddressEl.innerText = '';
    walletAddressEl.title = '';
    if (!isMetaMaskInstalled()) {
      onboardButton.innerText = 'Click here to install MetaMask!';
      onboardButton.onclick = onClickInstall;
      onboardButton.disabled = false;
    } else {
      if (accounts[0]) {
        walletAddressEl.innerText = shortenAddress(accounts[0]);
        walletAddressEl.title = accounts[0];
        onboardButton.innerText = 'Send';
        onboardButton.onclick = sendTransaction;
        onboardButton.disabled = false;
      } else {
        onboardButton.innerText = 'Connect Metamask Wallet';
        onboardButton.onclick = onClickConnect;
        onboardButton.disabled = false;
      }
    }
  };

  const sendTransaction = () => {
    isLoading(true);
    ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: accounts[0],
          to: WALLET_ADDRESS,
          value: parseEther(nftToEth(input.value)),
          gas: '0x5208',
        },
      ],
    })
    .then((txHash) => {
      notify({
        text: `Click here to check out your transaction on Etherscan: https://ropsten.etherscan.io/tx/${txHash}`,
        destination: `https://ropsten.etherscan.io/tx/${txHash}`,
        newWindow: true
      });
      isLoading(false);
    })
    .catch((error) => {
      notify({
        text: error.message,
        destination: '',
        background: "linear-gradient(to right, rgb(176 0 0), rgb(201 61 61))"
      });
      isLoading(false);
    });
  }

  const isLoading = isLoading => {
    if (isLoading) {
      onboardButton.innerHTML += `
        <div id="loader" class="flex justify-center items-center mx-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700" />
        </div>
      `;
    } else {
      onboardButton.querySelector('#loader')?.remove();
    }
    onboardButton.disabled = isLoading;
    plusEl.disabled = isLoading;
    minusEl.disabled = isLoading;
  }
  
  const notify = ({text, duration = 10000, position = "center", background = "linear-gradient(to right, #00b09b, #96c93d)", destination, newWindow = false}) => {
    Toastify({
      text, duration,  destination, newWindow, position, stopOnFocus: true, close: true,
      style: {
        background,
      }
    }).showToast();
  }

  const parseEther = amount => ethers.utils.parseEther(amount.toString())._hex;
  const nftToEth = value => parseFloat((value * parseFloat(COST)).toFixed(10));
  const shortenAddress = address => `${address.slice(0, 8)}...${address.slice(address.length - 10)}`;

  input.addEventListener('keyup', (e) => {
    changeAmount(e.target.value);
  });
  input.addEventListener('change', (e) => {
    changeAmount(e.target.value);
  });
  plusEl.addEventListener('click', () => {
    changeAmount(parseInt(input.value) + 1);
  });
  minusEl.addEventListener('click', () => {
    changeAmount(parseInt(input.value) - 1);
  });

  const changeAmount = (newval) => {
    newval = parseInt(newval);
    if (isNaN(newval) || newval <= 1) newval = 1
    if (newval >= MAX) newval = MAX;
    input.value = newval;
    toalEl.innerText = nftToEth(input.value);
    return newval;
  }

  const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  MetaMaskClientCheck();
  setup();
};

window.addEventListener('DOMContentLoaded', initialize);