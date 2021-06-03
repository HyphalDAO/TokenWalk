export type DAOMemberRole = "member" | "admin" | "contributor" | "head"

export type DAODecisionMakingSpeed = "slow" | "medium" | "fast"

export type DAOVotingThreshold = "low" | "medium" | "high"

export type HouseDAOTokenType = "ERC20" | "NFT"

export type Member = {
	address: string
	role: DAOMemberRole
	memberSince?: string
}

export type DAO = {
	type: "gallery" | "house"
	houseTokenType?: HouseDAOTokenType
	name: string
	symbol: string
	totalSupply: number
	members: Member[]
	decisionMakingSpeed: DAODecisionMakingSpeed
	votingThreshold: DAOVotingThreshold
	roles: {
		member: boolean
		admin: boolean
		contributor: boolean
	}
	tax: number
}