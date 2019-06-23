"use strict"

const Configstore = require("configstore")
/* eslint-disable no-process-env */
const configstoreName = process.env.NODE_ENV === "test" ? "18sh-test" : "18sh"
const conf = new Configstore(configstoreName)
const nameGenerator = require("./generateName")

const open = name => {
	let feedback = ""
	let success = false
	if (conf.has(name)) {
		success = true
		feedback = `Opened game ^y'${name}'^\n`
		conf.set("currentGameName", name)
	} else {
		feedback = `Game ^y'${name}'^ doesn't exist.\n`
	}
	return {
		feedback,
		success
	}
}

const listGames = () => {
	let feedback = ""
	Object.keys(conf.all).forEach(key => {
		if (key === "currentGameName") return
		feedback += `${key}\n`
	})
	return feedback
}

const deleteGame = name => {
	let feedback = ""
	let success = false
	if (conf.has(name)) {
		conf.delete(name)
		feedback = `Deleted ^y'${name}'^\n`
		if (conf.get("currentGameName") === name) {
			conf.delete("currentGameName")
			success = true
			feedback += `Deleted the active game, no game active at the moment.\n`
		}
	} else {
		feedback = `^rGame ^y'${name}'^r doesn't exist.\n`
	}
	return {
		feedback,
		success
	}
}

const newGame = gameName => {
	let feedback = ""
	let success = false
	if (conf.has(gameName)) {
		feedback = `^rGame ^y'${gameName}'^ already exists!\n`
	} else {
		success = true
		conf.set("currentGameName", gameName)
		feedback = `Game ^y'${gameName}'^ generated and active.\n`
	}
	return {
		feedback,
		success
	}
}

const createOrLoadGame = () => {
	let currentGameName = conf.get("currentGameName")
	let feedback = ""
	let mode = ""
	if (!currentGameName) {
		currentGameName = nameGenerator.generateName()
		conf.set("currentGameName", currentGameName)
		mode = "create"
		feedback = `Your game name is ^y'${currentGameName}'^\n`
	} else if (currentGameName) {
		feedback = `Continuing game ^y'${currentGameName}'^\n`
		mode = "load"
	}
	return {
		currentGameName,
		feedback,
		mode
	}
}

module.exports = {
	open,
	listGames,
	deleteGame,
	newGame,
	createOrLoadGame
}
