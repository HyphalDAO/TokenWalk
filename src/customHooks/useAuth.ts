import {createContext, useEffect, useState} from "react"
import Web3 from "web3"
import decode from "jwt-decode"
const {REACT_APP_CLOUD_FUNCTIONS_URL} = process.env

type AuthContext = {
	account: string | null
	signIn: () => void
	isLoggedIn: boolean
	signOut: () => void
}

export const useAuth = (): AuthContext => {
	const [account, setAccount] = useState<string | null>(null)
	const [isLoggedIn, setIsLoggedIn] = useState(false)

	const getAccount = async () => {
		window.web3 = new Web3(window.ethereum)
		const accounts = await window.ethereum.request({method: "eth_requestAccounts"})
		if (accounts[0]) {
			setAccount(accounts[0])
		}
	}
	useEffect(() => {
		if (window.ethereum) {
			getAccount()
		}
	}, [window.ethereum])

	const checkToken = () => {
		const token = localStorage.getItem("tokenwalk_at")
		if (token) {
			try {
				const {exp} = decode<{exp: number}>(token)
				if (exp * 1000 - new Date().getTime() > 10) {
					setIsLoggedIn(true)
				}
			} catch (e) {
				// do nothing
			}
		}
	}
	useEffect(checkToken, [])

	const signIn = async () => {
		if (!account) return
		const signature = await window.web3.eth.personal.sign(JSON.stringify({account, token: "tokenwalk"}), account)
		try {
			const res = await fetch(`${REACT_APP_CLOUD_FUNCTIONS_URL}/auth`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					account: account,
					token: "tokenwalk",
					signature
				})
			})
			const json = await res.json()
			localStorage.setItem("tokenwalk_at", json.token)
			setIsLoggedIn(true)
		} catch (e) {
			console.error(e)
		}
	}

	const signOut = () => {
		localStorage.removeItem("tokenwalk_at")
		setIsLoggedIn(false)
	}

	return {
		account,
		signIn,
		isLoggedIn,
		signOut
	}
}

export const AuthContext = createContext<AuthContext>(({} as unknown) as AuthContext)
