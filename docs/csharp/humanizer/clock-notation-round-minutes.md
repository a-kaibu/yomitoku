---
title: "分を最も近い 5 分に丸め、60 分になったら次の時へ繰り上げる"
description: "Humanizer の時刻の言い方（クロック表記）で、分を最も近い 5 分に丸める処理。丸めた結果が 60 分になったら、時を 1 つ進めて分を 0 にする。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/Localisation/TimeToClockNotation/PhraseClockNotationConverter.cs
lines: [30, 45]
function: "PhraseClockNotationConverter.Convert(TimeOnly, ClockNotationRounding)（分の丸め部分）"
difficulty: 2
format: 2
tags: [日時, 数値計算, 防御的プログラミング]
---

## ひとことで

`Convert(time, rounding)` は、時刻を「〇時〇分」のような、人が読みやすい言い方に直す処理の一部です。
ここで扱うのは **分の丸め** です。指定があれば、分を最も近い 5 分に丸めます。たとえば 10 時 13 分は 10 時 15 分になり、10 時 58 分は 11 時 0 分になります。

## コード

::: code-group

```csharp:line-numbers=30 [日本語訳]
        var normalizedMinutes = (int)(roundToNearestFive == ClockNotationRounding.NearestFiveMinutes
            ? 5 * Math.Round(time.Minute / 5.0)
            : time.Minute);

        // 丸めた結果が 60 分になったら、次の時へ進める。そうすれば、後で時を正規化し直す必要がない。
        // （分が 60 のまま残ると、時間帯の判定が 1 回余計に必要になるため）
        int hour;
        if (normalizedMinutes == 60)
        {
            hour = time.Hour + 1;
            normalizedMinutes = 0;
        }
        else
        {
            hour = time.Hour;
        }
```

```csharp:line-numbers=30 [原文]
        var normalizedMinutes = (int)(roundToNearestFive == ClockNotationRounding.NearestFiveMinutes
            ? 5 * Math.Round(time.Minute / 5.0)
            : time.Minute);

        // When rounding pushes minutes to 60, advance to the next hour so the bucket switch
        // does not need a second normalization pass.
        int hour;
        if (normalizedMinutes == 60)
        {
            hour = time.Hour + 1;
            normalizedMinutes = 0;
        }
        else
        {
            hour = time.Hour;
        }
```

:::

## 前提知識

- **`TimeOnly`**: 時刻（時と分）だけを表す型です。日付は持ちません。
- **丸め（rounding）**: 数を、ある単位の近い方へそろえることです。ここでは 5 分の単位で行います。
- **`Math.Round`**: 小数を最も近い整数にする関数です。ここでは、分を 5 で割った値を整数に丸めるために使います。
- **繰り上がり**: 丸めた結果が、60 分のように次の単位にあふれることです。時計の場合は、時を 1 つ進めます。
- **`int` へのキャスト `(int)`**: 小数の値を整数にする書き方です。

## 何をしているか

### 1. 分を 5 分単位に丸める

```csharp:line-numbers=30
        var normalizedMinutes = (int)(roundToNearestFive == ClockNotationRounding.NearestFiveMinutes
            ? 5 * Math.Round(time.Minute / 5.0)
            : time.Minute);
```

丸めの指定があれば、`分 ÷ 5` を四捨五入し、その結果に 5 を掛けて分を求めます。指定がなければ、分をそのまま使います。

### 2. 60 分になったら次の時へ

```csharp:line-numbers=34
        // 丸めた結果が 60 分になったら、次の時へ進める。そうすれば、後で時を正規化し直す必要がない。
        // （分が 60 のまま残ると、時間帯の判定が 1 回余計に必要になるため）
        int hour;
        if (normalizedMinutes == 60)
        {
            hour = time.Hour + 1;
            normalizedMinutes = 0;
        }
```

丸めた結果が 60 分になったら、時を 1 つ進めて、分を 0 にします。ここで繰り上げておくと、あとで別に正規化する処理が要りません。

```csharp:line-numbers=42
        else
        {
            hour = time.Hour;
        }
```

それ以外のときは、時をそのまま使います。

### 具体例で確かめる

分の丸めを 5 分単位で行うと、次のようになります。

```
13 分 → 13 ÷ 5 = 2.6 → 3 → 15 分
12 分 → 12 ÷ 5 = 2.4 → 2 → 10 分
58 分 → 58 ÷ 5 = 11.6 → 12 → 60 分 → 時を 1 つ進めて 0 分
```

## ここがすごい

- **割り算と四捨五入だけで丸める**: 条件を 12 個も並べずに、5 分単位の丸めを 1 行で表しています。
- **繰り上がりを 1 か所で処理**: 60 分になった場合だけ、時を進めます。時と分がずれる危険を、この分岐だけに集めています。
- **指定がなければ何もしない**: 丸めの指定が `None` なら、分をそのまま使うので、既定の動きは変わりません。
- **後続の処理が簡単になる**: 繰り上げを済ませた後の時と分は、必ず正しい範囲に収まっています。

## まとめ

- 分の丸めは、5 で割って四捨五入し、5 を掛けて求める。
- 丸めの結果が 60 分になったら、時を 1 つ進めて分を 0 にする。
- 繰り上げをこの場所で済ませるので、後の処理は正しい時刻だけを扱える。
