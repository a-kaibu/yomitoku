---
title: コマンドの文字列を、引用符とエスケープを考えて単語に分ける
description: Symfony Console の StringInput::tokenize は、"hello world" --name='Ami' のようなコマンドの文字列を、引数の単語の配列に分けます。引用符とバックスラッシュを、1 文字ずつ正規表現で読み進めます。
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Console/Input/StringInput.php
lines: [47, 84]
function: StringInput::tokenize
difficulty: 3
format: 2
tags: [パース, 正規表現, 文字列処理]
---

## ひとことで

`tokenize` は、コマンドラインの 1 行の文字列を **引数の配列** に分けます。`"hello world"` のように引用符で囲まれた空白は 1 つの値として残し、`--name=Ami` のような形もきちんと分けます。Symfony Console で、文字列からコマンドを実行するときに使われます。

## コード

::: code-group

```php:line-numbers=47 [日本語訳]
    private function tokenize(string $input): array
    {
        $tokens = [];
        $length = \strlen($input);
        $cursor = 0;
        $token = null;
        while ($cursor < $length) {
            if ('\\' === $input[$cursor]) {
                $token .= $input[++$cursor] ?? '';
                ++$cursor;
                continue;
            }

            if (preg_match('/\s+/A', $input, $match, 0, $cursor)) {
                if (null !== $token) {
                    $tokens[] = $token;
                    $token = null;
                }
            } elseif (preg_match('/([^="\'\s]+?)(=?)('.self::REGEX_QUOTED_STRING.'+)/A', $input, $match, 0, $cursor)) {
                $token .= $match[1].$match[2].stripcslashes(preg_replace('/'.self::REGEX_QUOTED_STRING.'/', '$1$2', $match[3]));
            } elseif (preg_match('/'.self::REGEX_QUOTED_STRING.'/A', $input, $match, 0, $cursor)) {
                $token .= stripcslashes(substr($match[0], 1, -1));
            } elseif (preg_match('/'.self::REGEX_UNQUOTED_STRING.'/A', $input, $match, 0, $cursor)) {
                $token .= $match[1];
            } else {
                // ここに来ることはないはず。
                throw new InvalidArgumentException(\sprintf('Unable to parse input near "... %s ...".', substr($input, $cursor, 10)));
            }

            $cursor += \strlen($match[0]);
        }

        if (null !== $token) {
            $tokens[] = $token;
        }

        return $tokens;
    }
```

```php:line-numbers=47 [原文]
    private function tokenize(string $input): array
    {
        $tokens = [];
        $length = \strlen($input);
        $cursor = 0;
        $token = null;
        while ($cursor < $length) {
            if ('\\' === $input[$cursor]) {
                $token .= $input[++$cursor] ?? '';
                ++$cursor;
                continue;
            }

            if (preg_match('/\s+/A', $input, $match, 0, $cursor)) {
                if (null !== $token) {
                    $tokens[] = $token;
                    $token = null;
                }
            } elseif (preg_match('/([^="\'\s]+?)(=?)('.self::REGEX_QUOTED_STRING.'+)/A', $input, $match, 0, $cursor)) {
                $token .= $match[1].$match[2].stripcslashes(preg_replace('/'.self::REGEX_QUOTED_STRING.'/', '$1$2', $match[3]));
            } elseif (preg_match('/'.self::REGEX_QUOTED_STRING.'/A', $input, $match, 0, $cursor)) {
                $token .= stripcslashes(substr($match[0], 1, -1));
            } elseif (preg_match('/'.self::REGEX_UNQUOTED_STRING.'/A', $input, $match, 0, $cursor)) {
                $token .= $match[1];
            } else {
                // should never happen
                throw new InvalidArgumentException(\sprintf('Unable to parse input near "... %s ...".', substr($input, $cursor, 10)));
            }

            $cursor += \strlen($match[0]);
        }

        if (null !== $token) {
            $tokens[] = $token;
        }

        return $tokens;
    }
```

:::

## 前提知識

- **トークン**: 文字列を意味のある最小の単位に区切ったものです。ここではコマンドの 1 つの引数に当たります。
- **バックスラッシュ `\`**: 次の 1 文字を特別扱いしない（エスケープする）記号です。
- **カーソル**: 文字列の中で、今どの位置を読んでいるかを表す数字です。
- **`preg_match` の `/A` 修飾子**: 正規表現を、指定した位置（カーソル）からだけ一致させる指定です。
- **`continue`**: ループの残りを飛ばして、次の繰り返しに進む命令です。

## 何をしているか

### 1. バックスラッシュは、次の 1 文字をそのまま残す

```php:line-numbers=53
        while ($cursor < $length) {
            if ('\\' === $input[$cursor]) {
                $token .= $input[++$cursor] ?? '';
                ++$cursor;
                continue;
            }
```

`$cursor` を進めながら文字列を読みます。`\` が来たら、次の 1 文字を `$token` に入れ、カーソルを 2 つ進めます。こうすると、`\"` のような引用符も、ただの文字として取り込めます。

### 2. 空白は、単語の区切りにする

```php:line-numbers=60
            if (preg_match('/\s+/A', $input, $match, 0, $cursor)) {
                if (null !== $token) {
                    $tokens[] = $token;
                    $token = null;
                }
```

`/\s+/A` は、今の位置から空白が続くかを調べます。空白なら、今まで作っていた `$token` を配列に入れて、次の単語に進みます。

### 3. `=` の前後と、引用符の中身を取り込む

```php:line-numbers=65
            } elseif (preg_match('/([^="\'\s]+?)(=?)('.self::REGEX_QUOTED_STRING.'+)/A', $input, $match, 0, $cursor)) {
                $token .= $match[1].$match[2].stripcslashes(preg_replace('/'.self::REGEX_QUOTED_STRING.'/', '$1$2', $match[3]));
            } elseif (preg_match('/'.self::REGEX_QUOTED_STRING.'/A', $input, $match, 0, $cursor)) {
                $token .= stripcslashes(substr($match[0], 1, -1));
            } elseif (preg_match('/'.self::REGEX_UNQUOTED_STRING.'/A', $input, $match, 0, $cursor)) {
                $token .= $match[1];
```

`--name="Ami"` のように、値が引用符で囲まれている場合は、引用符を外した中身を `$token` につなぎます。`stripcslashes` は、中のバックスラッシュの書き方（`\n` など）を実際の文字に変えます。

### 4. 最後に、読めなかったら例外

::: code-group

```php:line-numbers=71 [日本語訳]
            } else {
                // ここに来ることはないはず。
                throw new InvalidArgumentException(\sprintf('Unable to parse input near "... %s ...".', substr($input, $cursor, 10)));
            }
```

```php:line-numbers=71 [原文]
            } else {
                // should never happen
                throw new InvalidArgumentException(\sprintf('Unable to parse input near "... %s ...".', substr($input, $cursor, 10)));
            }
```

:::

どのパターンにも当てはまらなかった場合は、`InvalidArgumentException` を投げます。コメントにあるとおり、通常はここに来ることはありません。

ここまで読めたら、カーソルを読んだ分だけ進め、次の位置へ進みます。

## ここがすごい

### 1 文字ずつ、位置を決めて読む

正規表現で一度に全部を分けると、引用符の中の空白と、外の空白の区別が難しくなります。この関数は、カーソルの位置から「今どのパターンに当てはまるか」を順に試します。1 つずつ読むので、途中のエスケープや引用符の扱いを、ルールどおりに書けます。

### `/A` で、今の位置からだけ一致させる

```php:line-numbers=60
            if (preg_match('/\s+/A', $input, $match, 0, $cursor)) {
```

`/A` 修飾子があると、正規表現は指定した位置からしか一致しません。カーソルより前の文字を見ないので、同じ文字列を何度も切り出す必要がありません。読み取った部分だけを進めていく、構文解析の典型的な書き方です。

### 引用符の外し方を、最後に一括で

```php:line-numbers=66
                $token .= $match[1].$match[2].stripcslashes(preg_replace('/'.self::REGEX_QUOTED_STRING.'/', '$1$2', $match[3]));
            } elseif (preg_match('/'.self::REGEX_QUOTED_STRING.'/A', $input, $match, 0, $cursor)) {
                $token .= stripcslashes(substr($match[0], 1, -1));
```

引用符を外す処理は、値の部分に対してだけ行います。引用符の中の `\n` のような書き方を、必要なときだけ実際の文字に変えています。

## まとめ

- 文字列を単語に分けるには、先頭から 1 文字ずつ位置を進めて読むと、ルールを正確に書ける。
- 正規表現の `/A` を使うと、カーソルの位置から一致させる読み方ができる。
- バックスラッシュは「次の 1 文字をそのまま」と決めると、引用符の扱いが単純になる。
- 想定外の入力には、例外を投げて早く気づけるようにしておく。
