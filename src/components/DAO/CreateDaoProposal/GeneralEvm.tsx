import {isAddress} from "@ethersproject/address"
import {ChangeEvent, Fragment, FunctionComponent, useEffect, useState} from "react"
import fetchContractAbi from "../../../api/etherscan/fetchContractAbi"
import {Abi, AbiFunction} from "../../../types/abi"
import {validateArgument} from "../../../utlls"
import ArrayInput from "../../Controls/ArrayInput"
import Button from "../../Controls/Button"
import Input from "../../Controls/Input"
import Select from "../../Controls/Select"
import Textarea from "../../Controls/Textarea"
import {toastWarning} from "../../UI/Toast"

const GeneralEvm: FunctionComponent<{
	buttonDisabled: boolean
	processing: boolean
	onSubmit: (
		address: string,
		contractMethods: AbiFunction[],
		selectedMethodIndex: number,
		args: (string | string[])[]
	) => void
}> = ({buttonDisabled, processing, onSubmit}) => {
	const [address, setAddress] = useState("")
	const [addressBad, setAddressBad] = useState(false)

	const [abiString, setAbiString] = useState("")
	const [abiBad, setAbiBad] = useState(false)
	const [fetchingAbi, setFetchingAbi] = useState(false)
	const [contractMethods, setContractMethods] = useState<AbiFunction[]>([])
	useEffect(() => {
		if (abiString) {
			try {
				const abi: Abi = JSON.parse(abiString)
				const functions = abi.filter(
					f => f.type === "function" && ["payable", "nonpayable"].includes(f.stateMutability)
				) as AbiFunction[]
				setContractMethods(functions)
				setAbiBad(false)
			} catch (e) {
				setAbiBad(true)
				setContractMethods([])
				setSelectedMethodIndex(null)
			}
		} else {
			setAbiBad(false)
		}
	}, [abiString])

	const [selectedMethodIndex, setSelectedMethodIndex] = useState<number | null>(null)
	const [args, setArgs] = useState<Array<string | string[]>>([])
	const [argsBad, setArgsBad] = useState<boolean[]>([])
	useEffect(() => {
		if (selectedMethodIndex != null) {
			setArgs(
				contractMethods[selectedMethodIndex].inputs.map(input =>
					input.type.endsWith("[]") ? [] : ""
				)
			)
			setArgsBad(contractMethods[selectedMethodIndex].inputs.map(() => false))
		} else {
			setArgs([])
			setArgsBad([])
		}
	}, [selectedMethodIndex, contractMethods])

	const handleAddressChange = async (e: ChangeEvent<HTMLInputElement>) => {
		setAddress(e.target.value)
		setAddressBad(!!(e.target.value && !isAddress(e.target.value)))
		if (isAddress(e.target.value)) {
			setFetchingAbi(true)
			try {
				const abi = await fetchContractAbi(e.target.value)
				setAbiString(abi)
			} catch (err) {
				console.error(err)
				toastWarning("Could not get contract ABI")
			}
			setFetchingAbi(false)
		}
	}

	const handleArrayArgumentRemove = (indexToRemove: number, argIndex: number) => {
		if (selectedMethodIndex == null) return
		setArgs(prevState =>
			prevState.map((item, index) =>
				argIndex === index && item instanceof Array
					? item.filter((option, optionIndex) => optionIndex !== indexToRemove)
					: item
			)
		)
	}

	const handleArrayArgumentAdd = (value: string, index: number) => {
		if (selectedMethodIndex == null) return
		setArgs(prevState =>
			prevState.map((item, idx) =>
				idx === index && item instanceof Array ? [...item, value] : item
			)
		)
	}

	const handleArgumentChange = (value: string, index: number) => {
		if (selectedMethodIndex == null) return
		setArgs(prevState => prevState.map((item, idx) => (idx === index ? value : item)))
		setArgsBad(prevState =>
			prevState.map((item, idx) =>
				idx === index
					? !validateArgument(value, contractMethods[selectedMethodIndex].inputs[index].type)
					: item
			)
		)
	}

	const handleSubmit = () => {
		if (!address || selectedMethodIndex == null) return
		onSubmit(address, contractMethods, selectedMethodIndex, args)
	}

	const submitButtonDisabled =
		buttonDisabled ||
		!address ||
		addressBad ||
		!abiString ||
		abiBad ||
		selectedMethodIndex == null ||
		!args.reduce((acc, cur) => acc && !!cur, true) ||
		argsBad.reduce((acc, cur) => acc && cur, true)

	return (
		<>
			<label htmlFor="general-evm-address">Contract Address</label>
			<Input
				id="general-evm-address"
				value={address}
				onChange={handleAddressChange}
				validation={addressBad ? "Not a valid address" : null}
			/>
			{fetchingAbi && <p>TODO: fetching ABI...</p>}
			<label htmlFor="general-evm-abi">ABI</label>
			<Textarea
				value={abiString}
				onChange={e => {
					setAbiString(e.target.value)
				}}
				validation={abiBad ? "ABI is malformed" : null}
			/>
			{abiString && !abiBad && (
				<>
					<label>Select Method</label>
					<Select<number>
						placeholder="Choose One"
						value={selectedMethodIndex ?? null}
						options={contractMethods.map((method, index) => ({
							name: method.name,
							value: index
						}))}
						onChange={newSelectedMethodIndex => {
							setSelectedMethodIndex(newSelectedMethodIndex ?? null)
						}}
						fullWidth
					/>
					{selectedMethodIndex != null && (
						<>
							{contractMethods[selectedMethodIndex].inputs.map((input, index) => (
								<Fragment key={index}>
									<label>{`${input.name} (${input.type})`}</label>
									{input.type.endsWith("[]") ? (
										<ArrayInput
											onRemove={(indexToRemove: number) => {
												handleArrayArgumentRemove(indexToRemove, index)
											}}
											onAdd={(newValue: string) => {
												handleArrayArgumentAdd(newValue, index)
											}}
											items={(args.find((arg, idx) => idx === index) as string[]) || []}
											validator={(value: string) =>
												validateArgument([value], input.type)
													? null
													: `Bad value for type ${input.type}`
											}
										/>
									) : input.type === "bool" ? (
										<Select<string>
											placeholder="Select value"
											fullWidth
											options={[
												{name: "true", value: "true"},
												{name: "false", value: "false"}
											]}
											value={(args[index] as string) ?? ""}
											onChange={newValue => {
												handleArgumentChange(newValue, index)
											}}
										/>
									) : (
										<Input
											value={args[index] ?? ""}
											onChange={e => {
												handleArgumentChange(e.target.value, index)
											}}
											validation={argsBad[index] ? `Bad value for type ${input.type}` : null}
										/>
									)}
								</Fragment>
							))}
							<Button
								disabled={submitButtonDisabled || processing}
								onClick={handleSubmit}
								extraClassName="create-dao-proposal__submit-button"
							>
								{processing ? "Processing..." : "Create Proposal"}
							</Button>
						</>
					)}
				</>
			)}
		</>
	)
}

export default GeneralEvm