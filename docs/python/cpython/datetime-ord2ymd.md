---
title: 通し番号から年月日へ。400 年周期を divmod で削っていく日付計算
description: datetime の Python 版で、「西暦 1 年 1 月 1 日から何日目か」を年・月・日に戻す関数。うるう年の周期を利用して、ループなしで年を求めている。
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
tags: [日時, アルゴリズム, 数値計算, 標準ライブラリ]
---
## ひとことで

`_ord2ymd(n)` は、「西暦 1 年 1 月 1 日を 1 日目としたときの通し番号 `n`」を、`(年, 月, 日)` に変換する関数です。
たとえば `_ord2ymd(1)` は `(1, 1, 1)`、`_ord2ymd(738886)` は `(2024, 1, 1)` になります。
1 年ずつ数えていくのではなく、**うるう年が 400 年ごとに同じパターンで繰り返すこと** を使い、割り算だけで年を求めます。

## コード

```python:line-numbers=93
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

使っている定数は、同じファイルの 30〜91 行目で定義されています。`_DI400Y` は 400 年の日数（146097）、`_DI100Y` は 100 年の日数（36524）、`_DI4Y` は 4 年の日数（1461）です。`_DAYS_BEFORE_MONTH[m]` は「その月より前の月の日数の合計」（うるう年でない年）です。

## 前提知識

- **`divmod(a, b)`**: 割り算の商と余りを同時に返します。`divmod(17, 5)` は `(3, 2)` です。
- **`n -= 1`**: `n = n - 1` の省略形です。
- **`>>`（右シフト）**: 整数を 2 進数で右にずらす演算です。`x >> 5` は `x // 32`（32 で割って切り捨て）と同じです。
- **真偽値は数として足せる**: Python では `True` は 1、`False` は 0 として計算できます。`28 + True` は `29` です。
- **`assert`**: 「ここでは必ずこの条件が成り立つはず」という確認です。成り立たなければエラーになります。
- **グレゴリオ暦のうるう年**: 4 で割り切れる年はうるう年。ただし 100 で割り切れる年は平年。ただし 400 で割り切れる年はうるう年。

## 何をしているか

### 1. 400 年の周期を取り除く（116〜118 行目）

まず `n` から 1 を引いて 0 始まりにします。こうすると 400 年の区切りがちょうど `_DI400Y` で割り切れる値になります（96〜115 行目のコメントの表）。
`divmod(n, 146097)` で「何回 400 年が過ぎたか」と「その周期の何日目か」に分けます。

### 2. 100 年、4 年、1 年と順に削る（125〜132 行目）

同じように、残りの日数を 100 年（36524 日）、4 年（1461 日）、1 年（365 日）で順に割っていきます。各段階の商を足せば年がわかります（134 行目）。

例として 2024 年 1 月 1 日（`n = 738886`）を追うと、

- `n - 1 = 738885` → 400 年が 5 回（730485 日）、残り 8400 日
- 100 年（36524 日）: 0 回、残り 8400 日
- 4 年（1461 日）: 5 回（7305 日）、残り 1095 日
- 1 年（365 日）: 3 回（1095 日）、残り 0 日

となり、`year = 5*400 + 1 + 0*100 + 5*4 + 3 = 2024`、年の中の 0 日目（1 月 1 日）だとわかります。

### 3. 周期の最後の日の特別扱い（135〜137 行目）

4 年周期の最後の年はうるう年なので 366 日あります。そのため `divmod(n, 365)` の商 `n1` が 4 になることがあります。これは「周期の最後の日＝前の年の 12 月 31 日」を意味するので、そのまま答えを返します。100 年周期でも同じことが起きます。

### 4. 月を見積もって 1 回だけ補正（141〜149 行目）

年の中の日数 `n`（0〜365）から、`(n + 50) >> 5` で月を **見積もります**。32 日刻みで月を数えるイメージで、この式はちょうど「正しいか、1 つ大きすぎるか」のどちらかになるように作られています。大きすぎたら 1 つ戻します。
うるう年は `n1 == 3 and (n4 != 24 or n100 == 3)` で判定しています。「4 年周期の 4 年目」で、「100 年周期の最後の 4 年でない、または 400 年周期の最後の 100 年」という意味です。

## ここがすごい

### ループなしで年が決まる

素直に書くと「1 年の日数を引いていき、引けなくなったら止める」というループになり、2024 年なら 2000 回以上回ります。この実装は暦の周期を割り算で処理するので、どんな日付でも同じ回数の計算で済みます。

### 1 を引くだけで周期の境界をそろえる

1 日目が `1` だと、400 年の区切りは `146097 * k + 1` のような半端な位置になります。最初に `n -= 1` するだけで区切りが割り切れる値になり、以後の divmod がすべて素直になります。コメントの表がその理由を丁寧に示しています。

### 「見積もり + 1 回の補正」

月を探すのに 12 か月をループで調べる代わりに、ビットシフト 1 回で見積もり、ずれても 1 か月だけ、という性質を保証して補正 1 回で終わらせています。正しさは `assert` で確かめられています。

## まとめ

- 周期性のある問題は、周期の大きい順に `divmod` で削ると速く解ける。
- 0 始まりにそろえると、境界の計算がきれいになる。
- 「正確な答え」の代わりに「ずれが限られた見積もり」を使い、少しだけ補正する手法は強力。
