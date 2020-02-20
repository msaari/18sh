# Changelog for 18SH

## TODO
- Add more tests and more error handling to better survive wrong instructions
like buying too many shares.
- Command to dump history to a text file.
- Switch from configstore to conf.

## Unreleased (in `master` branch)

## 2.3.0 - 2020-02-20
- Added: `remove` will remove a player from the game.
- Changed: When buying shares from a source, can only buy as many as the source
has to sell.

## 2.2.1 - 2019-08-27
- Security update to fix a vulnerability in eslint-utils.

## 2.2.0 - 2019-07-13
- Added: The currency symbol is passed to the cash display.
- Added: You can leave comments in the game log. Anything after a `#` symbol is
considered a comment and will be saved in the log, but not parsed.

## 2.1.0 - 2019-07-12
- An external cash display support is available! If the environmental variable
`DISPLAY18SH` has an URL, 18SH will send cash status information there and if
there's an [18SH display server](https://github.com/msaari/18sh-display)
listening, it will display the cash totals.
- Added: `close` will close down company, removing all cash and shares from
play. This will remove the company from status bar and cash display.
- Added: `next` will move the game to next SR or OR. The current round is shown
in the status bar.
- Added: If you want to specify a currency other than the default dollar, you
can use any single-character currency symbol when setting the bank size:
`banksize £2000` would set pound as the currency.
- Added: `rounding up` changes the half-dividend company rounding to round in
favour of the company (as in 1858, 1869, 1870, 18??, 18EZ, 18GM and 18NK),
`rounding 1837` for 1837 style rounding (count exact sum, round dividend
payments down).
- Added: `companycredits` switches the game to use company credits, where company
cash is not part of the bank.
- Added: `income` can be used to set player or company income, which is then
paid out when new OR begins.
- Changed: Player value is only displayed in the status bar if it's not the
same as cash.
- Changed: Tests have been setup so that individual tests don't depend on other
tests.

## 2.0.0 - 2019-07-08
- Removed: `give` and `take` have been replaced by `cash`.
- Added: `cash` can be used to adjust player cash. `Mikko cash 100` adds money
and `Mikko cash -100` subtracts money.
- Changed: `give` is now used to move money between participants.
- Changed: `buy` can now specify a price and a source. Price will adjust cash
and if source is specified, the source sells the share and gets the money.
- Changed: `sell` can also specify a price to give the money.
- Removed: Doing `CR dividend prev` is no longer possible. It was a bit
complicated and actually not very helpful in practise, so I dropped it.

## 1.2.0 - 2019-06-29
- Added: Companies can now have cash as well. Company cash will appear in the
status bar, on a separate row with a different background color.
- Added: Companies can own shares and get paid dividends.
- Added: New command `halfdividend` pays half dividends, rounded to the favour
of shareholders.
- Fixed: Status bar works better if gets long enough to cover multiple lines.
- Fixed: No more `COMPANY pays PLAYER $0 for undefined shares.` notices.

## 1.1.1 - 2019-06-23
- Removed: One console.log() that was left in the code.

## 1.1.0 - 2019-06-23
- Added: Instead of sum, dividends can be now paid as `prev` to repeat the
previous dividend payment for the company.
- Added: Automated tests.
- Added: Player cash can be adjusted with `give` and `take`.
- Added: Bank size can be set with `banksize 4000` and the remaining bank
checked with `bank`.
- Added: Status bar shows total cash in play. Once the bank size is set, the
status bar shows instead the remaining bank size.
- Added: `help` command.
- Added: `companies` shows a list of companies with their share values and
share ownership.
- Changed: The status bar now shows players with the format "NAME: $CASH
($VALUE)" instead of "NAME: $VALUE".

## 1.0.0 - 2019-06-17
- First released version!