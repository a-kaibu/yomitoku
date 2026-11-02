---
title: ISO 8601 の期間の文字列を、部品ごとに読み取る
description: Carbon の CarbonPeriod の parseIso8601 は、R5/2008-03-01/P1D のような ISO 8601 の期間の書き方を、繰り返し回数、間隔、開始日、終了日の部品に分けます。各部品の形を見て、どれに当たるかを順に判定しています。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/CarbonPeriod.php
lines: [530, 556]
function: parseIso8601
difficulty: 3
format: 2
tags: [パース, 日時, 正規表現]
---
## ひとことで

`parseIso8601` は、日付の期間を表す ISO 8601 の文字列を読み取る関数です。`/` で区切られた部品を、先頭から順に見て、繰り返しの回数（`R5`）、間隔（`P1D`）、開始日、終了日のどれかを判定します。判定した結果を、順番どおりに配列で返します。

## コード

```php:line-numbers=530
    protected static function parseIso8601(string $iso): array
    {
        $result = [];

        $interval = null;
        $start = null;
        $end = null;
        $dateClass = static::DEFAULT_DATE_CLASS;

        foreach (explode('/', $iso) as $key => $part) {
            if ($key === 0 && preg_match('/^R(\d*|INF)$/', $part, $match)) {
                $parsed = \strlen($match[1]) ? (($match[1] !== 'INF') ? (int) $match[1] : INF) : null;
            } elseif ($interval === null && $parsed = self::makeInterval($part)) {
                $interval = $part;
            } elseif ($start === null && $parsed = $dateClass::make($part)) {
                $start = $part;
            } elseif ($end === null && $parsed = $dateClass::make(static::addMissingParts($start ?? '', $part))) {
                $end = $part;
            } else {
                throw new InvalidPeriodParameterException("Invalid ISO 8601 specification: $iso.");
            }

            $result[] = $parsed;
        }

        return $result;
    }
```

## 前提知識

- **ISO 8601 の期間**: 日付と時間の書き方を決めた国際規格です。期間は `開始/終了` や `開始/間隔` のように、`/` で区切って書きます。
- **繰り返し（`R`）**: `R5` は「5 回繰り返す」という意味です。`R` の後ろに数字がなければ、回数は指定されていないものとして `null` になります。`RINF` と書けば、無限に繰り返すことを表します。
- **間隔（`P`）**: `P1D` は「1 日」、`P1M` は「1 か月」のように、期間の長さを表します。`P` で始まります。
- **`static` と `static::`**: 呼ばれたクラスの値を参照する書き方です。ここでは、`DEFAULT_DATE_CLASS` で既定の日付クラスを決めています。
- **`InvalidPeriodParameterException`**: 期間の指定が正しくないときに投げる例外です。

## 何をしているか

### 1. 最初の部品が繰り返しかを見る

```php:line-numbers=539
        foreach (explode('/', $iso) as $key => $part) {
            if ($key === 0 && preg_match('/^R(\d*|INF)$/', $part, $match)) {
                $parsed = \strlen($match[1]) ? (($match[1] !== 'INF') ? (int) $match[1] : INF) : null;
```

`explode('/', $iso)` で部品に分け、先頭の部品（`$key === 0`）が `R` で始まる形かを、正規表現で確かめます。数字があれば整数に、`INF` なら無限大に、何も無ければ `null` にします。

### 2. 次に、間隔か日付かを判定する

```php:line-numbers=542
            } elseif ($interval === null && $parsed = self::makeInterval($part)) {
                $interval = $part;
            } elseif ($start === null && $parsed = $dateClass::make($part)) {
                $start = $part;
```

まだ間隔が決まっていなければ、`makeInterval` で、その部品が間隔の書き方かを確かめます。間隔でなければ、開始日として `make` を試します。`$parsed =` の代入と判定を、`&&` の中で同時に行っています。

### 3. 残りは終了日として読む

```php:line-numbers=546
            } elseif ($end === null && $parsed = $dateClass::make(static::addMissingParts($start ?? '', $part))) {
                $end = $part;
```

終了日がまだ無ければ、開始日を使って足りない部分を補ってから、日付として読みます。たとえば開始日が `2008-03-01` で、終了日が `03-10` だけなら、年を補えます。

### 4. どれにも当てはまらなければ例外

```php:line-numbers=548
            } else {
                throw new InvalidPeriodParameterException("Invalid ISO 8601 specification: $iso.");
            }

            $result[] = $parsed;
        }

        return $result;
```

どの判定にも当てはまらなければ、`InvalidPeriodParameterException` を投げて、元の文字列を示します。最後に、判定した値を結果の配列へ順番に入れて返します。

## ここがすごい

- 部品の順番に頼らず、各部品の形を見て役割を決めています。`R` で始まるものは繰り返し、間隔の形のものは間隔、と形で判断するので、`/` の数が少なくても正しく読めます。
- `$parsed = ...` の代入を、条件の中で行っています。判定と値の取り出しを 1 回で済ませ、同じ解析を二度行わずに済みます。
- 終了日を、開始日から足りない部分を補って読むので、`03-10` のような省略された書き方にも対応します。
- 判定できない部品があれば、元の文字列を例外に入れて知らせます。どこが誤りかを、利用者が見つけやすくなっています。

## まとめ

`parseIso8601` は、ISO 8601 の期間の文字列を、繰り返し、間隔、開始日、終了日に分けて読み取る関数です。部品の形で役割を判定し、足りない日付は開始日から補います。規格の書き方を、少ない条件分岐で丁寧に扱っている点が、読みどころです。
