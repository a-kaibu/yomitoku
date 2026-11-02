---
title: "最初の引数が、オプションの値ではないかを確かめる"
description: "Symfony Console の ArgvInput::getFirstArgumentPosition は、オプションの値として読まれた語を飛ばして、本当の最初の引数の位置を探します。"
language: php
project: Symfony
repo: https://github.com/symfony/symfony
license: MIT
copyright: Copyright (c) 2004-present Fabien Potencier
commit: "7c22be9fc7d3ea202cd09573edf6658cf427fcad"
file: src/Symfony/Component/Console/Input/ArgvInput.php
lines: [289, 319]
function: ArgvInput::getFirstArgumentPosition
difficulty: 3
format: 2
tags: [CLI, イテレータ]
---

## ひとことで

コマンドの中には、`--env prod deploy` のように、オプションの値と引数が空白で並ぶ形があります。この関数は、その中で「本当の最初の引数」がどこにあるかを探します。

## コード

::: code-group

```php:line-numbers=289 [日本語訳]
    private function getFirstArgumentPosition(): ?int
    {
        $isOption = false;
        foreach ($this->tokens as $i => $token) {
            if ($token && '-' === $token[0]) {
                if (str_contains($token, '=') || !isset($this->tokens[$i + 1])) {
                    continue;
                }

                // 長いオプション（--name）なら、「--」より後ろの全体をオプション名とみなす。
                // それ以外は最後の 1 文字を使う。短いオプションをまとめた形では、空白区切りで値を取れるのは最後の文字だけだからである。
                $name = '-' === $token[1] ? substr($token, 2) : substr($token, -1);
                if (!isset($this->options[$name]) && !$this->definition->hasShortcut($name)) {
                    // 何もしない（オプション名として登録されていない語）。
                } elseif ((isset($this->options[$name]) || isset($this->options[$name = $this->definition->shortcutToName($name)])) && $this->tokens[$i + 1] === $this->options[$name]) {
                    $isOption = true;
                }

                continue;
            }

            if ($isOption) {
                $isOption = false;
                continue;
            }

            return $i;
        }

        return null;
    }
```

```php:line-numbers=289 [原文]
    private function getFirstArgumentPosition(): ?int
    {
        $isOption = false;
        foreach ($this->tokens as $i => $token) {
            if ($token && '-' === $token[0]) {
                if (str_contains($token, '=') || !isset($this->tokens[$i + 1])) {
                    continue;
                }

                // If it's a long option, consider that everything after "--" is the option name.
                // Otherwise, use the last char (if it's a short option set, only the last one can take a value with space separator)
                $name = '-' === $token[1] ? substr($token, 2) : substr($token, -1);
                if (!isset($this->options[$name]) && !$this->definition->hasShortcut($name)) {
                    // noop
                } elseif ((isset($this->options[$name]) || isset($this->options[$name = $this->definition->shortcutToName($name)])) && $this->tokens[$i + 1] === $this->options[$name]) {
                    $isOption = true;
                }

                continue;
            }

            if ($isOption) {
                $isOption = false;
                continue;
            }

            return $i;
        }

        return null;
    }
```

:::

## 前提知識

- **引数とオプション**: 引数は、コマンドに続けて書く名前（`deploy` など）です。オプションは、`--env` のように `-` で始まる指定です。
- **トークン**: 空白で区切られた、1 つ 1 つの語のことです。
- **`foreach` と添字**: `$i => $token` の形で、位置（添字）と値を同時に取り出せます。
- **`str_contains`**: 文字列に別の文字列が含まれているかを調べる関数です。

## 何をしているか

### 1. 語を先頭から順に見る

```php:line-numbers=291
        $isOption = false;
        foreach ($this->tokens as $i => $token) {
            if ($token && '-' === $token[0]) {
```

`foreach` で、語とその位置（添字）を先頭から順に取り出します。

### 2. オプションなら、値として使われた次の語を飛ばすか決める

::: code-group

```php:line-numbers=294 [日本語訳]
                if (str_contains($token, '=') || !isset($this->tokens[$i + 1])) {
                    continue;
                }

                // 長いオプション（--name）なら、「--」より後ろの全体をオプション名とみなす。
                // それ以外は最後の 1 文字を使う。短いオプションをまとめた形では、空白区切りで値を取れるのは最後の文字だけだからである。
                $name = '-' === $token[1] ? substr($token, 2) : substr($token, -1);
                if (!isset($this->options[$name]) && !$this->definition->hasShortcut($name)) {
                    // 何もしない（オプション名として登録されていない語）。
                } elseif ((isset($this->options[$name]) || isset($this->options[$name = $this->definition->shortcutToName($name)])) && $this->tokens[$i + 1] === $this->options[$name]) {
                    $isOption = true;
                }

                continue;
```

```php:line-numbers=294 [原文]
                if (str_contains($token, '=') || !isset($this->tokens[$i + 1])) {
                    continue;
                }

                // If it's a long option, consider that everything after "--" is the option name.
                // Otherwise, use the last char (if it's a short option set, only the last one can take a value with space separator)
                $name = '-' === $token[1] ? substr($token, 2) : substr($token, -1);
                if (!isset($this->options[$name]) && !$this->definition->hasShortcut($name)) {
                    // noop
                } elseif ((isset($this->options[$name]) || isset($this->options[$name = $this->definition->shortcutToName($name)])) && $this->tokens[$i + 1] === $this->options[$name]) {
                    $isOption = true;
                }

                continue;
```

:::

`-` で始まる語がオプションです。`=` を含む語や、後ろに語がない場合は何もしません。それ以外は、オプション名を決めて、次の語がその値として使われているかを確かめます。

### 3. 値として読まれた語を飛ばす

```php:line-numbers=310
            if ($isOption) {
                $isOption = false;
                continue;
            }
```

`$isOption` が `true` なら、今の語はオプションの値なので、引数として数えずに飛ばします。

### 4. 引数の位置を返す

```php:line-numbers=315
            return $i;
        }

        return null;
```

オプションでもその値でもない最初の語の位置（`$i`）を返します。見つからなければ `null` です。

## ここがすごい

### 「値として読まれた語」を覚えておく

```php:line-numbers=310
            if ($isOption) {
                $isOption = false;
                continue;
            }
```

`$isOption` を `true` にしておくと、次の語をオプションの値として 1 つ飛ばせます。引数の位置を正しく決めるための小さな状態管理です。

### コメントが、判断の理由を説明している

::: code-group

```php:line-numbers=298 [日本語訳]
                // 長いオプション（--name）なら、「--」より後ろの全体をオプション名とみなす。
                // それ以外は最後の 1 文字を使う。短いオプションをまとめた形では、空白区切りで値を取れるのは最後の文字だけだからである。
```

```php:line-numbers=298 [原文]
                // If it's a long option, consider that everything after "--" is the option name.
                // Otherwise, use the last char (if it's a short option set, only the last one can take a value with space separator)
```

:::

長いオプションと短いオプションで、名前の取り方が違うことが、コメントで説明されています。読み手が「なぜ `$token[1]` を見るのか」を理解できるように書かれています。

## まとめ

この関数は、オプションとその値を飛ばしながら、語を先頭から読んでいきます。最初に「引数として残る語」の位置を返すことで、コマンドの中の引数を正しく取り出せるようにしています。
