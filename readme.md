# 18SH – an 18xx shell

![Travis build status](https://img.shields.io/travis/msaari/18sh.svg?style=flat-square)

18SH is designed as a replacement for the spreadsheets used to calcualte end of
game scores in 18xx games. Spreadsheets are fine, especially if they're well
designed with formulas to avoid entering the same data twice, but I wanted to
try how an interactive shell would work.

The design philosophy behind 18SH is to not support game rules, but just offer
a simple and effective way of recording the financial transactions of the game.
18SH aims to support different ways money and shares are handled, it has tools
that make life easier for both full cap and incremental cap games, for example,
but it cannot track company value automatically or enforce certificate limit.

18SH follows semantic versioning; the biggest catch is that save file
compatibility is only guaranteed within major versions. If the first number
changes in the version number, your saved games won't work anymore.

## Installing

Clone from GitHub or download the files. The GitHub `master` is the current
state of development and not always stable. For stable releases, get the
[tagged release packages](https://github.com/msaari/18sh/releases). Then
install the Node modules with

	npm install

and you're ready to go. 18SH requires [Node.js](https://nodejs.org/en/download/).

## Upgrading

If you use a stable release package, just download the new package and use
that.

If you clone from GitHub, you can upgrade to the latest version with

	git pull

Note that the latest `master` may be unstable. However, major version
development generally happens in a separate branch, so `master` will have the
latest version of the current major version.

## Usage

Run 18SH with Node:

	node 18sh.js

If there isn't an active game in the Configstore storage, a new game will be
created and assigned a name. If you quit and then restart 18SH, it will
continue with the same game. You can also switch between two games.

Shares can be bought by issuing the right commands (see below for a list),
company values can be set and with the command

	values

you'll finally see the end results.

## Commands

### BUY
	<player|company> buys <count> <company> [@<price> [from <source>]]

There's no need to introduce player or company names: just use any
abbreviations you like, as long as you always refer to the same player or
company with the same abbreviation. The names are case insensitive (and always
converted to upper case anyway).

If you specify a price, that amount of money will be reducted from the buyer.
Price is the price for single share, so it will be multiplied by the number of
shares bought. If you specify a source, the money will be paid to the source,
and the share will be removed from the source. When buying from pool, do not
specify the source; this is mostly useful in partical cap games like 1846,
where companies own their own shares and are paid for share purchases.

You can't specify source without a price.

Companies can also buy shares, either their own or from other companies.

You can abbreviate the command to `b`, `bu` or `buy`. Count can be omitted,
in which case it's assumed to be 1. You can drop the `@` from the price, if you
prefer, and adding the `from` is optional.

All of these commands have Mikko buy two LNWR shares:

	Mikko buys 2 LNWR
	Mikko buy 2 LNWR
	Mikko b 2 LNWR

In a game of 1846, you will see something like this. These commands have the
same effect:

	Mikko buys 1 GT @100 from GT
	Mikko b GT 100 GT

### SELL
	<player|company> sells <count> <company> [@<price>]

The opposite of buying shares. The same principles apply to `sell`: you can
abbreviate the command. If you specify the price, the seller will be given that
much money from the bank.

If you try to sell more than you have, 18SH will sell to zero. You can't sell
to someone; for transactions like that, you always have to `buy`.

### CASH
	<player|company> cash <amount>

Adjusts the player or company cash. If `<amount>` is positive, the money is
added and if it's negative, the money is removed. All transactions happen
between the player or the company and the bank.

Company must be floated before its cash can be handled (see `float` below).

### GIVE
	<player|company> give <amount> to <player|company>

Has the player or company move the specific amount of money to the target.

A company must be floated before its cash can be handled (see `float` below).

Doing one of these:

	GT give 60 to Mikko
	GT g 60 Mikko

is the same as doing

	GT cash -60
	Mikko cash 60

### DIVIDENDS
	<company> dividends <number>

This command has the company distribute `<number>` as a dividend. Use the
per-share value, not the total dividend: if there are ten shares as usual and
the total sum is £200, the command is

	GER dividends 20

as the per-share dividend is £20. This command can be abbreviated up to `d`
and it also has an alias, `pays`. These are all identical to the command above:

	GER d 20
	GER pays 20
	GER pay 20
	GER pa 20
	GER p 20

### HALF DIVIDENDS
	<company> halfdividends <number>

Distributes half dividends where half the sum is paid to the company and the
rest is distributed to shares, rounded up for the benefit of the shareholders.
The `<number>` is not the per-share dividend, but the total sum to distribute.
Thus if you do

	NYC halfdividends 290

NYC will retain 140 and each NYC share is paid 15.

If you want to change the default setting for half dividend rounding, 18SH
supports two other methods. To round in favour of company, use the command

	rounding up

and in order to round like it's done in 1837 (calculate exact sum per share,
then round share payments down – paying 50 would net 25 in company treasury and
a 30% owner would get 7.5 that rounds down to 7), use

	rounding 1837

### FLOAT
	<company> float <number>

Starts up a company and sets its cash to `<number>`. This needs to be done
first if you want to track company cash, because otherwise `<company> cash
<amount>` will not work correctly but will instead assume `<company>` is a
player.

	NYC float 630

In partial-cap games like 1846, you generally want to float companies like
this:

	GT float 0
	GT buys 10 GT @0

Now 18SH knows GT exists and GT has 10 shares. Then the president can determine
the price of one share and then buy the initial shares:

	Mikko buys 2 GT @100 from GT

Now GT would have $200 and Mikko has 2 GT shares.

### CLOSE
	close <company>

Closes the company, removing it from play completely (all shares and cash in
company treasury gone).

	close BIG4

### NEXT
	next <SR|OR>

Moves the game to next SR or OR. The current round is shown in the status bar.

### INCOME
	<player|company> income <amount>

Sets the player or company income to the specified amount. This income is
automatically paid in the beginning of each OR and happens whenever the command
`next OR` is used.

	Mikko income 25

### VALUE
	<company> value <number>

This sets the company share price value to `<number>`. This is required so that
18SH can report the final values for players. Again, all of these are
equivalent:

	SECR value 67
	SECR val 67
	SECR v 67

### BANKSIZE
	banksize <currency symbol><number>

Sets the game bank size to the specified value. Once this is set, the status
bar will show the money remaining in the bank (calculated as bank size minus
the cash players have).

The default currency is dollars, but you can specify any one-letter currency
symbol when setting the bank size in order to change currency, like this:

	banksize £2500
	banksize €2500
	banksize ₹2500

If you wish to use 1825 style company credits where company money is not
included in the bank, you can set that up with

	companycredits

### BANK
	bank

Shows the remaining cash in bank.

### HOLDINGS
	holdings

This command prints out a list of share and cash holdings for all players.

### VALUES
	values

This command prints out a list of player net worth values. All share holdings
are multiplied by the share values and the cash holdings are added to that. In
order for this command to work, the values need to be set using `value`.

### COMPANIES
	companies

This command prints out a list of companies with their share values and the
share ownership.

### UNDO
	undo

Undoes the previous game state altering command (commands that just show the
game state like `holdings` or `values` are not considered for `undo`). 18SH has
a history of commands entered, and `undo` simply removes the last command from
the list and then resets the game state to that.

### OPEN
	open <game-name>

Opens the specified game and closes the current game (game state is saved to
the file after each command, so nothing is lost).

### LIST
	list

Lists all the games that are saved at the moment.

### DELETE
	delete <game-name>

Deletes the saved game with a given name. This is permanent and cannot be
undone.

### HELP
	help

A list of these commands.

### QUIT
	quit

Alias `exit`. Exits the 18SH shell. The game state is automatically saved after
every command in the local configstore (`~/.config/configstore/18sh.json`).

## Cash Display

The biggest problem with 18SH is that the cash situation is not visible to
other players. This can be rectified with [18SH Cash Display](https://github.com/msaari/18sh-display).
If you have a cash display server running up, you can connect 18SH to it and
display the cash status on another screen.

For further instructions on setting up the Cash Display, refer to the Cash
Display GitHub page. 18SH will send the status information automatically to the
server whenever things change, all you need to to is to tell where the server
is. This is done by setting an environmental variable that points to the
server. The exact method depends on your system ([see this helpful guide](https://www.schrodinger.com/kb/1842)).
On my Mac running zsh, I do it like this:

	export DISPLAY18SH=https://example.com/18sh/

In any case, the name of the environmental variable is `DISPLAY18SH`. Make sure
you add the `18sh/` to the end of the URL of the server.

See Cash Display GitHub page for version compatibility information: 18SH and
the server must have compatible version numbers.

![Example image](https://github.com/msaari/18sh-display/raw/master/sample-game.jpg)

## BGG thread

For discussion about 18SH, see [the BoardGameGeek 18SH thread](https://boardgamegeek.com/thread/2225619/18sh-command-line-replacement-spreadsheets).

## Dependencies

18SH doesn't have many dependencies:

- [terminal-kit](https://github.com/cronvel/terminal-kit) is used to handle the user interface.
- [cli-table](https://github.com/Automattic/cli-table) is used to print out pretty tables.
- [configstore](https://github.com/yeoman/configstore) stores the game data.
- [axios](https://github.com/axios/axios) is used to send the data to the cash display server.

During development, [eslint](https://github.com/eslint/eslint) and
[prettier](https://github.com/prettier/prettier) are used and the testing and
code coverage is done with a combo of [mocha](https://github.com/mochajs/mocha),
[chai](https://github.com/chaijs/chai) and [nyc](https://github.com/istanbuljs/nyc).

## Changelog

See [changelog.md](changelog.md) in the repo for change history, todo list and
the unreleased features already available from the repo, but not in releases.

## License

Copyright 2019 [Mikko Saari](https://github.com/msaari/) mikko@mikkosaari.fi

See [license information](LICENSE).