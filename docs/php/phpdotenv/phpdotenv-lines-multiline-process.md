---
title: "複数行の値の始まりと終わりを、行ごとに判定する"
description: "phpdotenv の Lines::multilineProcess は、.env の 1 行が複数行の値の途中かどうかを判定します。始まりの行を見つけたら、終わりの引用符が出るまで行をためておきます。"
language: php
project: phpdotenv
repo: https://github.com/vlucas/phpdotenv
license: BSD-3-Clause
copyright: Copyright (c) 2014, Graham Campbell.
commit: "96149103e62ac67e915f6d2ef59b72dee2e011e0"
file: src/Parser/Lines.php
lines: [63, 83]
function: Lines::multilineProcess
difficulty: 3
format: 2
tags: [パース, 状態機械, 文字列処理]
---

## ひとことで

`multilineProcess` は、`.env` の **1 行** を受け取って、それが複数行の値の一部かを判定する関数です。始まりの行から終わりの行まで、行を順にためておき、終わったら 1 つの文字列にして返します。

## コード

::: code-group

```php:line-numbers=63 [日本語訳]
    private static function multilineProcess(bool $multiline, string $line, array $buffer)
    {
        $startsOnCurrentLine = $multiline ? false : self::looksLikeMultilineStart($line);

        // この行が複数行の値の始まりになりうるかを確かめる。
        if ($startsOnCurrentLine) {
            $multiline = true;
        }

        if ($multiline) {
            \array_push($buffer, $line);

            if (self::looksLikeMultilineStop($line, $startsOnCurrentLine)) {
                $multiline = false;
                $line = \implode("\n", $buffer);
                $buffer = [];
            }
        }

        return [$multiline, $line, $buffer];
    }
```

```php:line-numbers=63 [原文]
    private static function multilineProcess(bool $multiline, string $line, array $buffer)
    {
        $startsOnCurrentLine = $multiline ? false : self::looksLikeMultilineStart($line);

        // check if $line can be multiline variable
        if ($startsOnCurrentLine) {
            $multiline = true;
        }

        if ($multiline) {
            \array_push($buffer, $line);

            if (self::looksLikeMultilineStop($line, $startsOnCurrentLine)) {
                $multiline = false;
                $line = \implode("\n", $buffer);
                $buffer = [];
            }
        }

        return [$multiline, $line, $buffer];
    }
```

:::

## 前提知識

- **状態（ステート）**: 今が「複数行の途中」か「普通の行」かを表す情報です。
- **`array_push`**: 配列の末尾に要素を追加する PHP の関数です。
- **`implode`**: 配列の要素を、指定した文字（ここでは改行）でつなぐ関数です。
- **三項演算子**: 条件によって値を選ぶ書き方です。`$multiline ? false : ...` のように使います。
- **戻り値の配列**: 関数が「状態・行・バッファ」の 3 つをまとめて返します。

## 何をしているか

### 1. この行が、複数行の値の始まりかを判定する

::: code-group

```php:line-numbers=65 [日本語訳]
        $startsOnCurrentLine = $multiline ? false : self::looksLikeMultilineStart($line);

        // この行が複数行の値の始まりになりうるかを確かめる。
        if ($startsOnCurrentLine) {
            $multiline = true;
        }
```

```php:line-numbers=65 [原文]
        $startsOnCurrentLine = $multiline ? false : self::looksLikeMultilineStart($line);

        // check if $line can be multiline variable
        if ($startsOnCurrentLine) {
            $multiline = true;
        }
```

:::

今が複数行の途中でなければ、この行が始まりかを調べます。始まりなら `$multiline` を `true` にします。途中なら、始まりの判定は行いません。

### 2. 途中の行は、バッファに追加する

```php:line-numbers=72
        if ($multiline) {
            \array_push($buffer, $line);

```

複数行の中にいるときは、その行をバッファ（ためておく配列）に追加します。

### 3. 終わりの行なら、1 つにまとめて状態を戻す

```php:line-numbers=75
            if (self::looksLikeMultilineStop($line, $startsOnCurrentLine)) {
                $multiline = false;
                $line = \implode("\n", $buffer);
                $buffer = [];
            }
        }
```

`looksLikeMultilineStop` で終わりかを調べます。終わりなら、ためていた行を改行でつないで 1 つの `$line` にし、バッファを空にして、`$multiline` を `false` に戻します。

### 4. 3 つの値をまとめて返す

```php:line-numbers=82
        return [$multiline, $line, $buffer];
```

「今の状態」「処理後の行」「バッファ」の 3 つを、配列にして返します。呼び出し側は、この 3 つを次の行の処理に引き継ぎます。

具体例として `KEY="ab` の行で始まり、`cd"` の行で終わると、2 行がつながって `KEY="ab\ncd"` の 1 行になります。

## ここがすごい

### 状態を、引数と戻り値で受け渡している

この関数は、自分では状態を覚えません。今の状態を受け取り、新しい状態を返すだけです。状態の持ち主が呼び出し側に 1 か所にまとまっているので、関数の動きを見ると、入力と出力だけで理解できます。

### 始まりの判定を、終わりに使う

```php:line-numbers=65
        $startsOnCurrentLine = $multiline ? false : self::looksLikeMultilineStart($line);
```

同じ行に始まりと終わりがあるケースを区別するために、`$startsOnCurrentLine` を使っています。始まった行で終わる場合は、引用符が 2 つ必要です。途中から始まった行は、引用符が 1 つあれば終わりになります。判定の基準を、状態に合わせて変えています。

### 中身を、改行で正しくつなぐ

複数行の値は、改行を含んだ 1 つの文字列として扱いたいので、`implode("\n", ...)` で改行を戻します。行を分けて読んだ後も、元の値の形を保てるようにしています。

## まとめ

- 複数行の値は、状態を持つ関数を行ごとに呼び出すと、流れを追いやすい。
- 状態は関数の入力と戻り値で受け渡すと、どこで何が変わるかが明確になる。
- 始まりと終わりの判定は、同じ行かどうかで基準を変えると正確になる。
- 行をつなぐときは、元の改行を戻して値の形を保つ。
