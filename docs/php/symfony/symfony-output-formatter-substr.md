---
title: 色の指定を数えずに、表示される文字だけを切り出す
description: Symfony Console の OutputFormatter::substr は、ANSI の色の制御記号を数えずに、表示される文字の位置で切り出します。制御記号が無ければ標準の切り出しに任せます。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "e6396e82011ded4608b896e8fff4da24d253382a"
file: src/Symfony/Component/Console/Formatter/OutputFormatter.php
lines: [382, 403]
function: OutputFormatter::substr
difficulty: 3
format: 2
tags: [CLI, 文字列処理, パース]
---
## ひとことで

`substr` は、色付きの文字列を、表示される文字の位置で切り出す非公開の関数です。ターミナルの色は `ESC` で始まる制御記号として文字列に埋め込まれるので、普通の切り出しをすると、色の記号まで数えてしまいます。この関数は、それを避けます。

## コード

```php:line-numbers=382
    private function substr(string $text, int $from, ?int $length = null): string
    {
        if (!str_contains($text, "\e")) {
            return Helper::substr($text, $from, $length);
        }

        $result = '';
        $position = 0;
        foreach ($this->getTokens($text) as $token) {
            $isAnsi = preg_match(self::ANSI_REGEX, $token);
            if ($position >= $from && (null === $length || $position < $from + $length || $isAnsi && $position === $from + $length)
                && (!$isAnsi || !$from || $position > $from)
            ) {
                $result .= $token;
            }
            if (!$isAnsi) {
                ++$position;
            }
        }

        return $result;
    }
```

## 前提知識

- **ESC 文字（`\e`）**: 制御記号の始まりを表す見えない文字です。ターミナルは、`ESC[31m` のような並びを見て、文字の色を変えます。
- **表示される位置**: 画面に見える文字の番号です。色の記号は、画面に何も出さないので、この番号には数えません。
- **`Helper::substr`**: 文字の幅を考えて切り出す、Symfony Console の共通の関数です。
- **`foreach` と `getTokens`**: 文字列を、通常の文字と制御記号の断片に分けて、1 つずつ取り出します。
- **`preg_match`**: 正規表現で一致を調べる関数です。ここでは、断片が制御記号かどうかを判定します。
- **`++$position`**: 変数を 1 増やす書き方です。

## 何をしているか

### 1. 制御記号が無ければ、通常の切り出しに任せる

```php:line-numbers=384
        if (!str_contains($text, "\e")) {
            return Helper::substr($text, $from, $length);
        }
```

ESC 文字を含まなければ、色の記号は無いので、共通の切り出しをそのまま使います。ほとんどの文字列は、この早い経路を通ります。

### 2. 断片ごとに、制御記号かどうかを判定する

```php:line-numbers=388
        $result = '';
        $position = 0;
        foreach ($this->getTokens($text) as $token) {
            $isAnsi = preg_match(self::ANSI_REGEX, $token);
```

文字列を断片に分けて、1 つずつ見ていきます。`$position` は、制御記号を除いた表示の位置です。`$isAnsi` で、その断片が制御記号かを判定します。

### 3. 範囲に入る断片だけを足す

```php:line-numbers=392
            if ($position >= $from && (null === $length || $position < $from + $length || $isAnsi && $position === $from + $length)
                && (!$isAnsi || !$from || $position > $from)
            ) {
                $result .= $token;
            }
```

表示の位置が切り出しの範囲にある断片を、結果に足します。制御記号は、範囲の端にあるものを残します。色の指定が途中で消えると、その後の文字の色が崩れるからです。

### 4. 制御記号は位置を進めない

```php:line-numbers=397
            if (!$isAnsi) {
                ++$position;
            }
```

制御記号でない断片だけ、位置を 1 進めます。制御記号は画面に何も出さないので、位置を数えないのです。

## ここがすごい

- **見た目の長さで切る**: 色の記号を数えないので、表示上の列の位置がずれません。表の列揃えが、色の付いた文字列でも正しく保たれます。
- **制御記号を必要なところで残す**: 範囲の端にある制御記号を残すことで、切り出した文字列の色が、途中で壊れないようにしています。
- **早い経路の用意**: 制御記号が無ければ、断片に分ける処理を省きます。よくある平文の表示が、速く済みます。
- **表示の仕組みと対応**: 「位置は表示の文字数で数える」という規則が、コードの形にそのまま表れています。

## まとめ

- 色の付いた文字列を切るときは、制御記号を数えず、表示される文字の位置で切る。
- 制御記号は、切り出しの端で壊れないように、必要なものを残す。
- 制御記号が無い文字列は、通常の切り出しに任せると速い。
