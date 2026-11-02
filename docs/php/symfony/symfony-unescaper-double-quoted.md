---
title: YAML の \n などの書き方を、正しい文字に直す
description: Symfony の YAML パーサーは、ダブルクォートの中の \n や \t を実際の改行やタブに直します。正規表現で見つけた記号ごとに、match 式で変換先を選んでいます。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Yaml/Unescaper.php
lines: [46, 52]
function: Unescaper::unescapeDoubleQuotedString
difficulty: 2
format: 2
tags: [パース, 文字列処理, 正規表現]
---

## ひとことで

`unescapeDoubleQuotedString` は、YAML の **ダブルクォートで囲まれた文字列** の中にある `\n`（改行）や `\t`（タブ）のような書き方を、実際の文字に変換します。設定ファイルに書いた改行が、正しく読み込まれるようにするための関数です。

## コード

::: code-group

```php:line-numbers=46 [日本語訳]
    public function unescapeDoubleQuotedString(string $value): string
    {
        $callback = fn ($match) => $this->unescapeCharacter($match[0]);

        // 文字列を評価する。
        return preg_replace_callback('/'.self::REGEX_ESCAPED_CHARACTER.'/u', $callback, $value);
    }
```

```php:line-numbers=46 [原文]
    public function unescapeDoubleQuotedString(string $value): string
    {
        $callback = fn ($match) => $this->unescapeCharacter($match[0]);

        // evaluate the string
        return preg_replace_callback('/'.self::REGEX_ESCAPED_CHARACTER.'/u', $callback, $value);
    }
```

:::

## 前提知識

- **YAML**: 設定ファイルによく使われる、インデントで構造を表すデータ形式です。
- **エスケープ**: 普通には書けない文字を、`\` と別の文字の組み合わせで表すことです。`\n` は改行を表します。
- **`preg_replace_callback`**: 正規表現に一致した部分を、関数で変換して置き換える関数です。
- **`match` 式**: 値に応じて結果を選ぶ PHP の書き方です。
- **無名関数（アロー関数）**: `fn ($match) => ...` のように 1 行で書く関数です。

## 何をしているか

### 1. 変換の関数を用意する

```php:line-numbers=48
        $callback = fn ($match) => $this->unescapeCharacter($match[0]);
```

`fn ($match) => $this->unescapeCharacter($match[0])` は、見つけた 1 つのエスケープ文字を、`unescapeCharacter` に渡すための小さな関数です。

### 2. エスケープの並びを見つけて、置き換える

```php:line-numbers=51
        return preg_replace_callback('/'.self::REGEX_ESCAPED_CHARACTER.'/u', $callback, $value);
```

`REGEX_ESCAPED_CHARACTER` は、`\` と、そのあとに続くエスケープされた文字にマッチする正規表現です。`preg_replace_callback` で、見つけた部分ごとに `$callback` を呼び、その戻り値で置き換えます。

### 3. 文字ごとに、変換先を選ぶ

<!-- source: src/Symfony/Component/Yaml/Unescaper.php -->
```php:line-numbers=59
    private function unescapeCharacter(string $value): string
    {
        return match ($value[1]) {
            '0' => "\x0",
            'a' => "\x7",
            'b' => "\x8",
            't' => "\t",
            "\t" => "\t",
            'n' => "\n",
            'v' => "\xB",
            'f' => "\xC",
            'r' => "\r",
```

`unescapeCharacter` は、`$value[1]`（バックスラッシュの次の文字）を見て、`match` で変換先を決めます。`'n'` は改行、`'t'` はタブ、`'0'` は NUL 文字です。

具体例として、`"a\tb"` の `\t` は、`match` の `'t'` に当たり、タブ文字に置き換わります。

## ここがすごい

### 見つけた部分だけを、順番どおりに置き換える

エスケープを 1 つずつ探して変換するのは、文字列の先頭から順に読むのと同じです。`preg_replace_callback` を使えば、文字列全体を 1 回の処理で置き換えられます。元の文字列の別の部分は、そのまま残ります。

### 変換の対応表を、`match` で 1 か所にまとめている

改行、タブ、NUL など、変換先の対応が一覧になっているので、どの文字がどう変わるかが一目でわかります。YAML の仕様表を、そのままコードに写したような書き方です。

### 変換は文字列の中の「\」だけに効く

ダブルクォートの外にある `\n` は、ふつうの文字として残ります。この関数は、ダブルクォートの中身を扱うときだけ呼ばれるので、どこに変換が効くかを設計で限っています。

## まとめ

- 文字列の中の記号は、正規表現で見つけて、見つけた部分ごとに変換すると確実。
- 変換の対応は `match` のような 1 つの表にまとめると、仕様との対応が見やすい。
- 変換が効く範囲は、呼び出す場所で決めると、ほかの文字列に影響しない。
- エスケープは、「バックスラッシュと次の 1 文字」を単位に読むと理解しやすい。
