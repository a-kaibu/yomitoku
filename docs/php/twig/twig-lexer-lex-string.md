---
title: "ダブルクォートの文字列を、「#{}」の埋め込みも含めて読む"
description: "Twig の字句解析器（Lexer）の lexString は、テンプレートの \"...\" の中身を読みます。文字列の中に埋め込まれた式の開始と終了を見分ける、状態の切り替えが見どころです。"
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Lexer.php
lines: [529, 551]
function: Lexer::lexString
difficulty: 3
format: 2
tags: [パース, 状態機械, 正規表現]
---

## ひとことで

`lexString` は、Twig テンプレートの `"..."` の中身を **トークン（意味のある単位）に切り分ける** 関数です。文字列の中に `#{変数}` のような式が埋め込まれていても、文字列と式の境目を正しく見分けます。

## コード

::: code-group

```php:line-numbers=529 [日本語訳]
    private function lexString(): void
    {
        if (preg_match($this->regexes['interpolation_start'], $this->code, $match, 0, $this->cursor)) {
            $this->brackets[] = [$this->options['interpolation'][0], $this->lineno];
            $this->pushToken(Token::INTERPOLATION_START_TYPE);
            $this->moveCursor($match[0]);
            $this->pushState(self::STATE_INTERPOLATION);
        } elseif (preg_match(self::REGEX_DQ_STRING_PART, $this->code, $match, 0, $this->cursor) && '' !== $match[0]) {
            $this->pushToken(Token::STRING_TYPE, $this->stripcslashes($this->normalizeNewlines($match[0]), '"'));
            $this->moveCursor($match[0]);
        } elseif (preg_match(self::REGEX_DQ_STRING_DELIM, $this->code, $match, 0, $this->cursor)) {
            [$expect, $lineno] = array_pop($this->brackets);
            if ('"' != $this->code[$this->cursor]) {
                throw new SyntaxError(\sprintf('Unclosed "%s".', $expect), $lineno, $this->source);
            }

            $this->popState();
            $this->moveCursor($match[0]);
        } else {
            // 読めない文字（ここで例外にする）
            throw new SyntaxError(\sprintf('Unexpected character "%s".', $this->code[$this->cursor]), $this->lineno, $this->source, columnno: $this->source->getColumn($this->cursor));
        }
    }
```

```php:line-numbers=529 [原文]
    private function lexString(): void
    {
        if (preg_match($this->regexes['interpolation_start'], $this->code, $match, 0, $this->cursor)) {
            $this->brackets[] = [$this->options['interpolation'][0], $this->lineno];
            $this->pushToken(Token::INTERPOLATION_START_TYPE);
            $this->moveCursor($match[0]);
            $this->pushState(self::STATE_INTERPOLATION);
        } elseif (preg_match(self::REGEX_DQ_STRING_PART, $this->code, $match, 0, $this->cursor) && '' !== $match[0]) {
            $this->pushToken(Token::STRING_TYPE, $this->stripcslashes($this->normalizeNewlines($match[0]), '"'));
            $this->moveCursor($match[0]);
        } elseif (preg_match(self::REGEX_DQ_STRING_DELIM, $this->code, $match, 0, $this->cursor)) {
            [$expect, $lineno] = array_pop($this->brackets);
            if ('"' != $this->code[$this->cursor]) {
                throw new SyntaxError(\sprintf('Unclosed "%s".', $expect), $lineno, $this->source);
            }

            $this->popState();
            $this->moveCursor($match[0]);
        } else {
            // unlexable
            throw new SyntaxError(\sprintf('Unexpected character "%s".', $this->code[$this->cursor]), $this->lineno, $this->source, columnno: $this->source->getColumn($this->cursor));
        }
    }
```

:::

## 前提知識

- **字句解析（レキサー）**: 文字の並びを、意味のある単位（トークン）に分ける処理です。プログラムやテンプレートを読む最初の段階です。
- **状態機械**: 今どの「状態」にいるかを記録し、状態ごとに読み方を変える仕組みです。
- **`preg_match` と `$this->cursor`**: 今の位置（カーソル）から正規表現で一致を探す書き方です。
- **`pushState` / `popState`**: 状態をスタックに積んだり、取り出したりする操作です。
- **括弧のスタック**: 開いた括弧を記録しておき、閉じたときに対応を確かめる仕組みです。

## 何をしているか

### 1. 埋め込みの開始を先に見る

```php:line-numbers=531
        if (preg_match($this->regexes['interpolation_start'], $this->code, $match, 0, $this->cursor)) {
            $this->brackets[] = [$this->options['interpolation'][0], $this->lineno];
            $this->pushToken(Token::INTERPOLATION_START_TYPE);
            $this->moveCursor($match[0]);
            $this->pushState(self::STATE_INTERPOLATION);
```

`#{` のような埋め込みの開始が、今の位置にあるかを調べます。あれば、括弧を記録し、文字列の開始トークンを出して、埋め込みの状態へ切り替えます。

### 2. 文字列の本文を、1 かたまり読む

```php:line-numbers=536
        } elseif (preg_match(self::REGEX_DQ_STRING_PART, $this->code, $match, 0, $this->cursor) && '' !== $match[0]) {
            $this->pushToken(Token::STRING_TYPE, $this->stripcslashes($this->normalizeNewlines($match[0]), '"'));
            $this->moveCursor($match[0]);
```

埋め込みでなければ、次に `"` の直前までの文字列の本文を読みます。`stripcslashes` で `\n` などのエスケープを解いて、文字列トークンにします。

### 3. 閉じのクォートなら、状態を戻す

```php:line-numbers=539
        } elseif (preg_match(self::REGEX_DQ_STRING_DELIM, $this->code, $match, 0, $this->cursor)) {
            [$expect, $lineno] = array_pop($this->brackets);
            if ('"' != $this->code[$this->cursor]) {
                throw new SyntaxError(\sprintf('Unclosed "%s".', $expect), $lineno, $this->source);
            }

            $this->popState();
            $this->moveCursor($match[0]);
```

`"` が出てきたら、括弧のスタックから対応する開き記号を取り出します。もし現在の文字が `"` でなければ、閉じ忘れとして例外にします。正しく閉じていれば、状態を 1 つ戻して、読みを終わります。

### 4. どれにも当てはまらなければ、例外

::: code-group

```php:line-numbers=547 [日本語訳]
        } else {
            // 読めない文字（ここで例外にする）
            throw new SyntaxError(\sprintf('Unexpected character "%s".', $this->code[$this->cursor]), $this->lineno, $this->source, columnno: $this->source->getColumn($this->cursor));
        }
```

```php:line-numbers=547 [原文]
        } else {
            // unlexable
            throw new SyntaxError(\sprintf('Unexpected character "%s".', $this->code[$this->cursor]), $this->lineno, $this->source, columnno: $this->source->getColumn($this->cursor));
        }
```

:::

想定しない文字が来たら、その文字を示して例外を投げます。コメントにあるとおり、ここは読めない文字に対する最後の受け皿です。

## ここがすごい

### 「文字列の中」と「式の中」を、状態で切り替える

文字列の中に `#{...}` があると、その中はまた式として読まれます。もし文字列の読みと式の読みを 1 つの規則で書こうとすると、入れ子の扱いが複雑になります。この関数は、状態を切り替えることで、それぞれに合った読み方を使います。

### 閉じ忘れを、その場で見つける

括弧のスタックに開きを記録しておき、閉じるときに照合しています。閉じ忘れは、テンプレートの書き間違いで起きやすいので、早めに気づけるようにするための設計です。

### 正規表現は、カーソルの位置からだけ読む

`preg_match` に `$this->cursor` を渡しているので、既に読んだ部分を再び見ることがありません。読み進める手順が、位置の移動として明確に表れています。

## まとめ

- 入れ子の文字列は、状態を切り替えて読むと規則を分けて書ける。
- 開きと閉じの記号は、スタックに記録して照合すると書き間違いに気づける。
- 読んだ位置を進めながら正規表現を使うと、重複のない読み方ができる。
- 想定外の文字は、最後の受け皿で例外にすると、原因を示せる。
