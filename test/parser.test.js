"use strict"

const expect = require("chai").expect
const parser = require("../modules/parser")

describe("Parser", () => {
	describe("parse", () => {
		it("should return correct for holdings", () => {
			expect(parser("holdings")).to.include({
				verb: "holdings"
			})
			expect(parser("h")).to.include({
				verb: "holdings"
			})
		})
		it("should return correct for values", () => {
			expect(parser("values")).to.include({
				verb: "values"
			})
			expect(parser("v")).to.include({
				verb: "values"
			})
		})
		it("should return correct for list", () => {
			expect(parser("list")).to.include({
				verb: "listGames"
			})
			expect(parser("l")).to.include({
				verb: "listGames"
			})
		})
		it("should return correct for open", () => {
			expect(parser("open sesame")).to.include({
				verb: "open",
				object: "SESAME"
			})
			expect(parser("open")).to.include({
				verb: null,
				object: null
			})
			expect(parser("o two-words")).to.include({
				verb: "open",
				object: "TWO-WORDS"
			})
		})
		it("should return correct for delete", () => {
			expect(parser("delete sesame")).to.include({
				verb: "delete",
				object: "SESAME"
			})
			expect(parser("delete")).to.include({
				verb: null,
				object: null
			})
			expect(parser("d sesame")).to.include({
				verb: null,
				object: null
			})
		})
		it("should return correct for start", () => {
			expect(parser("start sesame")).to.include({
				verb: "start",
				object: "SESAME"
			})
			expect(parser("start")).to.include({
				verb: null,
				object: null
			})
			expect(parser("s sesame")).to.include({
				verb: null,
				object: null
			})
		})
		it("should return correct for buy", () => {
			expect(parser("mikko buys ger")).to.include({
				verb: "buy",
				object: "GER",
				subject: "MIKKO",
				quantity: 1
			})
			expect(parser("mikko b 2 ger")).to.include({
				verb: "buy",
				object: "GER",
				subject: "MIKKO",
				quantity: 2
			})
		})
		it("should return correct for sell", () => {
			expect(parser("mikko sells ger")).to.include({
				verb: "sell",
				object: "GER",
				subject: "MIKKO",
				quantity: 1
			})
			expect(parser("mikko s 2 ger")).to.include({
				verb: "sell",
				object: "GER",
				subject: "MIKKO",
				quantity: 2
			})
		})
		it("should return correct for give", () => {
			expect(parser("mikko give 100")).to.include({
				verb: "give",
				object: null,
				subject: "MIKKO",
				quantity: 100
			})
			expect(parser("mikko g 100")).to.include({
				verb: "give",
				object: null,
				subject: "MIKKO",
				quantity: 100
			})
		})
		it("should return correct for take", () => {
			expect(parser("mikko take 100")).to.include({
				verb: "take",
				object: null,
				subject: "MIKKO",
				quantity: 100
			})
			expect(parser("mikko t 100")).to.include({
				verb: "take",
				object: null,
				subject: "MIKKO",
				quantity: 100
			})
		})
		it("should return correct for dividends", () => {
			expect(parser("ger dividends 10")).to.include({
				verb: "dividend",
				object: 10,
				subject: "GER",
				quantity: 0
			})
			expect(parser("ger d 10")).to.include({
				verb: "dividend",
				object: 10,
				subject: "GER",
				quantity: 0
			})
			expect(parser("ger pays prev")).to.include({
				verb: "dividend",
				subject: "GER",
				object: "PREV",
				quantity: 0
			})
			expect(parser("ger p prev")).to.include({
				verb: "dividend",
				subject: "GER",
				object: "PREV",
				quantity: 0
			})
		})
		it("should return correct for value", () => {
			expect(parser("ger value 10")).to.include({
				verb: "value",
				object: 10,
				subject: "GER",
				quantity: 0
			})
			expect(parser("ger v word")).property("object").to.be.NaN
		})
		it("should return null for unexpected command", () => {
			expect(parser("not_a_proper_command")).to.include({
				verb: null,
				object: null,
				subject: null,
				quantity: 0
			})
			expect(parser("not_a_proper_command parameter and_another")).to.include({
				verb: null,
				object: null,
				subject: null,
				quantity: 0
			})
		})
	})
})
