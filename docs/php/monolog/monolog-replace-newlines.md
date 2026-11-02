---
title: ログの中の改行を、1 行に収まる形に変える
description: Monolog の LineFormatter の replaceNewlines は、1 行ごとに書くログの中の改行を空白に変えます。ただし JSON のような形のメッセージでは、エスケープされた改行を実際の改行に戻せるように、別の扱いをします。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Formatter/LineFormatter.php
lines: [237, 253]
function: replaceNewlines
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, ログ]
---
## ひとことで

`replaceNewlines` は、ログを 1 行の文字列として書き出すときに、中に含まれる改行を整える関数です。通常は、改行を空白に変えて、1 行に収まるようにします。ただし、JSON のような形のメッセージで、`\n` という文字の並びが書かれているときだけは、それを本当の改行に戻す設定も用意されています。

## コード

```php:line-numbers=237
    protected function replaceNewlines(string $str): string
    {
        if ($this->allowInlineLineBreaks) {
            if (0 === strpos($str, '{') || 0 === strpos($str, '[')) {
                $str = preg_replace('/(?<!\\\\)\\\\[rn]/', "\n", $str);
                if (null === $str) {
                    $pcreErrorCode = preg_last_error();

                    throw new \RuntimeException('Failed to run preg_replace: ' . $pcreErrorCode . ' / ' . preg_last_error_msg());
                }
            }

            return $str;
        }

        return str_replace(["\r\n", "\r", "\n"], ' ', $str);
    }
```

## 前提知識

- **1 行形式のログ**: 1 件のログを 1 行にまとめて書くと、ファイルを行ごとに読むツールで扱いやすくなります。改行が混ざると、1 件のログが複数行に分かれてしまいます。
- **改行の種類**: `\n`（LF）と `\r\n`（CRLF）、`\r`（CR）があります。Windows と Unix では、使われる改行が違います。
- **エスケープ**: `\n` のように、バックスラッシュと文字を並べて、改行などを文字列として書く方法です。実際の改行ではなく、2 文字の並びになります。
- **`preg_replace`**: 正規表現に当たる部分を、別の文字列に置き換える関数です。
- **`strpos` で先頭を調べる**: 文字列が `{` や `[` で始まるかを確かめるのに使われています。JSON のような形かを、先頭の文字で判断しています。

## 何をしているか

### 1. 改行を許す設定のとき、JSON の形なら戻す

```php:line-numbers=239
        if ($this->allowInlineLineBreaks) {
            if (0 === strpos($str, '{') || 0 === strpos($str, '[')) {
                $str = preg_replace('/(?<!\\\\)\\\\[rn]/', "\n", $str);
```

`allowInlineLineBreaks` が `true` のとき、まず文字列の先頭が `{` か `[` かを調べます。JSON のオブジェクトや配列のような形なら、正規表現で `\n` や `\r` の並びを本当の改行に置き換えます。前にバックスラッシュがある場合は、置き換えないよう、否定の後読み `(?<!\\)` で除きます。

### 2. 置き換えに失敗したら、例外にする

```php:line-numbers=242
                if (null === $str) {
                    $pcreErrorCode = preg_last_error();

                    throw new \RuntimeException('Failed to run preg_replace: ' . $pcreErrorCode . ' / ' . preg_last_error_msg());
                }
```

`preg_replace` が `null` を返したときは、失敗しています。エラーの番号と説明を例外のメッセージに入れて投げます。

### 3. 改行を許さない設定、またはそれ以外

```php:line-numbers=249
            return $str;
```

JSON の形でないときや、改行を許さない設定のときは、そのまま返すか、次の行で改行を空白に変えます。

```php:line-numbers=252
        return str_replace(["\r\n", "\r", "\n"], ' ', $str);
```

`str_replace` で、`\r\n`、`\r`、`\n` を空白に置き換えます。配列の順番が大事で、`\r\n` を先に置き換えることで、2 つの改行が 2 つの空白になるのを防いでいます。

## ここがすごい

- 改行の扱いを、設定と文字列の形の 2 段階で決めています。JSON の中の `\n` は読みやすく残しつつ、通常の文章では 1 行に収めます。
- `\r\n` を最初に置き換える順番によって、Windows 形式の改行が 2 つの空白になる誤りを防いでいます。細かいけれど、大切な配慮です。
- 否定の後読み `(?<!\\)` で、本来バックスラッシュとして書かれた文字は、改行に変えずに残しています。見た目の正確さを守る工夫です。
- 正規表現の失敗を、`null` で確かめて例外にしています。ログの書き出しで起きた問題が、静かに消えないようになっています。

## まとめ

`replaceNewlines` は、ログの中の改行を、1 行の形式に合うように整える関数です。JSON の形のメッセージでは、エスケープされた改行を読みやすく戻す道も用意しています。改行の種類ごとの置き換えの順番まで気を配った、細やかな文字列処理の例です。
