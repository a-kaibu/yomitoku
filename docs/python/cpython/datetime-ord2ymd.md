---
title: 通し番号から年月日へ。400 年周期を divmod で削っていく日付計算
description: datetime の _ord2ymd は、通し番号から年・月・日を求める。400 年の周期で大きく割り、100 年、4 年、1 年の周期で順に割っていく。周期の端の値を、特別な戻り方として扱う。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/_pydatetime.py
lines: [93, 153]
function: _ord2ymd
difficulty: 3
format: 2
tags: [日時, アルゴリズム, 数値計算, 標準ライブラリ]
---

## ひとことで

`_ord2ymd(n)` は、**0001 年 1 月 1 日を 1 日目としたときの通し番号から、年・月・日を求める** 関数です。
通し番号が `1` なら `(1, 1, 1)` を返します。日付の計算を、足し算ではなく割り算の商と余りで組み立てています。

## コード

::: code-group

```python:line-numbers=93 [日本語訳]
def _ord2ymd(n):
    "ordinal -> (year, month, day), considering 01-Jan-0001 as day 1."

    # n は 1 から始まる番号で、1 月 1 日（年 1）を 1 とする。閏年の並びは
    # ちょうど 400 年ごとに繰り返す。基本の方針は、n 以前で最も近い 400 年の区切りを求めること。
    # そこから n までのずれを使って計算する。
    # n から 1 を引くと、考えやすくなる。
    # そうすると、400 年の区切りの値が、ちょうど
    # _DI400Y で割り切れる値になる:
    #
    #     日  月   年            n              n-1
    #     -- --- ----        ----------     ----------------
    #     31 12月 -400        -_DI400Y       -_DI400Y -1
    #      1 1月 -399         -_DI400Y +1   -_DI400Y      400年の区切り
    #     ...
    #     30 12月  000        -1             -2
    #     31 12月  000         0             -1
    #      1 1月  001         1              0            400年の区切り
    #      2 1月  001         2              1
    #      3 1月  001         3              2
    #     ...
    #     31 12月  400         _DI400Y        _DI400Y -1
    #      1 1月  401         _DI400Y +1     _DI400Y      400年の区切り
    n -= 1
    n400, n = divmod(n, _DI400Y)
    year = n400 * 400 + 1   # ..., -399, 1, 401, ...

    # ここで n は、年の 1 月 1 日から目的の日付までの（負でない）日数のずれである。
    # 次に、n より前に 100 年周期がいくつあるかを求める。
    # n100 が 4 になることもある。その場合、
    # 4 つの完全な 100 年周期が目的の日より前にあり、
    # 目的の日は 400 年周期の終わりの 12 月 31 日である。
    n100, n = divmod(n, _DI100Y)

    # 次に、その前にある 4 年周期の数を求める。
    n4, n = divmod(n, _DI4Y)

    # 次に、残りの単独の年の数を求める。ここでも n1 は 4 になりうる。
    # その場合、目的の日は 4 年周期の終わりの 12 月 31 日である。
    n1, n = divmod(n, 365)

    year += n100 * 100 + n4 * 4 + n1
    if n1 == 4 or n100 == 4:
        assert n == 0
        return year-1, 12, 31

    # これで年は正しい。n は 1 月 1 日からのずれである。月は、
    # 正確か 1 大きすぎる見積もりから求める。
    leapyear = n1 == 3 and (n4 != 24 or n100 == 3)
    assert leapyear == _is_leap(year)
    month = (n + 50) >> 5
    preceding = _DAYS_BEFORE_MONTH[month] + (month > 2 and leapyear)
    if preceding > n:  # 見積もりが大きすぎる
        month -= 1
        preceding -= _DAYS_IN_MONTH[month] + (month == 2 and leapyear)
    n -= preceding
    assert 0 <= n < _days_in_month(year, month)

    # これで年と月は正しく、n は、その月の初めからのずれである。
    # これで完了。
    return year, month, n+1
```

```python:line-numbers=93 [原文]
def _ord2ymd(n):
    "ordinal -> (year, month, day), considering 01-Jan-0001 as day 1."

    # n is a 1-based index, starting at 1-Jan-1.  The pattern of leap years
    # repeats exactly every 400 years.  The basic strategy is to find the
    # closest 400-year boundary at or before n, then work with the offset
    # from that boundary to n.  Life is much clearer if we subtract 1 from
    # n first -- then the values of n at 400-year boundaries are exactly
    # those divisible by _DI400Y:
    #
    #     D  M   Y            n              n-1
    #     -- --- ----        ----------     ----------------
    #     31 Dec -400        -_DI400Y       -_DI400Y -1
    #      1 Jan -399         -_DI400Y +1   -_DI400Y      400-year boundary
    #     ...
    #     30 Dec  000        -1             -2
    #     31 Dec  000         0             -1
    #      1 Jan  001         1              0            400-year boundary
    #      2 Jan  001         2              1
    #      3 Jan  001         3              2
    #     ...
    #     31 Dec  400         _DI400Y        _DI400Y -1
    #      1 Jan  401         _DI400Y +1     _DI400Y      400-year boundary
    n -= 1
    n400, n = divmod(n, _DI400Y)
    year = n400 * 400 + 1   # ..., -399, 1, 401, ...

    # Now n is the (non-negative) offset, in days, from January 1 of year, to
    # the desired date.  Now compute how many 100-year cycles precede n.
    # Note that it's possible for n100 to equal 4!  In that case 4 full
    # 100-year cycles precede the desired day, which implies the desired
    # day is December 31 at the end of a 400-year cycle.
    n100, n = divmod(n, _DI100Y)

    # Now compute how many 4-year cycles precede it.
    n4, n = divmod(n, _DI4Y)

    # And now how many single years.  Again n1 can be 4, and again meaning
    # that the desired day is December 31 at the end of the 4-year cycle.
    n1, n = divmod(n, 365)

    year += n100 * 100 + n4 * 4 + n1
    if n1 == 4 or n100 == 4:
        assert n == 0
        return year-1, 12, 31

    # Now the year is correct, and n is the offset from January 1.  We find
    # the month via an estimate that's either exact or one too large.
    leapyear = n1 == 3 and (n4 != 24 or n100 == 3)
    assert leapyear == _is_leap(year)
    month = (n + 50) >> 5
    preceding = _DAYS_BEFORE_MONTH[month] + (month > 2 and leapyear)
    if preceding > n:  # estimate is too large
        month -= 1
        preceding -= _DAYS_IN_MONTH[month] + (month == 2 and leapyear)
    n -= preceding
    assert 0 <= n < _days_in_month(year, month)

    # Now the year and month are correct, and n is the offset from the
    # start of that month:  we're done!
    return year, month, n+1
```

:::

## 前提知識

- **閏年の周期**: グレゴリオ暦では、閏年のパターンが 400 年ごとに完全に繰り返します。
- **`divmod`**: 割り算の商と余りを同時に返す組み込み関数です。
- **通し番号**: 基準の日から何日目かを表す数です。ここでは 0001 年 1 月 1 日が 1 です。
- **`>>`**: 数をビットで右にずらす演算です。ここでは、2 で割って切り捨てる代わりに使われています。

## 何をしているか

### 1. 400 年の周期で大きく割る

```python:line-numbers=116
    n -= 1
    n400, n = divmod(n, _DI400Y)
```

番号から 1 を引いて、0 を基準にします。`divmod` で、400 年の周期の数と、その中の残りの日数に分けます。

### 2. 100 年、4 年、1 年の周期で順に割る

```python:line-numbers=125
    n100, n = divmod(n, _DI100Y)
```

残りの日数を 100 年の周期で割ります。周期の数が 4 になるのは、400 年の終わりを表す特別な場合です。

```python:line-numbers=128
    n4, n = divmod(n, _DI4Y)
```

次に、4 年の周期で割ります。

```python:line-numbers=132
    n1, n = divmod(n, 365)
```

最後に、1 年ずつの数を求めます。ここでも値が 4 になれば、4 年周期の終わりを表します。

### 3. 年を確定し、末日の特例を扱う

```python:line-numbers=134
    year += n100 * 100 + n4 * 4 + n1
    if n1 == 4 or n100 == 4:
        assert n == 0
        return year-1, 12, 31
```

求めた周期の数を足して、年を決めます。余りが周期の終わりを表す特別な値なら、前の年の 12 月 31 日を返します。

### 4. 閏年かどうかを判定し、月を見積もる

```python:line-numbers=141
    leapyear = n1 == 3 and (n4 != 24 or n100 == 3)
    assert leapyear == _is_leap(year)
    month = (n + 50) >> 5
    preceding = _DAYS_BEFORE_MONTH[month] + (month > 2 and leapyear)
```

閏年かどうかを、年の周期の情報から判定します。月は、日数の概算から求めます。この見積もりは、正しいか 1 だけ大きい値になります。

```python:line-numbers=146
        month -= 1
        preceding -= _DAYS_IN_MONTH[month] + (month == 2 and leapyear)
```

見積もりが大きすぎた場合は、1 つ前の月に戻し、その月の日数を引きます。

### 5. 月の中の日を返す

```python:line-numbers=148
    n -= preceding
    assert 0 <= n < _days_in_month(year, month)
```

残りの日数を月の初めからの値にし、確かめの `assert` を通します。

```python:line-numbers=153
    return year, month, n+1
```

年、月、日（1 から数えるので `n+1`）を組にして返します。

## ここがすごい

### 周期を大きい順に割る

400 年、100 年、4 年、1 年と、周期を大きい順に割っていきます。それぞれの段階で、残りの日数は必ず周期の範囲に収まるので、計算が単純になります。

### 周期の終わりを特別扱いする

4 年や 100 年の周期の数が、ちょうど次の区切りを指すことがあります。その日は 12 月 31 日になるので、特別な分岐で正しい年と日を返します。

### 見積もりを修正して正確にする

月は、まず大きめに見積もってから、必要なら 1 つ戻します。計算を単純にしながら、必ず正しい月にたどり着きます。

## まとめ

- 通し番号は、400 年、100 年、4 年、1 年の周期で順に割ると、年と残りの日数が求まる。
- 周期の終わりの日は、特別な分岐で 12 月 31 日として扱う。
- 月は大きめの見積もりから出し、必要なら 1 つ戻すと、正確に求まる。
