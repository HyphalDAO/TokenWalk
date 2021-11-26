import getUser from "../api/firebase/user/getUser"
import EthersContext from "./EthersContext"
import {BigNumberish} from "@ethersproject/bignumber"
import {Web3Provider} from "@ethersproject/providers"
import firebase from "firebase"
import decode from "jwt-decode"
import {createContext, useContext, useEffect, useState} from "react"

const {REACT_APP_CLOUD_FUNCTIONS_URL} = process.env

type AuthContext = {
	account: string | null
	balance: BigNumberish | null
	url: string | null
	connectWallet: () => void
	connected: boolean
	disconnect: () => void
	connecting: boolean
}

export const useAuth = (): AuthContext => {
	const [account, setAccount] = useState<string | null>(null)
	const [balance, setBalance] = useState<BigNumberish | null>(null)
	const [connected, setConnected] = useState(false)
	const [connecting, setConnecting] = useState(false)
	const {signer} = useContext(EthersContext)
	const [url, setUrl] = useState<string | null>(null)
	useEffect(() => {
		if (account) {
			getUser(account).then(user => {
				if (user?.url) {
					setUrl(user.url)
				}
			})
			signer?.getBalance().then(_balance => setBalance(_balance))
		}
	}, [account])

	const init = async () => {
		const metamaskProvider = new Web3Provider(window.ethereum)
		const accounts = await metamaskProvider.listAccounts()
		if (accounts[0]) {
			setAccount(accounts[0].toLowerCase())
		}
	}
	useEffect(() => {
		if (window.ethereum) {
			init()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [window.ethereum])

	const connectWallet = async () => {
		if (!signer) {
			window.open("https://metamask.io/", "blank")
			return
		}
		setConnecting(true)
		try {
			let currentAccount: string
			if (account) {
				currentAccount = account
			} else {
				const metamaskAccounts = await window.ethereum.request({method: "eth_requestAccounts"})
				setAccount(metamaskAccounts[0].toLowerCase())
				currentAccount = metamaskAccounts[0].toLowerCase()
			}
			const signature = await signer.signMessage(
				JSON.stringify({account: currentAccount, token: "tokenwalk"})
			)
			const res = await fetch(`${REACT_APP_CLOUD_FUNCTIONS_URL}/auth`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					account: currentAccount,
					token: "tokenwalk",
					signature
				})
			})
			const json = await res.json()
			localStorage.setItem("hyphal_at", json.token)
			await firebase.auth().signInWithCustomToken(json.token)
			setConnected(true)
		} catch (e) {
			console.error(e)
		}
		setConnecting(false)
	}

	const checkToken = async () => {
		const token = localStorage.getItem("hyphal_at")
		if (token) {
			try {
				const {exp} = decode<{exp: number}>(token)
				if (exp * 1000 - new Date().getTime() > 10) {
					await firebase.auth().signInWithCustomToken(token)
					setConnected(true)
				}
			} catch (e) {
				// do nothing
			}
		}
	}
	useEffect(() => {
		checkToken()
	}, [])

	const disconnect = () => {
		localStorage.removeItem("hyphal_at")
		setConnected(false)
	}

	return {
		account,
		balance,
		url,
		connected,
		connectWallet,
		disconnect,
		connecting
	}
}

export const AuthContext = createContext<AuthContext>({} as unknown as AuthContext)
