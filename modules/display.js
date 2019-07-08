"use strict"

const axios = require("axios")
/* eslint-disable no-process-env */
const displayURL = process.env.DISPLAY18SH

module.exports = (gameName, displayContent) => {
	if (displayURL) {
		const postData = {
			name: gameName,
			data: displayContent
		}
		axios
			.post(displayURL, postData)
			.then(response => {
				if (response.status !== 200) {
					console.log(response.data)
				}
			})
			.catch(error => {
				console.log(error.message)
				console.log("\n")
			})
	}
}
