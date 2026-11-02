---
title: 二つの日付の期間が、少しでも重なるかを調べる
description: Carbon の CarbonPeriod の overlaps は、自分の期間と相手の期間が、一部でも重なっているかを判定します。端が接しているだけの場合は重なりとみなさないように、不等号を使い分けています。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/CarbonPeriod.php
lines: [2026, 2038]
function: overlaps
difficulty: 2
format: 2
tags: [日時, 探索, 型システム]
---
## ひとことで

`overlaps` は、ある期間が、別の期間と少しでも重なっているかを判定する関数です。たとえば 3 月 1 日から 3 月 10 日と、3 月 5 日から 3 月 15 日は重なります。ただし、3 月 1 日から 3 月 10 日と、3 月 10 日から 3 月 20 日は、端が接しているだけなので重なりません。

## コード

```php:line-numbers=2026
    public function overlaps(mixed $rangeOrRangeStart, mixed $rangeEnd = null): bool
    {
        $range = $rangeEnd ? static::create($rangeOrRangeStart, $rangeEnd) : $rangeOrRangeStart;

        if (!($range instanceof self)) {
            $range = static::create($range);
        }

        [$start, $end] = $this->orderCouple($this->getStartDate(), $this->calculateEnd());
        [$rangeStart, $rangeEnd] = $this->orderCouple($range->getStartDate(), $range->calculateEnd());

        return $end > $rangeStart && $rangeEnd > $start;
    }
```

## 前提知識

- **期間（CarbonPeriod）**: 開始日と終了日の間の、日付の範囲を表す Carbon のクラスです。繰り返しや除外の条件も持てます。
- **重なりの判定**: 2 つの範囲が共通の部分を持つかを調べることです。一方の終わりが、もう一方の始まりより後で、かつ、その逆も成り立つ、という形で判定できます。
- **`orderCouple`**: 2 つの日付を、前後の順に並べて返すメソッドです。開始と終了が逆に与えられても、正しい順に直せます。
- **`calculateEnd`**: 期間の終わりの日付を、繰り返しなどを考えて計算するメソッドです。終わりが無い期間でも、終点を決められます。
- **分配の代入（`[$start, $end] = ...`）**: 配列の要素を、複数の変数へ一度に入れる書き方です。

## 何をしているか

### 1. 相手の期間を用意する

```php:line-numbers=2028
        $range = $rangeEnd ? static::create($rangeOrRangeStart, $rangeEnd) : $rangeOrRangeStart;

        if (!($range instanceof self)) {
            $range = static::create($range);
        }
```

引数が 2 つの日付なら、`create` で期間を作ります。引数が期間そのものなら、そのまま使います。期間でなければ、`create` で期間にしてから比べます。

### 2. 両方の期間を、前後の順にそろえる

```php:line-numbers=2034
        [$start, $end] = $this->orderCouple($this->getStartDate(), $this->calculateEnd());
        [$rangeStart, $rangeEnd] = $this->orderCouple($range->getStartDate(), $range->calculateEnd());
```

自分と相手のそれぞれについて、開始と終了を `orderCouple` で並べます。`calculateEnd` で、繰り返しを含めた終わりを求めてから並べているので、どちらも正しい範囲になります。

### 3. 重なりを、不等号で判定する

```php:line-numbers=2037
        return $end > $rangeStart && $rangeEnd > $start;
```

自分の終わりが相手の始まりより後で、相手の終わりが自分の始まりより後なら、重なっているので `true` です。端が接しているときは、不等号が `>` なので、`=` の場合は重なりとみなされません。

## ここがすごい

- 重なりを、2 つの不等号だけで判定しています。区間の交わりを調べる、最も基本的で正しい形です。
- 端が接するかどうかを、等しい場合を含まない `>` だけで表しています。3 月 10 日で続く 2 つの期間を、重なったものとして誤って扱わない作りです。
- 開始と終了を並べ直してから比べるので、逆向きに与えられた期間でも、結果が変わりません。
- 相手が期間でなくても、日付を受け取れるように作られています。呼び出し側は、型を変換せずに使えます。

## まとめ

`overlaps` は、2 つの期間が一部でも重なるかを、2 つの不等号で判定する関数です。端が接するだけの場合は重なりとしない決まりを、不等号の選び方で表しています。日付の範囲を扱う多くの処理の基礎になる、小さく大切な判定です。
