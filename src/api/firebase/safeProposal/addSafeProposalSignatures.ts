import firebase from "firebase"
import {SafeProposalState} from "../../../types/safeProposal"
import {SafeSignature} from "../../ethers/functions/gnosisSafe/safeUtils"

const {REACT_APP_CLOUD_FUNCTIONS_URL} = process.env

const addSafeProposalSignatures = async ({
	proposalId,
	signature,
	signatureStep2,
	newState
}: {
	proposalId: string
	signature: SafeSignature
	signatureStep2?: SafeSignature
	newState?: SafeProposalState
}): Promise<void> => {
	const token = await firebase.auth().currentUser?.getIdToken(true)
	if (!token) {
		throw new Error("Not authorized in firebase")
	}
	const res = await fetch(`${REACT_APP_CLOUD_FUNCTIONS_URL}/addSafeProposalSignatures`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			proposalId,
			signature,
			...(signatureStep2 ? {signatureStep2} : {}),
			...(newState ? {newState} : {})
		})
	})
	if (res.status !== 200) {
		throw new Error("Failed to add safe proposal signatures")
	}
}

export default addSafeProposalSignatures
