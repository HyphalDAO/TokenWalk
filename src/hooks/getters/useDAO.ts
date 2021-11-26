import {useContext, useEffect, useState} from "react"
import {getStrategies} from "../../api/ethers/functions/Usul/usulUtils"
import getOwners from "../../api/ethers/functions/gnosisSafe/getOwners"
import getVotingThreshold from "../../api/ethers/functions/gnosisSafe/getVotingThreshold"
import getDAO from "../../api/firebase/DAO/getDAO"
import EthersContext from "../../context/EthersContext"
import {DAO} from "../../types/DAO"

const useDAO = (
	gnosisAddress: string
): {
	dao: DAO | null
	loading: boolean
	error: boolean
	refetch: () => Promise<void>
} => {
	const [dao, setDao] = useState<DAO | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(false)
	const {provider} = useContext(EthersContext)

	const getInfo = async () => {
		setLoading(true)
		setError(false)
		try {
			const _dao = await getDAO(gnosisAddress)
			const gnosisVotingThreshold = await getVotingThreshold(gnosisAddress, provider)
			const owners = await getOwners(gnosisAddress, provider)
			const strategies = _dao.usulAddress ? await getStrategies(_dao.usulAddress, provider) : []
			const tokenSymbol = ""
			const balance = 0
			const fundedProjects = 0
			// TODO
			// if (_dao.tokenAddress && _dao.daoAddress) {
			// 	;[tokenSymbol, balance, fundedProjects] = await Promise.all([
			// 		getERC20Symbol(_dao.tokenAddress, provider),
			// 		getERC20HouseDAOBalance(_dao.daoAddress, provider),
			// 		getERC20HouseDAOFundedProjects(_dao.daoAddress, provider)
			// 	])
			// }
			setDao({
				..._dao,
				tokenSymbol,
				balance,
				fundedProjects,
				gnosisVotingThreshold,
				owners,
				strategies
			})
		} catch (e) {
			console.error(e)
			setError(true)
		}
		setLoading(false)
	}

	useEffect(() => {
		getInfo()
	}, [gnosisAddress])

	return {
		dao,
		loading,
		error,
		refetch: getInfo
	}
}

export default useDAO
