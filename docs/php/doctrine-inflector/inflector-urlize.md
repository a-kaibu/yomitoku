---
title: 記号を-に置き換えて、URLに使える文字列にする
description: Doctrine Inflector の urlize は、記事のタイトルを URL の一部に使える形に変えます。アクセント記号を取り、英数字以外を - でつなぐ、正規表現による置き換えの連続です。
language: php
project: Doctrine Inflector
repo: https://github.com/doctrine/inflector
license: MIT
copyright: Copyright (c) 2006-2015 Doctrine Project
commit: "4525be0a5b5650c00c6c866d8621a6ee1589eb48"
file: src/Inflector.php
lines: [455, 485]
function: Inflector::urlize
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, Unicode]
---
## ひとことで

`urlize` は、任意の文字列を URL のスラッグ（`hello-world` のような形）に変える関数です。アクセント記号を外し、小文字にしたあと、英数字以外の並びを `-` に置き換えて、両端の `-` を取り除きます。

## コード

```php:line-numbers=455
        $unaccented = $this->unaccent($string);

        if (function_exists('mb_strtolower')) {
            $lowered = mb_strtolower($unaccented);
        } else {
            $lowered = strtolower($unaccented);
        }

        $replacements = [
            '/\W/' => ' ',
            '/([A-Z]+)([A-Z][a-z])/' => '\1_\2',
            '/([a-z\d])([A-Z])/' => '\1_\2',
            '/[^A-Z^a-z^0-9^\/]+/' => '-',
        ];

        $urlized = $lowered;

        foreach ($replacements as $pattern => $replacement) {
            $replaced = preg_replace($pattern, $replacement, $urlized);

            if ($replaced === null) {
                throw new RuntimeException(sprintf(
                    'preg_replace returned null for value "%s"',
                    $urlized
                ));
            }

            $urlized = $replaced;
        }

        return trim($urlized, '-');
```

## 前提知識

- **スラッグ**: URL の中で、記事などを表す読みやすい部分です。`/blog/hello-world` の `hello-world` がスラッグです。英小文字、数字、`-` だけで作るのが一般的です。
- **`$this->unaccent`**: アクセント付きの文字（`é` など）を、基本の英字に置き換えるメソッドです。このコードの前で呼ばれています。
- **連想配列**: `'パターン' => '置換後'` の組を並べた配列です。`foreach` で、キーと値を 1 組ずつ取り出せます。
- **`\W`**: 英数字と `_` 以外の文字に合う正規表現の記号です。
- **`foreach`**: 配列の要素を 1 つずつ取り出して、同じ処理を繰り返す文です。
- **`trim($s, '-')`**: 文字列の両端から、指定した文字を取り除く関数です。

## 何をしているか

### 1. アクセントを外し、小文字にする

```php:line-numbers=455
        $unaccented = $this->unaccent($string);
```

まず、`é` を `e` に変えます。URL に使える文字だけを残すための準備です。

続く `if` は、`mb_strtolower` が使えれば小文字に、無ければ `strtolower` で小文字にします。小文字化のあとは、大文字の探索が効かなくなるため、注意が必要です。（後で触れます。）

### 2. 置き換えの規則を並べる

```php:line-numbers=463
        $replacements = [
            '/\W/' => ' ',
            '/([A-Z]+)([A-Z][a-z])/' => '\1_\2',
            '/([a-z\d])([A-Z])/' => '\1_\2',
            '/[^A-Z^a-z^0-9^\/]+/' => '-',
        ];
```

4 つの規則が、上から順に適用されます。1 つめの `\W` は、英数字と `_` 以外の文字（記号や空白）を空白 1 つに置き換えます。最後の規則は、英数字と `/` 以外の並びを `-` にします。

中ほどの 2 つは、大文字の境目に `_` を入れるための規則です。キャメルケースを分ける意図があります。

### 3. 規則を順に適用する

```php:line-numbers=472
        foreach ($replacements as $pattern => $replacement) {
            $replaced = preg_replace($pattern, $replacement, $urlized);
```

`foreach` で 4 つの規則を順に取り出し、`preg_replace` で `$urlized` に適用します。前の規則の結果が、次の規則の入力になります。

たとえば `Hello World!` は、小文字化で `hello world!` になります。1 つめの規則で `!` が空白になり、`hello world ` になります。最後の規則で、空白が `-` になり、`hello-world-` になります。

### 4. 両端の `-` を取る

```php:line-numbers=485
        return trim($urlized, '-');
```

最後の `trim` で、先頭と末尾の `-` を取り除きます。`hello-world-` は `hello-world` になります。

## ここがすごい

- **規則を表として並べる**: 置き換えの規則を、配列のデータとして並べています。規則を足したり消したりするとき、処理の本体を書き換えずに済みます。
- **失敗を検出する**: 規則ごとに `preg_replace` の `null` を確かめて、失敗したら例外にします。
- **英数字以外をまとめて 1 つに**: 最後の規則は `+` を付けているので、連続する記号が 1 つの `-` にまとまります。`a---b` のような重なりを防いでいます。
- **注意点**: 小文字化をしたあとに、大文字を探す規則（中ほどの 2 つ）が走っています。小文字しか残っていないので、この 2 つの規則は実際にはほとんど効きません。キャメルケースを分けたい場合は、小文字化より前に規則を適用する必要があります。読み手が「効いているはず」と思い込まないように、ここで確かめておくとよいでしょう。

## まとめ

- URL の文字列は、アクセント除去、小文字化、記号の置き換え、両端の整理、の順に作る。
- 置き換えの規則は、配列にして順番に適用すると拡張しやすい。
- `+` を付けた規則で、連続する記号を 1 つの区切りにまとめる。
- 処理の順番によって、規則が効くかどうかが変わるので、順序を読むことが大切。
