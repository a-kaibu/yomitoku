---
title: ".NET の時刻を、JavaScript の Date 用のミリ秒に変換する"
description: "Newtonsoft.Json の DateTimeUtils。.NET の 100 ナノ秒単位の tick を、1970 年 1 月 1 日からのミリ秒に変えて JSON に書き、その逆も行う。JavaScript と日時をやり取りするための計算。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/DateTimeUtils.cs
lines: [199, 211]
function: "DateTimeUtils.UniversalTicksToJavaScriptTicks(long) / ConvertJavaScriptTicksToDateTime(long)"
difficulty: 2
format: 2
tags: [日時, 数値計算, 入出力]
---

## ひとことで

この部分は、.NET の日時と **JavaScript の日時（ミリ秒）** を相互に変換する計算です。
JavaScript の `Date` は、1970 年 1 月 1 日 0 時（UTC）からの **ミリ秒** で時刻を表します。一方、.NET は **tick**（100 ナノ秒が 1 単位）で時刻を表します。

JSON に日時を書き出すときに、この変換が使われます。

## コード

```csharp:line-numbers=199
        private static long UniversalTicksToJavaScriptTicks(long universalTicks)
        {
            long javaScriptTicks = (universalTicks - InitialJavaScriptDateTicks) / 10000;

            return javaScriptTicks;
        }

        internal static DateTime ConvertJavaScriptTicksToDateTime(long javaScriptTicks)
        {
            DateTime dateTime = new DateTime((javaScriptTicks * 10000) + InitialJavaScriptDateTicks, DateTimeKind.Utc);

            return dateTime;
        }
```

## 前提知識

- **tick（ティック）**: .NET の `DateTime` が持つ時刻の単位です。1 tick は 100 ナノ秒（1,000 万分の 1 秒）です。
- **UTC（協定世界時）**: 時差のない基準の時刻です。ここでは、時刻を比べるときの基準として使います。
- **1970 年 1 月 1 日**: JavaScript と UNIX の時刻の基準日です。この日からの経過時間を数えます。
- **`InitialJavaScriptDateTicks`**: 1970 年 1 月 1 日の 0 時を、.NET の tick で表した値です。`621355968000000000` と定められています。
- **整数の割り算**: 10000 で割ると、tick から ミリ秒（1 ミリ秒 = 10,000 tick）が得られます。

## 何をしているか

### 1. tick を JavaScript のミリ秒に変える

```csharp:line-numbers=199
        private static long UniversalTicksToJavaScriptTicks(long universalTicks)
        {
            long javaScriptTicks = (universalTicks - InitialJavaScriptDateTicks) / 10000;

            return javaScriptTicks;
        }
```

.NET の tick（UTC 基準）から、1970 年の基準の tick を引き、10,000 で割ります。tick が 10,000 個で 1 ミリ秒なので、これでミリ秒になります。

### 2. ミリ秒を .NET の tick に戻す

```csharp:line-numbers=206
        internal static DateTime ConvertJavaScriptTicksToDateTime(long javaScriptTicks)
        {
            DateTime dateTime = new DateTime((javaScriptTicks * 10000) + InitialJavaScriptDateTicks, DateTimeKind.Utc);

            return dateTime;
        }
```

ミリ秒に 10,000 を掛けて、1970 年の基準の tick を足します。その結果を、UTC の `DateTime` として作ります。

### 具体例で確かめる

JavaScript で `0` は、1970 年 1 月 1 日 0 時（UTC）です。

```
ミリ秒 0 → tick = 0 × 10000 + 621355968000000000 = 1970-01-01T00:00:00Z
```

ミリ秒 `1000`（1 秒後）なら、`1000 × 10000` の tick を足した時刻になります。

## ここがすごい

- **単位の換算が 1 つの割り算と掛け算**: tick とミリ秒の関係（1 ミリ秒 = 10,000 tick）だけで、両方向の変換ができます。
- **基準の値に定数を使う**: 1970 年の tick を定数として 1 か所に定めているので、変換の全体が同じ基準で動きます。
- **戻すときは UTC**: `DateTimeKind.Utc` を指定し、時差の扱いを曖昧にしません。
- **小さな計算で済む**: 日時の計算を、年や月を数えずに整数だけで行えます。

## まとめ

- JavaScript の時刻は 1970 年からのミリ秒、.NET の時刻は tick で表される。
- 変換は、基準の tick との差を 10,000 で割る（または 10,000 を掛けて足す）だけ。
- 戻す値は UTC の `DateTime` として作られる。
