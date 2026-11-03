---
title: "二つの日時の差を、日と時刻の形で求める"
description: "calendar:time_difference/2 は、二つの日時のあいだの差を、日数と時刻の組として返す。両方の日時を通算の秒に直して引き、その秒数を日と時刻に分け直す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/calendar.erl
lines: [868, 872]
function: "calendar:time_difference/2"
difficulty: 3
format: 2
tags: ["日時", "数値計算", "標準ライブラリ"]
---
## ひとことで

`calendar:time_difference/2` は、二つの日時を受け取り、後の日時から前の日時を引いた差を返します。
差は、`{Days, {Hours, Minutes, Seconds}}` の形で表されます。日時の差を、人間が読める単位に分けて返す関数です。

## コード

```erlang:line-numbers=868
time_difference({{Y1, Mo1, D1}, {H1, Mi1, S1}},
		{{Y2, Mo2, D2}, {H2, Mi2, S2}}) ->
    Secs = datetime_to_gregorian_seconds({{Y2, Mo2, D2}, {H2, Mi2, S2}}) -
	datetime_to_gregorian_seconds({{Y1, Mo1, D1}, {H1, Mi1, S1}}),
    seconds_to_daystime(Secs).
```

## 前提知識

- **日時の形**: `{{年, 月, 日}, {時, 分, 秒}}` の組です。
- **グレゴリオ通算秒**: 基準の日時からの通算の秒数です。日時の差を、単純な引き算で求めるための形です。
- **`datetime_to_gregorian_seconds/1`**: 日時を、通算の秒に直す関数です。
- **`seconds_to_daystime/1`**: 秒数を、日数と時刻の組に分ける関数です。

## 何をしているか

### 1. 二つの日時を、通算の秒に直して引く

```erlang:line-numbers=868
time_difference({{Y1, Mo1, D1}, {H1, Mi1, S1}},
		{{Y2, Mo2, D2}, {H2, Mi2, S2}}) ->
    Secs = datetime_to_gregorian_seconds({{Y2, Mo2, D2}, {H2, Mi2, S2}}) -
	datetime_to_gregorian_seconds({{Y1, Mo1, D1}, {H1, Mi1, S1}}),
```

二つ目の日時の通算秒から、一つ目の日時の通算秒を引きます。結果は、秒数 `Secs` です。
引き算は、一つの数の上で行われるので、月の長さや閏年の扱いは、通算秒の計算に任せています。

### 2. 秒数を、日と時刻に分ける

```erlang:line-numbers=872
    seconds_to_daystime(Secs).
```

`seconds_to_daystime/1` で、秒数を、日数と時刻の組に分けて返します。

## ここがすごい

### 差を、単純な引き算に変える

年・月・日・時・分・秒をそのまま引くと、桁上がりの処理が必要になり、複雑です。
この関数は、両方を通算の秒に直してから引きます。桁上がりの処理は、通算秒を作る関数の中に閉じ込められています。

### 差の順番は、後ろから前を引く

`Secs` は、二つ目から一つ目を引いています。
そのため、二つ目の日時が後ろにあれば、差はプラスになります。読み手は、引数の順番がそのまま差の向きになることを、式から読み取れます。

### 変換の役割を、三つの関数に分けている

日時から秒、秒から日と時刻、という二段の変換を、関数に分けています。
この関数は、その二つを組み合わせて、差を求める流れだけを書いています。それぞれの変換を、別々に理解できる構成です。

### 一つ目と二つ目の日時を入れ替えたら

引数を入れ替えると、差の符号が反対になります。前の日時から後の日時を引けば、差は正の値です。
どちらの向きの差が欲しいかは、引数の順番で決めます。関数は、その約束をそのまま表しています。

## まとめ

`calendar:time_difference({{2024,1,1},{0,0,0}}, {{2024,1,2},{12,0,0}})` は、一日と十二時間の差を表す値を返します。
日付の差が、時刻を含めて正しく求められます。
