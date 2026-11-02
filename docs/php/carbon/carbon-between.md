---
title: 日付の大小を入れ替えてから範囲を比べる
description: Carbon の between は、開始と終了が逆に渡されても同じ結果になるように、2 つの日付を並べ替えてから比べます。範囲判定で入力の順番を気にしなくて済む工夫です。
language: php
project: Carbon
repo: https://github.com/briannesbitt/Carbon
license: MIT
copyright: Copyright (C) Brian Nesbitt
commit: "16c07968d5d346424ae69c2ea7814c586f62d37d"
file: src/Carbon/Traits/Comparison.php
lines: [294, 308]
function: Comparison::between
difficulty: 1
format: 2
tags: [日時, API設計, 防御的プログラミング]
---
## ひとことで

`between` は、ある日時が 2 つの日時の間にあるかを調べるメソッドです。2 つの日時の前後が逆でも、先に小さいほうと大きいほうに並べ替えてから比べるので、`between(開始, 終了)` と `between(終了, 開始)` が同じ結果を返します。

## コード

```php:line-numbers=294
    public function between(DateTimeInterface|string $date1, DateTimeInterface|string $date2, bool $equal = true): bool
    {
        $date1 = $this->resolveCarbon($date1);
        $date2 = $this->resolveCarbon($date2);

        if ($date1->greaterThan($date2)) {
            [$date1, $date2] = [$date2, $date1];
        }

        if ($equal) {
            return $this >= $date1 && $this <= $date2;
        }

        return $this > $date1 && $this < $date2;
    }
```

## 前提知識

- **`DateTimeInterface|string`**: 引数は PHP 標準の日時オブジェクトか文字列のどちらでもよい、という型の指定です。`|` は「または」の意味です。
- **`resolveCarbon`**: 引数を Carbon のオブジェクトに変換する内部のメソッドです。文字列の `"2024-01-01"` も、ここで日時に直されます。
- **`greaterThan`**: 「より後である」かを調べる比較メソッドです。
- **`[$a, $b] = [$b, $a];`**: 配列の分解代入です。変数の中身を一度に入れ替えられます。一時変数が要りません。
- **`$this >= $date1`**: Carbon は比較演算子で日時を大小比べられます。PHP の `DateTime` の仕様によるものです。
- **`bool $equal = true`**: 省略すると `true` になる引数で、端点を含めるかどうかを切り替えます。

## 何をしているか

### 1. 両方の引数を Carbon に揃える

```php:line-numbers=296
        $date1 = $this->resolveCarbon($date1);
        $date2 = $this->resolveCarbon($date2);
```

文字列でも日時オブジェクトでも、同じ `Carbon` の形に直します。これで、以降の比較は型を気にせずに書けます。

### 2. 小さいほうを前に置く

```php:line-numbers=299
        if ($date1->greaterThan($date2)) {
            [$date1, $date2] = [$date2, $date1];
        }
```

`$date1` が `$date2` より後なら、2 つの変数の中身を入れ替えます。たとえば `between('2024-03-10', '2024-03-01')` を呼ぶと、内部では `2024-03-01` が前、`2024-03-10` が後になります。

この 3 行があるので、呼ぶ人は「開始と終了」の順番を覚えなくてよくなります。

### 3. 端点を含めるかで比較を変える

```php:line-numbers=303
        if ($equal) {
            return $this >= $date1 && $this <= $date2;
        }

        return $this > $date1 && $this < $date2;
```

`$equal` が `true`（既定値）のときは、端点ぴったりの日時も範囲に入ります。`false` のときは、端点を含まない開いた範囲になります。`$this` は、呼び出し元の日時（ここでは調べたい日時）です。

たとえば `2024-03-01` を `2024-03-01` から `2024-03-10` の範囲で調べると、`$equal` が `true` なら結果は `true`、`false` なら `false` です。

## ここがすごい

- **入力の順番に依存しない**: 範囲の判定で、開始と終了を取り違えるバグは多くあります。ここでは並べ替えをライブラリ側で受け持つので、呼ぶ側が正しい順番を保証する必要がありません。
- **比較は 2 回だけ**: 並べ替えの比較が 1 回、範囲の判定が 1 回です。計算量は小さく、読みやすい形になっています。
- **同じ型で比べる**: 文字列を先に Carbon に直すので、比べ方が文字列の辞書順になることがありません。日付の文字列を `<` で比べると、書式によっては誤った結果になります。
- **端点の扱いを引数で選べる**: `isBetween` や `betweenIncluded`、`betweenExcluded` など、同じ判定の別の名前も用意されています。呼ぶ側は意図に合う名前を選べます。

## まとめ

- 範囲の判定は、開始と終了の順番を先に揃えてから行うと安全。
- Carbon の `between` は、順番の入れ替えを内部でやってくれる。
- 文字列は比較の前に日時へ変換すると、辞書順の誤りを避けられる。
- 端点を含めるかどうかは、引数で明確に切り替えられるようにする。
