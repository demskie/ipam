import React from "react";
import { Spinner } from "@blueprintjs/core";
import "./CustomSpinner.css";
import PropTypes from "prop-types";

export class CustomSpinner extends React.PureComponent {
	render() {
		if (this.props.floatPercent === 0) {
			return <div style={{ width: "10px" }} />;
		}
		return (
			<div
				style={{
					width: this.props.pixelSize + "px",
					WebkitAnimation: "spin360 " + this.props.cycleTime + "s linear infinite",
					animation: "spin360 " + this.props.cycleTime + "s linear infinite",
					willChange: "transform",
					margin: this.props.margin + "px"
				}}
			>
				<Spinner intent={this.props.intent} size={this.props.pixelSize} value={this.props.floatPercent} />
			</div>
		);
	}
}

CustomSpinner.propTypes = {
	cycleTime: PropTypes.number.isRequired,
	floatPercent: PropTypes.number.isRequired,
	intent: PropTypes.string.isRequired,
	margin: PropTypes.number.isRequired,
	pixelSize: PropTypes.number.isRequired
};
