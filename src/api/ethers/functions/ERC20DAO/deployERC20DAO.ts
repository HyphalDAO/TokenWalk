import HouseTokenDAO from "../../abis/HouseTokenDAO.json"
import {JsonRpcSigner, JsonRpcProvider} from "@ethersproject/providers"
import {ContractFactory} from "@ethersproject/contracts"
import {parseEther} from "@ethersproject/units"
import approveERC20 from "../ERC20Token/approveERC20"
import initERC20DAO from "./initERC20DAO"
const {REACT_APP_WETH_ADDRESS} = process.env

const deployERC20DAO = async (
	name: string,
	headsOfHouse: string[],
	governanceToken: string,
	proposalSpeed: number,
	governanceTokenSupply: number,
	votingThreshold: number,
	minProposalAmount: number,
	provider: JsonRpcProvider,
	signer: JsonRpcSigner
): Promise<string> => {
	const dao = new ContractFactory(HouseTokenDAO.abi, HouseTokenDAO.bytecode, signer)
	const contract = await dao.deploy(
		headsOfHouse,
		governanceToken,
		proposalSpeed,
		parseEther(String(governanceTokenSupply)),
		parseEther(String(votingThreshold)),
		parseEther(String(minProposalAmount)),
		REACT_APP_WETH_ADDRESS
	)
	await contract.deployed()
	// TODO if(governanceTokenSupply > O) {
	await approveERC20(governanceToken, contract.address, governanceTokenSupply, provider, signer)
	await initERC20DAO(contract.address, provider, signer)
	// }

	return contract.address
}

export default deployERC20DAO
