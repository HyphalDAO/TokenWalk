import React, {FunctionComponent} from "react"
import "./styles.scss"
import HeaderMenu from "./Menu"
import {Link} from "react-router-dom"
import Logo from "../../icons/Logo"

const Header: FunctionComponent<{
	background: boolean
	height?: number
}> = ({background, height}) => {
	return (
		<header
			className="header"
			style={{
				...(background ? {backgroundImage: `url("/assets/Dashboard_Header.png")`} : {}),
				...(height ? {height: `${height}px`} : {})
			}}
		>
			<div className="header__logo">
				<Link to="/">
					<Logo width={200} height={40} />
				</Link>
			</div>
			<HeaderMenu />
		</header>
	)
}

export default Header
